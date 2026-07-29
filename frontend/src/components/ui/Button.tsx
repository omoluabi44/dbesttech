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
    
    const baseStyles = "inline-flex items-center justify-center font-extrabold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-primary text-white border-primary-dark hover:bg-primary-hover focus:ring-primary active:translate-y-1 active:border-b-0 border-b-4",
      secondary: "bg-secondary text-secondary-900 border-yellow-500 hover:bg-secondary-hover focus:ring-secondary active:translate-y-1 active:border-b-0 border-b-4",
      ghost: "bg-transparent text-foreground border-transparent border-b-0 hover:bg-surface-dark focus:ring-surface-dark",
      danger: "bg-danger text-white border-red-700 hover:bg-red-600 focus:ring-danger active:translate-y-1 active:border-b-0 border-b-4",
      cartoon: "bg-primary text-white border-primary-dark hover:bg-primary-hover focus:ring-primary active:translate-y-1 active:border-b-0 border-b-[6px] rounded-full shadow-cartoon hover:shadow-cartoon-lg",
      gameAction: "bg-secondary text-secondary-900 border-secondary-hover hover:bg-secondary focus:ring-secondary active:translate-y-1 active:border-b-0 border-b-[6px] rounded-full shadow-cartoon-lg text-xl tracking-wide",
    };
    
    const sizes = {
      sm: "h-10 px-4 text-sm",
      md: "h-12 px-6 text-base",
      lg: "h-16 px-8 text-xl",
    };

    const motionProps = (variant === 'cartoon' || variant === 'gameAction') ? {
      whileHover: disabled || isLoading ? {} : { scale: 1.05 },
      whileTap: disabled || isLoading ? {} : { scale: 0.95 },
    } : {
      whileTap: { scale: disabled || isLoading ? 1 : 0.95 },
    };
    
    return (
      <motion.button
        ref={ref}
        {...motionProps}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
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
