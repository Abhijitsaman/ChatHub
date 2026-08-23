import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { userService } from '../services/userService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        try {
          const profile = await userService.getUserProfile(firebaseUser.uid);
          if (profile) {
            setUser({ ...firebaseUser, ...profile });
            setIsNewUser(false);
          } else {
            setUser(firebaseUser);
            setIsNewUser(true);
          }
        } catch (error) {
          console.error('Auth error:', error);
          setUser(null);
          setIsNewUser(false);
        }
      } else {
        setUser(null);
        setIsNewUser(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsNewUser(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    setUser,
    loading,
    isNewUser,
    setIsNewUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
