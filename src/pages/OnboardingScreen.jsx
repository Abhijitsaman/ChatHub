import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { Check, X, Loader2 } from 'lucide-react';
import '../styles/OnboardingScreen.css';

function OnboardingScreen() {
  const { user, setUser, setIsNewUser } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const validateUsername = (value) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!value) return 'Username is required';
    if (!usernameRegex.test(value)) {
      return 'Username must be 3-20 characters, letters, numbers, or underscores';
    }
    return null;
  };

  const checkUsername = async (value) => {
    if (!value || value.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }
    
    const validationError = validateUsername(value);
    if (validationError) {
      setIsUsernameAvailable(false);
      return;
    }
    
    setIsChecking(true);
    try {
      const available = await userService.checkUsernameAvailability(value);
      setIsUsernameAvailable(available);
    } catch (err) {
      console.error('Username check error:', err);
      setIsUsernameAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value.toLowerCase();
    setUsername(value);
    setIsUsernameAvailable(null);
    if (value.length >= 3) {
      const timer = setTimeout(() => checkUsername(value), 500);
      return () => clearTimeout(timer);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }
    
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }
    
    if (isUsernameAvailable === false) {
      setError('Username is not available');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const photoURL = user?.photoURL || '';
      const profile = await userService.createUserProfile(user.uid, {
        displayName: displayName.trim(),
        username: username,
        bio: bio.trim() || '',
        photoURL,
      });
      
      await userService.reserveUsername(user.uid, username);
      
      setUser({ ...user, ...profile });
      setIsNewUser(false);
      navigate('/chats', { replace: true });
    } catch (err) {
      console.error('Onboarding error:', err);
      if (err.message === 'Username already taken') {
        setError('Username is already taken. Please try another.');
        setIsUsernameAvailable(false);
      } else {
        setError('Unable to create profile. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="onboarding-screen">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <div className="onboarding-logo">
            <svg viewBox="0 0 200 200" className="onboarding-logo-svg">
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
          </div>
          <h1 className="onboarding-title">Welcome to ChatHub</h1>
          <p className="onboarding-subtitle">Complete your profile to get started</p>
        </div>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              maxLength={50}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="username-input-wrapper">
              <span className="username-prefix">@</span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="Choose a username"
                maxLength={20}
                required
              />
              {isChecking && <Loader2 className="username-status loading" size={20} />}
              {!isChecking && isUsernameAvailable === true && (
                <Check className="username-status available" size={20} />
              )}
              {!isChecking && isUsernameAvailable === false && (
                <X className="username-status unavailable" size={20} />
              )}
            </div>
            <span className="field-hint">3-20 characters, letters, numbers, or underscores</span>
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio <span className="optional">(optional)</span></label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              maxLength={150}
              rows={3}
            />
          </div>

          {error && (
            <div className="onboarding-error">
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="onboarding-submit-btn"
            disabled={isSubmitting || isUsernameAvailable === false || !username}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="btn-spinner" size={20} />
                <span>Setting up...</span>
              </>
            ) : (
              <span>Create Profile</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OnboardingScreen;
