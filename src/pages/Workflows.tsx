import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Database, Settings, Brain, CheckCircle, FileText, Search, Filter, BookOpen, Download, GitBranch, Users, Globe } from 'lucide-react';
import { workflows } from '@/data/mockData';
import GlassCard from '@/components/layout/GlassCard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Database, Settings, Brain, CheckCircle, FileText, Search, Filter, BookOpen, Download, GitBranch, Users, Globe,
};

function GlassNode({ data }: { data: { label: string; status: string; duration?: string; icon: string } }) {
  const Icon = iconMap[data.icon] || FileText;
  return (
    <div className={cn(
      'glass rounded-xl px-4 py-3 min-w-[150px] transition-all',
      data.status === 'completed' && 'border-l-2 border-l-success',
      data.status === 'running' && 'border-l-2 border-l-primary animate-pulse',
      data.status === 'pending' && 'border-dashed',
    )}>
      <Handle type="target" position={Position.Left} className="!bg-primary !w-2 !h-2 !border-0" />
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">{data.label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          'text-[10px] font-mono px-1.5 py-0.5 rounded-full',
          data.status === 'completed' && 'bg-success/10 text-success',
          data.status === 'running' && 'bg-primary/10 text-primary',
          data.status === 'pending' && 'bg-muted text-muted-foreground',
        )}>
          {data.status}
        </span>
        {data.duration && <span className="text-[10px] font-mono text-muted-foreground">{data.duration}</span>}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-primary !w-2 !h-2 !border-0" />
    </div>
  );
}

const nodeTypes = { glass: GlassNode };

const Workflows = () => {
  const [selected, setSelected] = useState(workflows[0].id);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const currentWorkflow = workflows.find(w => w.id === selected)!;

  const flowNodes: Node[] = useMemo(() => currentWorkflow.nodes.map((n, i) => ({
    id: n.id,
    type: 'glass',
    position: { x: i * 220, y: 80 + (i % 2 === 0 ? 0 : 40) },
    data: { label: n.label, status: n.status, duration: n.duration, icon: n.icon },
  })), [currentWorkflow]);

  const flowEdges: Edge[] = useMemo(() => currentWorkflow.edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: currentWorkflow.status === 'running',
    style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
  })), [currentWorkflow]);

  const [nodes, , onNodesChange] = useNodesState(flowNodes);
  const [edges, , onEdgesChange] = useEdgesState(flowEdges);

  const filteredWorkflows = filterStatus === 'all' ? workflows : workflows.filter(w => w.status === filterStatus);

  return (
    <motion.div
      className="p-6 md:p-8 space-y-6 relative z-10"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Workflows</h1>
          <p className="text-sm text-muted-foreground mt-1">Design and automate research pipelines</p>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'running', 'completed', 'draft'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-full transition-all capitalize',
                filterStatus === s
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground glass'
              )}
            >
              {s}
            </button>
          ))}
          <Button className="h-9 rounded-xl gap-2 text-sm ml-2">
            <Plus className="h-3.5 w-3.5" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[500px]">
        {/* List */}
        <div className="lg:col-span-2 space-y-2">
          {filteredWorkflows.map(wf => (
            <motion.div
              key={wf.id}
              onClick={() => setSelected(wf.id)}
              className={cn(
                'glass rounded-xl p-4 cursor-pointer transition-all',
                selected === wf.id
                  ? 'border-l-2 border-l-primary bg-primary/5'
                  : 'hover:bg-secondary/30'
              )}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground">{wf.name}</span>
                <span className={cn(
                  'text-[10px] font-mono px-2 py-0.5 rounded-full',
                  wf.status === 'running' && 'bg-primary/10 text-primary animate-pulse',
                  wf.status === 'completed' && 'bg-success/10 text-success',
                  wf.status === 'draft' && 'bg-muted text-muted-foreground',
                )}>
                  {wf.status}
                </span>
              </div>
              <div className="w-full h-0.5 bg-secondary rounded-full overflow-hidden mb-2">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${wf.progress}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted-foreground">{wf.steps} steps</span>
                <span className="text-[10px] font-mono text-muted-foreground">{wf.created}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Canvas */}
        <div className="lg:col-span-3 glass rounded-2xl overflow-hidden">
          <ReactFlow
            key={selected}
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            className="!bg-transparent"
          >
            <Background color="hsl(var(--border))" gap={20} size={1} />
            <Controls className="!bg-transparent !border-0 !shadow-none [&>button]:glass [&>button]:!border-border [&>button]:!bg-transparent [&>button]:text-foreground" />
            <MiniMap
              className="!bg-secondary/30 !border-border rounded-xl"
              nodeColor="hsl(var(--primary))"
              maskColor="hsl(var(--background) / 0.8)"
            />
          </ReactFlow>
        </div>
      </div>
    </motion.div>
  );
};

export default Workflows;
