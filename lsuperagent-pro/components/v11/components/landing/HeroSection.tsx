import React from 'react';
import { LSLogo } from '../common/LSLogo';
import { GradientButton } from '../common/GradientButton';

interface HeroSectionProps {
  onStartClick: () => void;
  onLoginClick: () => void;
  onSignupClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartClick,
  onLoginClick,
  onSignupClick,
}) => {
  return (
    <section className="relative w-full pt-8 pb-12 sm:py-16 flex flex-col items-center justify-center text-center overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#7B2CFE]/10 rounded-full blur-[120px] pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="max-w-[720px] mx-auto px-4 flex flex-col items-center">
        <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#131525] border border-[#312E81] text-xs text-white/60">
          <span className="w-2 h-2 rounded-full bg-[#00D1FF] animate-pulse" />
          <span className="font-medium tracking-wide">V11 · Public Beta Preview</span>
        </div>

        <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
          <LSLogo size="xl" showGlow />
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-2">
          <span className="brand-gradient-text">LSUPERAGENT</span>
        </h1>

        <h2 className="text-[14px] sm:text-[16px] font-bold uppercase tracking-[0.2em] text-[#7B2CFE] mb-2">
          AI ช่วยคิด ทำไว งานสำเร็จ
        </h2>
        <p className="text-2xl sm:text-4xl font-bold leading-tight bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent mb-8">
          ทุกไอเดีย...เป็นผลงาน
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          <GradientButton
            onClick={onStartClick}
            size="md"
            className="w-full sm:w-auto min-w-[220px]"
          >
            เริ่มต้นใช้งาน
          </GradientButton>
        </div>

        <div className="mt-3 flex min-h-[44px] items-center justify-center gap-1 text-xs sm:text-sm">
          {onSignupClick && (
            <button
              type="button"
              onClick={onSignupClick}
              className="flex min-h-[44px] items-center justify-center px-3 py-1.5 font-medium text-white/70 transition-colors hover:text-white"
            >
              สมัครใช้งาน
            </button>
          )}
          {onSignupClick && <span className="text-white/20" aria-hidden="true">•</span>}
          <button
            type="button"
            onClick={onLoginClick}
            className="flex min-h-[44px] items-center justify-center px-3 py-1.5 text-white/55 transition-colors hover:text-white"
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    </section>
  );
};
