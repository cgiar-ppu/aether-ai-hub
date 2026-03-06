import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Settings2, X } from 'lucide-react';
import { agents, chatMessages, agentToolsMap } from '@/data/mockData';
import CodeBlock from '@/components/CodeBlock';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const confidenceColors: Record<string, string> = {
  high: 'bg-success/10 text-success',
  medium: 'bg-warning/10 text-warning',
  low: 'bg-destructive/10 text-destructive',
};

const AgentChat = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const selectedAgent = agents.find(a => a.id === agentId) || agents[0];
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [configOpen, setConfigOpen] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState(selectedAgent.systemPrompt);
  const [maxTokens, setMaxTokens] = useState(8192);
  const [temperature, setTemperature] = useState([0.1]);
  const [toolStates, setToolStates] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const agentMessages = chatMessages.filter(m => m.agentId === selectedAgent.id);
  const agentTools = agentToolsMap[selectedAgent.id] || [];

  // Reset config when agent changes
  useEffect(() => {
    setSystemPrompt(selectedAgent.systemPrompt);
    const states: Record<string, boolean> = {};
    agentTools.forEach(t => { states[t.name] = t.enabled; });
    setToolStates(states);
  }, [selectedAgent.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages]);

  useEffect(() => {
    const timer = setTimeout(() => setIsTyping(true), 1000);
    const timer2 = setTimeout(() => setIsTyping(false), 3000);
    return () => { clearTimeout(timer); clearTimeout(timer2); };
  }, [selectedAgent.id]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessage('');
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
  };

  return (
    <motion.div
      className="relative z-10 h-[calc(100vh-3.5rem)] flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Left Sidebar - Agent List */}
      <div className="hidden md:flex w-64 shrink-0 flex-col glass border-r border-border">
        <div className="p-4 border-b border-border">
          <button
            onClick={() => navigate('/agents')}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Agents
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => navigate(`/agents/${agent.id}/chat`)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all',
                agent.id === selectedAgent.id
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-secondary/30'
              )}
            >
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold text-primary-foreground"
                  style={{ background: `linear-gradient(135deg, hsl(${agent.avatarHue}, 60%, 50%), hsl(${agent.avatarHue + 30}, 60%, 45%))` }}
                >
                  {agent.name.split(' ').map(w => w[0]).join('')}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background bg-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{agent.name}</p>
                <p className="text-[10px] text-muted-foreground">Online</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="glass border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/agents')}
              className="md:hidden p-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold text-primary-foreground"
              style={{ background: `linear-gradient(135deg, hsl(${selectedAgent.avatarHue}, 60%, 50%), hsl(${selectedAgent.avatarHue + 30}, 60%, 45%))` }}
            >
              {selectedAgent.name.split(' ').map(w => w[0]).join('')}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{selectedAgent.name}</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="text-[10px] text-success font-mono">Online</span>
                <span className="text-[10px] text-muted-foreground ml-2 font-mono">{selectedAgent.model}</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setConfigOpen(!configOpen)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {agentMessages.length === 0 && (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-semibold text-primary-foreground mx-auto mb-4"
                  style={{ background: `linear-gradient(135deg, hsl(${selectedAgent.avatarHue}, 60%, 50%), hsl(${selectedAgent.avatarHue + 30}, 60%, 45%))` }}
                >
                  {selectedAgent.name.split(' ').map(w => w[0]).join('')}
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{selectedAgent.name}</h3>
                <p className="text-xs text-muted-foreground max-w-sm">{selectedAgent.description}</p>
                <p className="text-xs text-muted-foreground mt-3">Start a conversation to begin.</p>
              </div>
            </div>
          )}

          {agentMessages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div className={cn(
                'max-w-[75%] space-y-1.5',
                msg.role === 'user' ? 'items-end' : 'items-start',
              )}>
                {msg.role === 'agent' && (
                  <span className="text-[10px] font-medium text-muted-foreground ml-1">{selectedAgent.name}</span>
                )}
                <div className={cn(
                  'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'glass rounded-bl-md'
                )}>
                  {renderMessageContent(msg.content)}
                </div>

                {msg.toolUsed && (
                  <div className="flex items-center gap-1 ml-1">
                    <span className="text-[10px] font-mono bg-secondary/80 text-muted-foreground px-2 py-0.5 rounded-full">
                      Using tool: {msg.toolUsed}
                    </span>
                  </div>
                )}

                {msg.confidence && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <span className={cn(
                      'text-[10px] font-mono px-2 py-0.5 rounded-full',
                      confidenceColors[msg.confidence]
                    )}>
                      Confidence: {msg.confidence}
                    </span>
                  </div>
                )}

                <span className="text-[10px] font-mono text-muted-foreground ml-1">{msg.timestamp}</span>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground mr-1">{selectedAgent.name} is typing</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="glass border-t border-border p-4 shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-3"
          >
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Message ${selectedAgent.name}...`}
              className="flex-1 glass border-border text-sm h-10"
            />
            <Button type="submit" size="icon" className="h-10 w-10 rounded-xl shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Right Config Sidebar */}
      {configOpen && (
        <motion.div
          className="hidden md:flex w-80 shrink-0 flex-col glass border-l border-border overflow-y-auto"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Configuration</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setConfigOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="p-4 space-y-6">
            {/* Model */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Model</label>
              <Select value={selectedAgent.model} disabled>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Claude Sonnet 4">Claude Sonnet 4</SelectItem>
                  <SelectItem value="Claude Opus 4.6">Claude Opus 4.6</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">System Prompt</label>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="text-xs min-h-[120px] resize-none"
              />
            </div>

            {/* Tools */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-foreground">Tools</label>
              <div className="space-y-2">
                {agentTools.map((tool) => (
                  <div key={tool.name} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-secondary/30">
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-medium text-foreground">{tool.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{tool.description}</p>
                    </div>
                    <Switch
                      checked={toolStates[tool.name] ?? tool.enabled}
                      onCheckedChange={(checked) => setToolStates(prev => ({ ...prev, [tool.name]: checked }))}
                      className="ml-2 shrink-0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Max Tokens */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Max Tokens</label>
              <Input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="h-9 text-xs"
              />
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Temperature</label>
                <span className="text-xs font-mono text-muted-foreground">{temperature[0].toFixed(1)}</span>
              </div>
              <Slider
                value={temperature}
                onValueChange={setTemperature}
                min={0}
                max={1}
                step={0.1}
              />
            </div>

            {/* Save */}
            <Button className="w-full h-9 text-xs">Save Changes</Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AgentChat;
