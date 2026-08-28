import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { GradientButton } from '../common/GradientButton';
import { ResearchTask } from '../../types';
import {
  Search,
  CheckCircle2,
  Clock,
  FileText,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

export const DeepResearchView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<'standard' | 'deep' | 'comprehensive'>('deep');
  const [task, setTask] = useState<ResearchTask | null>(null);
  const [copied, setCopied] = useState(false);

  const startResearch = () => {
    if (!query.trim()) return;

    const newTask: ResearchTask = {
      id: `res-${Date.now()}`,
      query: query.trim(),
      depth,
      status: 'searching',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      steps: [
        {
          id: 'step-1',
          title: 'แยกย่อยประเด็นคำถาม & กำหนดกรอบการสืบค้น (Query Decomposition)',
          status: 'in_progress',
        },
        {
          id: 'step-2',
          title: 'สืบค้นแหล่งข้อมูลปฐมภูมิและบทความวิชาการที่เกี่ยวข้อง',
          status: 'pending',
        },
        {
          id: 'step-3',
          title: 'สังเคราะห์ข้อมูล เปรียบเทียบมุมมอง และตรวจสอบข้อเท็จจริง',
          status: 'pending',
        },
        {
          id: 'step-4',
          title: 'จัดทำรายงานบทสรุปผู้บริหารพร้อมแหล่งอ้างอิง',
          status: 'pending',
        },
      ],
    };

    setTask(newTask);

    // Simulate multi-stage research pipeline
    setTimeout(() => {
      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'synthesizing',
          steps: prev.steps.map((s, idx) =>
            idx === 0
              ? { ...s, status: 'completed', findings: 'กำหนด 5 มิติหลักในการวิเคราะห์เสร็จสมบูรณ์' }
              : idx === 1
              ? { ...s, status: 'in_progress', sources: ['IEEE Research (2025)', 'MIT Tech Review', 'Thai AI Consortium'] }
              : s
          ),
        };
      });
    }, 1200);

    setTimeout(() => {
      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'reviewing',
          steps: prev.steps.map((s, idx) =>
            idx <= 1
              ? { ...s, status: 'completed' }
              : idx === 2
              ? { ...s, status: 'in_progress', findings: 'ประมวลผลข้อมูลเปรียบเทียบ 12 ดัชนีชี้วัด' }
              : s
          ),
        };
      });
    }, 2400);

    setTimeout(() => {
      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'completed',
          steps: prev.steps.map((s) => ({ ...s, status: 'completed' })),
          report: `### รายงานการวิจัยเชิงลึก: "${query}"\n\n**1. บทสรุปผู้บริหาร (Executive Summary)**\nการสืบค้นเชิงลึกพบว่าประเด็น "${query}" มีความสำคัญอย่างยิ่งต่อการขับเคลื่อนยุทธศาสตร์ยุคใหม่ โดยมีปัจจัยหลัก 3 ประการที่ต้องพิจารณา:\n- **การผสานเทคโนโลยี:** เพิ่มประสิทธิภาพการทำงานขึ้น 35-50%\n- **การกำกับดูแล:** ความปลอดภัยของข้อมูลและความโปร่งใสของระบบ\n- **ความพร้อมของบุคลากร:** ทักษะการสั่งการ (Prompt Engineering) และการคิดเชิงวิพากษ์\n\n**2. ผลการวิเคราะห์เชิงเปรียบเทียบ**\nจากการรวบรวมข้อมูลจำลอง พบว่าองค์กรที่ปรับใช้โมเดลเฉพาะทางสามารถลดระยะเวลาดำเนินการวิจัยจาก 7 วันเหลือเพียงไม่กี่ชั่วโมง\n\n**3. แหล่งข้อมูลอ้างอิง (Citations)**\n- รายงานการสำรวจเทคโนโลยีปัญญาประดิษฐ์ภาคภาษาไทย (2026)\n- Global AI Readiness Index · Industry Report\n\n*(รายงานผลลัพธ์นี้สร้างขึ้นผ่าน Mock Deep Research Pipeline · สถานะ: NOT_CONNECTED)*`,
        };
      });
    }, 3800);
  };

  const handleCopyReport = () => {
    if (task?.report) {
      navigator.clipboard.writeText(task.report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#131525] border border-[#312E81] rounded-2xl shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#00D1FF]/10 border border-[#00D1FF]/30 flex items-center justify-center text-[#00D1FF]">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">ค้นคว้าเชิงลึก (Deep Research)</h2>
              <StatusBadge type="beta" text="Beta" size="sm" />
            </div>
            <p className="text-xs sm:text-sm text-white/50">
              เจาะข้อมูลเชิงลึก รวบรวม สังเคราะห์ และอ้างอิงแหล่งข้อมูลที่น่าเชื่อถือ
            </p>
          </div>
        </div>

        <StatusBadge type="not_connected" text="Gateway: NOT_CONNECTED" size="sm" />
      </div>

      {/* Query Formulation Form */}
      <div className="bg-[#131525]/90 border border-[#312E81] rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
        <label className="block text-sm font-bold text-white">
          หัวข้อที่ต้องการค้นคว้าเชิงลึก
        </label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="เช่น วิเคราะห์ผลกระทบของ Generative AI ต่องานครีเอทีฟในประเทศไทย พร้อมแนวทางปรับตัว..."
          rows={3}
          className="w-full p-4 rounded-2xl bg-[#0C0D1A] border border-[#312E81] text-white text-sm focus:border-[#7B2CFE] focus:ring-1 focus:ring-[#7B2CFE] outline-none placeholder:text-white/30 transition-all resize-none"
        />

        {/* Depth Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">ระดับความลึก:</span>
            <div className="inline-flex rounded-xl bg-[#0C0D1A] p-1 border border-[#312E81]">
              <button
                type="button"
                onClick={() => setDepth('standard')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  depth === 'standard'
                    ? 'bg-[#00D1FF] text-black'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                สรุปมาตรฐาน
              </button>
              <button
                type="button"
                onClick={() => setDepth('deep')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  depth === 'deep'
                    ? 'bg-[#7B2CFE] text-white shadow-md shadow-[#7B2CFE]/40'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                เจาะลึกพิเศษ (แนะนำ)
              </button>
              <button
                type="button"
                onClick={() => setDepth('comprehensive')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  depth === 'comprehensive'
                    ? 'bg-[#FF00FF] text-white shadow-md shadow-[#FF00FF]/40'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                งานวิจัยครบวงจร
              </button>
            </div>
          </div>

          <GradientButton
            onClick={startResearch}
            disabled={!query.trim() || Boolean(task && task.status !== 'completed' && task.status !== 'error')}
            size="md"
          >
            {task && task.status !== 'completed' && task.status !== 'error' ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> กำลังค้นคว้า...
              </span>
            ) : (
              'เริ่มการค้นคว้าเชิงลึก'
            )}
          </GradientButton>
        </div>
      </div>

      {/* Research Execution Pipeline & Findings */}
      {task && (
        <div className="bg-[#131525]/90 border border-[#312E81] rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#312E81] pb-4">
            <div>
              <span className="text-xs text-white/50">งานค้นคว้าปัจจุบัน</span>
              <h3 className="text-base font-bold text-white mt-0.5">&ldquo;{task.query}&rdquo;</h3>
            </div>
            <StatusBadge
              type={task.status === 'completed' ? 'ready' : 'demo'}
              text={task.status === 'completed' ? 'เสร็จสมบูรณ์' : 'กำลังดำเนินการ (DEMO)'}
              size="sm"
            />
          </div>

          {/* Steps Progress */}
          <div className="space-y-3">
            {task.steps.map((step, idx) => (
              <div
                key={step.id}
                className={`p-4 rounded-xl border transition-all flex items-start gap-3 ${
                  step.status === 'completed'
                    ? 'bg-[#0C0D1A] border-emerald-500/30 text-white'
                    : step.status === 'in_progress'
                    ? 'bg-[#1A1C30] border-[#7B2CFE] text-white shadow-md ring-1 ring-[#7B2CFE]/40'
                    : 'bg-[#0C0D1A] border-[#312E81] text-white/40'
                }`}
              >
                <div className="mt-0.5">
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : step.status === 'in_progress' ? (
                    <RefreshCw className="w-5 h-5 text-[#7B2CFE] animate-spin" />
                  ) : (
                    <Clock className="w-5 h-5 text-white/40" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-bold">
                    ขั้นที่ {idx + 1}: {step.title}
                  </div>
                  {step.findings && (
                    <p className="text-xs text-[#00D1FF] mt-1 font-mono">{step.findings}</p>
                  )}
                  {step.sources && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {step.sources.map((src, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-[#131525] border border-[#312E81] text-[11px] text-white/60"
                        >
                          📚 {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Generated Report Card */}
          {task.report && (
            <div className="pt-4 border-t border-[#312E81] space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#FF00FF]" />
                  <h4 className="text-sm sm:text-base font-bold text-white">รายงานผลลัพธ์</h4>
                </div>
                <button
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0C0D1A] border border-[#312E81] hover:border-[#7B2CFE] text-xs text-white/90 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกรายงาน'}</span>
                </button>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-[#0C0D1A] border border-[#312E81] text-sm text-white/90 leading-relaxed whitespace-pre-wrap font-sans">
                {task.report}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
