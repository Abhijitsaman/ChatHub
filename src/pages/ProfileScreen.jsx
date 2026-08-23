import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { blockService } from '../services/blockService';
import { conversationService } from '../services/conversationService';
import Avatar from '../components/Avatar';
import { Settings, QrCode, LogOut, MessageCircle, Phone, Video, Ban, UserPlus, X } from 'lucide-react';
import '../styles/ProfileScreen.css';

function ProfileScreen() {
  const { username } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const isOwnProfile = !username || username === user?.username;

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        let profile;
        if (isOwnProfile) {
          profile = await userService.getUserProfile(user.uid);
        } else {
          profile = await userService.getUserByUsername(username);
          if (!profile) {
            throw new Error('User not found');
          }
          const blocked = await blockService.isBlocked(user.uid, profile.uid);
          setIsBlocked(blocked);
        }
        setProfileUser(profile);
      } catch (err) {
        console.error('Load profile error:', err);
        setError('Unable to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user, username, isOwnProfile]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleStartChat = async () => {
    if (!profileUser) return;
    try {
      const conversationId = await conversationService.getOrCreateConversation(
        user.uid,
        profileUser.uid
      );
      navigate(`/chat/${conversationId}`, { state: { otherUserId: profileUser.uid } });
    } catch (err) {
      console.error('Start chat error:', err);
    }
  };

  const handleBlock = async () => {
    if (!profileUser) return;
    try {
      if (isBlocked) {
        await blockService.unblockUser(user.uid, profileUser.uid);
        setIsBlocked(false);
      } else {
        await blockService.blockUser(user.uid, profileUser.uid);
        setIsBlocked(true);
      }
      setShowBlockConfirm(false);
    } catch (err) {
      console.error('Block error:', err);
    }
  };

  if (loading) {
    return (
      <div className="profile-screen">
        <div className="profile-loading">
          <div className="profile-spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="profile-screen">
        <div className="profile-error">
          <p>{error || 'User not found'}</p>
          <button onClick={() => navigate('/chats')}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <button className="profile-back-btn" onClick={() => navigate('/chats')}>
          <X size={24} />
        </button>
        <h1>{isOwnProfile ? 'Profile' : 'User Profile'}</h1>
      </div>

      <div className="profile-content">
        <div className="profile-avatar-section">
          <Avatar
            src={profileUser.photoURL}
            name={profileUser.displayName}
            size={100}
          />
          <h2 className="profile-display-name">{profileUser.displayName}</h2>
          <span className="profile-username">@{profileUser.username}</span>
          {profileUser.bio && (
            <p className="profile-bio">{profileUser.bio}</p>
          )}
        </div>

        <div className="profile-actions">
          {isOwnProfile ? (
            <>
              <button 
                className="profile-action-btn"
                onClick={() => navigate('/qr')}
              >
                <QrCode size={20} />
                <span>My QR</span>
              </button>
              <button 
                className="profile-action-btn"
                onClick={() => navigate('/settings')}
              >
                <Settings size={20} />
                <span>Settings</span>
              </button>
              <button 
                className="profile-action-btn logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <button 
                className="profile-action-btn primary"
                onClick={handleStartChat}
              >
                <MessageCircle size={20} />
                <span>Chat</span>
              </button>
              <button 
                className="profile-action-btn"
                onClick={() => navigate('/call/new', { state: { calleeId: profileUser.uid, type: 'voice', callerId: user.uid } })}
              >
                <Phone size={20} />
                <span>Call</span>
              </button>
              <button 
                className="profile-action-btn"
                onClick={() => navigate('/call/new', { state: { calleeId: profileUser.uid, type: 'video', callerId: user.uid } })}
              >
                <Video size={20} />
                <span>Video</span>
              </button>
              <button 
                className={`profile-action-btn ${isBlocked ? 'unblock-btn' : 'block-btn'}`}
                onClick={() => setShowBlockConfirm(true)}
              >
                <Ban size={20} />
                <span>{isBlocked ? 'Unblock' : 'Block'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {showBlockConfirm && (
        <div className="block-overlay" onClick={() => setShowBlockConfirm(false)}>
          <div className="block-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>{isBlocked ? 'Unblock User?' : 'Block User?'}</h3>
            <p>
              {isBlocked 
                ? 'This user will be able to contact you again.' 
                : 'This user will not be able to contact you or see your online status.'}
            </p>
            <div className="block-actions">
              <button className="block-cancel" onClick={() => setShowBlockConfirm(false)}>
                Cancel
              </button>
              <button className={`block-confirm-btn ${isBlocked ? 'unblock' : 'block'}`} onClick={handleBlock}>
                {isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileScreen;
