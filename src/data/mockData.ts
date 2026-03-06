export interface Agent {
  id: string;
  name: string;
  type: string;
  model: string;
  description: string;
  status: 'active' | 'inactive' | 'busy';
  tasks: number;
  successRate: number;
  avgTime: string;
  tags: string[];
  tools: string[];
  lastActive: string;
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
  description: string;
  lastRun: string;
  runCount: number;
  agentSequence: string[];
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
  type: 'pdf' | 'csv' | 'docx' | 'png' | 'folder' | 'md' | 'xlsx';
  size?: string;
  date: string;
  items?: number;
  parentId?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'offline' | 'away';
  avatar: string;
}

export interface ChatMessage {
  id: string;
  agentId: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  confidence?: 'high' | 'medium' | 'low';
  toolUsed?: string;
}

export interface Orchestrator {
  name: string;
  model: string;
  status: 'active' | 'inactive';
  description: string;
}

export const orchestrator: Orchestrator = {
  name: 'AI Co-Scientist Orchestrator',
  model: 'Claude Opus 4.6',
  status: 'active',
  description: 'Central orchestrator that coordinates all sub-agents, manages task delegation, monitors progress, and synthesizes results across the research pipeline.',
};

export const agents: Agent[] = [
  { id: '1', name: 'Literature Analyst', type: 'NLP', model: 'Claude Sonnet 4', description: 'Scans and synthesizes research papers from global agricultural databases.', status: 'active', tasks: 234, successRate: 96.2, avgTime: '2.4m', tags: ['NLP', 'Research', 'Analysis'], tools: ['web_search', 'file_read', 'memory_store'], lastActive: '3 min ago', avatarHue: 199 },
  { id: '2', name: 'Data Harmonizer', type: 'Data Processing', model: 'Claude Sonnet 4', description: 'Normalizes and merges heterogeneous datasets across CGIAR centers.', status: 'active', tasks: 189, successRate: 98.1, avgTime: '5.1m', tags: ['Data', 'ETL', 'Integration'], tools: ['data_transform', 'schema_validate', 'file_write'], lastActive: '12 min ago', avatarHue: 262 },
  { id: '3', name: 'Hypothesis Generator', type: 'Reasoning', model: 'Claude Opus 4.6', description: 'Proposes novel research hypotheses based on literature gaps and data patterns.', status: 'active', tasks: 67, successRate: 87.5, avgTime: '8.3m', tags: ['AI', 'Reasoning', 'Discovery'], tools: ['web_search', 'reasoning_engine', 'memory_store'], lastActive: '1 hr ago', avatarHue: 142 },
  { id: '4', name: 'Experiment Designer', type: 'Planning', model: 'Claude Sonnet 4', description: 'Creates experimental protocols with statistical power analysis and resource optimization.', status: 'active', tasks: 45, successRate: 91.8, avgTime: '12.6m', tags: ['Planning', 'Statistics', 'Design'], tools: ['calculator', 'file_write', 'template_engine'], lastActive: '2 days ago', avatarHue: 38 },
  { id: '5', name: 'Peer Reviewer', type: 'Review', model: 'Claude Opus 4.6', description: 'Provides detailed peer review feedback on manuscripts and proposals.', status: 'active', tasks: 156, successRate: 94.7, avgTime: '6.8m', tags: ['Review', 'Quality', 'NLP'], tools: ['file_read', 'web_search', 'annotation_tool'], lastActive: '30 min ago', avatarHue: 340 },
  { id: '6', name: 'Report Synthesizer', type: 'Writing', model: 'Claude Sonnet 4', description: 'Generates comprehensive reports from multi-source analysis results.', status: 'active', tasks: 89, successRate: 92.3, avgTime: '15.2m', tags: ['Writing', 'Synthesis', 'Reports'], tools: ['file_read', 'file_write', 'chart_generator'], lastActive: '5 hr ago', avatarHue: 180 },
];

export const chatMessages: ChatMessage[] = [
  { id: 'm1', agentId: '1', role: 'user', content: 'Search for recent papers on drought-resistant wheat varieties published in the last 2 years.', timestamp: '10:32 AM' },
  { id: 'm2', agentId: '1', role: 'agent', content: 'I found 47 papers matching your query across PubMed, Scopus, and CGIAR repositories. The top 5 most cited papers focus on CRISPR-edited drought tolerance genes in Triticum aestivum. Shall I generate a summary table?', timestamp: '10:33 AM', confidence: 'high', toolUsed: 'web_search("drought-resistant wheat 2024-2026")' },
  { id: 'm3', agentId: '1', role: 'user', content: 'Yes, and highlight any papers from CIMMYT researchers.', timestamp: '10:34 AM' },
  { id: 'm4', agentId: '1', role: 'agent', content: 'Here is the summary table with 47 papers. I identified 12 papers with CIMMYT-affiliated authors, highlighted in the results. Notable finding: 3 papers describe a novel TaDREB1 gene variant showing 23% improved water-use efficiency under controlled conditions.', timestamp: '10:35 AM', confidence: 'high', toolUsed: 'file_read("cimmyt_author_index.json")' },
  { id: 'm5', agentId: '1', role: 'user', content: 'What is the confidence level on the water-use efficiency claim?', timestamp: '10:36 AM' },
  { id: 'm6', agentId: '1', role: 'agent', content: 'The 23% improvement claim is supported by 2 independent field trials (Kenya, 2025 and India, 2024) with sample sizes of n=240 and n=180 respectively. However, one replication study from Brazil showed only 15% improvement, suggesting environmental factors play a significant role. I would rate this as medium confidence until more replication data is available.', timestamp: '10:37 AM', confidence: 'medium' },
];

export const workflows: Workflow[] = [
  {
    id: 'w1',
    name: 'Systematic Literature Review',
    status: 'running',
    progress: 66,
    steps: 3,
    created: '2026-02-28',
    description: 'Automated systematic review pipeline that searches, filters, and synthesizes research literature.',
    lastRun: '2 hours ago',
    runCount: 14,
    agentSequence: ['1', '2', '6'],
    nodes: [
      { id: 'n1', label: 'Literature Analyst', status: 'completed', duration: '3m 12s', icon: 'Search' },
      { id: 'n2', label: 'Data Harmonizer', status: 'running', duration: '5m 44s', icon: 'Database' },
      { id: 'n3', label: 'Report Synthesizer', status: 'pending', icon: 'FileText' },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ],
  },
  {
    id: 'w2',
    name: 'Hypothesis-to-Experiment Pipeline',
    status: 'completed',
    progress: 100,
    steps: 4,
    created: '2026-02-20',
    description: 'End-to-end pipeline from literature analysis through hypothesis generation to experiment design with peer review.',
    lastRun: '1 day ago',
    runCount: 8,
    agentSequence: ['1', '3', '4', '5'],
    nodes: [
      { id: 'n1', label: 'Literature Analyst', status: 'completed', duration: '2m 30s', icon: 'Search' },
      { id: 'n2', label: 'Hypothesis Generator', status: 'completed', duration: '8m 15s', icon: 'Brain' },
      { id: 'n3', label: 'Experiment Designer', status: 'completed', duration: '12m 42s', icon: 'Settings' },
      { id: 'n4', label: 'Peer Reviewer', status: 'completed', duration: '6m 10s', icon: 'CheckCircle' },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
    ],
  },
  {
    id: 'w3',
    name: 'Research Report Generation',
    status: 'draft',
    progress: 0,
    steps: 3,
    created: '2026-03-01',
    description: 'Harmonizes datasets, runs peer review validation, and generates comprehensive research reports.',
    lastRun: 'Never',
    runCount: 0,
    agentSequence: ['2', '5', '6'],
    nodes: [
      { id: 'n1', label: 'Data Harmonizer', status: 'pending', icon: 'Database' },
      { id: 'n2', label: 'Peer Reviewer', status: 'pending', icon: 'CheckCircle' },
      { id: 'n3', label: 'Report Synthesizer', status: 'pending', icon: 'FileText' },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ],
  },
];

export const activityData = Array.from({ length: 14 }, (_, i) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7],
  date: `Feb ${15 + i}`,
  value: Math.floor(Math.random() * 40) + 20,
}));

export const recentActivities: Activity[] = [
  { id: '1', type: 'agent', description: 'Literature Analyst completed batch analysis of 42 papers on drought resistance', timestamp: '2 min ago' },
  { id: '2', type: 'success', description: 'Systematic Literature Review workflow passed data harmonization step', timestamp: '8 min ago' },
  { id: '3', type: 'warning', description: 'Data Harmonizer detected schema mismatch in CIMMYT soil dataset', timestamp: '15 min ago' },
  { id: '4', type: 'agent', description: 'Hypothesis Generator proposed 3 new research directions for climate adaptation', timestamp: '32 min ago' },
  { id: '5', type: 'error', description: 'API rate limit exceeded for PubMed external data source', timestamp: '1 hr ago' },
  { id: '6', type: 'success', description: 'Peer Reviewer completed manuscript review for wheat genomics paper', timestamp: '2 hr ago' },
  { id: '7', type: 'agent', description: 'Experiment Designer generated protocol for multi-site field trial', timestamp: '3 hr ago' },
  { id: '8', type: 'success', description: 'Report Synthesizer generated quarterly crop yield analysis report', timestamp: '5 hr ago' },
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
  { id: 'f8', name: 'Experiment Protocol Notes.md', type: 'md', size: '124 KB', date: '2026-03-02' },
  { id: 'f9', name: 'Budget Allocation 2026.xlsx', type: 'xlsx', size: '1.1 MB', date: '2026-02-15' },
  { id: 'f10', name: 'Peer Review Feedback.md', type: 'md', size: '89 KB', date: '2026-03-03' },
  { id: 'f11', name: 'Climate Data Summary.csv', type: 'csv', size: '6.4 MB', date: '2026-02-10' },
  // Folder contents
  { id: 'fp1', name: 'Drought Resistance Meta-Analysis.pdf', type: 'pdf', size: '3.1 MB', date: '2026-02-27', parentId: 'f0' },
  { id: 'fp2', name: 'Wheat Genomics Review 2025.pdf', type: 'pdf', size: '4.2 MB', date: '2026-02-25', parentId: 'f0' },
  { id: 'fp3', name: 'CIMMYT Annual Review.pdf', type: 'pdf', size: '8.7 MB', date: '2026-02-20', parentId: 'f0' },
  { id: 'fp4', name: 'Soil pH Global Dataset.csv', type: 'csv', size: '22.4 MB', date: '2026-02-28', parentId: 'f1' },
  { id: 'fp5', name: 'Rainfall Patterns 2020-2025.xlsx', type: 'xlsx', size: '15.6 MB', date: '2026-02-26', parentId: 'f1' },
  { id: 'fp6', name: 'Crop Yield Multiyear.csv', type: 'csv', size: '9.8 MB', date: '2026-02-22', parentId: 'f1' },
];

export const teamMembers: TeamMember[] = [
  { id: 't1', name: 'Jose Martinez', role: 'Lead Researcher', status: 'online', avatar: 'JM' },
  { id: 't2', name: 'Sarah Chen', role: 'Data Scientist', status: 'online', avatar: 'SC' },
  { id: 't3', name: 'Amara Okafor', role: 'Research Associate', status: 'away', avatar: 'AO' },
];

export const dashboardStats = [
  { label: 'Active Sessions', value: 3, trend: 12.0, trendUp: true, sparkline: [1, 2, 1, 3, 2, 3, 3] },
  { label: 'Total Agents', value: 7, trend: 0, trendUp: true, sparkline: [6, 6, 6, 7, 7, 7, 7] },
  { label: 'Tasks Completed', value: 780, trend: 8.2, trendUp: true, sparkline: [620, 650, 690, 710, 740, 760, 780] },
  { label: 'Success Rate', value: 94.2, trend: 1.4, trendUp: true, sparkline: [91, 92, 93, 92, 94, 93, 94.2], suffix: '%' },
  { label: 'Papers Analyzed', value: 1247, trend: 15.3, trendUp: true, sparkline: [800, 900, 980, 1050, 1120, 1190, 1247] },
  { label: 'Datasets Processed', value: 89, trend: 5.6, trendUp: true, sparkline: [62, 68, 72, 76, 80, 85, 89] },
];
