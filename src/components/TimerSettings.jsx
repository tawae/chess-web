import React, { useState, useEffect } from 'react';

const TimerSettings = ({ onSettingsChange }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [timerType, setTimerType] = useState('total'); // 'total' hoặc 'perMove'
  const [totalTime, setTotalTime] = useState(10); // phút
  const [perMoveTime, setPerMoveTime] = useState(60); // giây

  // Update parent component whenever settings change
  useEffect(() => {
    handleSettingsChange();
  }, [isEnabled, timerType, totalTime, perMoveTime]);

  const handleSettingsChange = () => {
    onSettingsChange({
      isEnabled,
      timerType,
      totalTime: parseFloat(totalTime),
      perMoveTime: parseFloat(perMoveTime)
    });
  };

  return (
    <div className="timer-settings">
      <div className="timer-toggle">
        <label>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => {
              setIsEnabled(e.target.checked);
            }}
          />
          Bật đồng hồ đếm ngược
        </label>
      </div>

      {isEnabled && (
        <div className="timer-options">
          <div className="timer-type">
            <label>
              <input
                type="radio"
                value="total"
                checked={timerType === 'total'}
                onChange={(e) => {
                  setTimerType(e.target.value);
                }}
              />
              Tổng thời gian
            </label>
            <label>
              <input
                type="radio"
                value="perMove"
                checked={timerType === 'perMove'}
                onChange={(e) => {
                  setTimerType(e.target.value);
                }}
              />
              Thời gian mỗi nước
            </label>
          </div>

          {timerType === 'total' ? (
            <div className="total-time-setting">
              <label>
                Tổng thời gian (phút):
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={totalTime}
                  onChange={(e) => {
                    setTotalTime(e.target.value);
                  }}
                />
              </label>
            </div>
          ) : (
            <div className="per-move-time-setting">
              <label>
                Thời gian mỗi nước (giây):
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={perMoveTime}
                  onChange={(e) => {
                    setPerMoveTime(e.target.value);
                  }}
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimerSettings;