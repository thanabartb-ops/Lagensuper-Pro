import React from 'react';

export interface StatusBadgeProps {
  type: 'beta' | 'not_connected' | 'demo' | 'coming_soon' | 'ready' | 'simulated';
  text?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  text,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (type) {
    case 'beta':
      return (
        <span
          className={`inline-flex items-center font-bold rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1.5" />
          {text || 'BETA'}
        </span>
      );

    case 'not_connected':
      return (
        <span
          className={`inline-flex items-center font-bold rounded-full bg-red-500/10 text-red-400 border border-red-500/20 ${sizeClasses} ${className}`}
          title="Runtime gateway is currently offline"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
          {text || 'NOT_CONNECTED'}
        </span>
      );

    case 'demo':
      return (
        <span
          className={`inline-flex items-center font-bold rounded-full bg-white/5 text-white/40 border border-white/10 ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white/40 mr-1.5" />
          {text || 'DEMO'}
        </span>
      );

    case 'coming_soon':
      return (
        <span
          className={`inline-flex items-center font-bold rounded-full bg-white/5 text-white/40 border border-white/10 ${sizeClasses} ${className}`}
        >
          {text || 'COMING SOON'}
        </span>
      );

    case 'simulated':
      return (
        <span
          className={`inline-flex items-center font-bold rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1.5" />
          {text || 'SIMULATED'}
        </span>
      );

    case 'ready':
    default:
      return (
        <span
          className={`inline-flex items-center font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses} ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
          {text || 'READY'}
        </span>
      );
  }
};
