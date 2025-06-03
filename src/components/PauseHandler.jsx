import React from 'react';

const PauseHandler = ({ 
  isPaused,
  theme, 
  onPause, 
  onResume, 
  onExit,
  settingImages
}) => {
  const handlePauseToggle = () => {
    if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  };

  return (
    <>
      {isPaused && (
        <div className="pause-overlay">
          <div className="pause-content">
            <h2>Tạm dừng</h2>
            <button
              className="control-button resume"
              onClick={onResume}
            >
              Tiếp tục
            </button>
            <button 
                className="control-button resign"
                onClick={onExit}>Thoát trận</button>
          </div>
        </div>
      )}

      <button
        className="btn position-absolute top-0 end-0 m-2 p-2"
        onClick={handlePauseToggle}
        style={{ width: '50px', height: '50px' }}
      >
        <img
          src={settingImages[theme]}
          alt="settings"
          style={{ width: '100%', height: '100%' }}
        />
      </button>
    </>
  );
};

export default PauseHandler;