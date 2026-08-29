import React, { useState } from 'react';
import { LSLogo } from './LSLogo';
import { StatusBadge } from './StatusBadge';
import { AppRoute } from '../../types';
import {
  Menu,
  X,
  MessageSquare,
  Search,
  Image as ImageIcon,
  Bot,
  Brain,
  Settings,
  Activity,
  ShieldAlert,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';

interface HeaderProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
}

const PROJECT_CHILD_ROUTES = new Set<AppRoute>([
  'deep_research',
  'create_image',
  'agent_mode',
  'runtime',
  'audit',
]);

export const Header: React.FC<HeaderProps> = ({ currentRoute, onRouteChange }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { route: AppRoute; label: string; icon: React.ReactNode }[] = [
    { route: 'landing', label: 'หน้าหลัก', icon: <Sparkles className="w-4 h-4" /> },
    { route: 'smart_chat', label: 'แชท', icon: <MessageSquare className="w-4 h-4" /> },
    { route: 'projects', label: 'โปรเจกต์ & เครื่องมือ', icon: <LayoutGrid className="w-4 h-4" /> },
    { route: 'memory', label: 'ความจำ', icon: <Brain className="w-4 h-4" /> },
    { route: 'settings', label: 'ตั้งค่า', icon: <Settings className="w-4 h-4" /> },
  ];

  const quickTools: { route: AppRoute; label: string; icon: React.ReactNode }[] = [
    { route: 'deep_research', label: 'ค้นคว้าเชิงลึก (Deep Research)', icon: <Search className="w-4 h-4 text-sky-400" /> },
    { route: 'create_image', label: 'สร้างภาพ (Image Gen)', icon: <ImageIcon className="w-4 h-4 text-fuchsia-400" /> },
    { route: 'agent_mode', label: 'โหมดเอเจนท์ (Agent Mode)', icon: <Bot className="w-4 h-4 text-indigo-400" /> },
    { route: 'runtime', label: 'สถานะ Runtime', icon: <Activity className="w-4 h-4 text-emerald-400" /> },
    { route: 'audit', label: 'บันทึกตรวจสอบ (Audit)', icon: <ShieldAlert className="w-4 h-4 text-amber-400" /> },
  ];

  const handleNav = (route: AppRoute) => {
    onRouteChange(route);
    setMobileMenuOpen(false);
  };

  const isPrimaryRouteActive = (route: AppRoute) =>
    currentRoute === route || (route === 'projects' && PROJECT_CHILD_ROUTES.has(currentRoute));

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0C0D1A]/95 backdrop-blur-md border-b border-[#312E81]/40">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div
          onClick={() => handleNav('landing')}
          className="flex items-center gap-3 cursor-pointer group select-none min-h-[44px]"
        >
          <LSLogo size="sm" showGlow />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-[#7B2CFE] transition-colors">
                LSUPERAGENT
              </span>
              <span className="text-[10px] text-[#7B2CFE] font-bold uppercase tracking-widest bg-[#7B2CFE]/10 border border-[#7B2CFE]/30 px-2 py-0.5 rounded-md hidden sm:inline-block">
                V11 Beta
              </span>
            </div>
            <span className="text-[11px] text-white/40 font-normal leading-tight hidden xs:block">
              AI ช่วยคิด ทำไว งานสำเร็จ
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((item) => {
            const isActive = isPrimaryRouteActive(item.route);
            return (
              <button
                key={item.route}
                onClick={() => handleNav(item.route)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 min-h-[44px] ${
                  isActive
                    ? 'bg-gradient-to-r from-[#7B2CFE]/20 to-[#7B2CFE]/5 text-white border border-[#7B2CFE] shadow-[0_0_15px_rgba(123,44,254,0.25)]'
                    : 'text-white/50 hover:text-white hover:bg-[#131525]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Header Right Status & Mobile Toggle */}
        <div className="flex items-center gap-2">
          {/* Honest Gateway Offline Indicator */}
          <button
            onClick={() => handleNav('runtime')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131525] border border-[#312E81] hover:border-[#7B2CFE] text-xs transition-colors min-h-[40px]"
            title="คลิกเพื่อตรวจสอบสถานะ Runtime Adapter"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white/40 text-[11px] font-bold uppercase tracking-wider">Gateway:</span>
            <span className="text-red-400 font-mono text-[11px] font-bold">NOT_CONNECTED</span>
          </button>

          {/* Quick Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden items-center justify-center w-11 h-11 rounded-xl bg-[#131525] border border-[#312E81] text-white hover:bg-[#1A1C30] focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Overflow Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#312E81]/40 bg-[#0C0D1A] px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-[#312E81]/30">
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">
              เมนูหลัก
            </span>
            <StatusBadge type="not_connected" text="NOT_CONNECTED" size="sm" />
          </div>

          <div className="grid grid-cols-1 gap-1">
            {navLinks.map((item) => {
              const isActive = isPrimaryRouteActive(item.route);
              return (
                <button
                  key={item.route}
                  onClick={() => handleNav(item.route)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left text-sm font-medium transition-colors min-h-[44px] ${
                    isActive
                      ? 'bg-gradient-to-r from-[#7B2CFE]/25 to-transparent text-white border-l-2 border-[#7B2CFE]'
                      : 'text-white/50 hover:text-white hover:bg-[#131525]'
                  }`}
                >
                  <span className={isActive ? 'text-[#7B2CFE]' : 'text-white/40'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#312E81]/30">
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest block mb-2">
              เครื่องมือและบริการเพิ่มเติม
            </span>
            <div className="grid grid-cols-1 gap-1">
              {quickTools.map((tool) => (
                <button
                  key={tool.route}
                  onClick={() => handleNav(tool.route)}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-medium text-white/50 hover:text-white hover:bg-[#131525] transition-colors min-h-[44px]"
                >
                  {tool.icon}
                  <span>{tool.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};