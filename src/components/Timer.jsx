import React, { useState, useEffect } from 'react';

const Timer = ({ initialTime, isActive, onTimeUp, timerType, onMoveComplete }) => {
  const [time, setTime] = useState(initialTime);
  const [previousIsActive, setPreviousIsActive] = useState(false);

  // Reset timer when initialTime prop changes
  useEffect(() => {
    setTime(initialTime);
  }, [initialTime]);

  // Handle timer logic
  useEffect(() => {
    let interval = null;
    
    // When switching from inactive to active, trigger onMoveComplete
    if (isActive && !previousIsActive && timerType === 'perMove') {
      // Only reset on move change for per-move timer type
      setTime(initialTime);
      if (onMoveComplete) onMoveComplete();
    }
    
    setPreviousIsActive(isActive);

    if (isActive) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval);
            if (onTimeUp) setTimeout(onTimeUp, 0); // Call with slight delay to avoid state update issues
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, onTimeUp, initialTime, timerType, onMoveComplete, previousIsActive]);

  // Format time for display
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = (time / initialTime) * 100;
  const progressColor = progressPercentage > 50 
    ? '#4CAF50' 
    : progressPercentage > 20 
      ? '#FFA500' 
      : '#FF0000';

  return (
    <div className="timer">
      <div className="timer-display">{formatTime(time)}</div>
      <div className="timer-progress">
        <div 
          className="timer-progress-bar"
          style={{ 
            width: `${progressPercentage}%`,
            backgroundColor: progressColor
          }}
        ></div>
      </div>
    </div>
  );
};

export default Timer;