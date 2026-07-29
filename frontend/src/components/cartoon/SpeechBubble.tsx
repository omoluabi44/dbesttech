'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SpeechBubbleProps {
  text: string;
  variant?: 'cloud' | 'shout' | 'whisper';
  position?: 'above' | 'right' | 'left';
  typewriter?: boolean;
  className?: string;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  text,
  variant = 'cloud',
  position = 'above',
  typewriter = false,
  className = ''
}) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!typewriter) {
      setDisplayedText(text);
      return;
    }

    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [text, typewriter]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'shout':
        return 'bg-yellow-300 border-4 border-red-500 rounded-none shadow-[4px_4px_0px_#ef4444] text-red-900 font-bold';
      case 'whisper':
        return 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-3xl text-blue-600 font-light';
      case 'cloud':
      default:
        return 'bg-white border-4 border-gray-200 rounded-3xl text-gray-800 font-bold shadow-lg';
    }
  };

  const getTailPosition = () => {
    switch (position) {
      case 'right':
        return 'absolute w-4 h-4 transform rotate-45 -left-2 top-1/2 -translate-y-1/2';
      case 'left':
        return 'absolute w-4 h-4 transform rotate-45 -right-2 top-1/2 -translate-y-1/2';
      case 'above':
      default:
        return 'absolute w-4 h-4 transform rotate-45 -bottom-2 left-1/2 -translate-x-1/2';
    }
  };

  const getTailBorder = () => {
    switch (variant) {
      case 'shout': return 'bg-yellow-300 border-b-4 border-r-4 border-red-500';
      case 'whisper': return 'bg-blue-50 border-b-2 border-r-2 border-dashed border-blue-300';
      case 'cloud':
      default: return 'bg-white border-b-4 border-r-4 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className={`relative inline-block p-4 min-w-[120px] text-center z-10 ${getVariantStyles()} ${className}`}
    >
      <div className={`
        ${getTailPosition()}
        ${getTailBorder()}
      `} />
      
      {/* Cloud bumps for cloud variant */}
      {variant === 'cloud' && (
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-3 left-4 w-6 h-6 bg-white border-t-4 border-l-4 border-gray-200 rounded-full" />
          <div className="absolute -top-4 right-6 w-8 h-8 bg-white border-t-4 border-r-4 border-gray-200 rounded-full" />
          <div className="absolute -bottom-3 right-4 w-6 h-6 bg-white border-b-4 border-r-4 border-gray-200 rounded-full" />
        </div>
      )}

      {/* Spikes for shout variant */}
      {variant === 'shout' && (
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-3 left-0 w-4 h-4 bg-yellow-300 border-t-4 border-l-4 border-red-500 rotate-45" />
          <div className="absolute -top-2 right-4 w-6 h-6 bg-yellow-300 border-t-4 border-r-4 border-red-500 rotate-12" />
          <div className="absolute top-1/2 -left-3 w-4 h-4 bg-yellow-300 border-t-4 border-l-4 border-red-500 -rotate-45" />
          <div className="absolute -bottom-2 right-2 w-5 h-5 bg-yellow-300 border-b-4 border-r-4 border-red-500 rotate-45" />
        </div>
      )}

      <p className="relative z-10 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-comic">
        {displayedText}
        {typewriter && displayedText.length < text.length && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
            className="inline-block w-1 h-4 ml-1 bg-current align-middle"
          />
        )}
      </p>
    </motion.div>
  );
};
