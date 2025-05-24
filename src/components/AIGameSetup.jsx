import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TimerSettings from './TimerSettings';


const AIGameSetup = () => {
  const navigate = useNavigate();
  const [playerColor, setPlayerColor] = useState('white');
  const [difficulty, setDifficulty] = useState('normal');
  const [timerSettings, setTimerSettings] = useState({
    isEnabled: false,
    timerType: 'total',
    totalTime: 10,
    perMoveTime: 60
  });

  const handleStartGame = () => {
    navigate('/play-ai', {
      state: {
        playerColor,
        difficulty,
        timerSettings
      }
    });
  };

  return (
    <div className="ai-setup">
      <h2>Thiết lập trận đấu với AI</h2>

      <div className="color-selection">
        <h3>Chọn quân cờ</h3>
        <div className="color-buttons">
          <button
            className={playerColor === 'white' ? 'selected' : ''}
            onClick={() => setPlayerColor('white')}
          >
            Trắng ⚪
          </button>
          <button
            className={playerColor === 'black' ? 'selected' : ''}
            onClick={() => setPlayerColor('black')}
          >
            Đen ⚫
          </button>
        </div>
      </div>

      <div className="difficulty-selection">
        <h3 class="setup-title">Chọn độ khó</h3>
        <div className="difficulty-buttons">
          <button
            className={difficulty === 'easy' ? 'selected' : ''}
            onClick={() => setDifficulty('easy')}
          >
            Dễ
          </button>
          <button
            className={difficulty === 'normal' ? 'selected' : ''}
            onClick={() => setDifficulty('normal')}
          >
            Trung bình
          </button>
          <button
            className={difficulty === 'hard' ? 'selected' : ''}
            onClick={() => setDifficulty('hard')}
          >
            Khó
          </button>
        </div>
      </div>

      <div className="timer-settings-section">
        <h3 class="setup-title">Cài đặt đồng hồ</h3>
        <TimerSettings onSettingsChange={setTimerSettings} />
      </div>

      <button className="start-button" onClick={handleStartGame}>
        Bắt đầu
      </button>
    </div>
  );
};

export default AIGameSetup; 
