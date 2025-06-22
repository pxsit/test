import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { pool } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { CreateProblemRequest, UpdateProblemRequest } from '../types';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'problems');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
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
router.get('/', authenticateToken, async (req: any, res: any, next: any) => {
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
router.get('/:id', authenticateToken, async (req: any, res: any, next: any) => {
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
    );

    // Get problem files
    const filesResult = await pool.query(
      'SELECT * FROM problem_files WHERE problem_id = $1 ORDER BY file_type, id',
      [problemId]
    );

    res.json({
      problem,
      testGroups: groupsResult.rows,
      testCases: casesResult.rows,
      files: filesResult.rows
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
], async (req: any, res: any, next: any) => {
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
], async (req: any, res: any, next: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const problemId = parseInt(req.params.id);
    const updates = req.body;

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
      if (value !== undefined) {
        updateFields.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(problemId);

    const query = `UPDATE problems SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    res.json({ problem: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// Delete problem
router.delete('/:id', authenticateToken, async (req: any, res: any, next: any) => {
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
router.post('/:id/files', authenticateToken, upload.single('file'), async (req: any, res: any, next: any) => {
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
router.get('/:id/export', authenticateToken, async (req: any, res: any, next: any) => {
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
      await createZipArchive(tempDir, zipPath);

      // Send file
      res.download(zipPath, `${problem.name}.zip`, async (err) => {
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
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

export default router;
