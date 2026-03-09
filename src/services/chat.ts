import { API_BASE_URL } from '@/config/aws';

type TokenProvider = () => Promise<string | null>;

export interface ChatWsMessage {
  // Agent (synapsis-agent) sends: text, thinking, tool_use, error, done
  // Backend may also wrap as: agent_response
  type: 'text' | 'thinking' | 'agent_response' | 'tool_use' | 'error' | 'done';
  content?: string;
  toolUsed?: string;
  tool_name?: string;
  confidence?: { level: 'GREEN' | 'AMBER' | 'RED'; score: number; reasoning: string };
  error?: string;
}

export interface StartSessionResponse {
  session_id: string;
  status: string;
  container_url?: string;
}

/**
 * Map numeric mock-data IDs to valid backend AgentType enum values.
 * mockData.ts uses IDs '1'–'6'; the backend expects snake_case enum values.
 */
const AGENT_ID_MAP: Record<string, string> = {
  '1': 'literature_analyst',
  '2': 'data_harmonizer',
  '3': 'hypothesis_generator',
  '4': 'experiment_designer',
  '5': 'peer_reviewer',
  '6': 'report_synthesizer',
};

/** Convert any agent ID format to a valid backend AgentType enum value. */
function resolveAgentType(agentId: string): string {
  // Numeric mock ID → enum value
  if (AGENT_ID_MAP[agentId]) return AGENT_ID_MAP[agentId];
  // Hyphenated backend ID (e.g. "literature-analyst") → underscore enum value
  return agentId.replace(/-/g, '_');
}

export class ChatService {
  private connections: Map<string, WebSocket> = new Map();
  private tokenProvider: TokenProvider | null = null;

  setTokenProvider(provider: TokenProvider) {
    this.tokenProvider = provider;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.tokenProvider) {
      const token = await this.tokenProvider();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /** POST /api/chat/start — provision an agent container and get a session_id */
  async startSession(agentId: string): Promise<StartSessionResponse> {
    const agentType = resolveAgentType(agentId);
    const res = await fetch(`${API_BASE_URL}/api/chat/start`, {
      method: 'POST',
      headers: await this.authHeaders(),
      body: JSON.stringify({ agent_type: agentType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      const message = typeof err.detail === 'string'
        ? err.detail
        : Array.isArray(err.detail)
          ? err.detail.map((e: any) => e.msg || JSON.stringify(e)).join('; ')
          : err.error || `Start session failed (${res.status})`;
      throw new Error(message);
    }
    return res.json();
  }

  /** POST /api/chat/stop/{sessionId} — deprovision the agent container */
  async stopSession(sessionId: string): Promise<void> {
    await fetch(`${API_BASE_URL}/api/chat/stop/${sessionId}`, {
      method: 'POST',
      headers: await this.authHeaders(),
    });
  }

  /** GET /api/chat/history/{sessionId} — retrieve conversation history */
  async getHistory(sessionId: string): Promise<unknown[]> {
    const res = await fetch(`${API_BASE_URL}/api/chat/history/${sessionId}`, {
      headers: await this.authHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  }

  /** GET /api/chat/status/{sessionId} — poll session readiness */
  async getStatus(sessionId: string): Promise<{ status: string; healthy?: boolean }> {
    const res = await fetch(`${API_BASE_URL}/api/chat/status/${sessionId}`, {
      headers: await this.authHeaders(),
    });
    if (!res.ok) throw new Error('Status check failed');
    return res.json();
  }

  async connect(
    sessionId: string,
    agentId: string,
    onMessage: (msg: ChatWsMessage) => void,
    onError: (err: string) => void,
  ) {
    const wsBase = API_BASE_URL.replace(/^http/, 'ws');
    let url = `${wsBase}/api/chat/ws/${sessionId}?agent_id=${agentId}`;

    if (this.tokenProvider) {
      const token = await this.tokenProvider();
      if (token) url += `&token=${token}`;
    }

    // Close only this agent's previous connection (not all agents)
    this.disconnectAgent(agentId);
    const ws = new WebSocket(url);
    this.connections.set(agentId, ws);

    ws.onmessage = (event) => {
      try {
        const msg: ChatWsMessage = JSON.parse(event.data);
        onMessage(msg);
      } catch {
        onMessage({ type: 'agent_response', content: event.data });
      }
    };

    ws.onerror = () => onError('WebSocket connection error');
    ws.onclose = (e) => {
      this.connections.delete(agentId);
      if (e.code !== 1000) {
        const reason = e.reason || `code ${e.code}`;
        onError(`Agent disconnected (${reason}). Please retry.`);
      }
    };

    return new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      const origError = ws.onerror;
      ws.onerror = (ev) => {
        if (origError) (origError as any)(ev);
        reject(new Error('Could not connect to agent'));
      };
    });
  }

  send(message: string, agentId?: string): boolean {
    let ws: WebSocket | undefined;
    if (agentId) {
      ws = this.connections.get(agentId);
    } else {
      for (const conn of this.connections.values()) {
        if (conn.readyState === WebSocket.OPEN) { ws = conn; break; }
      }
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'message', message }));
      return true;
    }
    return false;
  }

  /** Check if a specific agent has an open connection. */
  isConnected(agentId: string): boolean {
    const ws = this.connections.get(agentId);
    return ws?.readyState === WebSocket.OPEN;
  }

  /** Close a specific agent's WebSocket connection. */
  disconnectAgent(agentId: string) {
    const ws = this.connections.get(agentId);
    if (ws) {
      ws.close(1000);
      this.connections.delete(agentId);
    }
  }

  /** Close all agent connections. */
  disconnect() {
    for (const [id, ws] of this.connections) {
      ws.close(1000);
    }
    this.connections.clear();
  }
}

export const chatService = new ChatService();
