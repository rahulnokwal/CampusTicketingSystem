import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
  };

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const typeStyles = {
    success: 'border-success-border bg-surface text-ink shadow-card',
    error: 'border-danger-border bg-surface text-ink shadow-card',
    warning: 'border-warning-border bg-surface text-ink shadow-card',
    info: 'border-brand/40 bg-surface text-ink shadow-card',
  };

  const iconColors = {
    success: 'text-success',
    error: 'text-danger',
    warning: 'text-warning',
    info: 'text-brand',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const Icon = icons[t.type] || Info;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-card transition-all duration-300 animate-slide-in ${
                typeStyles[t.type] || typeStyles.info
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColors[t.type]}`} />
              <p className="text-sm font-medium text-ink flex-1">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="text-ink-subtle hover:text-ink p-0.5 rounded cursor-pointer transition-colors"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
