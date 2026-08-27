import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { callService } from '../services/callService';
import { userService } from '../services/userService';
import { MessageCircle, Search, User, QrCode, LogOut, Phone, PhoneOff, Video } from 'lucide-react';
import Avatar from '../components/Avatar';
import '../styles/MainLayout.css';

function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [incomingCaller, setIncomingCaller] = useState(null);

  const navItems = [
    { icon: MessageCircle, label: 'Chats', path: '/chats' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: QrCode, label: 'QR', path: '/qr' },
  ];

  useEffect(() => {
    if (!user) return;

    const unsubscribe = callService.listenIncomingCalls(user.uid, async (calls) => {
      if (calls.length === 0) {
        setIncomingCall(null);
        setIncomingCaller(null);
        return;
      }

      if (location.pathname.startsWith('/call')) return;

      const call = calls[0];
      setIncomingCall(call);

      try {
        const profile = await userService.getUserProfile(call.callerId);
        setIncomingCaller(profile);
      } catch (err) {
        console.error('Load caller profile error:', err);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, location.pathname]);

  const handleAcceptCall = async () => {
    if (!incomingCall) return;
    const call = incomingCall;
    setIncomingCall(null);
    setIncomingCaller(null);

    await callService.acceptCall(call.id);

    navigate(`/call/${call.id}`, {
      state: {
        callId: call.id,
        calleeId: user.uid,
        callerId: call.callerId,
        type: call.type,
      },
    });
  };

  const handleRejectCall = async () => {
    if (!incomingCall) return;
    const call = incomingCall;
    setIncomingCall(null);
    setIncomingCaller(null);
    await callService.rejectCall(call.id);
  };

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
    return location.pathname === path;
  };

  // Chat window and call screen should take over the full screen —
  // the bottom nav must NOT render there, otherwise it floats on top
  // of (and hides) the chat's message input box.
  const isChatOpen = location.pathname.startsWith('/chat');
  const isCallOpen = location.pathname.startsWith('/call');
  const hideBottomNav = isChatOpen || isCallOpen;

  return (
    <div className="main-layout">
      <div className={`main-content ${hideBottomNav ? 'chat-open' : ''}`}>
        <Outlet />
      </div>

      {!hideBottomNav && (
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
      )}

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

      {incomingCall && (
        <div className="incoming-call-overlay">
          <div className="incoming-call-card">
            <Avatar
              src={incomingCaller?.photoURL}
              name={incomingCaller?.displayName || 'User'}
              size={72}
            />
            <h3>{incomingCaller?.displayName || 'Unknown'}</h3>
            <p>{incomingCall.type === 'video' ? 'Incoming video call...' : 'Incoming voice call...'}</p>
            <div className="incoming-call-actions">
              <button className="incoming-call-btn reject" onClick={handleRejectCall}>
                <PhoneOff size={24} />
              </button>
              <button className="incoming-call-btn accept" onClick={handleAcceptCall}>
                {incomingCall.type === 'video' ? <Video size={24} /> : <Phone size={24} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainLayout;
