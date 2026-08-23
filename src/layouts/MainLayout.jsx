import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Search, User, Settings, QrCode, LogOut } from 'lucide-react';
import '../styles/MainLayout.css';

function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    { icon: MessageCircle, label: 'Chats', path: '/chats' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: QrCode, label: 'QR', path: '/qr' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path) => {
    if (path === '/chats' && location.pathname === '/') return true;
    if (path === '/chats' && location.pathname === '/chats') return true;
    if (path === '/chat' && location.pathname.startsWith('/chat')) return true;
    return location.pathname === path;
  };

  const isChatOpen = location.pathname.startsWith('/chat');

  return (
    <div className="main-layout">
      <div className={`main-content ${isChatOpen ? 'chat-open' : ''}`}>
        <Outlet />
      </div>
      
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
            >
              <Icon size={24} />
              <span>{item.label}</span>
            </button>
          );
        })}
        
        <button
          className="nav-item logout-btn"
          onClick={() => setShowLogoutConfirm(true)}
          aria-label="Logout"
        >
          <LogOut size={24} />
          <span>Logout</span>
        </button>
      </nav>

      {showLogoutConfirm && (
        <div className="logout-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="logout-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Logout?</h3>
            <p>Are you sure you want to sign out?</p>
            <div className="logout-actions">
              <button className="logout-cancel" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </button>
              <button className="logout-confirm-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainLayout;
