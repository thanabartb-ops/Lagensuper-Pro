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

export const defaultRuntimeAdapter = new MockRuntimeAdapter();
