"use client";
import React, { forwardRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    
    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              flex h-14 w-full rounded-2xl border-4 bg-surface px-4 py-3 text-base font-bold text-foreground
              placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-primary focus:border-transparent
              disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-sm
              ${error ? 'border-danger focus:ring-danger bg-red-50' : 'border-sky-100 hover:border-sky-300'}
              ${leftIcon ? 'pl-12' : ''}
              ${rightIcon ? 'pr-12' : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-danger mt-1 animate-pop-in">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
