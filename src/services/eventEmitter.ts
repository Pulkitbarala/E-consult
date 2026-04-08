// Simple event emitter for app-wide events
type EventListener = (...args: any[]) => void;

const listeners: Record<string, EventListener[]> = {};

// Keep track of debounced callbacks to prevent rapid repeated calls
const debouncedCallbacks: Record<string, { callback: () => Promise<void>; timeout?: NodeJS.Timeout }> = {};

export const emitEvent = (eventName: string, data?: any) => {
  if (listeners[eventName]) {
    listeners[eventName].forEach(listener => listener(data));
  }
};

export const onEvent = (eventName: string, listener: EventListener) => {
  if (!listeners[eventName]) {
    listeners[eventName] = [];
  }
  listeners[eventName].push(listener);
  
  // Return unsubscribe function
  return () => {
    listeners[eventName] = listeners[eventName].filter(l => l !== listener);
  };
};

export const offEvent = (eventName: string, listener: EventListener) => {
  if (listeners[eventName]) {
    listeners[eventName] = listeners[eventName].filter(l => l !== listener);
  }
};

// Debounced event handler - prevents rapid repeated calls to the same callback
// Only fires after 1000ms of no new events
export const onDebouncedEvent = (
  eventName: string,
  callback: () => Promise<void>,
  delayMs: number = 1000
) => {
  const callbackKey = `${eventName}_${Math.random()}`;
  
  const wrappedListener = () => {
    // Clear existing timeout
    if (debouncedCallbacks[callbackKey]?.timeout) {
      clearTimeout(debouncedCallbacks[callbackKey].timeout!);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      callback().catch(err => console.error(`Error in debounced callback for ${eventName}:`, err));
      delete debouncedCallbacks[callbackKey];
    }, delayMs);
    
    debouncedCallbacks[callbackKey] = { callback, timeout };
  };
  
  if (!listeners[eventName]) {
    listeners[eventName] = [];
  }
  listeners[eventName].push(wrappedListener);
  
  // Return unsubscribe function
  return () => {
    if (listeners[eventName]) {
      listeners[eventName] = listeners[eventName].filter(l => l !== wrappedListener);
    }
    if (debouncedCallbacks[callbackKey]?.timeout) {
      clearTimeout(debouncedCallbacks[callbackKey].timeout!);
    }
    delete debouncedCallbacks[callbackKey];
  };
};

// Common events
export const EVENTS = {
  COMMENT_POSTED: 'comment_posted',
  CONSULTATION_CREATED: 'consultation_created',
  CONSULTATION_EXPIRED: 'consultation_expired',
};
