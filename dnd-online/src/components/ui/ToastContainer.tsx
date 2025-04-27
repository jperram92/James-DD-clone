import { useToast } from '../../hooks/useToast';
import Toast from './Toast';

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

/**
 * Container for toast notifications
 * @param props Component props
 * @returns Toast container component
 */
const ToastContainer = ({ position = 'top-right' }: ToastContainerProps) => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className={`toast-container toast-${position}`}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
