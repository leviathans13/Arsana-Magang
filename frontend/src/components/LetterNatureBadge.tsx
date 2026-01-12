import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, Lock, KeyRound, FileText } from 'lucide-react';

export type LetterNature = 'BIASA' | 'PENTING' | 'TERBATAS' | 'RAHASIA' | 'SANGAT_RAHASIA';

interface LetterNatureBadgeProps {
  nature: LetterNature;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const natureConfig = {
  BIASA: {
    label: 'Biasa',
    icon: FileText,
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
  },
  PENTING: {
    label: 'Penting',
    icon: ShieldAlert,
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
  },
  TERBATAS: {
    label: 'Terbatas',
    icon: Shield,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
  },
  RAHASIA: {
    label: 'Rahasia',
    icon: Lock,
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-300',
  },
  SANGAT_RAHASIA: {
    label: 'Sangat Rahasia',
    icon: KeyRound,
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
  },
};

const sizeConfig = {
  sm: {
    padding: 'px-2 py-1',
    text: 'text-xs',
    icon: 'h-3 w-3',
    gap: 'gap-1',
  },
  md: {
    padding: 'px-3 py-1.5',
    text: 'text-sm',
    icon: 'h-4 w-4',
    gap: 'gap-1.5',
  },
  lg: {
    padding: 'px-4 py-2',
    text: 'text-base',
    icon: 'h-5 w-5',
    gap: 'gap-2',
  },
};

/**
 * LetterNatureBadge Component
 * 
 * Displays a visual badge for letter nature (sifat surat) with appropriate
 * color coding and optional icon.
 * 
 * @example
 * ```tsx
 * <LetterNatureBadge nature="RAHASIA" showIcon={true} size="md" />
 * ```
 */
export const LetterNatureBadge: React.FC<LetterNatureBadgeProps> = ({
  nature,
  showIcon = true,
  size = 'md',
}) => {
  const config = natureConfig[nature];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center ${sizeStyles.gap} ${sizeStyles.padding} rounded-full border font-medium ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeStyles.text}`}
    >
      {showIcon && <Icon className={sizeStyles.icon} />}
      {config.label}
    </span>
  );
};

export default LetterNatureBadge;
