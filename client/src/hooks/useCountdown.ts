import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCountdownReturn {
  timeLeft: number;
  formattedTime: string;
  isActive: boolean;
  start: (seconds: number) => void;
  reset: () => void;
}

export const useCountdown = (): UseCountdownReturn => {
  const [timeLeft, setTimeLeft] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeLeft]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const start = useCallback((seconds: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimeLeft(seconds);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimeLeft(0);
  }, []);

  return {
    timeLeft,
    formattedTime: formatTime(timeLeft),
    isActive: timeLeft > 0,
    start,
    reset,
  };
};

