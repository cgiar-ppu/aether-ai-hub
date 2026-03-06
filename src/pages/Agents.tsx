import { motion } from 'framer-motion';
import { Search, Plus, ArrowRight, Brain, Wrench } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '@/components/layout/GlassCard';
import { agents, orchestrator } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

const Agents = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const filtered = agents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-xl font-semibold text-foreground">AI Agents</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and monitor your research agents</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 glass border-border text-sm w-56"
            />
          </div>
          <Button className="h-9 rounded-xl gap-2 text-sm">
            <Plus className="h-3.5 w-3.5" />
            New Agent
          </Button>
        </div>
      </div>

      {/* Orchestrator Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative rounded-2xl p-5 overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-base font-semibold text-foreground">{orchestrator.name}</h2>
                <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {orchestrator.model}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] font-mono text-success">Online</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl">{orchestrator.description}</p>
            </div>
          </div>
          {/* Decorative connection line */}
          <div className="absolute bottom-0 left-10 w-px h-4 border-l-2 border-dashed border-primary/30" />
        </div>
      </motion.div>

      {/* Dashed connector */}
      <div className="flex justify-start pl-10">
        <div className="w-px h-4 border-l-2 border-dashed border-primary/20" />
      </div>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {filtered.map((agent) => (
          <motion.div key={agent.id} variants={item}>
            <GlassCard
              className="p-5 group relative cursor-pointer"
              onClick={() => navigate(`/agents/${agent.id}/chat`)}
            >
              {/* Top: avatar + name + status */}
              <div className="flex items-start gap-3 mb-3">
                <div className="relative">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold text-primary-foreground"
                    style={{ background: `linear-gradient(135deg, hsl(${agent.avatarHue}, 60%, 50%), hsl(${agent.avatarHue + 30}, 60%, 45%))` }}
                  >
                    {agent.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div className={cn(
                    'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background',
                    agent.status === 'active' && 'bg-success animate-pulse',
                    agent.status === 'inactive' && 'bg-muted-foreground/30',
                    agent.status === 'busy' && 'bg-warning',
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-label text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md">
                      {agent.type}
                    </span>
                    <span className="text-[10px] font-mono text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                      {agent.model}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{agent.description}</p>

              {/* Tools */}
              <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                <Wrench className="h-3 w-3 text-muted-foreground shrink-0" />
                {agent.tools.map(tool => (
                  <span key={tool} className="text-[10px] font-mono bg-secondary/50 text-muted-foreground px-1.5 py-0.5 rounded">
                    {tool}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-0 text-xs mb-3">
                <div className="flex-1 text-center">
                  <span className="font-mono font-semibold text-foreground">{agent.tasks}</span>
                  <p className="text-[10px] text-muted-foreground">Tasks</p>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="flex-1 text-center">
                  <span className="font-mono font-semibold text-success">{agent.successRate}%</span>
                  <p className="text-[10px] text-muted-foreground">Success</p>
                </div>
                <div className="w-px h-6 bg-border" />
                <div className="flex-1 text-center">
                  <span className="font-mono font-semibold text-foreground">{agent.avgTime}</span>
                  <p className="text-[10px] text-muted-foreground">Avg Time</p>
                </div>
              </div>

              {/* Bottom: tags + last active */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  {agent.tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0 ml-2">{agent.lastActive}</span>
              </div>

              {/* Hover arrow */}
              <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Agents;
