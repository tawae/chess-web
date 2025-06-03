import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRoomCode } from '../utils/helpers';
import { db } from '../firebase';
import { ref, set, get, onValue } from 'firebase/database';
import { useAuth } from '../hooks/useAuth';
import TimerSettings from './TimerSettings';

console.log("Imported db object:", db);

const OnlineGameMenu = () => {
  const [joinCode, setJoinCode] = useState('');
  const [selectedColor, setSelectedColor] = useState('white');
  const [error, setError] = useState('');
  const [timerSettings, setTimerSettings] = useState({
    isEnabled: false,
    timerType: 'total',
    totalTime: 10,
    perMoveTime: 60
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    console.log('Using database with proper methods:', db);

    const gamesRef = ref(db, 'games');
    
    const unsubscribe = onValue(gamesRef, (snapshot) => {
      if (snapshot.exists()) {
        // Process data
        console.log(snapshot.val());
      }
    }, (error) => {
      console.error("Database read error:", error);
    });
    
    return () => unsubscribe();
  }, []);

  const createRoom = async () => {
    console.log("Using db object in createRoom:", db);
    const roomCode = generateRoomCode();
    const roomRef = ref(db, `rooms/${roomCode}`);
    
    await set(roomRef, {
      hostId: user.uid,
      hostName: user.displayName,
      hostColor: selectedColor,
      status: 'waiting',
      createdAt: Date.now(),
      moves: [],
      timerSettings,
      players: {
        [user.uid]: {
          name: user.displayName,
          color: selectedColor
        }
      }
    });

    navigate(`/online/room/${roomCode}`);
  };

  const joinRoom = async () => {
    if (!joinCode.trim()) {
      setError('Vui lòng nhập mã phòng');
      return;
    }

    const roomRef = ref(db, `rooms/${joinCode}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      setError('Phòng không tồn tại');
      return;
    }

    const roomData = snapshot.val();
    if (roomData.status !== 'waiting') {
      setError('Phòng đã đầy hoặc đã bắt đầu game');
      return;
    }

    const guestColor = roomData.hostColor === 'white' ? 'black' : 'white';
    
    await set(ref(db, `rooms/${joinCode}/players/${user.uid}`), {
      name: user.displayName,
      color: guestColor
    });

    await set(ref(db, `rooms/${joinCode}/status`), 'playing');
    
    navigate(`/online/room/${joinCode}`);
  };

  return (
    <div className="online-menu">
      <h2>Chế độ chơi Online</h2>
      
      <div className="create-room">
        <h3>Tạo phòng mới</h3>
        <div className="color-selection">
          <h4>Chọn màu quân:</h4>
          <div className="color-buttons">
            <button 
              className={selectedColor === 'white' ? 'selected' : ''}
              onClick={() => setSelectedColor('white')}
            >
              Quân Trắng ⚪
            </button>
            <button 
              className={selectedColor === 'black' ? 'selected' : ''}
              onClick={() => setSelectedColor('black')}
            >
              Quân Đen ⚫
            </button>
          </div>
        </div>

        <div className="timer-settings-section">
          <h4>Cài đặt đồng hồ</h4>
          <TimerSettings onSettingsChange={setTimerSettings} />
        </div>

        <button className="create-button" onClick={createRoom}>
          Tạo phòng mới
        </button>
      </div>

      <div className="join-room">
        <h3>Tham gia phòng</h3>
        <input
          type="text"
          placeholder="Nhập mã phòng"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={6}
        />
        {error && <div className="error-message">{error}</div>}
        <button className="join-button" onClick={joinRoom}>
          Vào phòng
        </button>
      </div>
    </div>
  );
};

export default OnlineGameMenu;