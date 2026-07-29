'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const StarBurst: React.FC<{ trigger: boolean; className?: string }> = ({ trigger, className = '' }) => {
  const [bursts, setBursts] = useState<number>(0);

  useEffect(() => {
    if (trigger) {
      setBursts(b => b + 1);
    }
  }, [trigger]);

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {bursts > 0 && [...Array(8)].map((_, i) => (
          <motion.div
            key={`${bursts}-${i}`}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ 
              scale: [0, 1.5, 0], 
              x: Math.cos(i * Math.PI / 4) * 100, 
              y: Math.sin(i * Math.PI / 4) * 100,
              opacity: [1, 1, 0],
              rotate: 180
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 -ml-3 -mt-3 text-yellow-400"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const StarCounter: React.FC<{ count: number; className?: string }> = ({ count, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 bg-yellow-100 rounded-full px-4 py-2 border-2 border-yellow-400 shadow-sm ${className}`}>
      <motion.div
        key={count}
        initial={{ scale: 1.5, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 10 }}
        className="text-yellow-500"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </motion.div>
      <motion.span 
        key={`text-${count}`}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-xl font-bold text-yellow-700 font-comic"
      >
        {count}
      </motion.span>
    </div>
  );
};

export const StarRating: React.FC<{ rating: number; maxStars?: number; size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  rating, 
  maxStars = 5, 
  size = 'md',
  className = '' 
}) => {
  const sizeMap = { sm: 24, md: 36, lg: 48 };
  const s = sizeMap[size];

  return (
    <div className={`flex gap-1 ${className}`}>
      {[...Array(maxStars)].map((_, i) => (
        <div key={i} className="relative" style={{ width: s, height: s }}>
          {/* Empty star outline */}
          <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" className="absolute top-0 left-0">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
          </svg>
          
          {/* Filled star with animation */}
          {i < rating && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 12,
                delay: i * 0.15 
              }}
              className="absolute top-0 left-0 text-yellow-400 drop-shadow-md"
            >
              <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
};
