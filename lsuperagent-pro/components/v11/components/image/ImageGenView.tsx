'use client';

import React, { useState } from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { GradientButton } from '../common/GradientButton';
import { ImageGenerationItem } from '../../types';
import {
  Image as ImageIcon,
  Check,
  X,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3';

/**
 * The preview container must actually take the selected shape. It previously
 * rendered `aspect-video` (16:9) for every ratio, so a 9:16 portrait request
 * still previewed as a landscape box.
 *
 * Classes are written out in full rather than built by interpolation so that
 * Tailwind's scanner can see them.
 */
const ASPECT_PRESET: Record<AspectRatio, { box: string; label: string }> = {
  '1:1': { box: 'aspect-square max-w-[380px]', label: 'จัตุรัส' },
  '16:9': { box: 'aspect-video max-w-[480px]', label: 'แนวนอน' },
  '9:16': { box: 'aspect-[9/16] max-w-[260px]', label: 'แนวตั้ง' },
  '4:3': { box: 'aspect-[4/3] max-w-[440px]', label: 'คลาสสิก' },
};

export const ImageGenView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [style, setStyle] = useState('Cinematic Cyberpunk & Neon');
  const [activeItem, setActiveItem] = useState<ImageGenerationItem | null>(null);

  const styles = [
    'Cinematic Cyberpunk & Neon',
    'Photorealistic Ultra-HD',
    '3D Isometric Futuristic',
    'Minimalist Thai Tech Vector',
    'Concept Digital Painting',
  ];

  const handleGenerateBrief = () => {
    if (!prompt.trim()) return;

    const newItem: ImageGenerationItem = {
      id: `img-${Date.now()}`,
      prompt: prompt.trim(),
      aspectRatio,
      style,
      stage: 'brief_picture',
      briefSummary: {
        composition: `การจัดวางแบบ Rule of Thirds ในมุมมองสายตา (Eye-level) เน้นจุดเด่นที่แกนกลาง`,
        colorPalette: ['#070812 (Navy Deep)', '#FF2CAA (Neon Magenta)', '#885CF6 (Purple)', '#3082F6 (Electric Blue)'],
        lighting: 'แสงไฟนีออนส่องกระทบพื้นผิวกระจก มีแสงสลัวแบบ Rim-Light',
        elements: [
          `วัตถุหลักตามคำบรรยาย: "${prompt}"`,
          'พื้นผิวสะท้อนแสงสไตล์ High-Tech Glass',
          'โครงสร้างสถาปัตยกรรมดิจิทัลล้ำสมัย',
        ],
      },
      approvalStatus: 'pending',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setActiveItem(newItem);
  };

  const handleApprove = () => {
    if (!activeItem) return;

    setActiveItem((prev) => (prev ? { ...prev, stage: 'rendering', approvalStatus: 'approved', renderProgress: 20 } : null));

    // Simulated rendering progression
    setTimeout(() => {
      setActiveItem((prev) => (prev ? { ...prev, renderProgress: 60 } : null));
    }, 1000);

    setTimeout(() => {
      setActiveItem((prev) => (prev ? { ...prev, renderProgress: 95, stage: 'qc_check' } : null));
    }, 2000);

    setTimeout(() => {
      setActiveItem((prev) =>
        prev
          ? {
              ...prev,
              stage: 'completed',
              renderProgress: 100,
              qcResult: {
                score: 98,
                passed: true,
                artifactsChecked: true,
                details: 'ผ่านการตรวจสอบสัดส่วน แสงเงา และความคมชัดขององค์ประกอบตามเกณฑ์ LSUPERAGENT QC 1.0',
              },
            }
          : null
      );
    }, 3200);
  };

  const handleReject = () => {
    if (!activeItem) return;
    setActiveItem((prev) => (prev ? { ...prev, stage: 'rejected', approvalStatus: 'rejected' } : null));
  };

  const handleReset = () => {
    setActiveItem(null);
    setPrompt('');
  };

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#131525] border border-[#312E81] rounded-2xl shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#7B2CFE]/10 border border-[#7B2CFE]/30 flex items-center justify-center text-[#7B2CFE]">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">สร้างภาพ (Image Generation)</h2>
              <StatusBadge type="beta" text="Beta" size="sm" />
            </div>
            <p className="text-xs sm:text-sm text-white/50">
              กระบวนการ: คำขอ → BRIEF_PICTURE → อนุมัติ (@Approved/@Rejected) → เรนเดอร์ → QC
            </p>
          </div>
        </div>

        <StatusBadge type="not_connected" text="Gateway: NOT_CONNECTED" size="sm" />
      </div>

      {/* Input Parameters Form */}
      <div className="bg-[#131525]/90 border border-[#312E81] rounded-2xl p-5 sm:p-6 space-y-5 shadow-lg">
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            คำบรรยายภาพที่ต้องการ (Prompt)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={activeItem !== null && activeItem.stage !== 'rejected'}
            placeholder="เช่น พื้นที่ทำงานดิจิทัลล้ำสมัยของนักพัฒนาชาวไทย ในบรรยากาศห้องควบคุมกระจกนีออนสีน้ำเงินม่วง คมชัดสมจริง..."
            rows={3}
            className="w-full p-4 rounded-2xl bg-[#0C0D1A] border border-[#312E81] text-white text-sm focus:border-[#7B2CFE] focus:ring-1 focus:ring-[#7B2CFE] outline-none placeholder:text-white/30 transition-all resize-none disabled:opacity-60"
          />
        </div>

        {/* Aspect Ratio & Style Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-white/50 mb-1.5">
              อัตราส่วนภาพ (Aspect Ratio)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['1:1', '16:9', '9:16', '4:3'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  disabled={activeItem !== null}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    aspectRatio === ratio
                      ? 'bg-gradient-to-r from-[#FF00FF] to-[#7B2CFE] border-white/20 text-white shadow-md'
                      : 'bg-[#0C0D1A] border-[#312E81] text-white/50 hover:text-white'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/50 mb-1.5">
              สไตล์งานภาพ (Visual Style)
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              disabled={activeItem !== null}
              className="w-full h-10 px-3 rounded-xl bg-[#0C0D1A] border border-[#312E81] text-xs text-white outline-none focus:border-[#7B2CFE]"
            >
              {styles.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!activeItem && (
          <div className="flex justify-end pt-2">
            <GradientButton
              onClick={handleGenerateBrief}
              disabled={!prompt.trim()}
              size="md"
            >
              สร้าง BRIEF_PICTURE เพื่อตรวจสอบ
            </GradientButton>
          </div>
        )}
      </div>

      {/* Stage: BRIEF_PICTURE & Approval Checkpoint */}
      {activeItem && (
        <div className="bg-[#131525]/90 border border-[#312E81] rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#312E81] pb-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FF00FF] text-white flex items-center justify-center text-xs font-bold shadow-md shadow-[#FF00FF]/40">
                BP
              </span>
              <h3 className="text-base font-bold text-white">
                ขั้นตอนการตรวจสอบ: BRIEF_PICTURE
              </h3>
            </div>
            <StatusBadge
              type={
                activeItem.stage === 'brief_picture'
                  ? 'beta'
                  : activeItem.stage === 'rejected'
                  ? 'not_connected'
                  : 'ready'
              }
              text={`Stage: ${activeItem.stage.toUpperCase()}`}
              size="sm"
            />
          </div>

          {/* Brief Details */}
          {activeItem.briefSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#0C0D1A] border border-[#312E81] text-xs sm:text-sm">
              <div>
                <span className="text-white/50 font-bold block mb-1">📐 การจัดองค์ประกอบ (Composition):</span>
                <p className="text-white">{activeItem.briefSummary.composition}</p>
              </div>
              <div>
                <span className="text-white/50 font-bold block mb-1">💡 การจัดแสง (Lighting):</span>
                <p className="text-white">{activeItem.briefSummary.lighting}</p>
              </div>
              <div className="md:col-span-2">
                <span className="text-white/50 font-bold block mb-1">🎨 จานสีหลัก (Color Palette):</span>
                <div className="flex flex-wrap gap-2">
                  {activeItem.briefSummary.colorPalette.map((col, idx) => (
                    <span key={idx} className="px-2 py-1 rounded bg-[#131525] text-white text-[11px] font-mono border border-[#312E81]">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Approval Action Trigger */}
          {activeItem.stage === 'brief_picture' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#0C0D1A] border border-[#7B2CFE]/40">
              <div>
                <h4 className="text-sm font-bold text-white">ต้องการยืนยันโครงสร้างภาพนี้หรือไม่?</h4>
                <p className="text-xs text-white/50">
                  กด @Approved เพื่อส่งต่อไปยังขั้นตอนเรนเดอร์ หรือ @Rejected เพื่อปรับแต่งใหม่
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleReject}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 text-xs font-bold min-h-[44px]"
                >
                  <X className="w-4 h-4" /> @Rejected
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF00FF] to-[#7B2CFE] hover:opacity-90 text-white shadow-md text-xs font-bold min-h-[44px]"
                >
                  <Check className="w-4 h-4" /> @Approved & Render
                </button>
              </div>
            </div>
          )}

          {/* Rendering Progress */}
          {(activeItem.stage === 'rendering' || activeItem.stage === 'qc_check') && (
            <div className="p-6 rounded-2xl bg-[#0C0D1A] border border-[#312E81] text-center space-y-4">
              <div className="flex items-center justify-center gap-3 text-sm text-[#7B2CFE] font-bold">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>
                  {activeItem.stage === 'rendering'
                    ? 'กำลังประมวลผลเรนเดอร์ภาพ (Mock Pipeline)...'
                    : 'กำลังตรวจสอบมาตรฐานคุณภาพ (QC Check)...'}
                </span>
              </div>
              <div className="w-full bg-[#131525] rounded-full h-3 overflow-hidden border border-[#312E81]">
                <div
                  className="bg-gradient-to-r from-[#FF00FF] to-[#7B2CFE] h-full transition-all duration-300"
                  style={{ width: `${activeItem.renderProgress || 10}%` }}
                />
              </div>
              <p className="text-xs text-white/40 font-mono">
                ประมวลผล {activeItem.renderProgress}% · ไม่มีการใช้ GPU ภายนอก (NOT_CONNECTED)
              </p>
            </div>
          )}

          {/* Completed Visual & QC Card */}
          {activeItem.stage === 'completed' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="relative rounded-2xl bg-[#0C0D1A] border border-[#312E81] p-6 text-center overflow-hidden flex flex-col items-center justify-center min-h-[260px]">
                {/* Visual Watermark Canvas */}
                <div
                  className={`w-full ${ASPECT_PRESET[activeItem.aspectRatio].box} rounded-xl bg-[#131525] border border-[#7B2CFE]/40 flex flex-col items-center justify-center p-4 relative shadow-2xl`}
                >
                  <div className="absolute top-3 right-3">
                    <StatusBadge type="demo" text="WATERMARK: DEMO ONLY" size="sm" />
                  </div>
                  <ImageIcon className="w-12 h-12 text-[#7B2CFE] mb-2 opacity-80" />
                  <p className="text-xs text-white font-bold text-center px-4 max-w-sm">
                    &ldquo;{activeItem.prompt}&rdquo;
                  </p>
                  <span className="text-[10px] text-white/50 mt-2 font-mono">
                    LSUPERAGENT Visual Synthesizer · V11 Preview ({activeItem.aspectRatio})
                  </span>
                </div>
              </div>

              {/* QC Verification Card */}
              {activeItem.qcResult && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold text-emerald-300">
                      ผลการตรวจสอบ QC: ผ่านเกณฑ์ (คะแนน {activeItem.qcResult.score}/100)
                    </div>
                    <p className="text-white/50 mt-0.5">{activeItem.qcResult.details}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-[#0C0D1A] border border-[#312E81] text-xs text-white hover:border-[#7B2CFE] min-h-[44px]"
                >
                  สร้างรูปภาพใหม่
                </button>
              </div>
            </div>
          )}

          {activeItem.stage === 'rejected' && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center justify-between">
              <span>คำขอถูกยกเลิก (@Rejected) คุณสามารถแก้ไขคำบรรยายแล้วลองใหม่ได้</span>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg bg-[#0C0D1A] border border-red-500/40 text-white min-h-[36px]"
              >
                ลองใหม่
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
