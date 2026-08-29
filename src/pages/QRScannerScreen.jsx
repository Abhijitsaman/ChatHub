import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { conversationService } from '../services/conversationService';
import { QrScanner } from '@yudiel/react-qr-scanner';
import Avatar from '../components/Avatar';
import { ArrowLeft, Camera, X, Loader2, UserPlus } from 'lucide-react';
import '../styles/QRScannerScreen.css';

function QRScannerScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [scannedUser, setScannedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSelf, setIsSelf] = useState(false);

  const handleScan = async (result) => {
    if (!result || !scanning) return;

    setScanning(false);
    setLoading(true);
    setError(null);

    try {
      const text = result.text;
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid QR code format');
      }

      if (data.type !== 'chathub_user' || !data.uid) {
        throw new Error('Invalid ChatHub QR code');
      }

      if (data.uid === user.uid) {
        setIsSelf(true);
        setScannedData(data);
        setLoading(false);
        return;
      }

      const profile = await userService.getUserProfile(data.uid);
      if (!profile) {
        throw new Error('User not found');
      }

      setScannedUser(profile);
      setScannedData(data);
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message || 'Unable to scan QR code');
      setTimeout(() => {
        setScanning(true);
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err) => {
    console.error('Scanner error:', err);
    if (err?.name === 'NotAllowedError') {
      setCameraError('Camera access denied. Please allow camera access in your browser settings.');
    } else if (err?.name === 'NotFoundError') {
      setCameraError('No camera found on this device.');
    } else if (!cameraError) {
      setCameraError('Camera error. Please try again.');
    }
  };

  const handleStartChat = async () => {
    if (!scannedUser) return;
    try {
      const conversationId = await conversationService.getOrCreateConversation(
        user.uid,
        scannedUser.uid
      );
      navigate(`/chat/${conversationId}`, { state: { otherUserId: scannedUser.uid } });
    } catch (err) {
      console.error('Start chat error:', err);
      setError('Unable to start conversation');
    }
  };

  const handleReset = () => {
    setScannedData(null);
    setScannedUser(null);
    setIsSelf(false);
    setError(null);
    setScanning(true);
  };

  const handleClose = () => {
    navigate('/qr');
  };

  if (cameraError) {
    return (
      <div className="qr-scanner-screen">
        <div className="qr-scanner-header">
          <button className="qr-scanner-back" onClick={handleClose}>
            <ArrowLeft size={24} />
          </button>
          <h1>Scan QR Code</h1>
        </div>
        <div className="qr-scanner-permission-denied">
          <Camera size={48} />
          <h3>Camera Access Denied</h3>
          <p>{cameraError}</p>
          <button className="qr-scanner-retry" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="qr-scanner-screen">
        <div className="qr-scanner-header">
          <button className="qr-scanner-back" onClick={handleClose}>
            <ArrowLeft size={24} />
          </button>
          <h1>Scan QR Code</h1>
        </div>
        <div className="qr-scanner-loading">
          <Loader2 className="spinner" size={32} />
          <p>Processing QR code...</p>
        </div>
      </div>
    );
  }

  if (scannedData && isSelf) {
    return (
      <div className="qr-scanner-screen">
        <div className="qr-scanner-header">
          <button className="qr-scanner-back" onClick={handleClose}>
            <ArrowLeft size={24} />
          </button>
          <h1>Scan QR Code</h1>
        </div>
        <div className="qr-scanner-result">
          <div className="qr-result-icon">😅</div>
          <h3>That's You!</h3>
          <p>You scanned your own QR code</p>
          <button className="qr-result-action" onClick={handleReset}>
            Scan Again
          </button>
        </div>
      </div>
    );
  }

  if (scannedUser) {
    return (
      <div className="qr-scanner-screen">
        <div className="qr-scanner-header">
          <button className="qr-scanner-back" onClick={handleClose}>
            <ArrowLeft size={24} />
          </button>
          <h1>Scan QR Code</h1>
        </div>
        <div className="qr-scanner-result">
          <Avatar src={scannedUser.photoURL} name={scannedUser.displayName} size={80} />
          <h3>{scannedUser.displayName}</h3>
          <span className="qr-result-username">@{scannedUser.username}</span>
          {scannedUser.bio && <p className="qr-result-bio">{scannedUser.bio}</p>}

          <div className="qr-result-actions">
            <button className="qr-result-action primary" onClick={handleStartChat}>
              <UserPlus size={20} />
              <span>Start Chat</span>
            </button>
            <button className="qr-result-action" onClick={handleReset}>
              Scan Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-scanner-screen">
      <div className="qr-scanner-header">
        <button className="qr-scanner-back" onClick={handleClose}>
          <ArrowLeft size={24} />
        </button>
        <h1>Scan QR Code</h1>
      </div>

      <div className="qr-scanner-container">
        <QrScanner
          onDecode={handleScan}
          onError={handleError}
          constraints={{
            facingMode: 'environment',
          }}
          styles={{
            container: {
              width: '100%',
              height: '100%',
            },
            video: {
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            },
          }}
          components={{
            finder: (
              <div className="qr-viewfinder">
                <div className="qr-viewfinder-corner tl"></div>
                <div className="qr-viewfinder-corner tr"></div>
                <div className="qr-viewfinder-corner bl"></div>
                <div className="qr-viewfinder-corner br"></div>
              </div>
            ),
          }}
        />

        <div className="qr-scanner-overlay">
          <div className="qr-scanner-instructions">
            <Camera size={24} />
            <p>Position QR code within the frame</p>
          </div>
        </div>

        {error && (
          <div className="qr-scanner-error">
            <X size={20} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default QRScannerScreen;
