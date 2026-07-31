import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends Omit<HTMLMotionProps<"div">, 'ref'> {
  variant?: 'default' | 'outlined' | 'elevated' | 'glass' | 'cartoon' | 'achievement';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', padding = 'md', hoverEffect = false, children, ...props }, ref) => {
    
    const baseStyles = "rounded-xl overflow-hidden";
    
    const variants = {
      default: "bg-[var(--surface)] border border-[var(--surface-dark)] shadow-sm",
      outlined: "bg-transparent border border-[var(--surface-dark)]",
      elevated: "bg-[var(--surface)] shadow-md border border-[var(--surface-dark)]",
      glass: "glass-card",
      cartoon: "premium-card", // fallback
      achievement: "bg-[var(--secondary)]/10 border border-[var(--secondary)] shadow-sm",
    };
    
    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };
    
    const hoverStyles = hoverEffect ? "transition-all duration-300 hover:shadow-lg hover:-translate-y-1" : "";
    
    return (
      <motion.div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';
