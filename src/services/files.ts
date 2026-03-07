import { api } from './api';
import { API_BASE_URL } from '@/config/aws';

export const filesService = {
  list: (path?: string) =>
    api.get<any[]>(path ? `/api/files?path=${encodeURIComponent(path)}` : '/api/files'),

  upload: async (file: File, path: string, token?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/api/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
    return res.json();
  },

  createFolder: (name: string, path?: string) =>
    api.post<any>('/api/files/folder', { name, path }),

  delete: (id: string) => api.delete(`/api/files/${id}`),
};
