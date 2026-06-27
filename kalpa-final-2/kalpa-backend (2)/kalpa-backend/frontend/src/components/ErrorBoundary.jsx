import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-50 p-4">
          <div className="mx-auto mt-10 max-w-2xl rounded-lg border border-red-100 bg-white p-5 shadow-sm">
            <h1 className="text-xl font-semibold text-red-700">App crashed while rendering</h1>
            <p className="mt-2 text-sm text-slate-700">
              {this.state.error.message || 'Unknown frontend error'}
            </p>
            <button
              className="mt-4 rounded-md bg-emerald-900 px-4 py-2 text-white"
              onClick={() => window.location.assign('/')}
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
