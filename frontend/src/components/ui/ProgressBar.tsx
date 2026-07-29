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
    default: 'bg-gray-200 rounded-full',
    cartoon: 'bg-sky-100 rounded-full border-2 border-sky-200',
    rainbow: 'bg-gray-100 rounded-full border-2 border-purple-200',
  };

  const fillStyles = {
    default: color,
    cartoon: 'bg-primary',
    rainbow: 'bg-secondary',
  };

  const milestones = [25, 50, 75, 100];

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-foreground">Progress</span>
          <span className="text-sm font-bold text-foreground">{Math.round(safeProgress)}%</span>
        </div>
      )}
      <div className={`relative w-full overflow-hidden ${heights[height]} ${trackStyles[variant]}`}>
        <motion.div
          className={`h-full rounded-full ${fillStyles[variant]}`}
          initial={{ width: 0 }}
          animate={{ width: `${safeProgress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {/* Star endpoint for cartoon variant */}
        {variant === 'cartoon' && safeProgress > 5 && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-sm"
            initial={{ left: '0%' }}
            animate={{ left: `${safeProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        )}
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
