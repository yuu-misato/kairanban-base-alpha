import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: string; // FontAwesome class
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    fullWidth = false,
    className,
    children,
    ...props
}) => {
    const baseStyles = "rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

    const variants = {
        primary: "bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600",
        secondary: "bg-slate-100 text-slate-600 hover:bg-slate-200",
        danger: "bg-rose-50 text-rose-600 hover:bg-rose-100",
        ghost: "bg-transparent text-slate-500 hover:text-slate-700",
        outline: "border-2 border-slate-200 text-slate-500 hover:border-emerald-500 hover:text-emerald-500 bg-transparent"
    };

    const sizes = {
        sm: "px-4 py-2 text-xs",
        md: "px-6 py-3 text-sm",
        lg: "px-8 py-4 text-base"
    };

    const widthStyle = fullWidth ? "w-full" : "";

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className || ''}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <i className="fas fa-spinner fa-spin"></i>}
            {!isLoading && icon && <i className={icon}></i>}
            {children}
        </button>
    );
};
