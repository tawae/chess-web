import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Component to handle game exit confirmations
 * @param {Object} props
 * @param {boolean} props.isGameActive - Whether a game is currently active
 * @param {string} props.gameMode - Game mode: 'local', 'ai', or 'online'
 * @param {Function} props.onExitConfirm - Function to call when exit is confirmed
 * @param {string} props.playerColor - In online mode, the player's color ('white'/'black')
 * @param {Function} props.notifyOpponent - Function to notify opponent about forfeit in online mode
 */
const GameExitHandler = ({ 
  isGameActive, 
  gameMode = 'local',
  onExitConfirm,
  playerColor,
  notifyOpponent
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const exitConfirmed = useRef(false);
  const linkClickHandlerRef = useRef(null); // Store handler function reference for cleanup

  // Handler for browser's beforeunload event (closing tab, refreshing)
  const handleBeforeUnload = useCallback((e) => {
    if (!isGameActive) return;
    
    // Don't perform side effects during the confirmation dialog
    // Just show the standard browser confirmation dialog
    e.preventDefault();
    e.returnValue = 'Bạn đang trong trận đấu. Nếu rời đi bạn sẽ bị xử thua. Bạn có chắc muốn thoát?';
    return e.returnValue; // For older browsers
  }, [isGameActive]);

  // Handle actual unload event - only runs if the user confirmed leaving
  useEffect(() => {
    const handleUnload = () => {
      if (!isGameActive || exitConfirmed.current) return;
      
      // Only now perform the side effects since the user definitely is leaving
      if (gameMode === 'online' && notifyOpponent) {
        notifyOpponent({
          type: 'forfeit',
          player: playerColor
        });
      }
      
      if (onExitConfirm) {
        onExitConfirm();
      }
      
      exitConfirmed.current = true;
    };
    
    if (isGameActive) {
      window.addEventListener('unload', handleUnload);
    }
    
    return () => {
      window.removeEventListener('unload', handleUnload);
    };
  }, [isGameActive, gameMode, notifyOpponent, playerColor, onExitConfirm]);

  // Set up the beforeunload handler for browser tab close/refresh
  useEffect(() => {
    if (isGameActive) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isGameActive, handleBeforeUnload]);

  // Helper function to get the appropriate exit message based on game mode
  const getExitMessage = useCallback(() => {
    if (gameMode === 'ai') {
      return 'Bạn đang trong ván đấu với máy. Nếu rời đi bạn sẽ bị xử thua. Bạn có chắc chắn muốn thoát?';
    } else if (gameMode === 'online') {
      return 'Nếu rời đi, đối thủ của bạn sẽ được thông báo rằng bạn đã bỏ cuộc và bạn sẽ bị xử thua. Bạn có chắc chắn muốn thoát?';
    }
    return 'Bạn đang trong ván đấu. Nếu rời đi bạn sẽ bị xử thua. Bạn có chắc chắn muốn thoát?';
  }, [gameMode]);
  
  // Handle exit confirmation process
  const handleExit = useCallback(() => {
    exitConfirmed.current = true;
    
    // Handle online game opponent notification
    if (gameMode === 'online' && notifyOpponent) {
      notifyOpponent({ 
        type: 'forfeit', 
        player: playerColor 
      });
    }
    
    // Call the exit confirmation callback if provided
    if (onExitConfirm) {
      onExitConfirm();
    }
  }, [gameMode, notifyOpponent, playerColor, onExitConfirm]);
  
  // Custom navigation handling for in-app navigation
  useEffect(() => {
    // Store the original navigate function
    const originalNavigate = navigate;
    
    // Create a wrapper for navigate that includes confirmation
    const navigateWithConfirmation = (to, options) => {
      if (!isGameActive) {
        originalNavigate(to, options);
        return;
      }

      // Skip confirmation if navigating to the same page
      if (typeof to === 'string' && to === location.pathname) {
        originalNavigate(to, options);
        return;
      }

      const confirmExit = window.confirm(getExitMessage());
      
      if (confirmExit) {
        handleExit();
        originalNavigate(to, options);
      }
      // User canceled - do nothing, stay on the page
    };

    // Make the safe navigation function available globally
    // but don't reassign the navigate constant
    if (isGameActive) {
      window.__gameExitNavigate = navigateWithConfirmation;
    } else {
      window.__gameExitNavigate = originalNavigate;
    }
    
    return () => {
      // Clean up the global function
      window.__gameExitNavigate = originalNavigate;
    };
  }, [isGameActive, navigate, location.pathname, getExitMessage, handleExit]);

  // Listen for popstate events (browser back/forward buttons)
  useEffect(() => {
    const handlePopState = (e) => {
      if (!isGameActive) return;
      
      // For all game modes, prevent immediate navigation and show confirmation
      e.preventDefault();
      
      // Show appropriate confirmation dialog based on game mode
      const confirmExit = window.confirm(getExitMessage());
      
      if (confirmExit) {
        handleExit();
        // Allow navigation to continue
      } else {
        // If user cancels, prevent navigation by pushing the current path back to history
        window.history.pushState(null, '', location.pathname);
      }
    };

    // Define the link click handler and store its reference for cleanup
    const handleLinkClick = (e) => {
      if (!isGameActive) return;
      
      // Check if it's a navigation link (like title, home, etc.)
      const clickedElement = e.target;
      const linkElement = clickedElement.tagName === 'A' ? 
                         clickedElement : 
                         clickedElement.closest('a');
                         
      if (!linkElement) return; // Not a link or child of link
      
      const href = linkElement.getAttribute('href');
      
      // Skip if it's not a navigation link or points to the current page
      if (!href || href === '#' || href === location.pathname) return;
      
      // Prevent default navigation for all links when game is active
      e.preventDefault();
      e.stopPropagation();
      
      // Show confirmation dialog
      const confirmExit = window.confirm(getExitMessage());
      
      if (confirmExit) {
        handleExit();
        // Navigate after confirmation
        setTimeout(() => {
          window.location.href = href;
        }, 100);
      }
    };
    
    // Store the handler reference for cleanup
    linkClickHandlerRef.current = handleLinkClick;

    if (isGameActive) {
      // Listen for back button
      window.addEventListener('popstate', handlePopState);
      
      // Additionally, try to capture browser back via history API
      const pushStateOriginal = window.history.pushState;
      window.history.pushState = function() {
        // Call original
        pushStateOriginal.apply(window.history, arguments);
        // Dispatch custom event that we can listen for
        window.dispatchEvent(new Event('pushstate'));
      };
      
      // Listen for our custom pushstate event
      const handlePushState = () => {
        if (!isGameActive) return;
        // This will catch programmatic history changes
        // We use the same condition as in handlePopState
        const confirmExit = window.confirm(getExitMessage());
        if (!confirmExit) {
          // Restore history if user cancels
          window.history.pushState(null, '', location.pathname);
        } else {
          handleExit();
        }
      };
      
      window.addEventListener('pushstate', handlePushState);
      
      // Use the handler from the ref for click events
      document.addEventListener('click', linkClickHandlerRef.current, true);

      // Return cleanup function
      return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('pushstate', handlePushState);
        window.history.pushState = pushStateOriginal;
        if (linkClickHandlerRef.current) {
          document.removeEventListener('click', linkClickHandlerRef.current, true);
        }
      };
    }
    
    return () => {};
  }, [isGameActive, location.pathname, navigate, getExitMessage, handleExit]);

  return null; // This is a behavior-only component, no UI
};

// Export a utility function for other components to use
export const safeNavigate = (to, options) => {
  if (window.__gameExitNavigate) {
    window.__gameExitNavigate(to, options);
  } else if (typeof window.navigate === 'function') {
    window.navigate(to, options);
  } else {
    // Fallback to simple location change if navigate isn't available
    if (typeof to === 'string') {
      window.location.href = to;
    }
  }
};

export default GameExitHandler;
