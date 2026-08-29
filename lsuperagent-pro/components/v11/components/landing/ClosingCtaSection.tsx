import React from 'react';
import { GradientButton } from '../common/GradientButton';

interface ClosingCtaSectionProps {
  onStartClick: () => void;
}

export const ClosingCtaSection: React.FC<ClosingCtaSectionProps> = ({ onStartClick }) => {
  return (
    <section className="w-full py-12 sm:py-16">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
        <div className="relative rounded-2xl bg-gradient-to-b from-[#131525] to-[#0C0D1A] border border-[#312E81] p-8 sm:p-12 text-center overflow-hidden shadow-2xl">
          {/* Subtle background glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#7B2CFE]/15 blur-3xl pointer-events-none rounded-full"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-[640px] mx-auto flex flex-col items-center">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
              พร้อมให้ AI ช่วยคุณทำงานหรือยัง?
            </h2>
            <p className="text-sm sm:text-base text-white/50 mb-8 font-normal">
              เริ่มต้นใช้งานฟรี ไม่ต้องใส่บัตรเครดิต ทำงานได้ทันทีบนทุกอุปกรณ์
            </p>

            <GradientButton
              onClick={onStartClick}
              size="lg"
              className="min-w-[240px] shadow-[0_8px_32px_rgba(123,44,254,0.4)]"
            >
              เริ่มต้นใช้งาน
            </GradientButton>

            <p className="mt-4 text-[11px] text-white/40 font-mono">
              LSUPERAGENT V11 Public Beta · ปลอดภัย ไม่แชร์ข้อมูลส่วนบุคคล
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
