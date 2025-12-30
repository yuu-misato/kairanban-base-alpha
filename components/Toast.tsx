
import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastProps {
    toasts: ToastMessage[];
    onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toasts, onRemove }) => {
    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, 3000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    const bgColors = {
        success: 'bg-emerald-500',
        error: 'bg-rose-500',
        info: 'bg-slate-800'
    };

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };

    return (
        <div className={`
      ${bgColors[toast.type]} text-white px-6 py-4 rounded-2xl shadow-xl shadow-slate-900/10
      flex items-center gap-3 font-bold text-sm pointer-events-auto
      animate-in slide-in-from-bottom-5 fade-in duration-300
    `}>
            <i className={`${icons[toast.type]} text-lg`}></i>
            {toast.message}
        </div>
    );
};

export default Toast;
