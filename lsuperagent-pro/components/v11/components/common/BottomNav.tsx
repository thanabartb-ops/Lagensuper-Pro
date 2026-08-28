import React from 'react';
import { AppRoute } from '../../types';
import { Home, MessageSquare, LayoutGrid, Brain, Settings } from 'lucide-react';

interface BottomNavProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentRoute, onRouteChange }) => {
  const items: { route: AppRoute; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { route: 'landing', label: 'หน้าหลัก', icon: Home },
    { route: 'smart_chat', label: 'แชท', icon: MessageSquare },
    { route: 'projects', label: 'โปรเจกต์', icon: LayoutGrid },
    { route: 'memory', label: 'ความจำ', icon: Brain },
    { route: 'settings', label: 'ตั้งค่า', icon: Settings },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0C0D1A]/95 backdrop-blur-lg border-t border-[#312E81]/40 px-2 py-1.5 pb-safe select-none"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="max-w-[425px] mx-auto grid grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          // If we are in child tool routes, show 'projects' or appropriate parent as active
          const isCurrentActive =
            currentRoute === item.route ||
            (item.route === 'projects' &&
              ['deep_research', 'create_image', 'agent_mode', 'runtime', 'audit'].includes(
                currentRoute
              ));

          return (
            <button
              key={item.route}
              onClick={() => onRouteChange(item.route)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 min-h-[48px] min-w-[44px] ${
                isCurrentActive
                  ? 'text-white bg-[#7B2CFE]/15'
                  : 'text-white/50 hover:text-white active:scale-95'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isCurrentActive ? 'text-[#7B2CFE] scale-110' : ''
                  }`}
                />
                {isCurrentActive && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#FF00FF] via-[#7B2CFE] to-[#00D1FF]" />
                )}
              </div>
              <span
                className={`text-[11px] font-medium mt-1 leading-tight tracking-tight ${
                  isCurrentActive ? 'text-white font-bold' : 'text-white/40'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
