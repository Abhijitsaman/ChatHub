export class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.answered = false;
    this.isMuted = false;
    this.isVideoOff = false;
    this.onLocalStream = null;
    this.onRemoteStream = null;
    this.onIceConnectionStateChange = null;
    this.onTrack = null;
    
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };
  }

  async initPeerConnection() {
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    
    this.peerConnection = new RTCPeerConnection(this.configuration);
    
    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.onIceConnectionStateChange) {
        this.onIceConnectionStateChange(this.peerConnection.iceConnectionState);
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams.length > 0) {
        this.remoteStream = event.streams[0];
        if (this.onRemoteStream) {
          this.onRemoteStream(this.remoteStream);
        }
        if (this.onTrack) {
          this.onTrack(event);
        }
      }
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    return this.peerConnection;
  }

  async getLocalStream(includeVideo = true) {
    try {
      const constraints = {
        audio: true,
        video: includeVideo ? {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      
      if (this.onLocalStream) {
        this.onLocalStream(stream);
      }

      return stream;
    } catch (error) {
      console.error('Get media error:', error);
      
      // Try with audio only if video fails
      if (includeVideo && error.name !== 'NotAllowedError') {
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.localStream = audioOnly;
          if (this.onLocalStream) {
            this.onLocalStream(audioOnly);
          }
          return audioOnly;
        } catch (audioError) {
          throw audioError;
        }
      }
      
      throw error;
    }
  }

  async initiateCall(callId, includeVideo = true) {
    try {
      await this.getLocalStream(includeVideo);
      await this.initPeerConnection();

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Send offer via signaling
      const { callService } = await import('./callService');
      await callService.setOffer(callId, offer);

      // Listen for answer
      const unsubscribe = callService.listenCall(callId, async (callData) => {
        if (callData?.answer && !this.answered) {
          const answer = JSON.parse(callData.answer);
          await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          this.answered = true;
        }
      });

      // Listen for ICE candidates
      callService.listenCandidates(callId, async (candidates) => {
        for (const candidate of candidates) {
          try {
            await this.peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } catch (err) {
            console.warn('Add candidate error:', err);
          }
        }
      });

      // Send local ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          callService.addIceCandidate(callId, event.candidate);
        }
      };

      return unsubscribe;
    } catch (error) {
      console.error('Initiate call error:', error);
      throw error;
    }
  }

  async handleOffer(callId, offer) {
    try {
      await this.getLocalStream(true);
      await this.initPeerConnection();

      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      const { callService } = await import('./callService');
      await callService.setAnswer(callId, answer);

      // Listen for ICE candidates
      callService.listenCandidates(callId, async (candidates) => {
        for (const candidate of candidates) {
          try {
            await this.peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } catch (err) {
            console.warn('Add candidate error:', err);
          }
        }
      });

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          callService.addIceCandidate(callId, event.candidate);
        }
      };

      this.answered = true;
    } catch (error) {
      console.error('Handle offer error:', error);
      throw error;
    }
  }

  toggleMute() {
    if (!this.localStream) return;
    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !this.isMuted;
    });
  }

  toggleVideo() {
    if (!this.localStream) return;
    this.isVideoOff = !this.isVideoOff;
    this.localStream.getVideoTracks().forEach(track => {
      track.enabled = !this.isVideoOff;
    });
  }

  cleanup() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }
    this.answered = false;
  }
}
