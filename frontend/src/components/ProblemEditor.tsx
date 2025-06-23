import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { problemsAPI } from '../services/api';
import { Problem, ProblemFile } from '../types';
import toast from 'react-hot-toast';

const ProblemEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreate = id === 'create';
  
  const [problem, setProblem] = useState<Problem | null>(null);
  const [files, setFiles] = useState<ProblemFile[]>([]);
  const [isLoading, setIsLoading] = useState(!isCreate);
  const [activeTab, setActiveTab] = useState('general');
  
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    statementLatex: '',
    timeLimit: 1000,
    memoryLimit: 256,
    inputFormat: '',
    outputFormat: '',
    notes: ''
  });
  useEffect(() => {
    if (!isCreate && id) {
      loadProblem(parseInt(id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isCreate]);

  const loadProblem = async (problemId: number) => {
    try {
      const response = await problemsAPI.getById(problemId);
      setProblem(response.problem);
      setFiles(response.files);
      setFormData({
        name: response.problem.name,
        title: response.problem.title,
        statementLatex: response.problem.statementLatex || '',
        timeLimit: response.problem.timeLimit,
        memoryLimit: response.problem.memoryLimit,
        inputFormat: response.problem.inputFormat || '',
        outputFormat: response.problem.outputFormat || '',
        notes: response.problem.notes || ''
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load problem');
      navigate('/problems');
    } finally {
      setIsLoading(false);
    }
  };
  const handleSave = async () => {
    try {
      console.log('Saving problem with data:', formData);
      
      if (isCreate) {
        const response = await problemsAPI.create(formData);
        toast.success('Problem created successfully');
        navigate(`/problems/${response.problem.id}`);
      } else if (problem) {
        const response = await problemsAPI.update(problem.id, formData);
        console.log('Update response:', response);
        toast.success('Problem updated successfully');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.details) {
        // Show validation errors
        const details = error.response.data.details;
        const messages = details.map((d: any) => `${d.path}: ${d.msg}`).join(', ');
        toast.error(`Validation errors: ${messages}`);
      } else {
        toast.error(error.response?.data?.error || 'Failed to save problem');
      }
    }
  };

  const handleFileUpload = async (file: File, fileType: string, language?: string) => {
    if (!problem && isCreate) {
      toast.error('Please save the problem first before uploading files');
      return;
    }

    try {
      const problemId = problem?.id || parseInt(id!);
      const response = await problemsAPI.uploadFile(problemId, file, fileType, language);
      setFiles([...files, response.file]);
      toast.success('File uploaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload file');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/problems')}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                ← Back
              </button>
              <h1 className="text-xl font-semibold">
                {isCreate ? 'Create Problem' : `Edit: ${problem?.title}`}
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {isCreate ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                {[
                  { id: 'general', name: 'General' },
                  { id: 'statement', name: 'Statement' },
                  { id: 'files', name: 'Files' },
                  { id: 'tests', name: 'Tests' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-4 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Problem Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="problem-name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Problem Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Problem Title"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Time Limit (ms)
                      </label>
                      <input
                        type="number"
                        value={formData.timeLimit}
                        onChange={(e) => handleChange('timeLimit', parseInt(e.target.value))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Memory Limit (MB)
                      </label>
                      <input
                        type="number"
                        value={formData.memoryLimit}
                        onChange={(e) => handleChange('memoryLimit', parseInt(e.target.value))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'statement' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Problem Statement (LaTeX)
                    </label>
                    <div className="border rounded-md" style={{ height: '400px' }}>
                      <Editor
                        height="400px"
                        defaultLanguage="latex"
                        value={formData.statementLatex}
                        onChange={(value) => handleChange('statementLatex', value || '')}
                        options={{
                          minimap: { enabled: false },
                          wordWrap: 'on'
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Input Format
                      </label>
                      <textarea
                        value={formData.inputFormat}
                        onChange={(e) => handleChange('inputFormat', e.target.value)}
                        rows={4}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Output Format
                      </label>
                      <textarea
                        value={formData.outputFormat}
                        onChange={(e) => handleChange('outputFormat', e.target.value)}
                        rows={4}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'files' && (
                <FileManager files={files} onFileUpload={handleFileUpload} />
              )}              {activeTab === 'tests' && id && !isCreate && (
                <TestManager 
                  problemId={parseInt(id)} 
                  files={files}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FileManagerProps {
  files: ProblemFile[];
  onFileUpload: (file: File, fileType: string, language?: string) => void;
}

const FileManager: React.FC<FileManagerProps> = ({ files, onFileUpload }) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState('solution');
  const [selectedLanguage, setSelectedLanguage] = useState('cpp');

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(file => {
      onFileUpload(file, selectedFileType, selectedLanguage);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(file => {
      onFileUpload(file, selectedFileType, selectedLanguage);
    });
  };

  const fileTypeGroups = {
    solution: files.filter(f => f.fileType === 'solution'),
    checker: files.filter(f => f.fileType === 'checker'),
    generator: files.filter(f => f.fileType === 'generator'),
    interactor: files.filter(f => f.fileType === 'interactor')
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Type
            </label>
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="solution">Solution</option>
              <option value="checker">Checker</option>
              <option value="generator">Generator</option>
              <option value="interactor">Interactor</option>
            </select>
            
            <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
              Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
          </div>
          
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-lg p-4 ${dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}
          >
            <p className="text-sm text-gray-600">Drop files here or</p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="mt-2"
              accept=".cpp,.c,.py,.java,.txt,.in,.out"
            />
          </div>
        </div>
      </div>

      {Object.entries(fileTypeGroups).map(([type, typeFiles]) => (
        typeFiles.length > 0 && (
          <div key={type} className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3 capitalize">{type} Files</h3>
            <div className="space-y-2">
              {typeFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between bg-white p-3 rounded border">
                  <div>
                    <div className="font-medium">{file.fileName}</div>
                    <div className="text-sm text-gray-500">{file.language}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
};

interface TestManagerProps {
  problemId: number;
  files: ProblemFile[];
}

interface TestCase {
  id: number;
  testGroupId: number;
  testIndex: number;
  inputData: string;
  outputData: string;
}

interface TestGroup {
  id: number;
  problemId: number;
  name: string;
  points: number;
}

const TestManager: React.FC<TestManagerProps> = ({ problemId, files }) => {
  const [testGroups, setTestGroups] = useState<TestGroup[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGenerator, setSelectedGenerator] = useState('');
  const [selectedSolution, setSelectedSolution] = useState('');
  const [testCount, setTestCount] = useState(5);
  const [groupName, setGroupName] = useState('main');

  const generatorFiles = files.filter(f => f.fileType === 'generator');
  const solutionFiles = files.filter(f => f.fileType === 'solution');

  useEffect(() => {
    loadTests();
  }, [problemId]);

  const loadTests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/problems/${problemId}/tests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestGroups(data.testGroups);
        setTestCases(data.testCases);
      }
    } catch (error) {
      console.error('Failed to load tests:', error);
      toast.error('Failed to load test cases');
    } finally {
      setIsLoading(false);
    }
  };

  const generateTests = async () => {
    if (!selectedGenerator) {
      toast.error('Please select a generator file');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/problems/${problemId}/generate-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          generatorFile: selectedGenerator,
          testCount,
          groupName
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        loadTests();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate tests');
      }
    } catch (error) {
      console.error('Failed to generate tests:', error);
      toast.error('Failed to generate test cases');
    } finally {
      setIsLoading(false);
    }
  };

  const generateOutputs = async () => {
    if (!selectedSolution) {
      toast.error('Please select a solution file');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/problems/${problemId}/generate-outputs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          solutionFile: selectedSolution
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        loadTests();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate outputs');
      }
    } catch (error) {
      console.error('Failed to generate outputs:', error);
      toast.error('Failed to generate outputs');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTestCase = async (testId: number) => {
    try {
      const response = await fetch(`/api/problems/${problemId}/tests/${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Test case deleted');
        loadTests();
      } else {
        toast.error('Failed to delete test case');
      }
    } catch (error) {
      console.error('Failed to delete test case:', error);
      toast.error('Failed to delete test case');
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Generation Controls */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Generate Test Cases</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Generator File
            </label>
            <select
              value={selectedGenerator}
              onChange={(e) => setSelectedGenerator(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select generator...</option>
              {generatorFiles.map(file => (
                <option key={file.id} value={file.fileName}>
                  {file.fileName} ({file.language})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Solution File (for outputs)
            </label>
            <select
              value={selectedSolution}
              onChange={(e) => setSelectedSolution(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select solution...</option>
              {solutionFiles.map(file => (
                <option key={file.id} value={file.fileName}>
                  {file.fileName} ({file.language})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Count
            </label>
            <input
              type="number"
              value={testCount}
              onChange={(e) => setTestCount(parseInt(e.target.value))}
              min="1"
              max="100"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={generateTests}
              disabled={isLoading || !selectedGenerator}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Generate Tests
            </button>
            <button
              onClick={generateOutputs}
              disabled={isLoading || !selectedSolution}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Generate Outputs
            </button>
          </div>
        </div>
      </div>

      {/* Test Cases Display */}
      <div>
        <h3 className="text-lg font-medium mb-4">Test Cases</h3>
        
        {isLoading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}

        {testGroups.map(group => {
          const groupTests = testCases.filter(tc => tc.testGroupId === group.id);
          
          return (
            <div key={group.id} className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">
                Group: {group.name} ({groupTests.length} tests)
              </h4>
              
              <div className="space-y-3">
                {groupTests.map(testCase => (
                  <div key={testCase.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="font-medium">Test {testCase.testIndex}</h5>
                      <button
                        onClick={() => deleteTestCase(testCase.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Input
                        </label>
                        <textarea
                          value={testCase.inputData}
                          readOnly
                          rows={4}
                          className="w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expected Output
                        </label>
                        <textarea
                          value={testCase.outputData}
                          readOnly
                          rows={4}
                          className="w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {groupTests.length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  No test cases in this group
                </div>
              )}
            </div>
          );
        })}

        {testGroups.length === 0 && !isLoading && (
          <div className="text-gray-500 text-center py-8">
            No test cases generated yet. Use the controls above to generate test cases.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemEditor;
