import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { callService } from '../services/callService';
import { userService } from '../services/userService';
import { WebRTCService } from '../services/webrtcService';
import Avatar from '../components/Avatar';
import { 
  PhoneOff, Mic, MicOff, Video, VideoOff, ArrowLeft
} from 'lucide-react';
import '../styles/CallScreen.css';

function CallScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { calleeId, type, callerId, callId: stateCallId } = location.state || {};

  const [callId, setCallId] = useState(stateCallId || null);
  const [callee, setCallee] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState(null);

  const webrtcRef = useRef(null);
  const timerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const initializedRef = useRef(false);

  const isCaller = callerId === user?.uid;

  useEffect(() => {
    if (!user || !calleeId) {
      navigate('/chats');
      return;
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    let unsubscribeCall = null;
    let unsubscribeCandidates = null;

    const initializeCall = async () => {
      try {
        const profile = await userService.getUserProfile(calleeId);
        setCallee(profile);

        const webrtc = new WebRTCService();
        webrtcRef.current = webrtc;

        webrtc.onLocalStream = (stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        };

        webrtc.onRemoteStream = (stream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
          setStatus('connected');
        };

        webrtc.onIceConnectionStateChange = (state) => {
          if (state === 'connected') {
            setStatus('connected');
          }
          if (state === 'disconnected' || state === 'failed') {
            setError('Connection lost');
            setStatus('failed');
          }
        };

        if (isCaller) {
          const newCallId = await callService.createCall(user.uid, calleeId, type);
          setCallId(newCallId);

          await webrtc.initiateCall(newCallId, type === 'video', user.uid);

          unsubscribeCall = callService.listenCall(newCallId, (callData) => {
            if (callData?.status === 'rejected') {
              setError('Call declined');
              setStatus('failed');
            }
            if (callData?.status === 'ended') {
              navigate('/chats');
            }
          });

          setStatus('calling');
        } else {
          if (!stateCallId) {
            throw new Error('Call information missing');
          }

          const existingCall = await callService.getCall(stateCallId);
          if (!existingCall) {
            throw new Error('Call not found');
          }

          if (existingCall.offer) {
            await webrtc.handleOffer(stateCallId, JSON.parse(existingCall.offer), user.uid);
            await callService.acceptCall(stateCallId);
          }

          unsubscribeCall = callService.listenCall(stateCallId, async (callData) => {
            if (callData?.status === 'ended') {
              navigate('/chats');
            }
            if (callData?.offer && !webrtc.answered) {
              await webrtc.handleOffer(stateCallId, JSON.parse(callData.offer), user.uid);
              await callService.acceptCall(stateCallId);
            }
          });

          setStatus('calling');
        }

        timerRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);

      } catch (err) {
        console.error('Call initialization error:', err);
        setError(err.message || 'Unable to start call');
        setStatus('failed');
      }
    };

    initializeCall();

    return () => {
      if (unsubscribeCall) unsubscribeCall();
      if (unsubscribeCandidates) unsubscribeCandidates();
      cleanupCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, calleeId]);

  const cleanupCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (webrtcRef.current) {
      webrtcRef.current.cleanup();
    }
  };

  const handleEndCall = async () => {
    cleanupCall();
    if (callId) {
      await callService.endCall(callId);
    }
    navigate('/chats');
  };

  const handleToggleMute = () => {
    if (webrtcRef.current) {
      webrtcRef.current.toggleMute();
      setIsMuted(!isMuted);
    }
  };

  const handleToggleVideo = () => {
    if (webrtcRef.current) {
      webrtcRef.current.toggleVideo();
      setIsVideoOff(!isVideoOff);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="call-screen">
        <div className="call-error">
          <PhoneOff size={48} />
          <h3>Call Failed</h3>
          <p>{error}</p>
          <button className="call-end-btn" onClick={() => navigate('/chats')}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="call-screen">
      <div className="call-header">
        <button className="call-back-btn" onClick={handleEndCall}>
          <ArrowLeft size={24} />
        </button>
        <div className="call-header-info">
          <span className="call-header-name">{callee?.displayName || 'User'}</span>
          <span className="call-header-status">
            {status === 'connected' ? formatDuration(duration) :
             status === 'calling' ? 'Calling...' :
             status === 'connecting' ? 'Connecting...' : status}
          </span>
        </div>
      </div>

      <div className="call-video-container">
        {type === 'video' ? (
          <>
            <video ref={remoteVideoRef} className="call-remote-video" autoPlay playsInline />
            <video ref={localVideoRef} className="call-local-video" autoPlay playsInline muted />
          </>
        ) : (
          <div className="call-audio-avatar">
            <Avatar src={callee?.photoURL} name={callee?.displayName} size={120} />
          </div>
        )}
      </div>

      <div className="call-controls">
        <button
          className={`call-control-btn ${isMuted ? 'active' : ''}`}
          onClick={handleToggleMute}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        {type === 'video' && (
          <button
            className={`call-control-btn ${isVideoOff ? 'active' : ''}`}
            onClick={handleToggleVideo}
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>
        )}

        <button className="call-control-btn end-call" onClick={handleEndCall}>
          <PhoneOff size={28} />
        </button>
      </div>
    </div>
  );
}

export default CallScreen;
