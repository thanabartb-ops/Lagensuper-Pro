import React, { useState } from 'react';
import { AppRoute } from '../../types';
import {
  Search,
  Sparkles,
  MessageSquare,
  Compass,
  Image as ImageIcon,
  Bot,
  Brain,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface DashboardSectionProps {
  onRouteChange: (route: AppRoute) => void;
  onSearchSubmit?: (query: string) => void;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  onRouteChange,
  onSearchSubmit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const quickCards: {
    title: string;
    description: string;
    route: AppRoute;
    icon: React.ReactNode;
    iconBg: string;
    accentColor: string;
  }[] = [
    {
      title: 'แชทกับ AI',
      description: 'ถาม-ตอบ ได้ทุกเรื่อง',
      route: 'smart_chat',
      icon: <MessageSquare className="w-5 h-5 text-[#F472B6]" />,
      iconBg: 'bg-[#FF2CAA]/10 border-[#FF2CAA]/30',
      accentColor: 'group-hover:border-[#FF2CAA]/60',
    },
    {
      title: 'ค้นคว้าเชิงลึก',
      description: 'เจาะข้อมูลเชิงลึก รวบรวม และสังเคราะห์',
      route: 'deep_research',
      icon: <Compass className="w-5 h-5 text-[#38BDF8]" />,
      iconBg: 'bg-[#3082F6]/10 border-[#3082F6]/30',
      accentColor: 'group-hover:border-[#3082F6]/60',
    },
    {
      title: 'สร้างภาพ',
      description: 'เปลี่ยนไอเดียของคุณให้เป็นภาพ',
      route: 'create_image',
      icon: <ImageIcon className="w-5 h-5 text-[#C084FC]" />,
      iconBg: 'bg-[#885CF6]/10 border-[#885CF6]/30',
      accentColor: 'group-hover:border-[#885CF6]/60',
    },
    {
      title: 'โหมดเอเจนท์',
      description: 'มอบหมายงานให้ AI ดำเนินการเป็นขั้นตอน',
      route: 'agent_mode',
      icon: <Bot className="w-5 h-5 text-[#818CF8]" />,
      iconBg: 'bg-[#6366F1]/10 border-[#6366F1]/30',
      accentColor: 'group-hover:border-[#6366F1]/60',
    },
    {
      title: 'หน่วยความจำ',
      description: 'จัดเก็บบริบทและการตัดสินใจที่สำคัญ',
      route: 'memory',
      icon: <Brain className="w-5 h-5 text-[#34D399]" />,
      iconBg: 'bg-[#10B981]/10 border-[#10B981]/30',
      accentColor: 'group-hover:border-[#10B981]/60',
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearchSubmit) {
        onSearchSubmit(searchQuery);
      } else {
        onRouteChange('smart_chat');
      }
    }
  };

  return (
    <section id="dashboard" className="w-full py-8 sm:py-12">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
        {/* Dashboard Header Container */}
        <div className="bg-[#131525]/90 border border-[#312E81] rounded-2xl p-5 sm:p-8 relative overflow-hidden shadow-2xl backdrop-blur-sm">
          {/* Subtle top border gradient line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF00FF] via-[#7B2CFE] to-[#00D1FF] opacity-70" />

          {/* Workspace Title & Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00D1FF] animate-pulse" />
              <span className="text-xs font-bold text-white/70 tracking-wider uppercase font-mono">
                LS_BOTAGENT Workspace
              </span>
            </div>
            <span className="text-xs text-white/40 font-mono hidden sm:block">ศูนย์กลางเริ่มต้น</span>
          </div>

          {/* Greeting & Subtitle */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              สวัสดีคุณผู้ใช้ <span className="animate-wave inline-block">👋</span>
            </h2>
            <p className="text-sm sm:text-base text-white/50 mt-1">
              ต้องการให้ LS_BOTAGENT ช่วยอะไรในวันนี้?
            </p>
          </div>

          {/* Search / Composer Input Bar with Elegant Dark Glow */}
          <form onSubmit={handleSearchSubmit} className="relative mb-8 group">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-[#FF00FF] via-[#7B2CFE] to-[#00D1FF] rounded-2xl opacity-25 group-focus-within:opacity-100 transition-opacity blur-[2px] pointer-events-none" />
            <div className="relative bg-[#131525] rounded-2xl border border-[#312E81] flex items-center p-2">
              <div className="pl-3 text-white/40 pointer-events-none">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="พิมพ์ข้อความ หรือเลือกเครื่องมือด้านล่าง..."
                className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm sm:text-base text-white placeholder:text-white/30"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-[#FF00FF] to-[#7B2CFE] hover:opacity-90 px-6 py-3 rounded-xl font-bold text-white transition-all cursor-pointer flex items-center gap-2 text-sm shrink-0 min-h-[44px]"
                title="ค้นหาหรือเริ่มงาน"
              >
                <span>เริ่มต้นใช้งาน</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Prompt Tags */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 text-xs text-white/50 scrollbar-none">
              <span className="text-white/30 whitespace-nowrap">ตัวอย่าง:</span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('สรุปข้อมูลแนวโน้ม AI ประจำปี 2026');
                }}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-[#131525] border border-[#312E81]/60 hover:border-[#7B2CFE] hover:text-white transition-colors"
              >
                💡 สรุปแนวโน้ม AI 2026
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('ออกแบบโครงสร้างสไลด์ Pitch Deck');
                }}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-[#131525] border border-[#312E81]/60 hover:border-[#7B2CFE] hover:text-white transition-colors"
              >
                📊 โครงสร้าง Slide Pitch Deck
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('สร้างภาพทิวทัศน์ไซเบอร์พังค์แบบคมชัด');
                }}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-[#131525] border border-[#312E81]/60 hover:border-[#7B2CFE] hover:text-white transition-colors"
              >
                🎨 ภาพ Cyberpunk HD
              </button>
            </div>
          </form>

          {/* 5 Core Quick-Access Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickCards.map((card) => (
              <div
                key={card.title}
                onClick={() => onRouteChange(card.route)}
                className="group flex items-center justify-between p-5 rounded-2xl bg-[#131525]/80 border border-[#312E81] hover:bg-[#1A1C30] hover:border-[#7B2CFE] transition-all duration-200 cursor-pointer select-none min-h-[76px]"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border ${card.iconBg} shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    {card.icon}
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-white group-hover:text-[#7B2CFE] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-white/50 line-clamp-1 mt-0.5">{card.description}</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 group-hover:text-white group-hover:bg-[#312E81]/40 transition-all">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
