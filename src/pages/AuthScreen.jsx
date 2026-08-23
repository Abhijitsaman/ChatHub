import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { Chrome } from 'lucide-react';
import '../styles/AuthScreen.css';

function AuthScreen() {
  const { user, loading, setUser, setIsNewUser } = useAuth();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/chats', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });
      
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      const profile = await userService.getUserProfile(firebaseUser.uid);
      
      if (profile) {
        setUser({ ...firebaseUser, ...profile });
        setIsNewUser(false);
        navigate('/chats', { replace: true });
      } else {
        setUser(firebaseUser);
        setIsNewUser(true);
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login was cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popups are blocked. Please allow popups for this site and try again.');
      } else {
        setError('Unable to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-screen">
        <div className="auth-loader">
          <div className="auth-loader-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-logo">
          <svg viewBox="0 0 200 200" className="auth-logo-svg">
            <rect width="200" height="200" rx="40" fill="url(#grad)" />
            <path d="M60 140V80L100 110L140 80V140L100 170L60 140Z" fill="white" opacity="0.9" />
            <path d="M60 80L100 50L140 80L100 110L60 80Z" fill="white" opacity="0.6" />
            <circle cx="100" cy="110" r="12" fill="white" opacity="0.3" />
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="200" y2="200">
                <stop offset="0%" stop-color="#6366f1" />
                <stop offset="50%" stop-color="#8b5cf6" />
                <stop offset="100%" stop-color="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <h1 className="auth-brand">ChatHub</h1>
        </div>
        
        <div className="auth-content">
          <h2 className="auth-title">Welcome to ChatHub</h2>
          <p className="auth-subtitle">Connect, chat, and call with your friends</p>
          
          {error && (
            <div className="auth-error">
              <span>{error}</span>
            </div>
          )}
          
          <button
            className="auth-google-btn"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <Chrome size={24} />
            <span>{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>
        </div>
        
        <div className="auth-footer">
          <span>Secure • Private • Real-time</span>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;
