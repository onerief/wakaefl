
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="text-green-400" size={20} />,
  error: <XCircle className="text-red-400" size={20} />,
  info: <Info className="text-blue-400" size={20} />,
};

const TOAST_COLORS: Record<ToastType, string> = {
  success: 'border-green-500/50',
  error: 'border-red-500/50',
  info: 'border-blue-500/50',
};

const IndividualToast: React.FC<{ toast: ToastMessage, onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onDismiss(toast.id), 300); // Wait for animation
        }, 3000);

        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);
    
    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 300);
    }

    return (
        <div 
            className={`pointer-events-auto flex items-center gap-4 w-full max-w-sm p-4 text-brand-text bg-brand-secondary rounded-lg shadow-lg border-l-4 ${TOAST_COLORS[toast.type]} transition-all duration-300 ease-in-out transform ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
            role="alert"
        >
            <div>{ICONS[toast.type]}</div>
            <div className="text-sm font-medium flex-grow">{toast.message}</div>
            <button onClick={handleDismiss} className="text-brand-light hover:text-brand-text">
                <X size={16} />
            </button>
        </div>
    );
}


export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    setToasts((prevToasts) => [...prevToasts, { id: Date.now(), message, type }]);
  }, []);
  
  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-24 right-4 z-[120] space-y-3 pointer-events-none">
        {toasts.map((toast) => (
          <IndividualToast key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
