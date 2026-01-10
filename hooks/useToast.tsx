import React from 'react';

type ToastType = 'success' | 'error' | 'info';

const showToast = (message: string, type: ToastType = 'info', duration = 3000) => {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 
    'bg-blue-500'
  } text-white`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, duration);
};

export const toast = {
  success: (message: string, duration = 3000) => showToast(message, 'success', duration),
  error: (message: string, duration = 3000) => showToast(message, 'error', duration),
  info: (message: string, duration = 3000) => showToast(message, 'info', duration)
};

export const ToastProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return <>{children}</>;
};
