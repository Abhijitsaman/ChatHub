import React from 'react';
import { Loader2 } from 'lucide-react';
import '../styles/LoadingScreen.css';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">
          <svg viewBox="0 0 200 200" className="loading-logo-svg">
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
        <Loader2 className="loading-spinner" size={40} />
        <p className="loading-text">Loading ChatHub...</p>
      </div>
    </div>
  );
}

export default LoadingScreen;
