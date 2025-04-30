/**
 * Safe navigation function that respects game exit confirmation
 * when it's active
 * 
 * @param {string|object|number} to - Where to navigate
 * @param {object} options - Navigation options
 */
export const safeNavigate = (to, options) => {
  // Use the wrapped navigate function if available (during active game)
  // otherwise fall back to regular navigation
  if (window.__gameExitNavigate) {
    window.__gameExitNavigate(to, options);
  } else {
    // This case should not happen normally, but just as a fallback
    console.warn("Safe navigation function not available, using direct navigation");
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};
