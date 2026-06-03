import { Component } from 'react';

export default class ErrorBoundary extends Component {
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
      const { fallback: Fallback, darkMode } = this.props;
      if (Fallback) {
        return <Fallback error={this.state.error} darkMode={darkMode} />;
      }
      return (
        <div className={`flex flex-col items-center justify-center p-8 rounded-2xl ${darkMode ? 'bg-gray-800/50 text-gray-300' : 'bg-white/50 text-gray-600'}`}>
          <p className="text-sm font-bold mb-2">Algo salio mal</p>
          <p className="text-xs opacity-70 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
