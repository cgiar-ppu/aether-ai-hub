export interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  status: 'active' | 'inactive' | 'busy';
  tasks: number;
  successRate: number;
  avgTime: string;
  tags: string[];
  avatarHue: number;
}

export interface WorkflowNode {
  id: string;
  label: string;
  status: 'completed' | 'running' | 'pending';
  duration?: string;
  icon: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Workflow {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'draft';
  progress: number;
  steps: number;
  created: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface Activity {
  id: string;
  type: 'agent' | 'success' | 'error' | 'warning';
  description: string;
  timestamp: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'pdf' | 'csv' | 'docx' | 'png' | 'folder';
  size?: string;
  date: string;
  items?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'offline' | 'away';
  avatar: string;
}

export const agents: Agent[] = [
  { id: '1', name: 'Literature Analyst', type: 'NLP', description: 'Scans and synthesizes research papers from global agricultural databases.', status: 'active', tasks: 234, successRate: 96.2, avgTime: '2.4m', tags: ['NLP', 'Research', 'Analysis'], avatarHue: 199 },
  { id: '2', name: 'Data Harmonizer', type: 'Data Processing', description: 'Normalizes and merges heterogeneous datasets across CGIAR centers.', status: 'active', tasks: 189, successRate: 98.1, avgTime: '5.1m', tags: ['Data', 'ETL', 'Integration'], avatarHue: 262 },
  { id: '3', name: 'Hypothesis Generator', type: 'Reasoning', description: 'Proposes novel research hypotheses based on literature gaps and data patterns.', status: 'busy', tasks: 67, successRate: 87.5, avgTime: '8.3m', tags: ['AI', 'Reasoning', 'Discovery'], avatarHue: 142 },
  { id: '4', name: 'Experiment Designer', type: 'Planning', description: 'Creates experimental protocols with statistical power analysis and resource optimization.', status: 'inactive', tasks: 45, successRate: 91.8, avgTime: '12.6m', tags: ['Planning', 'Statistics', 'Design'], avatarHue: 38 },
  { id: '5', name: 'Peer Reviewer', type: 'Review', description: 'Provides detailed peer review feedback on manuscripts and proposals.', status: 'active', tasks: 156, successRate: 94.7, avgTime: '6.8m', tags: ['Review', 'Quality', 'NLP'], avatarHue: 340 },
  { id: '6', name: 'Report Synthesizer', type: 'Writing', description: 'Generates comprehensive reports from multi-source analysis results.', status: 'inactive', tasks: 89, successRate: 92.3, avgTime: '15.2m', tags: ['Writing', 'Synthesis', 'Reports'], avatarHue: 180 },
];

export const workflows: Workflow[] = [
  {
    id: 'w1',
    name: 'Crop Yield Analysis',
    status: 'running',
    progress: 60,
    steps: 5,
    created: '2026-02-28',
    nodes: [
      { id: 'n1', label: 'Data Collection', status: 'completed', duration: '3m 12s', icon: 'Database' },
      { id: 'n2', label: 'Preprocessing', status: 'completed', duration: '5m 44s', icon: 'Settings' },
      { id: 'n3', label: 'ML Analysis', status: 'running', duration: '12m 03s', icon: 'Brain' },
      { id: 'n4', label: 'Validation', status: 'pending', icon: 'CheckCircle' },
      { id: 'n5', label: 'Report', status: 'pending', icon: 'FileText' },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
    ],
  },
  {
    id: 'w2',
    name: 'Literature Review',
    status: 'completed',
    progress: 100,
    steps: 4,
    created: '2026-02-20',
    nodes: [
      { id: 'n1', label: 'Search', status: 'completed', duration: '1m 30s', icon: 'Search' },
      { id: 'n2', label: 'Filter', status: 'completed', duration: '2m 15s', icon: 'Filter' },
      { id: 'n3', label: 'Summarize', status: 'completed', duration: '8m 42s', icon: 'FileText' },
      { id: 'n4', label: 'Compile', status: 'completed', duration: '4m 10s', icon: 'BookOpen' },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
    ],
  },
  {
    id: 'w3',
    name: 'Climate Impact Study',
    status: 'draft',
    progress: 0,
    steps: 6,
    created: '2026-03-01',
    nodes: [
      { id: 'n1', label: 'Data Ingestion', status: 'pending', icon: 'Download' },
      { id: 'n2', label: 'Normalization', status: 'pending', icon: 'Settings' },
      { id: 'n3', label: 'Correlation', status: 'pending', icon: 'GitBranch' },
      { id: 'n4', label: 'Modeling', status: 'pending', icon: 'Brain' },
      { id: 'n5', label: 'Peer Review', status: 'pending', icon: 'Users' },
      { id: 'n6', label: 'Publication', status: 'pending', icon: 'Globe' },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
      { id: 'e4', source: 'n4', target: 'n5' },
      { id: 'e5', source: 'n5', target: 'n6' },
    ],
  },
];

export const activityData = Array.from({ length: 14 }, (_, i) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7],
  date: `Feb ${15 + i}`,
  value: Math.floor(Math.random() * 40) + 20,
}));

export const recentActivities: Activity[] = [
  { id: '1', type: 'agent', description: 'Literature Analyst completed batch analysis of 42 papers', timestamp: '2 min ago' },
  { id: '2', type: 'success', description: 'Crop Yield Analysis workflow passed validation step', timestamp: '8 min ago' },
  { id: '3', type: 'warning', description: 'Data Harmonizer detected schema mismatch in dataset', timestamp: '15 min ago' },
  { id: '4', type: 'agent', description: 'Hypothesis Generator proposed 3 new research directions', timestamp: '32 min ago' },
  { id: '5', type: 'error', description: 'API rate limit exceeded for external data source', timestamp: '1 hr ago' },
  { id: '6', type: 'success', description: 'Literature Review workflow completed successfully', timestamp: '2 hr ago' },
  { id: '7', type: 'agent', description: 'Peer Reviewer submitted feedback on manuscript draft', timestamp: '3 hr ago' },
  { id: '8', type: 'success', description: 'Report Synthesizer generated quarterly analysis report', timestamp: '5 hr ago' },
];

export const files: FileItem[] = [
  { id: 'f0', name: 'Research Papers', type: 'folder', date: '2026-02-28', items: 24 },
  { id: 'f1', name: 'Datasets', type: 'folder', date: '2026-03-01', items: 12 },
  { id: 'f2', name: 'Crop Yield Analysis Q4.pdf', type: 'pdf', size: '2.4 MB', date: '2026-02-28' },
  { id: 'f3', name: 'Soil Data 2025.csv', type: 'csv', size: '14.8 MB', date: '2026-02-25' },
  { id: 'f4', name: 'Research Proposal Draft.docx', type: 'docx', size: '856 KB', date: '2026-03-01' },
  { id: 'f5', name: 'Field Trial Results.csv', type: 'csv', size: '3.2 MB', date: '2026-02-20' },
  { id: 'f6', name: 'Satellite Imagery Analysis.png', type: 'png', size: '8.1 MB', date: '2026-02-18' },
  { id: 'f7', name: 'Annual Report 2025.pdf', type: 'pdf', size: '5.6 MB', date: '2026-01-15' },
];

export const teamMembers: TeamMember[] = [
  { id: 't1', name: 'Jose Martinez', role: 'Lead Researcher', status: 'online', avatar: 'JM' },
  { id: 't2', name: 'Sarah Chen', role: 'Data Scientist', status: 'online', avatar: 'SC' },
  { id: 't3', name: 'Amara Okafor', role: 'Research Associate', status: 'away', avatar: 'AO' },
];

export const dashboardStats = [
  { label: 'Active Agents', value: 12, trend: 8.2, trendUp: true, sparkline: [4, 6, 8, 7, 10, 9, 12] },
  { label: 'Workflows', value: 8, trend: 12.5, trendUp: true, sparkline: [3, 4, 5, 4, 6, 7, 8] },
  { label: 'Tasks Today', value: 47, trend: 3.1, trendUp: false, sparkline: [52, 48, 55, 51, 49, 47, 47] },
  { label: 'Success Rate', value: 94.2, trend: 1.4, trendUp: true, sparkline: [91, 92, 93, 92, 94, 93, 94.2], suffix: '%' },
];
