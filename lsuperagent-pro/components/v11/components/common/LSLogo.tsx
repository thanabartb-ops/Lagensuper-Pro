import React from 'react';

interface LSLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlow?: boolean;
}

export const LSLogo: React.FC<LSLogoProps> = ({ size = 'md', className = '', showGlow = true }) => {
  const sizeDimensions = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24 sm:w-28 sm:h-28',
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${sizeDimensions[size]} ${className}`}>
      {showGlow && (
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF2CAA]/30 via-[#885CF6]/30 to-[#3082F6]/30 blur-md pointer-events-none -z-10"
          aria-hidden="true"
        />
      )}
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_4px_16px_rgba(136,92,246,0.35)]"
      >
        <defs>
          {/* Main Neon Gradient */}
          <linearGradient id="lsGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF2CAA" />
            <stop offset="45%" stopColor="#885CF6" />
            <stop offset="100%" stopColor="#3082F6" />
          </linearGradient>

          {/* Cyan-Blue Accent Gradient */}
          <linearGradient id="lsGradCyan" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3082F6" />
            <stop offset="100%" stopColor="#00F0FF" />
          </linearGradient>

          {/* Deep Isometric Facet Shade */}
          <linearGradient id="lsDarkFacet" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1C1F38" />
            <stop offset="100%" stopColor="#0B0D1B" />
          </linearGradient>

          {/* Glass Highlight */}
          <linearGradient id="lsGlassHighlight" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="40%" stopColor="#885CF6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#070812" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* 3D Isometric Outer Hexagonal Block */}
        {/* Top/Back Shadow Face */}
        <polygon
          points="60,6 106,30 106,86 60,112 14,86 14,30"
          fill="url(#lsDarkFacet)"
          stroke="url(#lsGradPrimary)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Top Facet Highlight */}
        <polygon
          points="60,10 102,32 60,54 18,32"
          fill="url(#lsGlassHighlight)"
          stroke="#885CF6"
          strokeWidth="1.2"
          strokeOpacity="0.5"
        />

        {/* Left 3D Isometric Wall */}
        <polygon
          points="18,32 60,54 60,106 18,84"
          fill="#111322"
          fillOpacity="0.9"
          stroke="url(#lsGradCyan)"
          strokeWidth="1"
          strokeOpacity="0.4"
        />

        {/* Right 3D Isometric Wall */}
        <polygon
          points="60,54 102,32 102,84 60,106"
          fill="#171A2E"
          fillOpacity="0.9"
          stroke="url(#lsGradPrimary)"
          strokeWidth="1"
          strokeOpacity="0.4"
        />

        {/* Bold Isometric 'L' & 'S' Letterforms in 3D Neon Glass */}
        {/* 'L' Geometry */}
        <path
          d="M32 38 L43 32 L43 68 L56 61 L56 72 L32 85 Z"
          fill="url(#lsGradPrimary)"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeOpacity="0.85"
        />
        {/* 'L' Bevel Inner Plane */}
        <path
          d="M36 43 L40 41 L40 66 L52 60 L52 68 L36 78 Z"
          fill="#00F0FF"
          fillOpacity="0.3"
        />

        {/* 'S' Geometry */}
        <path
          d="M62 36 L86 24 L86 35 L73 42 L86 49 L86 74 L62 86 L62 75 L75 68 L62 61 Z"
          fill="url(#lsGradCyan)"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeOpacity="0.85"
        />
        {/* 'S' Bevel Inner Accents */}
        <path
          d="M66 40 L82 32 L82 36 L70 42 L82 48 L82 71 L66 80 L66 76 L78 70 L66 64 Z"
          fill="#FF2CAA"
          fillOpacity="0.3"
        />

        {/* Floating Neon Sparkle Points */}
        <circle cx="60" cy="54" r="2" fill="#00F0FF" />
        <circle cx="102" cy="32" r="1.5" fill="#FF2CAA" />
        <circle cx="18" cy="84" r="1.5" fill="#885CF6" />
      </svg>
    </div>
  );
};
