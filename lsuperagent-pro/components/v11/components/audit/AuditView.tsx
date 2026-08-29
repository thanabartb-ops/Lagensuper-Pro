import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { AuditRecord } from '../../types';
import { ShieldAlert } from 'lucide-react';

export const AuditView: React.FC = () => {
  const [logs] = useState<AuditRecord[]>([
    {
      id: 'aud-101',
      timestamp: '2026-08-28 09:15:22',
      actor: 'Local User',
      action: 'INITIALIZE_WORKSPACE',
      route: 'landing',
      status: 'SUCCESS',
      details: 'โหลดหน้าหลัก LSUPERAGENT V11 และตั้งค่าโทเค็นการแสดงผล',
    },
    {
      id: 'aud-102',
      timestamp: '2026-08-28 09:16:04',
      actor: 'Runtime Manager',
      action: 'GATEWAY_HEALTH_CHECK',
      route: 'runtime',
      status: 'NOT_CONNECTED',
      details: 'ตรวจสอบเกตเวย์ AI ภายนอก: ปิดการเชื่อมต่อเพื่อความปลอดภัย (Mock Mode)',
    },
    {
      id: 'aud-103',
      timestamp: '2026-08-28 09:17:40',
      actor: 'Local User',
      action: 'EXECUTE_QUERY',
      route: 'smart_chat',
      status: 'SUCCESS',
      details: 'ส่งข้อความทดสอบไปยัง MockRuntimeAdapter',
    },
  ]);

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-10 space-y-6">
      {/* Surface Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#131525] border border-[#312E81] rounded-2xl shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">บันทึกการตรวจสอบ (Audit Log)</h2>
              <StatusBadge type="ready" text="Supabase Ready" size="sm" />
            </div>
            <p className="text-xs sm:text-sm text-white/50">
              บันทึกกิจกรรม คำสั่ง และประวัติการประมวลผลทั้งหมดเพื่อความโปร่งใส
            </p>
          </div>
        </div>

        <StatusBadge type="not_connected" text="Gateway: NOT_CONNECTED" size="sm" />
      </div>

      {/* Log Table Container */}
      <div className="bg-[#131525]/90 border border-[#312E81] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#312E81]">
          <h3 className="text-sm font-bold text-white">ประวัติกิจกรรมล่าสุด</h3>
          <span className="text-xs text-white/50">ทั้งหมด {logs.length} รายการ</span>
        </div>

        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-xl bg-[#0C0D1A] border border-[#312E81] hover:border-[#7B2CFE] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#FF00FF] font-bold">{log.action}</span>
                  <span className="px-2 py-0.5 rounded bg-[#131525] text-[10px] text-white/60 font-mono border border-[#312E81]">
                    /{log.route}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
                <p className="text-white/90">{log.details}</p>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-white/40 shrink-0">
                <span>{log.actor}</span>
                <span>•</span>
                <span className="font-mono">{log.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
