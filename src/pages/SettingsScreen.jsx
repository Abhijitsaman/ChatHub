import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { blockService } from '../services/blockService';
import Avatar from '../components/Avatar';
import { ArrowLeft, User, Shield, Bell, Users, Info, LogOut, Edit2, Check, X } from 'lucide-react';
import '../styles/SettingsScreen.css';

function SettingsScreen() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const profileData = await userService.getUserProfile(user.uid);
        setProfile(profileData);
        setDisplayName(profileData.displayName || '');
        setBio(profileData.bio || '');
        
        const blocked = await blockService.getBlockedUsers(user.uid);
        setBlockedUsers(blocked);
      } catch (err) {
        console.error('Load settings error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleUpdateProfile = async () => {
    setError(null);
    setSuccess(null);
    
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    try {
      await userService.updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        bio: bio.trim(),
      });
      
      const updatedProfile = await userService.getUserProfile(user.uid);
      setProfile(updatedProfile);
      setSuccess('Profile updated successfully');
      setEditing(false);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Update profile error:', err);
      setError('Unable to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="settings-screen">
        <div className="settings-loading">
          <div className="settings-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <button className="settings-back-btn" onClick={() => navigate('/profile')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Settings</h1>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <div className="settings-section-header">
            <User size={20} />
            <span>Profile</span>
          </div>
          
          <div className="settings-profile-preview">
            <Avatar src={profile?.photoURL} name={profile?.displayName} size={64} />
            <div>
              <div className="settings-profile-name">{profile?.displayName}</div>
              <div className="settings-profile-username">@{profile?.username}</div>
            </div>
          </div>

          {!editing ? (
            <button className="settings-edit-btn" onClick={() => setEditing(true)}>
              <Edit2 size={16} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="settings-edit-form">
              <div className="settings-form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="settings-form-group">
                <label>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={150}
                  rows={2}
                  placeholder="Tell others about yourself..."
                />
              </div>
              {error && <div className="settings-error">{error}</div>}
              {success && <div className="settings-success">{success}</div>}
              <div className="settings-edit-actions">
                <button className="settings-cancel-btn" onClick={() => {
                  setEditing(false);
                  setDisplayName(profile?.displayName || '');
                  setBio(profile?.bio || '');
                  setError(null);
                }}>
                  <X size={16} />
                  Cancel
                </button>
                <button className="settings-save-btn" onClick={handleUpdateProfile}>
                  <Check size={16} />
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="settings-section">
          <div className="settings-section-header">
            <Shield size={20} />
            <span>Privacy</span>
          </div>
          
          <div className="settings-item">
            <div className="settings-item-info">
              <Users size={18} />
              <span>Blocked Users</span>
            </div>
            <span className="settings-item-badge">{blockedUsers.length}</span>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-header">
            <Bell size={20} />
            <span>Notifications</span>
          </div>
          <div className="settings-item">
            <span>Notification preferences</span>
            <span className="settings-item-value">Coming soon</span>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-header">
            <Info size={20} />
            <span>About</span>
          </div>
          <div className="settings-item">
            <span>ChatHub v1.0.0</span>
          </div>
        </div>

        <button className="settings-logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default SettingsScreen;
