import { api } from './api';

export const dashboardService = {
  getStats: () => api.get<any>('/api/dashboard/stats'),
};
