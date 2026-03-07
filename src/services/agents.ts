import { api } from './api';

export const agentsService = {
  list: () => api.get<any[]>('/api/agents'),
  get: (id: string) => api.get<any>(`/api/agents/${id}`),
  getOrchestrator: () => api.get<any>('/api/agents/orchestrator'),
  getStatus: (id: string) => api.get<any>(`/api/agents/${id}/status`),
  configure: (id: string, config: Record<string, any>) =>
    api.put<any>(`/api/agents/${id}/config`, config),
};
