import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { CreateProblemRequest, UpdateProblemRequest } from '../types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'problems');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['.cpp', '.c', '.py', '.java', '.txt', '.in', '.out'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// Get all problems for authenticated user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      'SELECT id, name, title, time_limit, memory_limit, created_at, updated_at FROM problems WHERE author_id = $1 ORDER BY updated_at DESC',
      [req.userId]
    );

    res.json({ problems: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get specific problem
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const problemId = parseInt(req.params.id);
    
    const result = await pool.query(
      'SELECT * FROM problems WHERE id = $1 AND author_id = $2',
      [problemId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const problem = result.rows[0];

    // Get test groups
    const groupsResult = await pool.query(
      'SELECT * FROM test_groups WHERE problem_id = $1 ORDER BY id',
      [problemId]
    );

    // Get test cases
    const casesResult = await pool.query(
      'SELECT * FROM test_cases WHERE problem_id = $1 ORDER BY id',
      [problemId]
    );    // Get problem files
    const filesResult = await pool.query(
      'SELECT * FROM problem_files WHERE problem_id = $1 ORDER BY file_type, id',
      [problemId]
    );    // Convert file fields to camelCase for frontend
    const files = filesResult.rows.map((file: any) => ({
      id: file.id,
      problemId: file.problem_id,
      fileType: file.file_type,
      fileName: file.file_name,
      filePath: file.file_path,
      language: file.language,
      createdAt: file.created_at
    }));

    res.json({
      problem,
      testGroups: groupsResult.rows,
      testCases: casesResult.rows,
      files
    });
  } catch (error) {
    next(error);
  }
});

// Create new problem
router.post('/', authenticateToken, [
  body('name').isLength({ min: 1, max: 255 }).trim(),
  body('title').isLength({ min: 1, max: 255 }).trim(),
  body('timeLimit').optional().isInt({ min: 100, max: 10000 }),
  body('memoryLimit').optional().isInt({ min: 64, max: 1024 })
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, title, statementLatex, timeLimit = 1000, memoryLimit = 256, inputFormat, outputFormat, notes } = req.body;

    const result = await pool.query(`
      INSERT INTO problems (name, title, author_id, statement_latex, time_limit, memory_limit, input_format, output_format, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [name, title, req.userId, statementLatex, timeLimit, memoryLimit, inputFormat, outputFormat, notes]);

    res.status(201).json({ problem: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Update problem
router.put('/:id', authenticateToken, [
  body('name').optional().isLength({ min: 1, max: 255 }).trim(),
  body('title').optional().isLength({ min: 1, max: 255 }).trim(),
  body('timeLimit').optional().isInt({ min: 100, max: 10000 }),
  body('memoryLimit').optional().isInt({ min: 64, max: 1024 })
], async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log('Update request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const problemId = parseInt(req.params.id);
    const updates = req.body;

    console.log('Problem ID:', problemId, 'User ID:', req.userId);

    // Check if problem exists and belongs to user
    const checkResult = await pool.query(
      'SELECT id FROM problems WHERE id = $1 AND author_id = $2',
      [problemId, req.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && value !== null && value !== '') {
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateFields.push(`${dbField} = $${paramCount}`);
        values.push(value);
        paramCount++;
        console.log(`Mapping ${key} -> ${dbField} = ${value}`);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(problemId);

    const query = `UPDATE problems SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    console.log('Update query:', query);
    console.log('Values:', values);
    
    const result = await pool.query(query, values);

    res.json({ problem: result.rows[0] });
  } catch (error) {
    console.error('Update error:', error);
    next(error);
  }
});

// Delete problem
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const problemId = parseInt(req.params.id);

    const result = await pool.query(
      'DELETE FROM problems WHERE id = $1 AND author_id = $2 RETURNING id',
      [problemId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Upload problem files (generator, checker, interactor, solution)
router.post('/:id/files', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const problemId = parseInt(req.params.id);
    const { fileType, language } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if problem exists and belongs to user
    const checkResult = await pool.query(
      'SELECT id FROM problems WHERE id = $1 AND author_id = $2',
      [problemId, req.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Save file info to database
    const result = await pool.query(`
      INSERT INTO problem_files (problem_id, file_type, file_name, file_path, language)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [problemId, fileType, req.file.originalname, req.file.path, language]);

    res.status(201).json({ file: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Export problem package
router.get('/:id/export', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const problemId = parseInt(req.params.id);

    // Check if problem exists and belongs to user
    const problemResult = await pool.query(
      'SELECT * FROM problems WHERE id = $1 AND author_id = $2',
      [problemId, req.userId]
    );

    if (problemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const problem = problemResult.rows[0];

    // Create temporary directory
    const tempDir = path.join(process.cwd(), 'temp', uuidv4());
    await fs.ensureDir(tempDir);

    try {
      // Create problem.xml (polygon format)
      const problemXml = generateProblemXml(problem);
      await fs.writeFile(path.join(tempDir, 'problem.xml'), problemXml);

      // Copy problem files
      const filesResult = await pool.query(
        'SELECT * FROM problem_files WHERE problem_id = $1',
        [problemId]
      );

      for (const file of filesResult.rows) {
        if (await fs.pathExists(file.file_path)) {
          await fs.copy(file.file_path, path.join(tempDir, file.file_name));
        }
      }

      // Create ZIP archive
      const zipPath = path.join(process.cwd(), 'temp', `${problem.name}.zip`);
      await createZipArchive(tempDir, zipPath);      // Send file
      res.download(zipPath, `${problem.name}.zip`, async (err: Error | null) => {
        // Cleanup
        await fs.remove(tempDir);
        await fs.remove(zipPath);
        
        if (err) {
          console.error('Download error:', err);
        }
      });

    } catch (error) {
      await fs.remove(tempDir);
      throw error;
    }

  } catch (error) {
    next(error);
  }
});

// Generate test cases
router.post('/:id/generate-test-cases', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const problemId = parseInt(req.params.id);

    // Check if problem exists and belongs to user
    const problemResult = await pool.query(
      'SELECT * FROM problems WHERE id = $1 AND author_id = $2',
      [problemId, req.userId]
    );

    if (problemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const problem = problemResult.rows[0];

    // Run the generator
    const generatorFile = await pool.query(
      'SELECT * FROM problem_files WHERE problem_id = $1 AND file_type = $2',
      [problemId, 'generator']
    );

    if (generatorFile.rows.length === 0) {
      return res.status(400).json({ error: 'No generator file found' });
    }

    const generatorPath = generatorFile.rows[0].file_path;

    // Execute the generator
    const { stdout, stderr } = await execAsync(`python3 ${generatorPath} ${problemId}`, { cwd: process.cwd() });

    if (stderr) {
      return res.status(500).json({ error: 'Error running generator: ' + stderr });
    }

    // Parse and save test cases
    const testCases = JSON.parse(stdout);

    for (const testCase of testCases) {
      await pool.query(
        'INSERT INTO test_cases (problem_id, input, output) VALUES ($1, $2, $3)',
        [problemId, testCase.input, testCase.output]
      );
    }

    res.status(201).json({ message: 'Test cases generated successfully', testCases });
  } catch (error) {
    next(error);
  }
});

// Run all test cases for a problem
router.post('/:id/run-test-cases', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const problemId = parseInt(req.params.id);

    // Check if problem exists and belongs to user
    const problemResult = await pool.query(
      'SELECT * FROM problems WHERE id = $1 AND author_id = $2',
      [problemId, req.userId]
    );

    if (problemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Get test cases
    const testCasesResult = await pool.query(
      'SELECT * FROM test_cases WHERE problem_id = $1',
      [problemId]
    );

    if (testCasesResult.rows.length === 0) {
      return res.status(404).json({ error: 'No test cases found' });
    }

    const testCases = testCasesResult.rows;

    // TODO: Implement test case running logic (e.g., compile solution, run against test cases, return results)

    res.json({ message: 'Test cases run successfully', testCases });
  } catch (error) {
    next(error);
  }
});

// Generate test cases using generator
router.post('/:id/generate-tests', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { generatorFile, testCount = 5, groupName = 'main' } = req.body;

    console.log('Generate tests request:', { id, generatorFile, testCount, groupName });

    // Check if problem exists and belongs to user
    const problemResult = await pool.query(
      'SELECT * FROM problems WHERE id = $1 AND author_id = $2',
      [id, req.userId]
    );

    if (problemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const problem = problemResult.rows[0];
    console.log('Found problem:', problem.name);

    // Get generator file
    console.log('Looking for generator file:', generatorFile);
    const generatorResult = await pool.query(
      'SELECT * FROM problem_files WHERE problem_id = $1 AND file_type = $2 AND file_name = $3',
      [id, 'generator', generatorFile]
    );

    console.log('Generator query result:', generatorResult.rows);

    if (generatorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Generator file not found' });
    }

    const generator = generatorResult.rows[0];
    const generatorPath = generator.file_path;

    // Create or get test group
    let testGroupResult = await pool.query(
      'SELECT * FROM test_groups WHERE problem_id = $1 AND name = $2',
      [id, groupName]
    );

    let testGroupId;
    if (testGroupResult.rows.length === 0) {
      const insertGroupResult = await pool.query(
        'INSERT INTO test_groups (problem_id, name, points) VALUES ($1, $2, $3) RETURNING id',
        [id, groupName, 100]
      );
      testGroupId = insertGroupResult.rows[0].id;
    } else {
      testGroupId = testGroupResult.rows[0].id;
    }    // Compile generator if it's C++
    if (path.extname(generatorPath) === '.cpp') {
      const compiledPath = generatorPath.replace('.cpp', '.exe');
      try {
        // Check if g++ is available
        await execAsync('g++ --version');
        await execAsync(`g++ "${generatorPath}" -o "${compiledPath}" -std=c++17`);
      } catch (error) {
        console.error('Compilation error:', error);
        return res.status(400).json({ 
          error: 'Failed to compile generator. Make sure g++ is installed and accessible.', 
          details: error 
        });
      }
    }

    // Generate test cases
    const generatedTests = [];
    for (let i = 1; i <= testCount; i++) {
      try {
        let command;
        if (path.extname(generatorPath) === '.cpp') {
          const compiledPath = generatorPath.replace('.cpp', '.exe');
          command = `"${compiledPath}" ${i}`;        } else if (path.extname(generatorPath) === '.py') {
          try {
            // Check if python is available
            await execAsync('python --version');
            command = `python "${generatorPath}" ${i}`;
          } catch (error) {
            console.error('Python not found, trying python3:', error);
            try {
              await execAsync('python3 --version');
              command = `python3 "${generatorPath}" ${i}`;
            } catch (error2) {
              return res.status(400).json({ 
                error: 'Python is not installed or not accessible. Please install Python and make sure it\'s in your PATH.' 
              });
            }
          }
        } else {
          return res.status(400).json({ error: 'Unsupported generator file type' });
        }

        const { stdout } = await execAsync(command);
        const input = stdout.trim();

        // Save test case to database
        const testResult = await pool.query(
          'INSERT INTO test_cases (problem_id, test_group_id, test_index, input_data, output_data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [id, testGroupId, i, input, ''] // Output will be generated later by running the solution
        );

        generatedTests.push(testResult.rows[0]);
      } catch (error) {
        console.error(`Failed to generate test case ${i}:`, error);
      }
    }

    res.json({ 
      message: 'Test cases generated successfully', 
      testCases: generatedTests,
      testGroupId 
    });
  } catch (error) {
    next(error);
  }
});

// Get test cases for a problem
router.get('/:id/tests', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if problem exists and belongs to user
    const problemResult = await pool.query(
      'SELECT * FROM problems WHERE id = $1 AND author_id = $2',
      [id, req.userId]
    );

    if (problemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Get test groups
    const groupsResult = await pool.query(
      'SELECT * FROM test_groups WHERE problem_id = $1 ORDER BY id',
      [id]
    );

    // Get test cases
    const casesResult = await pool.query(
      'SELECT * FROM test_cases WHERE problem_id = $1 ORDER BY test_group_id, test_index',
      [id]
    );

    res.json({
      testGroups: groupsResult.rows,
      testCases: casesResult.rows
    });
  } catch (error) {
    next(error);
  }
});

// Delete test case
router.delete('/:id/tests/:testId', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, testId } = req.params;

    // Check if problem exists and belongs to user
    const problemResult = await pool.query(
      'SELECT * FROM problems WHERE id = $1 AND author_id = $2',
      [id, req.userId]
    );

    if (problemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Delete test case
    await pool.query(
      'DELETE FROM test_cases WHERE id = $1 AND problem_id = $2',
      [testId, id]
    );

    res.json({ message: 'Test case deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Run solution against test cases to generate expected outputs
router.post('/:id/generate-outputs', authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { solutionFile } = req.body;

    // Check if problem exists and belongs to user
    const problemResult = await pool.query(
      'SELECT * FROM problems WHERE id = $1 AND author_id = $2',
      [id, req.userId]
    );

    if (problemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Get solution file
    const solutionResult = await pool.query(
      'SELECT * FROM problem_files WHERE problem_id = $1 AND file_type = $2 AND file_name = $3',
      [id, 'solution', solutionFile]
    );

    if (solutionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Solution file not found' });
    }

    const solution = solutionResult.rows[0];
    const solutionPath = solution.file_path;    // Compile solution if it's C++
    if (path.extname(solutionPath) === '.cpp') {
      const compiledPath = solutionPath.replace('.cpp', '.exe');
      try {
        // Check if g++ is available
        await execAsync('g++ --version');
        await execAsync(`g++ "${solutionPath}" -o "${compiledPath}" -std=c++17`);
      } catch (error) {
        console.error('Compilation error:', error);
        return res.status(400).json({ 
          error: 'Failed to compile solution. Make sure g++ is installed and accessible.', 
          details: error 
        });
      }
    }

    // Get all test cases for this problem
    const testCasesResult = await pool.query(
      'SELECT * FROM test_cases WHERE problem_id = $1 ORDER BY test_group_id, test_index',
      [id]
    );

    const updatedTestCases = [];
    
    for (const testCase of testCasesResult.rows) {
      try {
        let command;
        if (path.extname(solutionPath) === '.cpp') {
          const compiledPath = solutionPath.replace('.cpp', '.exe');
          command = `echo "${testCase.input_data}" | "${compiledPath}"`;        } else if (path.extname(solutionPath) === '.py') {
          try {
            // Check if python is available
            await execAsync('python --version');
            command = `echo "${testCase.input_data}" | python "${solutionPath}"`;
          } catch (error) {
            console.error('Python not found, trying python3:', error);
            try {
              await execAsync('python3 --version');
              command = `echo "${testCase.input_data}" | python3 "${solutionPath}"`;
            } catch (error2) {
              console.error('Python not available for solution:', error2);
              continue; // Skip this test case
            }
          }
        } else {
          continue; // Skip unsupported file types
        }

        const { stdout } = await execAsync(command);
        const output = stdout.trim();

        // Update test case with generated output
        const updateResult = await pool.query(
          'UPDATE test_cases SET output_data = $1 WHERE id = $2 RETURNING *',
          [output, testCase.id]
        );

        updatedTestCases.push(updateResult.rows[0]);
      } catch (error) {
        console.error(`Failed to generate output for test case ${testCase.id}:`, error);
      }
    }

    res.json({ 
      message: 'Outputs generated successfully', 
      testCases: updatedTestCases 
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate problem.xml
function generateProblemXml(problem: any): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<problem>
    <names>
        <name language="english" value="${problem.title}"/>
    </names>
    <judging>
        <testset name="tests">
            <time-limit>${problem.time_limit}</time-limit>
            <memory-limit>${problem.memory_limit * 1024 * 1024}</memory-limit>
            <test-count>0</test-count>
        </testset>
    </judging>
    <files>
        <resources>
            <file>
                <copy>statement.tex</copy>
            </file>
        </resources>
    </files>
    <assets>
        <checker>
            <source path="checker.cpp" type="cpp.g++17"/>
        </checker>
    </assets>
</problem>`;
}

// Helper function to create ZIP archive
async function createZipArchive(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err: Error) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

export default router;
