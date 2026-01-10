import React, { useState, useCallback } from 'react';
import Toast, { ToastType } from '../components/Toast';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [nextId, setNextId] = useState(0);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = nextId;
    setNextId(prev => prev + 1);
    
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    
    if (duration > 0) {
      const timer = setTimeout(() => {
        removeToast(id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
    
    return id;
  }, [nextId]);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const ToastContainer: React.FC = () => {
    return (
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    );
  };

  return { showToast, ToastContainer };
};

// Create a simple toast function
export const toast = {
  success: (message: string, duration = 3000) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, duration);
  },
  error: (message: string, duration = 3000) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, duration);
  },
  info: (message: string, duration = 3000) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, duration);
  }
};

// Simple provider that doesn't require context
export const ToastProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return <>{children}</>;
};
