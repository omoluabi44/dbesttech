import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'ref'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'cartoon' | 'gameAction';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary: "bg-[var(--primary)] text-white border border-[var(--primary-dark)] hover:bg-[var(--primary-hover)] focus:ring-[var(--primary)] shadow-sm hover:shadow active:translate-y-[1px]",
      secondary: "bg-[var(--surface-dark)] text-[var(--foreground)] border border-gray-200 hover:bg-gray-100 focus:ring-gray-200 shadow-sm hover:shadow active:translate-y-[1px]",
      ghost: "bg-transparent text-[var(--foreground)] border-transparent hover:bg-[var(--surface-dark)] focus:ring-[var(--surface-dark)]",
      danger: "bg-red-600 text-white border-red-700 hover:bg-red-700 focus:ring-red-600 shadow-sm hover:shadow active:translate-y-[1px]",
      cartoon: "bg-[var(--primary)] text-white border border-[var(--primary-dark)] hover:bg-[var(--primary-hover)] focus:ring-[var(--primary)] shadow-sm hover:shadow active:translate-y-[1px]", // fallback
      gameAction: "bg-[var(--primary)] text-white border border-[var(--primary-dark)] hover:bg-[var(--primary-hover)] focus:ring-[var(--primary)] shadow-sm hover:shadow active:translate-y-[1px]", // fallback
    };
    
    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: "h-9 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-11 px-8 text-base",
    };

    const motionProps = {
      whileTap: { scale: disabled || isLoading ? 1 : 0.97 },
    };
    
    return (
      <motion.button
        ref={ref}
        {...motionProps}
        className={`${baseStyles} ${variants[variant as keyof typeof variants]} ${sizes[size as keyof typeof sizes]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        
        {children as React.ReactNode}
        
        {!isLoading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
