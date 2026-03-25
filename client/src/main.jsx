import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Use env variable or dummy for dev
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
