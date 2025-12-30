import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        // Attempt to recover by likely going to a safe page or reloading
        window.location.href = '/dashboard';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
                    <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-rose-100/50">
                            <i className="fas fa-exclamation text-4xl text-rose-500"></i>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Halted.</h1>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                予期せぬ問題が発生しました。<br />
                                システムを再起動してください。
                            </p>
                        </div>

                        {/* Error Details (Hidden in Prod usually, but good for now to debug) */}
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-left overflow-hidden">
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Error Code</p>
                            <p className="text-xs font-mono text-slate-600 break-all bg-slate-50 p-2 rounded-lg">
                                {this.state.error?.message || 'Unknown Error'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 pt-4">
                            <Button
                                onClick={this.handleReload}
                                variant="primary"
                                size="lg"
                                className="w-full shadow-2xl shadow-emerald-200/50"
                                icon="fas fa-power-off"
                            >
                                再起動 (Reload)
                            </Button>
                        </div>

                        <p className="text-xs text-slate-300 font-medium">
                            Designed by World Class Engineering
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
