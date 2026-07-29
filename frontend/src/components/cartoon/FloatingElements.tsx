'use client';

import React from 'react';

export const FloatingClouds: React.FC<{ count?: number; className?: string }> = ({ count = 5, className = '' }) => {
  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden z-0 ${className}`}>
      <style>{`
        @keyframes float-cloud {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-20vw); }
        }
      `}</style>
      {[...Array(count)].map((_, i) => {
        const top = 5 + Math.random() * 30; // 5% to 35%
        const duration = 20 + Math.random() * 20; // 20s to 40s
        const delay = Math.random() * -30; // Random negative delay to start mid-screen
        const scale = 0.5 + Math.random() * 1;
        const opacity = 0.4 + Math.random() * 0.4;

        return (
          <div
            key={i}
            className="absolute text-white"
            style={{
              top: `${top}%`,
              left: 0,
              opacity,
              transform: `scale(${scale})`,
              animation: `float-cloud ${duration}s linear ${delay}s infinite`
            }}
          >
            <svg width="100" height="60" viewBox="0 0 100 60" fill="currentColor">
              <path d="M 20 40 Q 10 40 10 30 Q 10 20 25 20 Q 30 10 45 10 Q 60 10 65 20 Q 80 15 85 25 Q 90 35 85 45 Q 85 55 65 55 L 30 55 Q 20 55 20 40 Z" />
            </svg>
          </div>
        );
      })}
    </div>
  );
};

export const FloatingSparkles: React.FC<{ count?: number; className?: string }> = ({ count = 15, className = '' }) => {
  return (
    <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(45deg); }
        }
      `}</style>
      {[...Array(count)].map((_, i) => {
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const duration = 2 + Math.random() * 4;
        const delay = Math.random() * 5;
        const size = 10 + Math.random() * 15;

        return (
          <div
            key={i}
            className="absolute text-yellow-300"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: size,
              height: size,
              animation: `twinkle ${duration}s ease-in-out ${delay}s infinite`
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-[0_0_5px_rgba(253,224,71,0.8)]">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
          </div>
        );
      })}
    </div>
  );
};

export const FloatingBubbles: React.FC<{ count?: number; className?: string }> = ({ count = 20, className = '' }) => {
  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden z-0 ${className}`}>
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(110vh) scale(0.8); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-10vh) scale(1.2); opacity: 0; }
        }
      `}</style>
      {[...Array(count)].map((_, i) => {
        const left = Math.random() * 100;
        const duration = 10 + Math.random() * 15;
        const delay = Math.random() * -15;
        const size = 10 + Math.random() * 40;

        return (
          <div
            key={i}
            className="absolute rounded-full border border-white/40 bg-white/10 backdrop-blur-[1px]"
            style={{
              left: `${left}%`,
              bottom: 0,
              width: size,
              height: size,
              animation: `float-up ${duration}s linear ${delay}s infinite`,
              boxShadow: 'inset 0 0 10px rgba(255,255,255,0.2)'
            }}
          >
            <div className="absolute top-[15%] left-[15%] w-[30%] h-[30%] rounded-full bg-white/40 rotate-[-45deg]" />
          </div>
        );
      })}
    </div>
  );
};
