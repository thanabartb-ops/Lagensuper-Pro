import type { RuntimeGatewayStatus } from '../types';
import { getCurrentSession } from './browserAuth';

export interface RuntimeAdapter {
  name: string;
  getStatus(): Promise<RuntimeGatewayStatus>;
  executePrompt(prompt: string, route: string): Promise<{ status: string; message: string }>;
}

type VerifiedChatResult = {
  status: 'verified';
  requestId: string;
  data: unknown;
};

type ChatSenderResult =
  | VerifiedChatResult
  | { status: 'unauthenticated' }
  | { status: 'failed'; code: string };

type ChatSender = (message: string) => Promise<ChatSenderResult>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && !Array.isArray(value) && typeof value === 'object';
}

async function sendAuthenticatedChat(message: string): Promise<ChatSenderResult> {
  const session = await getCurrentSession();
  if (session.status === 'unauthenticated') return { status: 'unauthenticated' };
  if (session.status === 'unavailable') return { status: 'failed', code: 'AUTH_UNAVAILABLE' };

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ message }),
    });

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { status: 'failed', code: 'INVALID_RESPONSE' };
    }

    if (response.status === 401) return { status: 'unauthenticated' };

    if (
      response.ok &&
      isRecord(payload) &&
      payload.status === 'verified' &&
      typeof payload.requestId === 'string' &&
      'data' in payload
    ) {
      return {
        status: 'verified',
        requestId: payload.requestId,
        data: payload.data,
      };
    }

    return {
      status: 'failed',
      code: isRecord(payload) && typeof payload.code === 'string'
        ? payload.code
        : 'UPSTREAM_UNAVAILABLE',
    };
  } catch {
    return { status: 'failed', code: 'UPSTREAM_UNAVAILABLE' };
  }
}

function extractVerifiedOutput(data: unknown): { message: string; provider: string } | null {
  if (!isRecord(data)) return null;

  const provider = typeof data.provider === 'string' && data.provider.trim()
    ? data.provider.trim()
    : 'Runtime';

  if (isRecord(data.output) && typeof data.output.text === 'string' && data.output.text.trim()) {
    return { message: data.output.text, provider };
  }

  for (const key of ['message', 'text', 'content'] as const) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      return { message: value, provider };
    }
  }

  return null;
}

export class MockRuntimeAdapter implements RuntimeAdapter {
  name = 'MockRuntimeAdapter (Provider-Neutral)';

  async getStatus(): Promise<RuntimeGatewayStatus> {
    return {
      connected: false,
      statusText: 'NOT_CONNECTED',
      adapterName: 'MockRuntimeAdapter (V11 Public Beta)',
      mode: 'MockRuntimeAdapter',
      apiLatencyMs: 0,
      activeProvider: 'None (Gateway Offline)',
      supabaseAuth: 'DISCONNECTED',
      version: 'V11.0.4-beta',
      lastChecked: new Date().toISOString(),
    };
  }

  async executePrompt(_prompt: string, route: string): Promise<{ status: string; message: string }> {
    return {
      status: 'NOT_CONNECTED',
      message: `คำขอเส้นทาง [${route}] ดำเนินการผ่าน MockRuntimeAdapter: Gateway ยังไม่ได้เชื่อมต่อ (NOT_CONNECTED). ระบบทำงานในโหมดจำลอง (DEMO).`,
    };
  }
}

export class GatewayRuntimeAdapter implements RuntimeAdapter {
  name = 'GatewayRuntimeAdapter (Provider-Neutral)';

  private readonly mockAdapter = new MockRuntimeAdapter();
  private status: RuntimeGatewayStatus = {
    connected: false,
    statusText: 'NOT_CONNECTED',
    adapterName: 'GatewayRuntimeAdapter (V11 Public Beta)',
    mode: 'LiveGateway',
    apiLatencyMs: 0,
    activeProvider: 'None (Awaiting verified execution)',
    supabaseAuth: 'DISCONNECTED',
    version: 'V11.0.4-beta',
    lastChecked: new Date().toISOString(),
  };

  constructor(private readonly sendChat: ChatSender = sendAuthenticatedChat) {}

  async getStatus(): Promise<RuntimeGatewayStatus> {
    return { ...this.status };
  }

  async executePrompt(prompt: string, route: string): Promise<{ status: string; message: string }> {
    if (route !== 'smart_chat') {
      return this.mockAdapter.executePrompt(prompt, route);
    }

    const startedAt = Date.now();
    const result = await this.sendChat(prompt);
    const apiLatencyMs = Math.max(0, Date.now() - startedAt);

    if (result.status === 'unauthenticated') {
      this.status = {
        ...this.status,
        connected: false,
        statusText: 'NOT_CONNECTED',
        apiLatencyMs,
        activeProvider: 'None (Authentication required)',
        supabaseAuth: 'DISCONNECTED',
        lastChecked: new Date().toISOString(),
      };
      return {
        status: 'UNAUTHENTICATED',
        message: 'กรุณาเข้าสู่ระบบก่อนใช้งานแชท',
      };
    }

    if (result.status === 'failed') {
      this.status = {
        ...this.status,
        connected: false,
        statusText: 'DEGRADED',
        apiLatencyMs,
        activeProvider: 'Runtime unavailable',
        supabaseAuth: result.code === 'AUTH_UNAVAILABLE' ? 'DISCONNECTED' : 'READY',
        lastChecked: new Date().toISOString(),
      };
      return {
        status: result.code,
        message: `ไม่สามารถยืนยันคำตอบจาก runtime ได้ (${result.code})`,
      };
    }

    const output = extractVerifiedOutput(result.data);
    if (!output) {
      this.status = {
        ...this.status,
        connected: false,
        statusText: 'DEGRADED',
        apiLatencyMs,
        activeProvider: 'Runtime response invalid',
        supabaseAuth: 'READY',
        lastChecked: new Date().toISOString(),
      };
      return {
        status: 'INVALID_RESPONSE',
        message: 'ได้รับ response ที่ตรวจสอบแล้ว แต่ไม่มีข้อความที่แสดงผลได้',
      };
    }

    this.status = {
      ...this.status,
      connected: true,
      statusText: 'CONNECTED',
      apiLatencyMs,
      activeProvider: output.provider,
      supabaseAuth: 'READY',
      lastChecked: new Date().toISOString(),
    };

    return {
      status: 'SUCCESS',
      message: output.message,
    };
  }
}

export const defaultRuntimeAdapter = new GatewayRuntimeAdapter();
