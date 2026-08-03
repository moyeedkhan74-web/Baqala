import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { signInWithGoogle, firebaseEmailLogin, firebaseEmailRegister, firebaseSignOut, getFirebaseIdToken } from '../firebase';

const AuthContext = createContext({
  user: null,
  loading: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUser: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
          try {
            setUser(JSON.parse(savedUser));
            // Re-fetch the latest profile from backend to pick up role changes
            await api.get('/auth/profile');
          } catch (e) {
            // silently use cached user if backend is down or token expired
          }
        } else {
          // If there's no backend token but the user is still signed into Firebase,
          // try to exchange the Firebase ID token for a backend JWT so requests won't 401.
          try {
            const idToken = await getFirebaseIdToken();
            if (idToken) {
              const { data } = await api.post('/auth/firebase-login', { idToken });
              if (data?.token && data?.user) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
              }
            }
          } catch (e) {
            // ignore; user will be treated as unauthenticated
          }
        }
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Email/Password login via Firebase, then verify with backend
  const login = async (email, password) => {
    // Sign in with Firebase first
    const firebaseCred = await firebaseEmailLogin(email, password);
    const idToken = await firebaseCred.user.getIdToken();
    
    // Send Firebase ID token to backend for verification
    const { data } = await api.post('/auth/firebase-login', { idToken });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  // Google Sign-In via Firebase popup, then verify with backend
  const loginWithGoogle = async (role = 'user') => {
    const result = await signInWithGoogle();
    const idToken = await result.user.getIdToken();
    
    // Send Firebase ID token to backend
    const { data } = await api.post('/auth/firebase-login', { idToken, role });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  // Register via Firebase Email/Password, then create user in backend
  const register = async (name, email, password, role) => {
    // Create Firebase user first
    const firebaseCred = await firebaseEmailRegister(email, password);
    const idToken = await firebaseCred.user.getIdToken();
    
    // Send to backend to create MongoDB user
    const { data } = await api.post('/auth/firebase-register', { idToken, name, role });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await firebaseSignOut();
    } catch (e) {
      // Silently ignore Firebase sign-out errors
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
