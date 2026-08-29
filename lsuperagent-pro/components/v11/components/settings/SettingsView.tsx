import React, { useEffect, useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { GradientButton } from '../common/GradientButton';
import {
  Settings,
  Palette,
  Globe,
  Cpu,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [workspaceName, setWorkspaceName] = useState('My LSUPERAGENT Workspace');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = window.setTimeout(() => {
      if (cancelled) return;
      try {
        const stored = window.localStorage.getItem('lsuperagent.v11.settings');
        if (!stored) return;
        const parsed = JSON.parse(stored) as {
          workspaceName?: unknown;
          reducedMotion?: unknown;
        };
        if (typeof parsed.workspaceName === 'string') setWorkspaceName(parsed.workspaceName);
        if (typeof parsed.reducedMotion === 'boolean') setReducedMotion(parsed.reducedMotion);
      } catch {
        // Keep safe defaults when storage is unavailable or malformed.
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(load);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
    return () => document.documentElement.classList.remove('reduce-motion');
  }, [reducedMotion]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      window.localStorage.setItem(
        'lsuperagent.v11.settings',
        JSON.stringify({ workspaceName, reducedMotion }),
      );
      setSavedSuccess(true);
      setSaveFailed(false);
    } catch {
      setSavedSuccess(false);
      setSaveFailed(true);
    }
    setTimeout(() => {
      setSavedSuccess(false);
      setSaveFailed(false);
    }, 2500);
  };

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-10 space-y-6">
      {/* Surface Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#131525] border border-[#312E81] rounded-2xl shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-[#312E81] flex items-center justify-center text-white">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">การตั้งค่า (Settings)</h2>
              <StatusBadge type="beta" text="V11 Public Beta" size="sm" />
            </div>
            <p className="text-xs sm:text-sm text-white/50">
              ปรับแต่งเวิร์กสเปซ ความเป็นส่วนตัว การแสดงผล และสถานะระบบ
            </p>
          </div>
        </div>

        <StatusBadge type="not_connected" text="Gateway: NOT_CONNECTED" size="sm" />
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Workspace & Persona Card */}
        <div className="bg-[#131525]/90 border border-[#312E81] rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#312E81]">
            <Globe className="w-5 h-5 text-[#00D1FF]" />
            <h3 className="text-base font-bold text-white">ข้อมูลเวิร์กสเปซและการใช้งาน</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="workspace-name" className="block text-xs font-bold text-white/50 mb-1.5">
                ชื่อเวิร์กสเปซ (Workspace Name)
              </label>
              <input
                id="workspace-name"
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#0C0D1A] border border-[#312E81] text-xs text-white outline-none focus:border-[#7B2CFE]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/50 mb-1.5">
                ผู้ช่วย AI หลัก (Active Persona)
              </label>
              <input
                type="text"
                value="LS_BOTAGENT (Thai Specialized Model)"
                disabled
                className="w-full h-11 px-3.5 rounded-xl bg-[#0C0D1A] border border-[#312E81] text-xs text-white/40 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* AI Gateway & Runtime Configuration (Truthful Status) */}
        <div className="bg-[#131525]/90 border border-[#312E81] rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#312E81]">
            <Cpu className="w-5 h-5 text-[#7B2CFE]" />
            <h3 className="text-base font-bold text-white">การเชื่อมต่อ AI Gateway & Runtime</h3>
          </div>

          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 space-y-1">
            <div className="font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>สถานะการเชื่อมต่อ: NOT_CONNECTED (Mock Adapter ทำงาน)</span>
            </div>
            <p className="text-red-300/80">
              ไม่มีการเปิดเผยหรือฝังคีย์ API (Gemini, OpenAI หรือ Provider อื่นๆ) ในรหัสฝั่งเบราว์เซอร์อย่างเคร่งครัด
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#0C0D1A] border border-[#312E81]">
              <span className="text-white/50 block mb-1">Runtime Adapter:</span>
              <span className="font-mono text-white">MockRuntimeAdapter (Provider-Neutral)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0C0D1A] border border-[#312E81]">
              <span className="text-white/50 block mb-1">Database & Auth Authority:</span>
              <span className="font-mono text-white">Supabase Managed Authority</span>
            </div>
          </div>
        </div>

        {/* UI & Accessibility Settings */}
        <div className="bg-[#131525]/90 border border-[#312E81] rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#312E81]">
            <Palette className="w-5 h-5 text-[#FF00FF]" />
            <h3 className="text-base font-bold text-white">การแสดงผลและการเข้าถึง (Accessibility)</h3>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0C0D1A] border border-[#312E81]">
            <div>
              <span className="text-xs font-bold text-white block">ลดทอนการเคลื่อนไหว (Reduced Motion)</span>
              <span className="text-[11px] text-white/50">
                ลดเอฟเฟกต์การเคลื่อนไหวตามมาตรฐานสากล prefers-reduced-motion
              </span>
            </div>
            <input
              type="checkbox"
              aria-label="ลดทอนการเคลื่อนไหว"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="w-5 h-5 accent-[#7B2CFE] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0C0D1A] border border-[#312E81]">
            <div>
              <span className="text-xs font-bold text-white block">ธีมของระบบ (Visual Theme)</span>
              <span className="text-[11px] text-white/50">Elegant Dark · V11 Master</span>
            </div>
            <StatusBadge type="ready" text="Active" size="sm" />
          </div>
        </div>

        {/* Public Website & Canonical Info */}
        <div className="p-4 rounded-2xl bg-[#0C0D1A] border border-[#312E81] flex items-center justify-between text-xs text-white/50 shadow-md">
          <span>เว็บไซต์ประชาสัมพันธ์: <strong className="text-white">https://www.wokers-wise.com/</strong></span>
          <a
            href="https://www.wokers-wise.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#00D1FF] hover:underline"
          >
            <span>เยี่ยมชม</span> <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4" /> บันทึกการตั้งค่าเรียบร้อยแล้ว
            </span>
          ) : saveFailed ? (
            <span className="text-xs text-red-400 font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> บันทึกไม่สำเร็จในเบราว์เซอร์นี้
            </span>
          ) : (
            <span className="text-xs text-white/40">การตั้งค่าจะถูกจัดเก็บในเครื่องของคุณ</span>
          )}

          <GradientButton type="submit" size="md">
            บันทึกการเปลี่ยนแปลง
          </GradientButton>
        </div>
      </form>
    </div>
  );
};
