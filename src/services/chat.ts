import { API_BASE_URL } from '@/config/aws';

type TokenProvider = () => Promise<string | null>;

export interface ChatWsMessage {
  type: 'agent_response' | 'tool_use' | 'error' | 'done';
  content?: string;
  toolUsed?: string;
  confidence?: { level: 'GREEN' | 'AMBER' | 'RED'; score: number; reasoning: string };
  error?: string;
}

export class ChatService {
  private ws: WebSocket | null = null;
  private tokenProvider: TokenProvider | null = null;

  setTokenProvider(provider: TokenProvider) {
    this.tokenProvider = provider;
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
