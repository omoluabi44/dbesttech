'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CartoonFoxProps {
  mood: 'idle' | 'thinking' | 'happy' | 'sad' | 'celebrating' | 'encouraging' | 'waving';
  size?: 'sm' | 'md' | 'lg';
  speechBubble?: string;
  className?: string;
}

const sizes = {
  sm: 64,
  md: 120,
  lg: 180,
};

export const CartoonFox: React.FC<CartoonFoxProps> = ({
  mood,
  size = 'md',
  speechBubble,
  className = '',
}) => {
  const s = sizes[size];

  // Define animations based on mood
  const getFoxAnimation = () => {
    switch (mood) {
      case 'happy':
        return { y: [0, -20, 0], transition: { repeat: Infinity, duration: 0.6 } };
      case 'sad':
        return { scale: 0.9, y: 10, transition: { duration: 0.5 } };
      case 'celebrating':
        return { y: [0, -30, 0], rotate: [0, -10, 10, 0], transition: { repeat: Infinity, duration: 0.8 } };
      case 'waving':
        return { y: [0, -5, 0], transition: { repeat: Infinity, duration: 1 } };
      case 'idle':
      default:
        return { y: [0, -10, 0], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" as const } };
    }
  };

  const getArmAnimation = () => {
    if (mood === 'waving') {
      return { rotate: [0, 45, -20, 45, 0], transformOrigin: 'top left', transition: { repeat: Infinity, duration: 1.5 } };
    }
    if (mood === 'celebrating') {
      return { y: -20, rotate: 180, transition: { duration: 0.3 } };
    }
    if (mood === 'encouraging') {
      return { rotate: -45, transition: { duration: 0.3 } };
    }
    return { rotate: 0 };
  };

  const getTailAnimation = () => {
    if (mood === 'sad') {
      return { rotate: 45, transformOrigin: 'bottom right', transition: { duration: 0.5 } };
    }
    const speed = mood === 'happy' || mood === 'celebrating' ? 0.3 : 1.5;
    return { rotate: [0, -20, 0], transformOrigin: 'bottom right', transition: { repeat: Infinity, duration: speed } };
  };

  return (
    <div className={`relative inline-flex flex-col items-center justify-end ${className}`} style={{ width: s, height: s * 1.2 }}>
      <AnimatePresence>
        {speechBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 10 }}
            className="absolute z-10 bg-white border-4 border-gray-200 rounded-3xl p-3 text-center shadow-lg"
            style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', minWidth: '120px', marginBottom: '10px' }}
          >
            <p className="text-gray-800 font-bold text-sm whitespace-pre-wrap">{speechBubble}</p>
            <div className="absolute w-4 h-4 bg-white border-b-4 border-r-4 border-gray-200 transform rotate-45 -bottom-2 left-1/2 -translate-x-1/2"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {(mood === 'happy' || mood === 'celebrating') && (
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="absolute inset-0 pointer-events-none"
        >
          {[0, 90, 180, 270].map((deg, i) => (
            <motion.div 
              key={i}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
              className="absolute w-3 h-3 bg-yellow-400 rotate-45"
              style={{ top: '10%', left: '45%', transformOrigin: `0 ${s * 0.4}px`, rotate: deg }}
            />
          ))}
        </motion.div>
      )}

      {mood === 'thinking' && (
        <motion.div
          animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute z-10 text-4xl font-bold text-orange-500"
          style={{ top: -20, right: 0 }}
        >
          ?
        </motion.div>
      )}

      <motion.div
        animate={getFoxAnimation()}
        className="relative"
        style={{ width: s, height: s }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {/* Tail */}
          <motion.path
            d="M 80 70 Q 110 50 100 80 Q 90 95 70 85 Z"
            fill="#ea580c"
            stroke="#9a3412"
            strokeWidth="2"
            animate={getTailAnimation()}
          />
          <motion.path
            d="M 100 80 Q 95 90 85 85 Q 90 75 100 80 Z"
            fill="#ffffff"
            animate={getTailAnimation()}
          />
          
          {/* Body */}
          <path d="M 30 90 Q 50 100 70 90 L 65 50 Q 50 40 35 50 Z" fill="#ea580c" stroke="#9a3412" strokeWidth="2" />
          <path d="M 40 90 Q 50 95 60 90 L 55 60 Q 50 55 45 60 Z" fill="#ffffff" />

          {/* Left Arm */}
          <motion.path
            d="M 35 60 Q 20 70 25 80"
            fill="none"
            stroke="#ea580c"
            strokeWidth="8"
            strokeLinecap="round"
            style={{ transformOrigin: '35px 60px' }}
            animate={getArmAnimation()}
          />

          {/* Right Arm */}
          <path d="M 65 60 Q 80 70 75 80" fill="none" stroke="#ea580c" strokeWidth="8" strokeLinecap="round" />

          {/* Head */}
          {mood === 'thinking' ? (
            <motion.g animate={{ rotate: 15 }} style={{ transformOrigin: '50px 50px' }}>
              <path d="M 20 20 L 35 45 L 65 45 L 80 20 L 65 65 L 35 65 Z" fill="#ea580c" stroke="#9a3412" strokeWidth="2" />
              <path d="M 35 45 Q 50 70 65 45 Z" fill="#ffffff" />
              <path d="M 25 25 L 35 40 Z M 75 25 L 65 40 Z" fill="none" stroke="#9a3412" strokeWidth="2" />
              <circle cx="40" cy="50" r="4" fill="#000000" />
              <circle cx="60" cy="50" r="4" fill="#000000" />
              <circle cx="50" cy="60" r="3" fill="#000000" />
            </motion.g>
          ) : (
            <g>
              <path d="M 20 20 L 35 45 L 65 45 L 80 20 L 65 65 L 35 65 Z" fill="#ea580c" stroke="#9a3412" strokeWidth="2" />
              <path d="M 35 45 Q 50 70 65 45 Z" fill="#ffffff" />
              <path d="M 25 25 L 35 40 Z M 75 25 L 65 40 Z" fill="none" stroke="#9a3412" strokeWidth="2" />
              
              {/* Eyes based on mood */}
              {mood === 'happy' || mood === 'celebrating' ? (
                <>
                  <path d="M 35 50 Q 40 45 45 50" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
                  <path d="M 55 50 Q 60 45 65 50" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
                </>
              ) : mood === 'sad' ? (
                <>
                  <path d="M 35 48 Q 40 45 45 52" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
                  <path d="M 55 52 Q 60 45 65 48" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="40" cy="50" r="4" fill="#000000" />
                  <circle cx="41" cy="49" r="1.5" fill="#ffffff" />
                  <circle cx="60" cy="50" r="4" fill="#000000" />
                  <circle cx="61" cy="49" r="1.5" fill="#ffffff" />
                </>
              )}
              
              <circle cx="50" cy="60" r="3" fill="#000000" />
              {mood === 'happy' || mood === 'celebrating' || mood === 'encouraging' ? (
                <path d="M 45 65 Q 50 70 55 65" fill="none" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" />
              ) : mood === 'sad' ? (
                <path d="M 45 68 Q 50 63 55 68" fill="none" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" />
              ) : null}
            </g>
          )}
        </svg>
      </motion.div>
    </div>
  );
};
