import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('CafTrack crashed:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            CafTrack hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-slate-700 dark:hover:bg-slate-600 dark:focus-visible:ring-white/30 dark:focus-visible:ring-offset-slate-900"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}


