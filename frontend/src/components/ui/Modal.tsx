import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showCloseButton?: boolean;
  variant?: 'default' | 'celebration';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  showCloseButton = true,
  variant = 'default',
}) => {
  
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const maxWClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full mx-4',
  };

  const isCelebration = variant === 'celebration';

  const modalAnimation = isCelebration
    ? {
        initial: { opacity: 0, scale: 0.5, rotate: -10 },
        animate: { opacity: 1, scale: 1, rotate: 0 },
        exit: { opacity: 0, scale: 0.5, rotate: 10 },
        transition: { type: "spring" as const, duration: 0.6, bounce: 0.5 },
      }
    : {
        initial: { opacity: 0, scale: 0.95, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 20 },
        transition: { type: "spring" as const, duration: 0.5, bounce: 0.3 },
      };

  const containerStyles = isCelebration
    ? `relative w-full ${maxWClasses[maxWidth]} bg-surface rounded-3xl shadow-2xl border-4 border-secondary overflow-hidden flex flex-col max-h-[90vh]`
    : `relative w-full ${maxWClasses[maxWidth]} bg-surface rounded-3xl shadow-2xl border-4 border-sky-100 overflow-hidden flex flex-col max-h-[90vh]`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`absolute inset-0 ${isCelebration ? 'bg-indigo-950/50' : 'bg-slate-900/40'} backdrop-blur-sm`}
          />
          
          <motion.div
            {...modalAnimation}
            className={containerStyles}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Celebration decorations */}
            {isCelebration && (
              <>
                <div className="absolute top-0 left-0 w-32 h-32 bg-secondary/10 rounded-full -ml-16 -mt-16 pointer-events-none" />
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-12 -mt-12 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-accent/10 rounded-full -ml-10 -mb-10 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-28 h-28 bg-primary/10 rounded-full -mr-14 -mb-14 pointer-events-none" />
              </>
            )}

            {(title || showCloseButton) && (
              <div className={`flex items-center justify-between px-6 py-4 ${isCelebration ? 'border-b-4 border-yellow-100' : 'border-b-4 border-sky-50'}`}>
                {title && <h2 className={`text-2xl font-extrabold ${isCelebration ? 'text-yellow-700' : 'text-sky-900'}`}>{title}</h2>}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 ml-auto rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            
            <div className="p-6 overflow-y-auto relative z-10">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
