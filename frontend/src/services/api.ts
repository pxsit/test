import axios from 'axios';
import { AuthResponse, Problem, CreateProblemRequest, ProblemFile } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: {
    username: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
};

// Problems API
export const problemsAPI = {
  getAll: async (): Promise<{ problems: Problem[] }> => {
    const response = await api.get('/problems');
    return response.data;
  },

  getById: async (id: number): Promise<{
    problem: Problem;
    testGroups: any[];
    testCases: any[];
    files: ProblemFile[];
  }> => {
    const response = await api.get(`/problems/${id}`);
    return response.data;
  },

  create: async (problemData: CreateProblemRequest): Promise<{ problem: Problem }> => {
    const response = await api.post('/problems', problemData);
    return response.data;
  },

  update: async (id: number, problemData: Partial<CreateProblemRequest>): Promise<{ problem: Problem }> => {
    const response = await api.put(`/problems/${id}`, problemData);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/problems/${id}`);
    return response.data;
  },

  uploadFile: async (id: number, file: File, fileType: string, language?: string): Promise<{ file: ProblemFile }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);
    if (language) {
      formData.append('language', language);
    }

    const response = await api.post(`/problems/${id}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  exportPackage: async (id: number): Promise<Blob> => {
    const response = await api.get(`/problems/${id}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;
