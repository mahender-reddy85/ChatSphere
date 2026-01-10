type ToastType = 'success' | 'error' | 'info';

const showToast = (message: string, type: ToastType = 'info', duration = 3000) => {
  // Create toast element
  const toast = document.createElement('div');
  
  // Set toast styles based on type
  const baseStyles = 'fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 text-white';
  const typeStyles = type === 'success' 
    ? 'bg-green-500' 
    : type === 'error' 
      ? 'bg-red-500' 
      : 'bg-blue-500';
  
  toast.className = `${baseStyles} ${typeStyles}`;
  toast.textContent = message;
  
  // Add to DOM
  document.body.appendChild(toast);
  
  // Auto-remove after duration
  setTimeout(() => {
    if (toast.parentNode) {
      document.body.removeChild(toast);
    }
  }, duration);
};

// Export toast methods
export const toast = {
  success: (message: string, duration = 3000) => showToast(message, 'success', duration),
  error: (message: string, duration = 3000) => showToast(message, 'error', duration),
  info: (message: string, duration = 3000) => showToast(message, 'info', duration)
};

// Simple provider component that doesn't render anything
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
