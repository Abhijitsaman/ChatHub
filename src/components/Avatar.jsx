import React from 'react';
import '../styles/Avatar.css';

function Avatar({ src, name, size = 40, className = '' }) {
  const getInitials = () => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getColor = (name) => {
    if (!name) return '#6366f1';
    const colors = [
      '#6366f1', '#8b5cf6', '#06b6d4', '#34d399', '#f59e0b',
      '#ef4444', '#ec4899', '#14b8a6', '#8b5cf6', '#3b82f6'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const style = {
    width: size,
    height: size,
    fontSize: size * 0.4,
    backgroundColor: src ? 'transparent' : getColor(name),
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`avatar ${className}`}
        style={style}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`avatar avatar-placeholder ${className}`} style={style}>
      {getInitials()}
    </div>
  );
}

export default Avatar;
