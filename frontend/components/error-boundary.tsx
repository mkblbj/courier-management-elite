
import React from 'react';

interface ErrorBoundaryState {
      hasError: boolean;
      error?: Error;
}

interface ErrorBoundaryProps {
      children: React.ReactNode;
      fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
      constructor(props: ErrorBoundaryProps) {
            super(props);
            this.state = { hasError: false };
      }

      static getDerivedStateFromError(error: Error): ErrorBoundaryState {
            return { hasError: true, error };
      }

      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
            if (process.env.NODE_ENV === 'development') {
                  console.error('ErrorBoundary caught an error:', error, errorInfo);
            }
      }

      resetError = () => {
            this.setState({ hasError: false, error: undefined });
      };

      render() {
            if (this.state.hasError) {
                  return (
                        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
                              <h3 className="text-lg font-semibold mb-2">出现了一个错误</h3>
                              <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    页面遇到了意外错误，请尝试刷新页面
                              </p>
                              <button
                                    onClick={this.resetError}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                              >
                                    重试
                              </button>
                        </div>
                  );
            }

            return this.props.children;
      }
}

export default ErrorBoundary;
'use client';
