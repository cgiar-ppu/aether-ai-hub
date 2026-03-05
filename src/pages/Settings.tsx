import { motion } from 'framer-motion';
import { useState } from 'react';
import { Sun, Moon, Copy, Eye, EyeOff } from 'lucide-react';
import GlassCard from '@/components/layout/GlassCard';
import { teamMembers } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/hooks/useTheme';

const accentColors = [
  { name: 'Sky', hue: 199 },
  { name: 'Violet', hue: 262 },
  { name: 'Emerald', hue: 160 },
  { name: 'Amber', hue: 38 },
  { name: 'Rose', hue: 340 },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [selectedAccent, setSelectedAccent] = useState(0);
  const [showKey, setShowKey] = useState(false);
  const [notifications, setNotifications] = useState({ email: true, push: false, agents: true });

  return (
    <motion.div
      className="p-6 md:p-8 space-y-6 relative z-10 max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your platform</p>
      </div>

      <motion.div className="space-y-4" variants={container} initial="hidden" animate="show">
        {/* Profile */}
        <motion.div variants={item}>
          <GlassCard hoverable={false} className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Profile</h3>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                JM
              </div>
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-label text-muted-foreground mb-1 block">Name</label>
                    <Input defaultValue="Jose Martinez" className="glass border-border text-sm" />
                  </div>
                  <div>
                    <label className="text-label text-muted-foreground mb-1 block">Email</label>
                    <Input defaultValue="jose@cgiar.org" className="glass border-border text-sm" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">Lead Researcher</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Appearance */}
        <motion.div variants={item}>
          <GlassCard hoverable={false} className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Appearance</h3>
            <div className="space-y-4">
              <div>
                <label className="text-label text-muted-foreground mb-2 block">Theme</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => theme !== 'light' && toggleTheme()}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all',
                      theme === 'light' ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Sun className="h-4 w-4" /> Light
                  </button>
                  <button
                    onClick={() => theme !== 'dark' && toggleTheme()}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all',
                      theme === 'dark' ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Moon className="h-4 w-4" /> Dark
                  </button>
                </div>
              </div>
              <div>
                <label className="text-label text-muted-foreground mb-2 block">Accent Color</label>
                <div className="flex gap-3">
                  {accentColors.map((c, i) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedAccent(i)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        selectedAccent === i && 'ring-2 ring-offset-2 ring-offset-background ring-primary'
                      )}
                      style={{ background: `hsl(${c.hue}, 60%, 50%)` }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={item}>
          <GlassCard hoverable={false} className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Notifications</h3>
            <div className="space-y-4">
              {[
                { key: 'email' as const, label: 'Email Notifications' },
                { key: 'push' as const, label: 'Push Notifications' },
                { key: 'agents' as const, label: 'Agent Alerts' },
              ].map(n => (
                <div key={n.key} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{n.label}</span>
                  <Switch
                    checked={notifications[n.key]}
                    onCheckedChange={(v) => setNotifications(prev => ({ ...prev, [n.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* API Configuration */}
        <motion.div variants={item}>
          <GlassCard hoverable={false} className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">API Configuration</h3>
            <div className="space-y-3">
              <div>
                <label className="text-label text-muted-foreground mb-1 block">API Key</label>
                <div className="flex gap-2">
                  <Input
                    type={showKey ? 'text' : 'password'}
                    defaultValue="sk-cgiar-xxxxxxxxxxxxxxxxxxxx"
                    className="glass border-border text-sm font-mono flex-1"
                    readOnly
                  />
                  <button onClick={() => setShowKey(!showKey)} className="p-2 glass rounded-lg text-muted-foreground hover:text-foreground">
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button className="p-2 glass rounded-lg text-muted-foreground hover:text-foreground">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-label text-muted-foreground mb-1 block">Endpoint</label>
                <Input defaultValue="https://api.cgiar.org/v1" className="glass border-border text-sm font-mono" readOnly />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Team */}
        <motion.div variants={item}>
          <GlassCard hoverable={false} className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Team</h3>
            <div className="space-y-3">
              {teamMembers.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                    {member.avatar}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-foreground">{member.name}</span>
                    <p className="text-[10px] text-muted-foreground">{member.role}</p>
                  </div>
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    member.status === 'online' && 'bg-success',
                    member.status === 'offline' && 'bg-muted-foreground/30',
                    member.status === 'away' && 'bg-warning',
                  )} />
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SettingsPage;
