import React from 'react';
import { TOOLS_DATA } from '../../data/toolsData';
import { StatusBadge } from '../common/StatusBadge';
import { GradientButton } from '../common/GradientButton';
import { AppRoute } from '../../types';
import {
  PenTool,
  Presentation,
  Image as ImageIcon,
  Search,
  Bot,
  Brain,
  CheckCircle2,
} from 'lucide-react';

interface ToolDetailSectionProps {
  selectedToolId: string;
  onRouteChange: (route: AppRoute) => void;
}

export const ToolDetailSection: React.FC<ToolDetailSectionProps> = ({
  selectedToolId,
  onRouteChange,
}) => {
  const currentTool =
    TOOLS_DATA.find((t) => t.id === selectedToolId) || TOOLS_DATA[0];

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'PenTool':
        return <PenTool className="w-6 h-6 text-white" />;
      case 'Presentation':
        return <Presentation className="w-6 h-6 text-white" />;
      case 'Image':
        return <ImageIcon className="w-6 h-6 text-white" />;
      case 'Search':
        return <Search className="w-6 h-6 text-white" />;
      case 'Bot':
        return <Bot className="w-6 h-6 text-white" />;
      case 'Brain':
        return <Brain className="w-6 h-6 text-white" />;
      default:
        return <PenTool className="w-6 h-6 text-white" />;
    }
  };

  const handleLaunchTool = () => {
    if (currentTool.route) {
      onRouteChange(currentTool.route);
    } else {
      onRouteChange('smart_chat');
    }
  };

  return (
    <section id="tool-detail" className="w-full py-6 sm:py-10">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
        <div className="bg-[#131525]/90 border border-[#312E81] rounded-2xl p-5 sm:p-8 relative overflow-hidden shadow-2xl">
          {/* Subtle neon corner highlight */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#FF00FF]/15 via-[#7B2CFE]/15 to-transparent blur-2xl pointer-events-none rounded-full" />

          {/* Section Subtitle */}
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#7B2CFE]" />
            <span className="text-xs font-bold text-white/60 tracking-wider uppercase font-mono">
              รายละเอียดเครื่องมือที่เลือก
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Tool Info & Capabilities */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF00FF] to-[#7B2CFE] flex items-center justify-center shadow-lg shadow-[#7B2CFE]/30">
                  {getToolIcon(currentTool.icon)}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                      {currentTool.name}
                    </h3>
                    <StatusBadge
                      type={currentTool.badge === 'Beta' ? 'beta' : 'coming_soon'}
                      text={currentTool.badge}
                      size="sm"
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                    {currentTool.description}
                  </p>
                </div>
              </div>

              {/* Capabilities Checklist */}
              <div className="space-y-2.5 pt-2">
                {currentTool.capabilities.map((cap, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-white/90">
                    <CheckCircle2 className="w-4 h-4 text-[#FF00FF] shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>

              {/* Status Note */}
              <div className="pt-2 flex items-center gap-2 text-xs text-white/50">
                <span>สถานะ:</span>
                <span className="text-[#00D1FF] font-semibold">{currentTool.statusText}</span>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="lg:w-auto shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center gap-3">
              <GradientButton
                onClick={handleLaunchTool}
                size="md"
                className="w-full sm:w-auto min-w-[240px]"
              >
                เริ่มต้นใช้งาน {currentTool.name}
              </GradientButton>
              <span className="text-[11px] text-white/40 text-center font-mono">
                ทำงานในโหมดจำลองความเร็วสูง
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
