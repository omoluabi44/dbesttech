import React from 'react';
import { motion } from 'framer-motion';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string; // Tailwind color class
  height?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'cartoon' | 'rainbow';
  showLabel?: boolean;
  showMilestones?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'bg-primary',
  height = 'md',
  variant = 'default',
  showLabel = false,
  showMilestones = false,
  className = '',
}) => {
  const safeProgress = Math.min(Math.max(progress, 0), 100);
  
  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-5',
  };

  const trackStyles = {
    default: 'bg-[var(--surface-dark)] rounded-full',
    cartoon: 'bg-[var(--surface-dark)] rounded-full', // fallback
    rainbow: 'bg-[var(--surface-dark)] rounded-full', // fallback
  };

  const fillStyles = {
    default: color,
    cartoon: 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]', // fallback to gradient
    rainbow: 'bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]',
  };

  const milestones = [25, 50, 75, 100];

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-[var(--foreground)]">Progress</span>
          <span className="text-sm font-bold text-[var(--foreground)]">{Math.round(safeProgress)}%</span>
        </div>
      )}
      <div className={`relative w-full overflow-hidden ${heights[height]} ${trackStyles[variant]}`}>
        <motion.div
          className={`h-full rounded-full ${fillStyles[variant]} shadow-sm`}
          initial={{ width: 0 }}
          animate={{ width: `${safeProgress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      {/* Milestone flags */}
      {showMilestones && variant !== 'default' && (
        <div className="relative mt-2 h-4">
          {milestones.map((m) => (
            <div
              key={m}
              className="absolute -translate-x-1/2 flex justify-center items-center"
              style={{ left: `${m}%` }}
            >
              <div className={`w-2 h-2 rounded-full ${safeProgress >= m ? 'bg-primary' : 'bg-gray-300'}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
