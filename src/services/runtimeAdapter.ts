import { RuntimeGatewayStatus } from '../types';

export interface RuntimeAdapter {
  name: string;
  getStatus(): Promise<RuntimeGatewayStatus>;
  executePrompt(prompt: string, route: string): Promise<{ status: string; message: string }>;
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

  async executePrompt(prompt: string, route: string): Promise<{ status: string; message: string }> {
    return {
      status: 'NOT_CONNECTED',
      message: `คำขอเส้นทาง [${route}] ดำเนินการผ่าน MockRuntimeAdapter: Gateway ยังไม่ได้เชื่อมต่อ (NOT_CONNECTED). ระบบทำงานในโหมดจำลอง (DEMO).`,
    };
  }
}

export class GeminiRuntimeAdapter implements RuntimeAdapter {
  name = 'GeminiRuntimeAdapter (Server-Side Secure)';

  async getStatus(): Promise<RuntimeGatewayStatus> {
    try {
      const res = await fetch('/api/runtime/status');
      if (!res.ok) {
        throw new Error(`Status check failed: HTTP ${res.status}`);
      }
      return await res.json();
    } catch (_err) {
      return {
        connected: false,
        statusText: 'NOT_CONNECTED',
        adapterName: 'GeminiRuntimeAdapter (Server-Side Secure)',
        mode: 'MockRuntimeAdapter',
        apiLatencyMs: 0,
        activeProvider: 'None (Server Unavailable)',
        supabaseAuth: 'DISCONNECTED',
        version: 'V11.0.4-beta',
        lastChecked: new Date().toISOString(),
      };
    }
  }

  async executePrompt(prompt: string, route: string = 'smart_chat'): Promise<{ status: string; message: string }> {
    try {
      const res = await fetch('/api/runtime/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, route }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        return {
          status: errorData.status || 'PROVIDER_ERROR',
          message: errorData.message || `เกิดข้อผิดพลาดในการติดต่อกับ Server Runtime (HTTP ${res.status})`,
        };
      }

      return await res.json();
    } catch (err: any) {
      return {
        status: 'OFFLINE',
        message: `ไม่สามารถเชื่อมต่อกับ Server Runtime ได้: ${err?.message || 'Network Error'}`,
      };
    }
  }
}

export const defaultRuntimeAdapter: RuntimeAdapter = new GeminiRuntimeAdapter();
