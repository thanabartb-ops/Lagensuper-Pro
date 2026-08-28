import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { RuntimeGatewayStatus } from '../../types';
import { defaultRuntimeAdapter } from '../../services/runtimeAdapter';
import {
  Activity,
  Server,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
} from 'lucide-react';

export const RuntimeView: React.FC = () => {
  const [status, setStatus] = useState<RuntimeGatewayStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    const data = await defaultRuntimeAdapter.getStatus();
    setStatus(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const routeDiagnostics = [
    { route: 'smart_chat', name: 'Smart Chat', status: 'SIMULATED', latency: '0ms (Mock)' },
    { route: 'deep_research', name: 'Deep Research', status: 'SIMULATED', latency: '0ms (Mock)' },
    { route: 'create_image', name: 'Image Generation', status: 'SIMULATED', latency: '0ms (Mock)' },
    { route: 'agent_mode', name: 'Agent Mode', status: 'SIMULATED', latency: '0ms (Mock)' },
    { route: 'memory', name: 'Memory Vault', status: 'LOCAL_CACHE', latency: '0ms (Local)' },
  ];

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#131525] border border-[#312E81] rounded-2xl shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">สถานะระบบ Runtime & Gateway</h2>
              <StatusBadge
                type={status?.connected ? 'connected' : 'not_connected'}
                text={status?.statusText || 'NOT_CONNECTED'}
                size="sm"
              />
            </div>
            <p className="text-xs sm:text-sm text-white/50">
              การตรวจสอบความพร้อมของ Adapter และการทำงานแบบ Provider-Neutral
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#0C0D1A] border border-[#312E81] text-xs text-white hover:border-[#7B2CFE] min-h-[44px]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00D1FF]' : ''}`} />
          <span>รีเฟรชสถานะ</span>
        </button>
      </div>

      {/* Main Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#131525]/90 border border-[#312E81] space-y-2 shadow-lg">
          <span className="text-xs text-white/50 font-bold">สถานะ Gateway หลัก</span>
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                status?.connected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'
              }`}
            />
            <span
              className={`text-lg font-bold ${
                status?.connected ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {status?.statusText || 'NOT_CONNECTED'}
            </span>
          </div>
          <p className="text-[11px] text-white/40">
            {status?.connected
              ? `เชื่อมต่อกับ ${status?.activeProvider || 'Gemini Gateway'}`
              : 'โหมด MockRuntimeAdapter กำลังทำงานแทน'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#131525]/90 border border-[#312E81] space-y-2 shadow-lg">
          <span className="text-xs text-white/50 font-bold">Active Adapter</span>
          <div className="text-sm font-mono text-white font-bold truncate">
            {status?.adapterName || 'MockRuntimeAdapter'}
          </div>
          <p className="text-[11px] text-white/40">Provider-Neutral Specification</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#131525]/90 border border-[#312E81] space-y-2 shadow-lg">
          <span className="text-xs text-white/50 font-bold">เวอร์ชันซอฟต์แวร์</span>
          <div className="text-base font-mono text-[#FF00FF] font-bold">
            {status?.version || 'V11.0.4-beta'}
          </div>
          <p className="text-[11px] text-white/40">Public Beta Preview Engine</p>
        </div>
      </div>

      {/* Route Diagnostics Table */}
      <div className="bg-[#131525]/90 border border-[#312E81] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 pb-3 border-b border-[#312E81]">
          <Terminal className="w-5 h-5 text-[#00D1FF]" />
          <h3 className="text-base font-bold text-white">การวินิจฉัยเส้นทาง (Route Diagnostics)</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#312E81] text-white/50">
                <th className="pb-3 font-bold">Canonical Route</th>
                <th className="pb-3 font-bold">ชื่อบริการ</th>
                <th className="pb-3 font-bold">สถานะปัจจุบัน</th>
                <th className="pb-3 font-bold">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#312E81]/60">
              {routeDiagnostics.map((r) => (
                <tr key={r.route} className="hover:bg-[#1A1C30]/50 transition-colors">
                  <td className="py-3 font-mono text-[#00D1FF]">{r.route}</td>
                  <td className="py-3 text-white font-bold">{r.name}</td>
                  <td className="py-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 text-white/50 font-mono">{r.latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
