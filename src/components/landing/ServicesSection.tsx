import React, { useState } from 'react';
import { ToolCategory, ToolItem, AppRoute } from '../../types';
import { TOOLS_DATA } from '../../data/toolsData';
import { StatusBadge } from '../common/StatusBadge';
import {
  PenTool,
  Presentation,
  Image as ImageIcon,
  Search,
  Bot,
  Brain,
  ChevronRight,
} from 'lucide-react';

interface ServicesSectionProps {
  selectedToolId: string;
  onSelectTool: (toolId: string) => void;
  onRouteChange: (route: AppRoute) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  selectedToolId,
  onSelectTool,
  onRouteChange,
}) => {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('all');

  const categories: { key: ToolCategory; label: string }[] = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'ai_writing', label: 'AI Writing' },
    { key: 'design', label: 'ออกแบบ' },
    { key: 'analysis', label: 'วิเคราะห์' },
    { key: 'development', label: 'พัฒนา' },
  ];

  const filteredTools =
    activeCategory === 'all'
      ? TOOLS_DATA
      : TOOLS_DATA.filter((tool) => tool.category === activeCategory);

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'PenTool':
        return <PenTool className="w-5 h-5 text-[#F472B6]" />;
      case 'Presentation':
        return <Presentation className="w-5 h-5 text-[#818CF8]" />;
      case 'Image':
        return <ImageIcon className="w-5 h-5 text-[#38BDF8]" />;
      case 'Search':
        return <Search className="w-5 h-5 text-[#38BDF8]" />;
      case 'Bot':
        return <Bot className="w-5 h-5 text-[#C084FC]" />;
      case 'Brain':
        return <Brain className="w-5 h-5 text-[#34D399]" />;
      default:
        return <PenTool className="w-5 h-5 text-[#A855F7]" />;
    }
  };

  return (
    <section id="services" className="w-full py-8 sm:py-12">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">บริการและเครื่องมือ</h2>
            <p className="text-xs sm:text-sm text-white/50">
              รวมบริการและเครื่องมือครบในที่เดียว ค้นหาและเลือกใช้งานได้ง่าย
            </p>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[38px] cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF00FF] to-[#7B2CFE] text-white shadow-[0_2px_12px_rgba(123,44,254,0.4)] border border-white/20'
                      : 'bg-[#131525] text-white/50 hover:text-white border border-[#312E81] hover:border-[#7B2CFE]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => {
            const isSelected = selectedToolId === tool.id;
            return (
              <div
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                className={`group relative p-5 rounded-2xl bg-[#131525]/80 border transition-all duration-200 cursor-pointer select-none ${
                  isSelected
                    ? 'border-[#7B2CFE] bg-[#1A1C30] shadow-[0_0_25px_rgba(123,44,254,0.3)] ring-1 ring-[#7B2CFE]'
                    : 'border-[#312E81] hover:border-[#7B2CFE] hover:bg-[#1A1C30]'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0C0D1A] border border-[#312E81] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {getToolIcon(tool.icon)}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      type={tool.badge === 'Beta' ? 'beta' : 'coming_soon'}
                      text={tool.badge}
                      size="sm"
                    />
                    <ChevronRight
                      className={`w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all ${
                        isSelected ? 'text-[#7B2CFE] translate-x-0.5' : ''
                      }`}
                    />
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-[#7B2CFE] transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
                  {tool.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
