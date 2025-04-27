import { useState, useCallback, ReactNode, createContext, useContext } from 'react';
import { generateId } from '../utils/helpers';

// Toast types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

// Toast interface
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

// Toast context interface
interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

// Create context with default values
const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

// Toast provider props
interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast provider component
 * @param props Component props
 * @returns Toast provider component
 */
export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add a new toast
  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      const id = generateId();
      
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      
      // Auto-remove toast after duration
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    []
  );

  // Remove a toast by ID
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      
      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast toast-${toast.type}`}
              onClick={() => removeToast(toast.id)}
            >
              <div className="toast-message">{toast.message}</div>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

/**
 * Custom hook for using toast notifications
 * @returns Toast functions and state
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};
