import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends Omit<HTMLMotionProps<"div">, 'ref'> {
  variant?: 'default' | 'outlined' | 'elevated' | 'glass' | 'cartoon' | 'achievement';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', padding = 'md', hoverEffect = false, children, ...props }, ref) => {
    
    const baseStyles = "rounded-3xl overflow-hidden";
    
    const variants = {
      default: "bg-surface border-4 border-surface-dark shadow-sm",
      outlined: "bg-transparent border-4 border-surface-dark",
      elevated: "bg-surface shadow-xl border-4 border-surface-dark",
      glass: "glass-card",
      cartoon: "bg-white border-4 border-sky-200 shadow-cartoon hover:shadow-cartoon-lg transition-all duration-200 hover:-translate-y-1",
      achievement: "bg-secondary/10 border-4 border-secondary shadow-sm",
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
