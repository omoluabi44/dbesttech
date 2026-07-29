'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CartoonOwlProps {
  mood: 'proud' | 'concerned' | 'celebrating' | 'pointing';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 64,
  md: 120,
  lg: 180,
};

export const CartoonOwl: React.FC<CartoonOwlProps> = ({
  mood,
  size = 'md',
  className = '',
}) => {
  const s = sizes[size];

  const getOwlAnimation = () => {
    switch (mood) {
      case 'proud':
        return { scale: [1, 1.05, 1], y: [0, -5, 0], transition: { repeat: Infinity, duration: 2 } };
      case 'concerned':
        return { rotate: [0, -5, 0, 5, 0], transition: { repeat: Infinity, duration: 3 } };
      case 'celebrating':
        return { y: [0, -20, 0], transition: { repeat: Infinity, duration: 0.5 } };
      case 'pointing':
      default:
        return { y: [0, -2, 0], transition: { repeat: Infinity, duration: 2 } };
    }
  };

  const getLeftWing = () => {
    if (mood === 'celebrating') {
      return { rotate: 120, y: -10, transition: { repeat: Infinity, duration: 0.5, repeatType: "reverse" as const } };
    }
    if (mood === 'concerned') {
      return { rotate: 45, x: 10, y: -10 };
    }
    if (mood === 'pointing') {
      return { rotate: 90, x: -10, y: -10 };
    }
    return { rotate: 0 };
  };

  const getRightWing = () => {
    if (mood === 'celebrating') {
      return { rotate: -120, y: -10, transition: { repeat: Infinity, duration: 0.5, repeatType: "reverse" as const } };
    }
    return { rotate: 0 };
  };

  return (
    <div className={`relative inline-flex flex-col items-center justify-end ${className}`} style={{ width: s, height: s }}>
      {mood === 'celebrating' && (
        <motion.div className="absolute inset-0 z-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: 50, x: 50, opacity: 1, scale: 0 }}
              animate={{ y: Math.random() * -100 - 20, x: Math.random() * 100, opacity: 0, scale: Math.random() * 2 + 1 }}
              transition={{ repeat: Infinity, duration: 1.5, delay: Math.random() }}
              className={`absolute w-2 h-2 rounded-full ${['bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400'][i % 4]}`}
              style={{ left: '50%', top: '50%' }}
            />
          ))}
        </motion.div>
      )}

      {mood === 'proud' && (
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          className="absolute inset-0 pointer-events-none opacity-50"
        >
          <div className="w-full h-full border-4 border-dashed border-yellow-300 rounded-full scale-125" />
        </motion.div>
      )}

      <motion.div animate={getOwlAnimation()} className="relative z-10 w-full h-full">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {/* Feet */}
          <path d="M 40 90 L 35 95 L 45 95 Z" fill="#f59e0b" />
          <path d="M 60 90 L 55 95 L 65 95 Z" fill="#f59e0b" />

          {/* Left Wing */}
          <motion.path
            d="M 25 50 Q 10 65 25 80 Z"
            fill="#8b5cf6"
            stroke="#5b21b6"
            strokeWidth="2"
            style={{ transformOrigin: '25px 50px' }}
            animate={getLeftWing()}
          />

          {/* Right Wing */}
          <motion.path
            d="M 75 50 Q 90 65 75 80 Z"
            fill="#8b5cf6"
            stroke="#5b21b6"
            strokeWidth="2"
            style={{ transformOrigin: '75px 50px' }}
            animate={getRightWing()}
          />

          {/* Body/Head */}
          <path d="M 25 40 Q 25 10 50 10 Q 75 10 75 40 L 80 70 Q 80 90 50 90 Q 20 90 20 70 Z" fill="#a78bfa" stroke="#5b21b6" strokeWidth="2" />
          <path d="M 35 45 Q 50 40 65 45 Q 70 85 50 85 Q 30 85 35 45 Z" fill="#ddd6fe" />

          {/* Graduation Cap */}
          <path d="M 35 15 L 50 5 L 65 15 L 50 25 Z" fill="#1e1b4b" />
          <path d="M 40 18 L 40 28 Q 50 32 60 28 L 60 18 Z" fill="#1e1b4b" />
          <path d="M 50 20 L 70 30 L 70 40" fill="none" stroke="#fcd34d" strokeWidth="2" />
          <circle cx="70" cy="40" r="3" fill="#fcd34d" />

          {/* Glasses */}
          <circle cx="40" cy="45" r="12" fill="none" stroke="#1e1b4b" strokeWidth="3" />
          <circle cx="60" cy="45" r="12" fill="none" stroke="#1e1b4b" strokeWidth="3" />
          <path d="M 52 45 L 48 45" stroke="#1e1b4b" strokeWidth="3" />

          {/* Eyes */}
          {mood === 'celebrating' || mood === 'proud' ? (
            <>
              <path d="M 35 45 Q 40 40 45 45" fill="none" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 55 45 Q 60 40 65 45" fill="none" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : mood === 'concerned' ? (
            <>
              <circle cx="42" cy="45" r="3" fill="#1e1b4b" />
              <circle cx="58" cy="45" r="3" fill="#1e1b4b" />
              <path d="M 33 37 Q 40 33 47 38" fill="none" stroke="#1e1b4b" strokeWidth="2" />
              <path d="M 67 37 Q 60 33 53 38" fill="none" stroke="#1e1b4b" strokeWidth="2" />
            </>
          ) : (
            <>
              <circle cx="40" cy="45" r="4" fill="#1e1b4b" />
              <circle cx="60" cy="45" r="4" fill="#1e1b4b" />
              <circle cx="41" cy="44" r="1.5" fill="#ffffff" />
              <circle cx="61" cy="44" r="1.5" fill="#ffffff" />
            </>
          )}

          {/* Beak */}
          <path d="M 45 55 L 55 55 L 50 65 Z" fill="#f59e0b" />
          
          {/* Feathers */}
          <path d="M 45 75 Q 50 78 55 75" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
          <path d="M 40 80 Q 50 85 60 80" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </motion.div>
    </div>
  );
};
