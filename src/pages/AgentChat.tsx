import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, ArrowLeft, Settings2, X, AlertTriangle, Loader2 } from 'lucide-react';
import { agents, agentToolsMap, type ChatMessage } from '@/data/mockData';
import CodeBlock from '@/components/CodeBlock';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { chatService, type ChatWsMessage } from '@/services/chat';

const confidenceColors: Record<string, string> = {
  high: 'bg-success/10 text-success',
  medium: 'bg-warning/10 text-warning',
  low: 'bg-destructive/10 text-destructive',
  GREEN: 'bg-success/10 text-success',
  AMBER: 'bg-warning/10 text-warning',
  RED: 'bg-destructive/10 text-destructive',
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
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const agentTools = agentToolsMap[selectedAgent.id] || [];

  // Only show live messages from the real WebSocket connection
  const allMessages = liveMessages;

  // Parse message content for code blocks
  const renderMessageContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`t-${lastIndex}`}>{content.slice(lastIndex, match.index)}</span>);
      }
      const language = match[1] || 'code';
      const code = match[2].trim();
      parts.push(<CodeBlock key={`c-${match.index}`} language={language} code={code} />);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(<span key={`t-${lastIndex}`}>{content.slice(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : content;
  };

  // Provision session, poll for readiness, then connect WebSocket
  const connectWs = useCallback(async () => {
    setWsError(null);
    setProvisioning(true);
    try {
      // 1. Start session — provisions a container (use URL agentId, not mock selectedAgent.id)
      const session = await chatService.startSession(agentId!);
      const sid = session.session_id;
      setSessionId(sid);

      // 2. Poll status until container is truly healthy (max 90s for cold starts).
      //    Never trust the provision response — it may optimistically return
      //    "active" before the container is actually serving requests.
      const deadline = Date.now() + 90_000;
      let ready = false;
      let lastStatus = session.status;
      while (!ready && Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 3000));
        try {
          const st = await chatService.getStatus(sid);
          lastStatus = st.status;
          ready = st.status === 'active';
        } catch {
          // status endpoint may error while starting — keep polling
        }
      }
      setProvisioning(false);

      if (!ready) {
        setWsError(
          lastStatus === 'starting'
            ? 'Agent container is starting but not yet healthy. The agent service may need attention.'
            : lastStatus === 'not_found'
              ? 'Agent container was not found. It may have timed out — try again.'
              : `Agent container did not become ready (last status: ${lastStatus})`
        );
        return;
      }

      // 3. Connect WebSocket (use URL agentId for consistency)
      await chatService.connect(
        sid,
        agentId!,
        (msg: ChatWsMessage) => {
          // Agent sends: text (response), thinking, tool_use, error, done
          if ((msg.type === 'text' || msg.type === 'agent_response') && msg.content) {
            setIsTyping(false);
            const newMsg: ChatMessage = {
              id: `live-${Date.now()}`,
              agentId: selectedAgent.id,
              role: 'agent',
              content: msg.content,
              timestamp: 'just now',
              toolUsed: msg.toolUsed || msg.tool_name,
              confidence: msg.confidence?.level === 'GREEN' ? 'high'
                : msg.confidence?.level === 'AMBER' ? 'medium'
                : msg.confidence?.level === 'RED' ? 'low'
                : undefined,
            };
            setLiveMessages(prev => [...prev, newMsg]);
          } else if (msg.type === 'tool_use') {
            const toolName = msg.toolUsed || msg.tool_name || 'tool';
            const toolMsg: ChatMessage = {
              id: `tool-${Date.now()}`,
              agentId: selectedAgent.id,
              role: 'agent',
              content: msg.content || `Using ${toolName}...`,
              timestamp: 'just now',
              toolUsed: toolName,
            };
            setLiveMessages(prev => [...prev, toolMsg]);
          } else if (msg.type === 'error') {
            setWsError(msg.error || msg.content || 'Agent returned an error');
            setIsTyping(false);
          } else if (msg.type === 'done') {
            setIsTyping(false);
          }
          // 'thinking' messages are intentionally not displayed
        },
        (err) => {
          setIsTyping(false);
          setWsConnected(false);
          setWsError(err || 'Agent disconnected — please retry.');
        },
      );
      setWsConnected(true);
    } catch (e) {
      setProvisioning(false);
      setWsError(e instanceof Error ? e.message : 'Could not connect to agent');
      setWsConnected(false);
    }
  }, [agentId]);

  // Try to connect on mount, cleanup on unmount
  useEffect(() => {
    connectWs();
    return () => {
      chatService.disconnect();
      if (sessionId) chatService.stopSession(sessionId).catch(() => {});
    };
  }, [connectWs]);

  // Reset config when agent changes
  useEffect(() => {
    setSystemPrompt(selectedAgent.systemPrompt);
    const states: Record<string, boolean> = {};
    agentTools.forEach(t => { states[t.name] = t.enabled; });
    setToolStates(states);
    setLiveMessages([]);
    setWsError(null);
    setSessionId(null);
    setProvisioning(false);
  }, [selectedAgent.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  // No fake typing animation — typing indicator only shows after sending a real message

  const handleSend = () => {
    if (!message.trim()) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      agentId: selectedAgent.id,
      role: 'user',
      content: message,
      timestamp: 'just now',
    };
    setLiveMessages(prev => [...prev, userMsg]);

    if (wsConnected) {
      chatService.send(message);
      setIsTyping(true);
    } else {
      setWsError('Not connected to agent — message was not sent. Please retry.');
    }
    setMessage('');
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
                <span className={cn('w-1.5 h-1.5 rounded-full', wsConnected ? 'bg-success' : provisioning ? 'bg-warning animate-pulse' : 'bg-muted-foreground')} />
                <span className={cn('text-[10px] font-mono', wsConnected ? 'text-success' : provisioning ? 'text-warning' : 'text-muted-foreground')}>
                  {wsConnected ? 'Connected' : provisioning ? 'Provisioning...' : 'Offline'}
                </span>
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

        {/* Provisioning Banner */}
        {provisioning && !wsError && (
          <div className="flex items-center gap-3 bg-warning/10 border-b border-warning/20 text-warning px-6 py-2.5">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            <span className="text-xs flex-1">Provisioning agent container... This may take up to 60 seconds.</span>
          </div>
        )}

        {/* WebSocket Error Banner */}
        {wsError && (
          <div className="flex items-center gap-3 bg-destructive/10 border-b border-destructive/20 text-destructive px-6 py-2.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs flex-1">{wsError}</span>
            <button onClick={connectWs} className="text-xs font-medium hover:underline">Retry</button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {allMessages.length === 0 && (
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

          {allMessages.map((msg, i) => (
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
