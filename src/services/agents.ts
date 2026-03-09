import { api } from './api';

/**
 * Default avatar hues for backend agent IDs (match mockData visual style).
 * Used when the backend response doesn't include avatarHue.
 */
const AVATAR_HUES: Record<string, number> = {
  'orchestrator': 260,
  'literature-analyst': 220,
  'data-harmonizer': 175,
  'hypothesis-generator': 142,
  'experiment-designer': 280,
  'peer-reviewer': 25,
  'report-synthesizer': 250,
};

/**
 * Normalize a backend Agent object to include all fields the frontend pages
 * expect (avatarHue, tags, tasks, successRate, etc.).
 * The backend Agent model has: id, name, type, model, role, description,
 * status, tools, capabilities, example_prompts, icon, system_prompt.
 * The frontend pages also access: avatarHue, tags, tasks, successRate,
 * avgTime, lastActive, systemPrompt.
 */
function normalizeAgent(a: any): any {
  return {
    ...a,
    tags: a.tags || a.capabilities || [],
    tasks: a.tasks ?? 0,
    successRate: a.successRate ?? a.success_rate ?? 0,
    avgTime: a.avgTime ?? a.avg_time ?? '\u2014',
    lastActive: a.lastActive ?? a.last_active ?? 'recently',
    avatarHue: a.avatarHue ?? a.avatar_hue ?? AVATAR_HUES[a.id] ?? 200,
    systemPrompt: a.systemPrompt ?? a.system_prompt ?? a.description ?? '',
  };
}

export const agentsService = {
  list: async () => {
    const agents = await api.get<any[]>('/api/agents/');
    return agents.map(normalizeAgent);
  },
  get: async (id: string) => {
    const agent = await api.get<any>(`/api/agents/${id}`);
    return normalizeAgent(agent);
  },
  getOrchestrator: async () => {
    const agent = await api.get<any>('/api/agents/orchestrator');
    return normalizeAgent(agent);
  },
  getStatus: (id: string) => api.get<any>(`/api/agents/${id}/status`),
  configure: (id: string, config: Record<string, any>) =>
    api.put<any>(`/api/agents/${id}/config`, config),
};
