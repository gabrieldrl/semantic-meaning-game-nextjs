import { useEffect, useState } from 'react';

interface Props {
  duration: number;
  onTimeUp: () => void;
  isActive: boolean;
  shouldReset: boolean;  // Add this prop
}

export const Timer = ({ duration, onTimeUp, isActive, shouldReset }: Props) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (shouldReset) {
      setTimeLeft(duration);
    }
  }, [shouldReset, duration]);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, onTimeUp]);

  return (
    <div className={`text-2xl font-bold ${timeLeft < 6 ? 'text-red-600 animate-pulse' : 'text-gray-600'}`}>
      Time Left: {timeLeft}s
    </div>
  );
};