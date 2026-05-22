import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#131314] flex flex-col items-center justify-center p-8 text-white font-body-md">
          <div className="max-w-md text-center flex flex-col items-center gap-6">
            {/* Error Icon */}
            <div className="w-20 h-20 rounded-full bg-red-900/30 border-2 border-red-700/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-[40px] text-red-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                error
              </span>
            </div>
            
            <div>
              <h1 className="text-3xl font-black font-display-lg tracking-wide uppercase mb-2 text-red-400">
                SYSTEM ERROR
              </h1>
              <p className="text-gray-400 text-sm">
                Something went wrong. Please try refreshing the page.
              </p>
            </div>

            {/* Error details in dev mode */}
            {import.meta.env.DEV && this.state.error && (
              <div className="w-full bg-[#1a1a1c] border border-[#2a2a2b] rounded-lg p-4 text-left overflow-auto max-h-32">
                <p className="text-xs font-mono text-red-300 break-all">
                  {this.state.error.message || this.state.error.toString()}
                </p>
              </div>
            )}

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-[#7a33ff] hover:bg-[#6a1ceb] text-white px-8 py-3 rounded-lg font-bold tracking-wider transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined">refresh</span>
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
