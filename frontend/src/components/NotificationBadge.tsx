import React from 'react';
import { Bell, BellRing, Check } from 'lucide-react';

interface NotificationBadgeProps {
  count: number;
  variant?: 'default' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  pulse?: boolean;
}

const variantConfig = {
  default: {
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    iconColor: 'text-blue-500',
  },
  danger: {
    bgColor: 'bg-red-500',
    textColor: 'text-white',
    iconColor: 'text-red-500',
  },
  warning: {
    bgColor: 'bg-orange-500',
    textColor: 'text-white',
    iconColor: 'text-orange-500',
  },
};

const sizeConfig = {
  sm: {
    size: 'h-5 w-5',
    text: 'text-xs',
    icon: 'h-3 w-3',
  },
  md: {
    size: 'h-6 w-6',
    text: 'text-sm',
    icon: 'h-4 w-4',
  },
  lg: {
    size: 'h-7 w-7',
    text: 'text-base',
    icon: 'h-5 w-5',
  },
};

/**
 * NotificationBadge Component
 * 
 * Displays notification count with optional pulsing animation
 * 
 * @example
 * ```tsx
 * <NotificationBadge count={5} variant="danger" pulse={true} />
 * ```
 */
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  variant = 'default',
  size = 'md',
  showIcon = true,
  pulse = false,
}) => {
  const config = variantConfig[variant];
  const sizeStyles = sizeConfig[size];

  if (count === 0) {
    return showIcon ? (
      <Check className={`${sizeStyles.icon} text-emerald-500`} />
    ) : null;
  }

  return (
    <div className="relative inline-flex items-center">
      {showIcon && (
        <div className={`relative ${pulse ? 'animate-pulse' : ''}`}>
          <BellRing className={`${sizeStyles.icon} ${config.iconColor}`} />
        </div>
      )}
      <span
        className={`inline-flex items-center justify-center ${sizeStyles.size} ${config.bgColor} ${config.textColor} ${sizeStyles.text} font-bold rounded-full ${showIcon ? '-ml-2' : ''} ${
          pulse ? 'animate-pulse' : ''
        }`}
      >
        {count > 99 ? '99+' : count}
      </span>
    </div>
  );
};

export default NotificationBadge;
