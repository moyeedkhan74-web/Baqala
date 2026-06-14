import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import './firebase';

// ✅ ADD THIS
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("🔴 App crashed:", error);
    console.error("Error Info:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#050505',
          color: '#fff',
          padding: '20px',
          fontFamily: 'monospace'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>⚠️ Something went wrong</h1>
          <p style={{ fontSize: '0.9rem', maxWidth: '600px', marginBottom: '20px', color: '#ccc' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
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
  
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);