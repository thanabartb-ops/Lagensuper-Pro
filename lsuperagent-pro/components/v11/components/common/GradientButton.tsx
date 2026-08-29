import React from 'react';
import { ChevronRight } from 'lucide-react';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  showArrow?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  icon,
  showArrow = true,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-10 px-4 text-sm rounded-[14px]',
    md: 'h-12 px-6 text-[15px] rounded-[16px]', // 48px height from design spec
    lg: 'h-14 px-8 text-base rounded-[18px]',
  };

  const baseStyles =
    'relative inline-flex items-center justify-center font-bold transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#7B2CFE]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] min-h-[44px]';

  let variantStyles = '';

  if (variant === 'primary') {
    variantStyles =
      'text-white bg-gradient-to-r from-[#FF00FF] to-[#7B2CFE] hover:opacity-90 shadow-[0_4px_24px_rgba(123,44,254,0.4)] border border-white/20';
  } else if (variant === 'secondary') {
    variantStyles =
      'bg-[#131525] text-white/90 hover:bg-[#1A1C30] border border-[#312E81] hover:border-[#7B2CFE]';
  } else if (variant === 'outline') {
    variantStyles =
      'bg-transparent text-white/90 hover:bg-[#131525] border border-[#312E81] hover:border-[#7B2CFE]';
  } else {
    variantStyles = 'bg-transparent text-white/50 hover:text-white hover:bg-[#131525]/60';
  }

  return (
    <button
      className={`${baseStyles} ${sizeClasses[size]} ${variantStyles} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="mr-2 flex items-center justify-center">{icon}</span>}
      <span className="truncate">{children}</span>
      {showArrow && (
        <ChevronRight className="ml-1.5 w-4 h-4 opacity-80 group-hover:translate-x-0.5 transition-transform" />
      )}
    </button>
  );
};
