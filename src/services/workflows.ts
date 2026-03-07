import { api } from './api';

export const workflowsService = {
  list: () => api.get<any[]>('/api/workflows'),
  get: (id: string) => api.get<any>(`/api/workflows/${id}`),
  create: (data?: Record<string, any>) => api.post<any>('/api/workflows', data),
  update: (id: string, data: Record<string, any>) =>
    api.put<any>(`/api/workflows/${id}`, data),
  execute: (id: string) => api.post<any>(`/api/workflows/${id}/execute`),
  delete: (id: string) => api.delete(`/api/workflows/${id}`),
};
