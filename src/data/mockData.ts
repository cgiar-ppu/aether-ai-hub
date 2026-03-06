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
  systemPrompt: string;
}

export interface ToolInfo {
  name: string;
  description: string;
  enabled: boolean;
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
  description: 'Central intelligence that coordinates all research subagents, decomposes complex research questions, delegates tasks to specialized subagents, and synthesizes final results for CGIAR Food, Land & Water research.',
};

export const agentToolsMap: Record<string, ToolInfo[]> = {
  '1': [
    { name: 'web_search', description: 'Search the web', enabled: true },
    { name: 'file_read', description: 'Read files from storage', enabled: true },
    { name: 'memory_store', description: 'Store findings in memory', enabled: true },
    { name: 'python_exec', description: 'Execute Python code', enabled: false },
    { name: 's3_upload', description: 'Upload files to S3', enabled: false },
    { name: 's3_download', description: 'Download files from S3', enabled: false },
    { name: 'url_fetch', description: 'Fetch content from URLs', enabled: false },
  ],
  '2': [
    { name: 'bash', description: 'Execute commands', enabled: true },
    { name: 'file_read', description: 'Read files from storage', enabled: true },
    { name: 'file_write', description: 'Write files to storage', enabled: true },
    { name: 'python_exec', description: 'Execute Python code', enabled: false },
    { name: 's3_upload', description: 'Upload files to S3', enabled: false },
    { name: 's3_download', description: 'Download files from S3', enabled: false },
    { name: 'url_fetch', description: 'Fetch content from URLs', enabled: false },
  ],
  '3': [
    { name: 'memory_read', description: 'Read from memory', enabled: true },
    { name: 'web_search', description: 'Search the web', enabled: true },
    { name: 'python_exec', description: 'Execute Python code', enabled: false },
    { name: 's3_upload', description: 'Upload files to S3', enabled: false },
    { name: 's3_download', description: 'Download files from S3', enabled: false },
    { name: 'url_fetch', description: 'Fetch content from URLs', enabled: false },
  ],
  '4': [
    { name: 'bash', description: 'Execute commands', enabled: true },
    { name: 'file_write', description: 'Write files to storage', enabled: true },
    { name: 'python_exec', description: 'Execute Python code', enabled: false },
    { name: 's3_upload', description: 'Upload files to S3', enabled: false },
    { name: 's3_download', description: 'Download files from S3', enabled: false },
    { name: 'url_fetch', description: 'Fetch content from URLs', enabled: false },
  ],
  '5': [
    { name: 'memory_read', description: 'Read from memory', enabled: true },
    { name: 'file_read', description: 'Read files from storage', enabled: true },
    { name: 'python_exec', description: 'Execute Python code', enabled: false },
    { name: 's3_upload', description: 'Upload files to S3', enabled: false },
    { name: 's3_download', description: 'Download files from S3', enabled: false },
    { name: 'url_fetch', description: 'Fetch content from URLs', enabled: false },
  ],
  '6': [
    { name: 'file_read', description: 'Read files from storage', enabled: true },
    { name: 'file_write', description: 'Write files to storage', enabled: true },
    { name: 'memory_read', description: 'Read from memory', enabled: true },
    { name: 'python_exec', description: 'Execute Python code', enabled: false },
    { name: 's3_upload', description: 'Upload files to S3', enabled: false },
    { name: 's3_download', description: 'Download files from S3', enabled: false },
    { name: 'url_fetch', description: 'Fetch content from URLs', enabled: false },
  ],
};

export const agents: Agent[] = [
  {
    id: '1', name: 'Literature Analyst', type: 'NLP', model: 'Claude Sonnet 4',
    description: 'Analyzes scientific literature from global agricultural databases, extracts key findings, identifies research gaps, and synthesizes systematic reviews on crop science topics for CGIAR research programs.',
    status: 'active', tasks: 234, successRate: 96, avgTime: '2.4m',
    tags: ['NLP', 'Research', 'Analysis'],
    tools: ['web_search', 'file_read', 'memory_store'],
    lastActive: '2 days ago', avatarHue: 220,
    systemPrompt: 'You are a scientific literature analyst specializing in CGIAR Food, Land & Water research. Search databases, extract key findings, identify research gaps, and synthesize systematic reviews on crop science topics.',
  },
  {
    id: '2', name: 'Data Harmonizer', type: 'Data Processing', model: 'Claude Sonnet 4',
    description: 'Processes and harmonizes experimental datasets from multiple sources, cleans data, standardizes formats, runs statistical analyses, and generates visualizations for agricultural research data.',
    status: 'active', tasks: 189, successRate: 94, avgTime: '5.1m',
    tags: ['Data', 'ETL', 'Integration'],
    tools: ['bash', 'file_read', 'file_write'],
    lastActive: '1 day ago', avatarHue: 175,
    systemPrompt: 'You are a data specialist for agricultural research. Clean, normalize, and harmonize experimental datasets from multiple sources. Run statistical analyses using pandas and generate clear visualizations.',
  },
  {
    id: '3', name: 'Hypothesis Generator', type: 'Reasoning', model: 'Claude Sonnet 4',
    description: 'Generates novel research hypotheses by cross-referencing existing literature, experimental data, and domain knowledge. Identifies unexplored connections in crop science and agricultural systems.',
    status: 'active', tasks: 67, successRate: 91, avgTime: '8.3m',
    tags: ['AI', 'Reasoning', 'Discovery'],
    tools: ['memory_read', 'web_search'],
    lastActive: '3 days ago', avatarHue: 142,
    systemPrompt: 'You are a research hypothesis generator for agricultural science. Cross-reference existing literature, experimental data, and domain knowledge to generate novel, testable research hypotheses with evidence rankings.',
  },
  {
    id: '4', name: 'Experiment Designer', type: 'Planning', model: 'Claude Sonnet 4',
    description: 'Designs experimental protocols with statistical power analysis, randomization schemes, treatment structures, and resource optimization for field trials and laboratory studies.',
    status: 'active', tasks: 45, successRate: 93, avgTime: '12.6m',
    tags: ['Planning', 'Statistics', 'Design'],
    tools: ['bash', 'file_write'],
    lastActive: '4 days ago', avatarHue: 280,
    systemPrompt: 'You are an experimental protocol designer for agricultural field trials. Create statistically rigorous protocols with power analysis, randomization schemes, treatment structures, and resource optimization plans.',
  },
  {
    id: '5', name: 'Peer Reviewer', type: 'Review', model: 'Claude Sonnet 4',
    description: 'Reviews research outputs for methodological rigor, statistical validity, logical consistency, and alignment with CGIAR standards. Provides structured feedback and improvement suggestions.',
    status: 'active', tasks: 156, successRate: 97, avgTime: '6.8m',
    tags: ['Review', 'Quality', 'NLP'],
    tools: ['memory_read', 'file_read'],
    lastActive: '1 day ago', avatarHue: 25,
    systemPrompt: 'You are a critical peer reviewer for CGIAR research outputs. Review manuscripts and reports for methodological rigor, statistical validity, logical consistency, and alignment with CGIAR standards. Provide structured feedback with confidence scores.',
  },
  {
    id: '6', name: 'Report Synthesizer', type: 'Writing', model: 'Claude Sonnet 4',
    description: 'Compiles research findings into structured reports, policy briefs, donor summaries, and publication-ready manuscripts following CGIAR reporting standards and formatting guidelines.',
    status: 'active', tasks: 89, successRate: 95, avgTime: '15.2m',
    tags: ['Writing', 'Synthesis', 'Reports'],
    tools: ['file_read', 'file_write', 'memory_read'],
    lastActive: '6 days ago', avatarHue: 250,
    systemPrompt: 'You are a report compiler for CGIAR research programs. Compile research findings into structured reports, policy briefs, donor summaries, and publication-ready manuscripts following CGIAR formatting guidelines.',
  },
];

export const chatMessages: ChatMessage[] = [
  // Literature Analyst (id: 1)
  { id: 'la1', agentId: '1', role: 'user', content: 'What are the latest publications on drought resistant wheat varieties published in 2025?', timestamp: '2 days ago' },
  { id: 'la2', agentId: '1', role: 'agent', content: "I'll search for recent publications on drought-resistant wheat varieties.", timestamp: '2 days ago', toolUsed: 'web_search("drought resistant wheat varieties 2025 research papers")' },
  { id: 'la3', agentId: '1', role: 'agent', content: "I found 47 relevant publications across PubMed, Scopus, and CGIAR repositories. Here are the key findings:\n\n1. **Enhanced Root Architecture** — A CIMMYT study identified TaDREB1 gene variants showing 23% improved water-use efficiency in field trials across Kenya and India (n=420).\n\n2. **Gene Editing Approaches** — Three papers describe CRISPR-Cas9 modifications to the TaWRKY transcription factor family, achieving 18% higher grain yield under drought stress.\n\n3. **Phenotyping Advances** — Novel high-throughput phenotyping methods using UAV-based thermal imaging correlated canopy temperature with drought tolerance (r² = 0.87).\n\n4. **Marker-Assisted Selection** — Two independent groups validated a QTL on chromosome 7A associated with osmotic adjustment capacity.\n\n5. **Microbiome Interactions** — Emerging research on rhizosphere bacterial communities enhancing drought resilience through improved soil moisture retention.", timestamp: '2 days ago', confidence: 'high' },
  { id: 'la4', agentId: '1', role: 'agent', content: 'Findings stored for cross-referencing with other research workflows.', timestamp: '2 days ago', toolUsed: 'memory_store(findings)' },
  { id: 'la5', agentId: '1', role: 'user', content: 'What is the confidence level on the water-use efficiency claim?', timestamp: '2 days ago' },
  { id: 'la6', agentId: '1', role: 'agent', content: 'The 23% improvement claim is supported by 2 independent field trials (Kenya, 2025 and India, 2024) with sample sizes of n=240 and n=180 respectively. However, one replication study from Brazil showed only 15% improvement, suggesting environmental factors play a significant role. I would rate this as medium confidence until more replication data is available.', timestamp: '2 days ago', confidence: 'medium' },

  // Data Harmonizer (id: 2)
  { id: 'dh1', agentId: '2', role: 'user', content: 'I have field trial data from 3 sites in Kenya. Can you run a multi-environment analysis?', timestamp: '1 day ago' },
  { id: 'dh2', agentId: '2', role: 'agent', content: "I'll load the field trial data and perform a multi-environment trial (MET) analysis.", timestamp: '1 day ago', toolUsed: 'file_read("kenya_field_trials_2025.csv")' },
  { id: 'dh3', agentId: '2', role: 'agent', content: "```python\n\nimport pandas as pd\n\nimport statsmodels.api as sm\n\nfrom statsmodels.formula.api import mixedlm\n\n\n\n\n# Load data\n\ndf = pd.read_csv(\"kenya_field_trials_2025.csv\")\n\n\n\n\n# Fit mixed model\n\nmodel = mixedlm(\"yield ~ genotype + environment\",\n\n                df, groups=df[\"site\"],\n\n                re_formula=\"~genotype\")\n\nresult = model.fit()\n\nprint(result.summary())\n\n```\n\nLet me run the statistical analysis using a linear mixed model.", timestamp: '1 day ago' },
  { id: 'dh4', agentId: '2', role: 'agent', content: "Analysis complete. Key results:\n\n— **Genotype × Environment interaction** was significant (p < 0.001).\n— **Top performing genotype**: KEN-DH-042 with mean yield of 4.2 t/ha across sites.\n— **Site effects**: Nairobi site had highest overall yields (4.8 t/ha mean).\n— **Heritability**: H² = 0.72, indicating good genetic control of yield.", timestamp: '1 day ago', confidence: 'high' },

  // Hypothesis Generator (id: 3)
  { id: 'hg1', agentId: '3', role: 'user', content: 'Based on recent maize yield data and climate projections, what hypotheses can you generate for improving drought tolerance?', timestamp: '3 days ago' },
  { id: 'hg2', agentId: '3', role: 'agent', content: 'Let me cross-reference the yield data with recent publications.', timestamp: '3 days ago', toolUsed: 'memory_read("maize_yield_data_2025")' },
  { id: 'hg3', agentId: '3', role: 'agent', content: 'Searching for latest drought tolerance mechanisms.', timestamp: '3 days ago', toolUsed: 'web_search("maize drought tolerance mechanisms 2025")' },
  { id: 'hg4', agentId: '3', role: 'agent', content: "Based on cross-referencing the yield data with 34 recent publications, I've generated 5 ranked hypotheses:\n\n**H1 (Confidence: HIGH)**: Root architecture modification through ZmNAC111 overexpression will increase drought tolerance by 15-25% in tropical maize lines, based on 3 independent validation studies.\n\n**H2 (Confidence: HIGH)**: Combining stay-green trait (SGT) with deeper rooting depth (>1.5m) will show synergistic drought tolerance effects, predicted yield improvement: 20-30%.\n\n**H3 (Confidence: MEDIUM)**: Mycorrhizal inoculation at planting can compensate for 40% water deficit through enhanced phosphorus uptake pathways.\n\n**H4 (Confidence: MEDIUM)**: Adjusting planting density from 80,000 to 65,000 plants/ha in drought-prone regions will reduce inter-plant water competition and increase individual plant yield by 12%.\n\n**H5 (Confidence: LOW)**: Foliar silicon application during vegetative stage may trigger epigenetic drought memory, improving tolerance in subsequent stress events.", timestamp: '3 days ago', confidence: 'medium' },

  // Experiment Designer (id: 4)
  { id: 'ed1', agentId: '4', role: 'user', content: 'Design a field trial protocol to test hypothesis H1 — ZmNAC111 overexpression for drought tolerance in tropical maize.', timestamp: '4 days ago' },
  { id: 'ed2', agentId: '4', role: 'agent', content: 'Running power analysis for the proposed trial design.', timestamp: '4 days ago', toolUsed: 'bash("python power_analysis.py --effect_size=0.20 --alpha=0.05 --power=0.80")' },
  { id: 'ed2b', agentId: '4', role: 'agent', content: "```python\n\nfrom scipy import stats\n\nimport numpy as np\n\nfrom statsmodels.stats.power import FTestAnovaPower\n\n\n\n\neffect_size = 0.20\n\nalpha = 0.05\n\npower = 0.80\n\nn_groups = 6\n\n\n\n\nanalysis = FTestAnovaPower()\n\nn_per_group = analysis.solve_power(\n\n    effect_size=effect_size,\n\n    alpha=alpha,\n\n    power=power,\n\n    k_groups=n_groups\n\n)\n\nprint(f\"Required plots per treatment: {int(np.ceil(n_per_group))}\")\n\nprint(f\"Total plots: {int(np.ceil(n_per_group)) * n_groups * 2}\")\n\n```", timestamp: '4 days ago' },
  { id: 'ed3', agentId: '4', role: 'agent', content: "I've designed a complete experimental protocol:\n\n**Trial Design**: Split-plot RCBD with 4 replications\n**Locations**: 3 sites (Kiboko-Kenya, Namulonge-Uganda, Chitedze-Malawi)\n**Treatments**: 2 factors — Genotype (4 ZmNAC111 lines + 2 controls) × Water regime (well-watered + managed drought stress)\n**Plot size**: 4 rows × 5m, 0.75m spacing = 15m²\n**Total plots**: 144 (6 genotypes × 2 treatments × 4 reps × 3 sites)\n\n**Power analysis result**: With n=144 plots, we can detect a 20% yield difference with 80% power at α=0.05.\n\n**Timeline**: Planting in March 2026, drought stress imposed at V8 stage (May), harvest in August.\n**Key measurements**: Grain yield, ASI, leaf rolling score, root pull resistance, canopy temperature, NDVI at weekly intervals.", timestamp: '4 days ago', confidence: 'high' },
  { id: 'ed4', agentId: '4', role: 'agent', content: 'Protocol document saved.', timestamp: '4 days ago', toolUsed: 'file_write("protocol_ZmNAC111_drought_trial_2026.pdf")' },

  // Peer Reviewer (id: 5)
  { id: 'pr1', agentId: '5', role: 'user', content: 'Review the drought tolerance experiment protocol and the hypothesis report for methodological rigor.', timestamp: '1 day ago' },
  { id: 'pr2', agentId: '5', role: 'agent', content: 'Loading protocol and hypothesis report for review.', timestamp: '1 day ago', toolUsed: 'memory_read("protocol_ZmNAC111")' },
  { id: 'pr3', agentId: '5', role: 'agent', content: 'Reading the hypothesis report.', timestamp: '1 day ago', toolUsed: 'file_read("hypothesis_report_maize_yield.md")' },
  { id: 'pr4', agentId: '5', role: 'agent', content: "**Peer Review Report**\n\n**Overall Score: 7.5/10 — ACCEPT WITH MINOR REVISIONS**\n\n**Strengths:**\n✅ Appropriate use of split-plot RCBD design for genotype × water regime\n✅ Power analysis correctly calculated — 144 plots provides adequate statistical power\n✅ Multi-location design adds generalizability\n\n**Issues Found:**\n⚠️ **Missing soil characterization**: Protocol doesn't specify soil type requirements at each site. Drought response varies significantly by soil water-holding capacity. **Recommendation**: Add pre-trial soil sampling for texture, organic matter, and field capacity.\n⚠️ **Incomplete drought stress protocol**: \"Managed drought\" is vaguely defined. Specify: days of withholding irrigation, target soil moisture levels (e.g., 30% FC), and rainout shelter specifications.\n⚠️ **No border rows specified**: Edge effects may confound yield data. Add 1 border row on each side.\n\n**Statistical Concerns:**\n⚠️ The mixed model should include site × genotype × water interaction term, not just main effects.\n\n**Minor:**\n- Consider adding chlorophyll fluorescence (Fv/Fm) as a rapid stress indicator\n- Add data management plan and quality control procedures", timestamp: '1 day ago', confidence: 'high' },

  // Report Synthesizer (id: 6)
  { id: 'rs1', agentId: '6', role: 'user', content: 'Compile a summary report of the drought tolerance research pipeline — from literature review through experiment design and peer review.', timestamp: '6 days ago' },
  { id: 'rs2', agentId: '6', role: 'agent', content: 'Loading source documents for compilation.', timestamp: '6 days ago', toolUsed: 'file_read("literature_review_drought_wheat.md")' },
  { id: 'rs3', agentId: '6', role: 'agent', content: 'Reading hypothesis report.', timestamp: '6 days ago', toolUsed: 'file_read("hypothesis_report_maize_yield.md")' },
  { id: 'rs4', agentId: '6', role: 'agent', content: 'Loading experiment protocol from memory.', timestamp: '6 days ago', toolUsed: 'memory_read("experiment_protocol_ZmNAC111")' },
  { id: 'rs5', agentId: '6', role: 'agent', content: "I've compiled the comprehensive research pipeline report. Here's the executive summary:\n\n**CGIAR AI Co-Scientist Research Report**\n**Title**: Drought Tolerance Enhancement in Tropical Maize — Integrated Research Pipeline\n**Date**: March 2026 | **Status**: Ready for review\n\n**Executive Summary**: This report synthesizes findings from an automated research pipeline covering literature analysis (47 papers reviewed), hypothesis generation (5 ranked hypotheses), experimental protocol design (split-plot RCBD, 3 sites, 144 plots), and peer review (7.5/10, minor revisions required).\n\n**Key Recommendation**: Proceed with field trial for Hypothesis H1 (ZmNAC111 overexpression) after addressing peer review feedback on soil characterization and drought stress specification.\n\n**Confidence Assessment**:\n🟢 Literature review: HIGH (comprehensive coverage of 2024-2025 publications)\n🟢 Experimental design: HIGH (statistically rigorous, multi-location)\n🟡 Hypothesis H1: MEDIUM-HIGH (2 supporting studies, 1 partial replication)\n🟡 Timeline feasibility: MEDIUM (dependent on seed availability for March planting)", timestamp: '6 days ago', confidence: 'high' },
  { id: 'rs6', agentId: '6', role: 'agent', content: 'Report saved. The full document includes: executive summary, methodology overview, detailed findings per pipeline stage, risk assessment, budget estimate ($45,000 for 3-site trial), and recommended next steps.', timestamp: '6 days ago', toolUsed: 'file_write("report_drought_tolerance_pipeline_2026.pdf")' },
];

export const workflows: Workflow[] = [
  {
    id: 'w1',
    name: 'Systematic Literature Review',
    status: 'running',
    progress: 66,
    steps: 3,
    created: '2026-02-28',
    description: 'Automated pipeline for conducting systematic reviews across agricultural databases',
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
    description: 'End-to-end pipeline from literature review to validated experimental protocol',
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
    status: 'running',
    progress: 33,
    steps: 3,
    created: '2026-03-01',
    description: 'Automated research report compilation with peer review quality assurance',
    lastRun: '4 hours ago',
    runCount: 5,
    agentSequence: ['2', '5', '6'],
    nodes: [
      { id: 'n1', label: 'Data Harmonizer', status: 'completed', duration: '4m 20s', icon: 'Database' },
      { id: 'n2', label: 'Peer Reviewer', status: 'running', duration: '3m 15s', icon: 'CheckCircle' },
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
  { id: '1', type: 'agent', description: 'Literature Analyst completed systematic review of 42 papers on drought resistance', timestamp: '2 min ago' },
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
  { id: 'f7', name: 'Annual Report 2025.pdf', type: 'pdf', size: '5.6 MB', date: '2026-02-15' },
  { id: 'f8', name: 'wheat_drought_resistance_review_2025.pdf', type: 'pdf', size: '2.4 MB', date: '2026-01-30' },
  { id: 'f9', name: 'field_trial_data_kenya_q1.csv', type: 'csv', size: '890 KB', date: '2026-02-10' },
  { id: 'f10', name: 'hypothesis_report_maize_yield.md', type: 'md', size: '156 KB', date: '2026-02-22' },
  { id: 'f11', name: 'experiment_protocol_rice_salinity.pdf', type: 'pdf', size: '1.1 MB', date: '2026-02-05' },
  // Research Papers folder contents
  { id: 'fp1', name: 'Drought Resistant Wheat Varieties - Systematic Review.pdf', type: 'pdf', size: '3.2 MB', date: '2026-02-27', parentId: 'f0' },
  { id: 'fp2', name: 'Banana Disease Detection ML Paper.pdf', type: 'pdf', size: '1.8 MB', date: '2026-02-25', parentId: 'f0' },
  { id: 'fp3', name: 'Sweet Potato Genomics Study 2025.pdf', type: 'pdf', size: '2.1 MB', date: '2026-02-20', parentId: 'f0' },
  { id: 'fp4', name: 'CIMMYT Annual Review.pdf', type: 'pdf', size: '8.7 MB', date: '2026-02-18', parentId: 'f0' },
  { id: 'fp5', name: 'Wheat Genomics Review 2025.pdf', type: 'pdf', size: '4.2 MB', date: '2026-02-15', parentId: 'f0' },
  // Datasets folder contents
  { id: 'fd1', name: 'kenya_maize_field_trial_2025.csv', type: 'csv', size: '4.5 MB', date: '2026-02-28', parentId: 'f1' },
  { id: 'fd2', name: 'soil_moisture_sensors_q1.csv', type: 'csv', size: '8.2 MB', date: '2026-02-26', parentId: 'f1' },
  { id: 'fd3', name: 'crop_yield_historical_data.xlsx', type: 'xlsx', size: '12.3 MB', date: '2026-02-22', parentId: 'f1' },
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
