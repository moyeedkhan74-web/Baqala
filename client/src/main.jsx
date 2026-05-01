import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import './firebase';

// ✅ ADD THIS
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App crashed:", error);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please refresh.</h1>;
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary> {/* ✅ WRAP HERE */}
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
            <Toaster 
              position="bottom-right"
              toastOptions={{
                className: 'dark:bg-dark-800 dark:text-white bg-white text-dark-800 shadow-glass border dark:border-white/10 border-dark-200/50 rounded-2xl',
                style: { backdropFilter: 'blur(12px)' },
                success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
                error: { iconTheme: { primary: '#f43f5e', secondary: 'white' } },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary> {/* ✅ WRAP END */}
  </React.StrictMode>,
);