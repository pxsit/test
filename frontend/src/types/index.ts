export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  createdAt: string;
}

export interface Problem {
  id: number;
  name: string;
  title: string;
  authorId: number;
  statementLatex?: string;
  timeLimit: number;
  memoryLimit: number;
  inputFormat?: string;
  outputFormat?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestGroup {
  id: number;
  problemId: number;
  name: string;
  score: number;
  isSample: boolean;
  createdAt: string;
}

export interface TestCase {
  id: number;
  problemId: number;
  groupId: number;
  inputFile: string;
  outputFile: string;
  isSample: boolean;
  createdAt: string;
}

export interface ProblemFile {
  id: number;
  problemId: number;
  fileType: 'generator' | 'checker' | 'interactor' | 'solution';
  fileName: string;
  filePath: string;
  language?: string;
  createdAt: string;
}

export interface CreateProblemRequest {
  name: string;
  title: string;
  statementLatex?: string;
  timeLimit?: number;
  memoryLimit?: number;
  inputFormat?: string;
  outputFormat?: string;
  notes?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
  details?: string;
}
