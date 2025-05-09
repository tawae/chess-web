// GameExitHandler.jsx
import React, { useEffect, useCallback } from "react";
import { useNavigate, useLocation, useBeforeUnload } from "react-router-dom";

export default function GameExitHandler({
  isGameActive,
  message = "Bạn sẽ bị xử thua nếu rời khỏi ván đấu. Rời đi?",
  onExitConfirm = () => {},
  notifyOpponent = () => {},
  gameEnded = false // Thêm prop để kiểm tra xem game đã kết thúc chưa
}) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Chặn reload / đóng tab với useBeforeUnload hook
  useBeforeUnload(
    useCallback(
      (event) => {
        if (isGameActive && !gameEnded) {
          event.preventDefault();
          return message;
        }
      },
      [isGameActive, gameEnded, message]
    )
  );

  // Xử lý nút Back và navigation trong ứng dụng
  useEffect(() => {
    if (!isGameActive || gameEnded) return;
    
    // Biến cờ để theo dõi xem người dùng đã xác nhận thoát chưa
    let hasConfirmedExit = false;
    
    // Biến để lưu trạng thái của vị trí hiện tại
    const currentPath = location.pathname;
    
    // Hàm để xử lý khi người dùng cố gắng rời trang
    const handleNavigation = (e) => {
      // Nếu đã xác nhận thoát, không làm gì cả
      if (hasConfirmedExit) return;
      
      // Ngăn chặn điều hướng mặc định
      e.preventDefault();
      
      // Hiển thị hộp thoại xác nhận
      const confirmed = window.confirm(message);
      
      if (confirmed) {
        // Đánh dấu đã xác nhận thoát
        hasConfirmedExit = true;
        
        // Thực hiện các hành động khi thoát
        onExitConfirm();
        notifyOpponent();
        
        // Gỡ bỏ trình xử lý sự kiện
        window.removeEventListener('popstate', handleNavigation);
        
        // Để React Router tiếp tục điều hướng, chúng ta sẽ thực hiện lại hành động
        if (e.type === 'popstate') {
          // Nếu là nút Back, tiếp tục quá trình điều hướng
          window.history.back();
        } else {
          // Đối với các phương thức điều hướng khác, sẽ sử dụng navigate
          // e.state.target có thể chứa URL đích
          if (e.state && e.state.target) {
            navigate(e.state.target);
          }
        }
      } else {
        // Nếu người dùng không muốn rời đi, đảm bảo lịch sử không thay đổi
        window.history.pushState(null, "", currentPath);
      }
    };

    // Lưu lại phương thức gốc
    const originalPushState = window.history.pushState;
    
    // Ghi đè phương thức pushState để bắt các điều hướng trong ứng dụng
    window.history.pushState = function(state, title, url) {
      if (url !== currentPath && isGameActive && !hasConfirmedExit) {
        // Lưu URL đích vào state để sử dụng sau
        const customEvent = new PopStateEvent('pushState', {
          state: { ...state, target: url }
        });
        
        // Gọi trình xử lý với sự kiện tùy chỉnh
        handleNavigation(customEvent);
        
        // Nếu không xác nhận, không thực hiện điều hướng
        if (!hasConfirmedExit) {
          return;
        }
      }
      
      // Nếu không phải điều hướng ra khỏi trang trò chơi hoặc đã xác nhận, thực hiện bình thường
      return originalPushState.apply(this, arguments);
    };
    
    // Đưa URL hiện tại vào lịch sử để có thể bắt sự kiện back
    window.history.pushState(null, "", currentPath);
    
    // Đăng ký bắt sự kiện popstate (nút Back)
    window.addEventListener('popstate', handleNavigation);
    
    // Dọn dẹp khi component bị unmount
    return () => {
      window.history.pushState = originalPushState;
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [isGameActive, message, navigate, location, onExitConfirm, notifyOpponent]);

  // Gửi thông báo thoát khi người chơi thật sự rời tab
  useEffect(() => {
    const handleUnload = () => {
      if (isGameActive && !gameEnded) {
        onExitConfirm();
        // Gọi notifyOpponent với thông tin cần thiết về người chơi thoát
        notifyOpponent({
          type: 'forfeit',
          player: 'current'
        });
      }
    };

    window.addEventListener("unload", handleUnload);
    return () => window.removeEventListener("unload", handleUnload);
  }, [isGameActive, gameEnded, onExitConfirm, notifyOpponent]);

  return null;
}