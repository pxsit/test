export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  createdAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface TestGroup {
  id: number;
  problemId: number;
  name: string;
  score: number;
  isSample: boolean;
  createdAt: Date;
}

export interface TestCase {
  id: number;
  problemId: number;
  groupId: number;
  inputFile: string;
  outputFile: string;
  isSample: boolean;
  createdAt: Date;
}

export interface ProblemFile {
  id: number;
  problemId: number;
  fileType: 'generator' | 'checker' | 'interactor' | 'solution';
  fileName: string;
  filePath: string;
  language?: string;
  createdAt: Date;
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

export interface UpdateProblemRequest extends Partial<CreateProblemRequest> {
  id: number;
}
