import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import GlassCard from '@/components/layout/GlassCard';
import { dashboardStats, activityData, agents, recentActivities, workflows } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { dashboardService } from '@/services/dashboard';
import { useApi } from '@/hooks/useApi';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Number(current.toFixed(1)));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <>{count}{suffix}</>;
}

const mockDashboard = {
  stats: dashboardStats,
  activityData,
  agents,
  recentActivities,
  workflows,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { data, error, isLive, refetch } = useApi(
    () => dashboardService.getStats(),
    mockDashboard,
  );

  const stats = data?.stats || dashboardStats;
  const chartData = data?.activityData || activityData;
  const agentList = data?.agents || agents;
  const activities = data?.recentActivities || recentActivities;
  const wfList = data?.workflows || workflows;
  const topAgents = [...agentList].sort((a: any, b: any) => b.tasks - a.tasks).slice(0, 5);

  return (
    <motion.div
      className="p-6 md:p-8 space-y-6 relative z-10"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="text-xs flex-1">{error}</span>
          <button onClick={refetch} className="flex items-center gap-1 text-xs font-medium hover:underline">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* Greeting + Stats */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Good morning, Jose</h1>
          <p className="text-sm text-muted-foreground mt-1">6 agents active, 1 workflow running</p>
        </div>
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1.5 text-[10px] font-mono bg-success/10 text-success px-2.5 py-1 rounded-full">
              <Wifi className="h-3 w-3" /> Live
            </span>
          ) : !error ? (
            <span className="flex items-center gap-1.5 text-[10px] font-mono bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
              <WifiOff className="h-3 w-3" /> Using sample data
            </span>
          ) : null}
        </div>
      </div>

      {/* 6 KPI Stat Cards */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {stats.map((stat: any) => (
          <motion.div key={stat.label} variants={item}>
            <GlassCard className="p-4 space-y-2">
              <span className="text-label text-muted-foreground">{stat.label}</span>
              <div className="text-2xl font-bold font-mono text-foreground">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="flex items-center gap-1">
                {stat.trendUp ? (
                  <ArrowUpRight className="h-3 w-3 text-success" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-destructive" />
                )}
                <span className={cn('text-[11px] font-mono', stat.trendUp ? 'text-success' : 'text-destructive')}>
                  {stat.trend}%
                </span>
              </div>
              <div className="h-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stat.sparkline.map((v: number, i: number) => ({ v, i }))}>
                    <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Bento Grid Row 1 */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-4 gap-4"
        variants={container} initial="hidden" animate="show"
      >
        {/* Activity Chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <GlassCard hoverable={false} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Agent Activity</h3>
              <span className="text-label text-muted-foreground">Last 14 days</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backdropFilter: 'blur(16px)',
                    }}
                  />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#actGrad)" dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }} activeDot={{ r: 6, fill: 'hsl(var(--primary))', filter: 'drop-shadow(0 0 6px hsl(var(--primary)))' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 mt-4 pt-3 border-t border-border">
              {[{ l: 'Avg/day', v: '34' }, { l: 'Peak', v: '58' }, { l: 'Total', v: '478' }].map(s => (
                <div key={s.l}>
                  <span className="text-[10px] text-muted-foreground uppercase">{s.l}</span>
                  <p className="text-sm font-mono font-semibold text-foreground">{s.v}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Top Agents */}
        <motion.div variants={item}>
          <GlassCard hoverable={false} className="p-5 h-full">
            <h3 className="text-sm font-semibold text-foreground mb-4">Top Agents</h3>
            <div className="space-y-3">
              {topAgents.map((agent: any, i: number) => (
                <div key={agent.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => navigate(`/agents/${agent.id}/chat`)}>
                  <span className={cn('text-xs font-mono w-4', i === 0 ? 'text-primary font-bold' : 'text-muted-foreground')}>
                    {i + 1}
                  </span>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-primary-foreground"
                    style={{ background: `hsl(${agent.avatarHue}, 60%, 50%)` }}
                  >
                    {agent.name[0]}
                  </div>
                  <span className="text-xs flex-1 text-foreground truncate">{agent.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">{agent.tasks}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* System Health */}
        <motion.div variants={item}>
          <GlassCard hoverable={false} className="p-5 h-full">
            <h3 className="text-sm font-semibold text-foreground mb-4">System Health</h3>
            <div className="flex justify-around items-center h-[calc(100%-2rem)]">
              {[
                { value: 45, label: 'CPU', color: 'hsl(var(--primary))' },
                { value: 62, label: 'Memory', color: 'hsl(var(--warning))' },
                { value: 78, label: 'API', color: 'hsl(var(--success))' },
              ].map(h => (
                <div key={h.label} className="relative flex flex-col items-center gap-2">
                  <div className="relative">
                    <svg width="56" height="56" className="-rotate-90">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
                      <motion.circle
                        cx="28" cy="28" r="24" fill="none"
                        stroke={h.color}
                        strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 24}
                        initial={{ strokeDashoffset: 2 * Math.PI * 24 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 24 * (1 - h.value / 100) }}
                        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-foreground">
                      {h.value}%
                    </span>
                  </div>
                  <span className="text-label text-muted-foreground">{h.label}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* Bento Grid Row 2 */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        variants={container} initial="hidden" animate="show"
      >
        {/* Recent Activity */}
        <motion.div variants={item}>
          <GlassCard hoverable={false} className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-0">
              {activities.map((act: any, i: number) => (
                <motion.div
                  key={act.id}
                  className="flex gap-3 py-2.5"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-1.5 h-1.5 rounded-full mt-1.5',
                      act.type === 'agent' && 'bg-primary',
                      act.type === 'success' && 'bg-success',
                      act.type === 'error' && 'bg-destructive',
                      act.type === 'warning' && 'bg-warning',
                    )} />
                    {i < activities.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{act.description}</p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{act.timestamp}</span>
                </motion.div>
              ))}
            </div>
            <button className="text-xs text-primary hover:underline mt-2">View all</button>
          </GlassCard>
        </motion.div>

        {/* Active Workflows */}
        <motion.div variants={item}>
          <GlassCard hoverable={false} className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Active Workflows</h3>
            <div className="space-y-3">
              {wfList.map((wf: any) => (
                <motion.div
                  key={wf.id}
                  className="glass rounded-xl p-3 cursor-pointer hover:bg-secondary/30 transition-all group"
                  whileHover={{ scale: 1.01 }}
                  onClick={() => navigate('/workflows')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">{wf.name}</span>
                    <span className={cn(
                      'text-[10px] font-mono px-2 py-0.5 rounded-full',
                      wf.status === 'running' && 'bg-primary/10 text-primary animate-pulse',
                      wf.status === 'completed' && 'bg-success/10 text-success',
                      wf.status === 'draft' && 'bg-muted text-muted-foreground',
                    )}>
                      {wf.status}
                    </span>
                  </div>
                  <div className="w-full h-0.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${wf.progress}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-mono text-muted-foreground">{wf.steps} steps</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{wf.created}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
