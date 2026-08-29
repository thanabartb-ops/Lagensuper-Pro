import React from 'react';
import { AppRoute } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  LayoutGrid,
  Search,
  Image as ImageIcon,
  Bot,
  Brain,
  PenTool,
  Activity,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

interface ProjectsHubViewProps {
  onRouteChange: (route: AppRoute) => void;
}

export const ProjectsHubView: React.FC<ProjectsHubViewProps> = ({ onRouteChange }) => {
  const quickSurfaces: {
    route: AppRoute;
    title: string;
    description: string;
    icon: React.ReactNode;
    badge: 'Beta' | 'Coming Soon' | 'Ready';
  }[] = [
    {
      route: 'smart_chat',
      title: 'Smart Chat',
      description: 'โหมดแชทถาม-ตอบอัจฉริยะภาษาไทย',
      icon: <PenTool className="w-5 h-5 text-[#F472B6]" />,
      badge: 'Beta',
    },
    {
      route: 'deep_research',
      title: 'Deep Research',
      description: 'สืบค้น เจาะลึก และสร้างบทสรุปผู้บริหาร',
      icon: <Search className="w-5 h-5 text-[#38BDF8]" />,
      badge: 'Beta',
    },
    {
      route: 'create_image',
      title: 'Image Generation',
      description: 'ระบบสร้างภาพพร้อม BRIEF_PICTURE และ QC Check',
      icon: <ImageIcon className="w-5 h-5 text-[#C084FC]" />,
      badge: 'Beta',
    },
    {
      route: 'agent_mode',
      title: 'Agent Mode',
      description: 'มอบหมายงานให้ AI วางแผนและดำเนินการเป็นขั้นตอน',
      icon: <Bot className="w-5 h-5 text-[#818CF8]" />,
      badge: 'Coming Soon',
    },
    {
      route: 'memory',
      title: 'Memory Vault',
      description: 'บันทึกบริบท กฎเกณฑ์ และความจำเพื่อการทำงานต่อเนื่อง',
      icon: <Brain className="w-5 h-5 text-[#34D399]" />,
      badge: 'Coming Soon',
    },
    {
      route: 'runtime',
      title: 'Runtime Diagnostics',
      description: 'ตรวจสอบสถานะ Adapter, Gateway และ Latency',
      icon: <Activity className="w-5 h-5 text-emerald-400" />,
      badge: 'Ready',
    },
    {
      route: 'audit',
      title: 'Audit Log',
      description: 'บันทึกประวัติการทำงานและกิจกรรมของระบบ',
      icon: <ShieldAlert className="w-5 h-5 text-amber-400" />,
      badge: 'Ready',
    },
  ];

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#131525] border border-[#312E81] rounded-2xl shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#7B2CFE]/10 border border-[#7B2CFE]/30 flex items-center justify-center text-[#7B2CFE]">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">โปรเจกต์และศูนย์รวมเครื่องมือ</h2>
              <StatusBadge type="beta" text="V11 Hub" size="sm" />
            </div>
            <p className="text-xs sm:text-sm text-white/50">
              เข้าถึงเครื่องมือทั้งหมดของ LSUPERAGENT จากจุดเดียว
            </p>
          </div>
        </div>

        <StatusBadge type="not_connected" text="Gateway: NOT_CONNECTED" size="sm" />
      </div>

      {/* Surface Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickSurfaces.map((item) => (
          <div
            key={item.route}
            onClick={() => onRouteChange(item.route)}
            className="group p-5 rounded-2xl bg-[#131525]/90 border border-[#312E81] hover:border-[#7B2CFE] hover:bg-[#1A1C30] transition-all cursor-pointer space-y-3 flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#0C0D1A] border border-[#312E81] flex items-center justify-center group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <StatusBadge
                  type={item.badge === 'Beta' ? 'beta' : item.badge === 'Ready' ? 'ready' : 'coming_soon'}
                  text={item.badge}
                  size="sm"
                />
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-[#00D1FF] transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">{item.description}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#312E81]/50 text-xs text-white/40 group-hover:text-white transition-colors">
              <span className="font-mono">/{item.route}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#7B2CFE]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
