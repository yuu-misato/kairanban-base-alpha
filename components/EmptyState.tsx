import React from 'react';
import { Button } from './ui/Button';

interface EmptyStateProps {
    icon?: string;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'fas fa-wind',
    title,
    description,
    actionLabel,
    onAction
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in-95 duration-500 select-none">
            {/* Artistic Icon Circle */}
            <div className="relative mb-8 group cursor-default">
                <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                <div className="w-24 h-24 bg-gradient-to-br from-white to-slate-50 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-slate-200/50 relative z-10 border border-white transform hover:rotate-6 transition-transform duration-500">
                    <i className={`${icon} text-4xl text-emerald-500/80`}></i>
                </div>
            </div>

            <h3 className="text-xl font-black text-slate-800 mb-3 tracking-tight">{title}</h3>
            <p className="text-slate-400 font-medium text-sm max-w-xs mb-8 leading-relaxed">
                {description}
            </p>

            {actionLabel && onAction && (
                <Button
                    onClick={onAction}
                    variant="primary"
                    size="md"
                    className="shadow-xl shadow-emerald-200/50"
                    icon="fas fa-plus"
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
