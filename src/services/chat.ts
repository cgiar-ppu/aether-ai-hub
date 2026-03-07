import { API_BASE_URL } from '@/config/aws';

type TokenProvider = () => Promise<string | null>;

export interface ChatWsMessage {
  type: 'agent_response' | 'tool_use' | 'error' | 'done';
  content?: string;
  toolUsed?: string;
  confidence?: { level: 'GREEN' | 'AMBER' | 'RED'; score: number; reasoning: string };
  error?: string;
}

export interface StartSessionResponse {
  session_id: string;
  status: string;
  container_url?: string;
}

export class ChatService {
  private ws: WebSocket | null = null;
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
    const res = await fetch(`${API_BASE_URL}/api/chat/start`, {
      method: 'POST',
      headers: await this.authHeaders(),
      body: JSON.stringify({ agent_type: agentId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Start session failed (${res.status})`);
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
  async getStatus(sessionId: string): Promise<{ status: string }> {
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

    this.disconnect();
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const msg: ChatWsMessage = JSON.parse(event.data);
        onMessage(msg);
      } catch {
        onMessage({ type: 'agent_response', content: event.data });
      }
    };

    this.ws.onerror = () => onError('WebSocket connection error');
    this.ws.onclose = (e) => {
      if (e.code !== 1000) onError(`Connection closed (code ${e.code})`);
    };

    return new Promise<void>((resolve, reject) => {
      if (!this.ws) return reject(new Error('No WebSocket'));
      this.ws.onopen = () => resolve();
      const origError = this.ws.onerror;
      this.ws.onerror = (ev) => {
        if (origError) (origError as any)(ev);
        reject(new Error('Could not connect to agent'));
      };
    });
  }

  send(message: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ content: message }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000);
      this.ws = null;
    }
  }
}

export const chatService = new ChatService();
