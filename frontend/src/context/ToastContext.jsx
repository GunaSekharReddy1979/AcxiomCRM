import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', title = '') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, title };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="crm-toast-container">
        {toasts.map((toast) => {
          let borderStart = 'border-primary';
          let icon = 'bi-info-circle-fill text-primary';

          if (toast.type === 'success') {
            borderStart = 'border-success';
            icon = 'bi-check-circle-fill text-success';
          } else if (toast.type === 'danger' || toast.type === 'error') {
            borderStart = 'border-danger';
            icon = 'bi-exclamation-octagon-fill text-danger';
          } else if (toast.type === 'warning') {
            borderStart = 'border-warning';
            icon = 'bi-exclamation-triangle-fill text-warning';
          }

          return (
            <div key={toast.id} className={`card shadow-sm p-3 border-start border-4 ${borderStart}`}>
              <div className="d-flex align-items-start">
                <i className={`bi ${icon} fs-5 me-2 mt-0`}></i>
                <div className="flex-grow-1">
                  {toast.title && <div className="fw-bold mb-1 fs-6">{toast.title}</div>}
                  <div className="text-secondary small">{toast.message}</div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-sm ms-2"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Close"
                ></button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
