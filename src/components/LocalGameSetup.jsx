import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TimerSettings from './TimerSettings';


const LocalGameSetup = () => {
  const navigate = useNavigate();
  const [playerColor, setPlayerColor] = useState('white');
  const [timerSettings, setTimerSettings] = useState({
    isEnabled: false,
    timerType: 'total',
    totalTime: 10,
    perMoveTime: 60
  });
  const handleStartGame = () => {
    navigate('/play-local', {
      state: {
        timerSettings
      }
    });
  };

  return (
    <div className="ai-setup">
      <h2>Thiết lập trận đấu</h2>

      <div className="timer-settings-section">
        <h4>Cài đặt đồng hồ</h4>
        <TimerSettings onSettingsChange={setTimerSettings} />
      </div>

      <button className="start-button" onClick={handleStartGame}>
        Bắt đầu
      </button>
    </div>
  );
};

export default LocalGameSetup; 
