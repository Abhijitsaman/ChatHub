import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import QRCode from 'qrcode.react';
import Avatar from '../components/Avatar';
import { ArrowLeft, QrCode as QrIcon, Scan, Copy, Check, Share2 } from 'lucide-react';
import '../styles/QRIdentityScreen.css';

function QRIdentityScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const profileData = await userService.getUserProfile(user.uid);
        setProfile(profileData);
      } catch (err) {
        console.error('Load profile error:', err);
        setError('Unable to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const handleCopy = async () => {
    if (!profile) return;
    const text = `ChatHub User: @${profile.username} (${profile.uid})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  const handleShare = async () => {
    if (!profile) return;
    const text = `Connect with me on ChatHub! My username: @${profile.username}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'ChatHub Profile',
          text: text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share error:', err);
      }
    }
  };

  const qrData = profile ? JSON.stringify({
    type: 'chathub_user',
    uid: profile.uid,
    username: profile.username,
    displayName: profile.displayName,
  }) : '';

  if (loading) {
    return (
      <div className="qr-screen">
        <div className="qr-loading">
          <div className="qr-spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="qr-screen">
        <div className="qr-error">
          <p>{error || 'Unable to load profile'}</p>
          <button onClick={() => navigate('/profile')}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-screen">
      <div className="qr-header">
        <button className="qr-back-btn" onClick={() => navigate('/profile')}>
          <ArrowLeft size={24} />
        </button>
        <h1>My QR Code</h1>
      </div>

      <div className="qr-content">
        <div className="qr-card">
          <div className="qr-avatar">
            <Avatar src={profile.photoURL} name={profile.displayName} size={64} />
          </div>
          <h2 className="qr-display-name">{profile.displayName}</h2>
          <span className="qr-username">@{profile.username}</span>

          <div className="qr-code-container">
            <QRCode
              value={qrData}
              size={200}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#1a1a2e"
            />
          </div>

          <div className="qr-actions">
            <button className="qr-action-btn" onClick={handleCopy}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span>{copied ? 'Copied!' : 'Copy ID'}</span>
            </button>
            <button className="qr-action-btn" onClick={handleShare}>
              <Share2 size={18} />
              <span>Share</span>
            </button>
          </div>

          <div className="qr-id-info">
            <span className="qr-id-label">User ID</span>
            <code className="qr-id-value">{profile.uid}</code>
          </div>
        </div>

        <button className="qr-scan-btn" onClick={() => navigate('/scan')}>
          <Scan size={20} />
          <span>Scan QR Code</span>
        </button>
      </div>
    </div>
  );
}

export default QRIdentityScreen;
