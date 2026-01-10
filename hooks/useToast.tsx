// Simple toast notification system using vanilla JavaScript

type ToastType = 'success' | 'error' | 'info';

/**
 * Shows a toast notification
 * @param message The message to display
 * @param type The type of toast (success, error, info)
 * @param duration How long to show the toast in milliseconds
 */
function showToast(message: string, type: ToastType = 'info', duration = 3000): void {
  // Create toast element
  const toast = document.createElement('div');
  
  // Set toast styles
  const baseStyles = [
    'position: fixed',
    'bottom: 1rem',
    'right: 1rem',
    'padding: 0.5rem 1rem',
    'border-radius: 0.5rem',
    'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    'z-index: 50',
    'color: white',
    'max-width: 24rem',
    'word-break: break-word'
  ];

  // Set type-specific styles
  const typeStyles = {
    success: 'background-color: #10B981', // green-500
    error: 'background-color: #EF4444',   // red-500
    info: 'background-color: #3B82F6'     // blue-500
  }[type];

  // Apply all styles
  toast.setAttribute('style', [...baseStyles, typeStyles].join(';'));
  
  // Set content
  toast.textContent = message;
  
  // Add to DOM
  document.body.appendChild(toast);
  
  // Auto-remove after duration
  setTimeout(() => {
    if (toast.parentNode === document.body) {
      document.body.removeChild(toast);
    }
  }, duration);
}

// Export toast methods
export const toast = {
  success: (message: string, duration = 3000) => showToast(message, 'success', duration),
  error: (message: string, duration = 3000) => showToast(message, 'error', duration),
  info: (message: string, duration = 3000) => showToast(message, 'info', duration)
};

// Export a no-op provider for compatibility
export const ToastProvider = {
  // This is a no-op object to maintain compatibility with existing code
  // that might be using the ToastProvider component
  // In a real implementation, you might want to provide a proper React component here
} as any;
