import { useState, useEffect, useCallback } from 'react';

export const useTimer = (totalSeconds: number, onExpire?: () => void) => {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setTimeLeft(totalSeconds);
    setIsRunning(true);
  }, [totalSeconds]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (onExpire) {
        onExpire();
      }
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, timeLeft, onExpire]);

  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => setIsRunning(true), []);
  const reset = useCallback(() => {
    setTimeLeft(totalSeconds);
    setIsRunning(false);
  }, [totalSeconds]);

  const m = Math.floor(timeLeft / 60);
  const s = Math.floor(timeLeft % 60);
  const formattedTime = `${m}:${s.toString().padStart(2, '0')}`;

  return {
    timeLeft,
    isExpired: timeLeft === 0,
    formattedTime,
    isWarning: timeLeft > 0 && timeLeft <= 60,
    isCritical: timeLeft > 0 && timeLeft <= 30,
    pause,
    resume,
    reset,
    isRunning,
  };
};
