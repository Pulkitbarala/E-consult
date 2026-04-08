// Detect when page becomes visible/hidden for smart polling
type VisibilityCallback = (isVisible: boolean) => void;

const visibilityCallbacks: Set<VisibilityCallback> = new Set();
let isPageVisible = !document.hidden;

// Set up visibility change listener
document.addEventListener('visibilitychange', () => {
  isPageVisible = !document.hidden;
  visibilityCallbacks.forEach(callback => callback(isPageVisible));
});

export const onVisibilityChange = (callback: VisibilityCallback): (() => void) => {
  visibilityCallbacks.add(callback);
  
  // Call immediately with current state
  callback(isPageVisible);
  
  // Return unsubscribe function
  return () => {
    visibilityCallbacks.delete(callback);
  };
};

export const isPageActive = (): boolean => {
  return isPageVisible;
};

// Polling with visibility detection - only polls when page is active
export const smartPoll = (
  callback: () => Promise<void>,
  intervalMs: number = 3000,
  startImmediately: boolean = true
) => {
  let pollInterval: NodeJS.Timeout | null = null;
  let isPolling = isPageVisible;
  
  const startPolling = () => {
    if (!isPolling) {
      isPolling = true;
      if (startImmediately) {
        callback().catch(err => console.error('Smart poll error:', err));
      }
      pollInterval = setInterval(() => {
        callback().catch(err => console.error('Smart poll error:', err));
      }, intervalMs);
    }
  };
  
  const stopPolling = () => {
    if (isPolling && pollInterval) {
      clearInterval(pollInterval);
      isPolling = false;
    }
  };
  
  // Subscribe to visibility changes
  const unsubscribeVisibility = onVisibilityChange((isVisible) => {
    if (isVisible) {
      startPolling();
    } else {
      stopPolling();
    }
  });
  
  // Return cleanup function
  return () => {
    stopPolling();
    unsubscribeVisibility();
  };
};
