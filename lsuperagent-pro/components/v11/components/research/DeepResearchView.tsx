'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

type ResearchDepth = 'standard' | 'deep' | 'comprehensive';

const DEPTH_PROFILE: Record<
  ResearchDepth,
  { stageMs: number; keyFindings: number; sources: string[]; dimensions: number; indicators: number }
> = {
  standard: {
    stageMs: 700,
    keyFindings: 3,
    sources: ['Thai AI Consortium'],
    dimensions: 3,
    indicators: 6,
  },
  deep: {
    stageMs: 1200,
    keyFindings: 5,
    sources: ['IEEE Research (2025)', 'MIT Tech Review', 'Thai AI Consortium'],
    dimensions: 5,
    indicators: 12,
  },
  comprehensive: {
    stageMs: 2000,
    keyFindings: 8,
    sources: [
      'IEEE Research (2025)',
      'MIT Tech Review',
      'Thai AI Consortium',
      'Global AI Readiness Index',
      'OECD Digital Outlook',
    ],
    dimensions: 8,
    indicators: 24,
  },
};

const FINDING_POOL = [
  '**การผสานเทคโนโลยี:** เพิ่มประสิทธิภาพการทำงานขึ้น 35-50%',
  '**การกำกับดูแล:** ความปลอดภัยของข้อมูลและความโปร่งใสของระบบ',
  '**ความพร้อมของบุคลากร:** ทักษะการสั่งการ (Prompt Engineering) และการคิดเชิงวิพากษ์',
  '**ต้นทุนการดำเนินงาน:** ค่าใช้จ่ายต่อหน่วยงานลดลงเมื่อขยายการใช้งาน',
  '**การยอมรับของผู้ใช้:** ต้องมีช่วงปรับตัวและการฝึกอบรมที่ชัดเจน',
  '**ความเสี่ยงด้านข้อมูล:** การรั่วไหลและการกำกับสิทธิ์การเข้าถึง',
  '**การวัดผล:** ต้องกำหนดตัวชี้วัดก่อนเริ่มใช้งานจริง',
  '**ความยั่งยืน:** แผนบำรุงรักษาและการอัปเดตโมเดลระยะยาว',
];

export const DeepResearchView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<ResearchDepth>('deep');
  const [task, setTask] = useState<ResearchTask | null>(null);
  const [copied, setCopied] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const startResearch = () => {
    if (!query.trim()) return;

    clearTimers();
    const profile = DEPTH_PROFILE[depth];
    const at = (multiplier: number, fn: () => void) => {
      timersRef.current.push(setTimeout(fn, profile.stageMs * multiplier));
    };

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

    at(1, () => {
      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'synthesizing',
          steps: prev.steps.map((s, idx) =>
            idx === 0
              ? {
                  ...s,
                  status: 'completed',
                  findings: `กำหนด ${profile.dimensions} มิติหลักในการวิเคราะห์เสร็จสมบูรณ์`,
                }
              : idx === 1
              ? { ...s, status: 'in_progress', sources: profile.sources }
              : s
          ),
        };
      });
    });

    at(2, () => {
      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'reviewing',
          steps: prev.steps.map((s, idx) =>
            idx <= 1
              ? { ...s, status: 'completed' }
              : idx === 2
              ? {
                  ...s,
                  status: 'in_progress',
                  findings: `ประมวลผลข้อมูลเปรียบเทียบ ${profile.indicators} ดัชนีชี้วัด`,
                }
              : s
          ),
        };
      });
    });

    at(3, () => {
      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'completed',
          steps: prev.steps.map((s) => ({ ...s, status: 'completed' })),
          report: [
            `### รายงานการวิจัยเชิงลึก: "${query}"`,
            '',
            `**ระดับความลึก:** ${depth} · ${profile.keyFindings} ประเด็นหลัก · ${profile.sources.length} แหล่งอ้างอิง`,
            '',
            '**1. บทสรุปผู้บริหาร (Executive Summary)**',
            `การสืบค้นพบว่าประเด็น "${query}" มีปัจจัยหลัก ${profile.keyFindings} ประการที่ต้องพิจารณา:`,
            ...FINDING_POOL.slice(0, profile.keyFindings).map((f) => `- ${f}`),
            '',
            '**2. ผลการวิเคราะห์เชิงเปรียบเทียบ**',
            `เปรียบเทียบจาก ${profile.indicators} ดัชนีชี้วัด พบว่าองค์กรที่ปรับใช้โมเดลเฉพาะทางลดระยะเวลาดำเนินการวิจัยลงได้อย่างมีนัยสำคัญ`,
            '',
            '**3. แหล่งข้อมูลอ้างอิง (Citations)**',
            ...profile.sources.map((s) => `- ${s}`),
            '',
            '*(รายงานนี้สร้างจากข้อมูลจำลอง · Mock Deep Research Pipeline · สถานะ: NOT_CONNECTED)*',
          ].join('\n'),
        };
      });
    });
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

        <div className="flex flex-col items-stretch gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-xs text-white/50">ระดับความลึก:</span>
            <div className="grid w-full grid-cols-1 gap-1 rounded-xl bg-[#0C0D1A] p-1 border border-[#312E81] sm:w-auto sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setDepth('standard')}
                className={`w-full px-3 py-2 rounded-lg text-xs font-bold whitespace-normal transition-all ${
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
                className={`w-full px-3 py-2 rounded-lg text-xs font-bold whitespace-normal transition-all ${
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
                className={`w-full px-3 py-2 rounded-lg text-xs font-bold whitespace-normal transition-all ${
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

              <div className="v11-markdown p-4 sm:p-5 rounded-2xl bg-[#0C0D1A] border border-[#312E81] text-sm text-white/90 leading-relaxed font-sans">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.report}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};