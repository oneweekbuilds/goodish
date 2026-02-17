import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Toast Notification System (#15)
 *
 * Usage:
 *   import { useToast } from '../components/ui/Toast';
 *   const { showToast } = useToast();
 *   showToast('Scan started!', 'success');
 *   showToast('Something went wrong', 'error');
 */

const ToastContext = createContext(null);

const TOAST_ICONS = {
  success: CheckCircle,
  error: AlertTriangle,
  info: Info,
};

const TOAST_STYLES = {
  success: 'bg-white border-status-success/30 text-text-main',
  error: 'bg-white border-status-error/30 text-text-main',
  info: 'bg-white border-primary-blue/30 text-text-main',
};

const TOAST_ICON_STYLES = {
  success: 'text-status-success',
  error: 'text-status-error',
  info: 'text-primary-blue',
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      <div
        className="fixed bottom-6 right-6 z-[70] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }) {
  const { id, message, type, duration } = toast;
  const Icon = TOAST_ICONS[type] || Info;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-medium animate-in slide-in-from-right-5 ${TOAST_STYLES[type]}`}
      role="status"
    >
      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${TOAST_ICON_STYLES[type]}`} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 p-0.5 text-text-muted hover:text-text-main transition-colors rounded"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastProvider;
