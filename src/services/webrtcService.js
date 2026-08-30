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

    this.userId = null;
    this.callId = null;
    this.processedCandidateIds = new Set();
    this.pendingCandidates = [];
    this.remoteDescriptionSet = false;

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

    // গুরুত্বপূর্ণ: ICE candidate হ্যান্ডলার এখানেই, PeerConnection তৈরি হওয়ার
    // সাথে সাথেই বসানো হচ্ছে — offer/answer তৈরি হওয়ার আগেই। কারণ
    // setLocalDescription() কল করার প্রায় সাথে সাথেই ব্রাউজার candidate
    // তৈরি শুরু করে দেয়; হ্যান্ডলার দেরিতে বসালে প্রথম দিকের candidate
    // গুলো চিরতরে হারিয়ে যায় এবং কানেকশন কখনোই ঠিকভাবে তৈরি হয় না।
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.callId && this.userId) {
        import('./callService').then(({ callService }) => {
          callService.addIceCandidate(this.callId, event.candidate, this.userId);
        });
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

  async _handleIncomingCandidates(items) {
    for (const item of items) {
      if (this.processedCandidateIds.has(item.id)) continue;
      this.processedCandidateIds.add(item.id);

      if (this.remoteDescriptionSet && this.peerConnection) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(item.candidate));
        } catch (err) {
          console.warn('Add candidate error:', err);
        }
      } else {
        this.pendingCandidates.push(item.candidate);
      }
    }
  }

  async _flushPendingCandidates() {
    this.remoteDescriptionSet = true;
    const toAdd = this.pendingCandidates;
    this.pendingCandidates = [];
    for (const candidate of toAdd) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('Add candidate error:', err);
      }
    }
  }

  async initiateCall(callId, includeVideo = true, userId) {
    try {
      this.userId = userId;
      this.callId = callId;

      await this.getLocalStream(includeVideo);
      await this.initPeerConnection(); // onicecandidate হ্যান্ডলার এখানেই বসে যাচ্ছে

      const { callService } = await import('./callService');

      // প্রতিপক্ষের candidate শোনা শুরু হচ্ছে
      callService.listenCandidates(callId, this.userId, (items) => {
        this._handleIncomingCandidates(items);
      });

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      await callService.setOffer(callId, offer);

      const unsubscribe = callService.listenCall(callId, async (callData) => {
        if (callData?.answer && !this.answered) {
          const answer = JSON.parse(callData.answer);
          await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          this.answered = true;
          await this._flushPendingCandidates();
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Initiate call error:', error);
      throw error;
    }
  }

  async handleOffer(callId, offer, userId) {
    try {
      this.userId = userId;
      this.callId = callId;

      await this.getLocalStream(true);
      await this.initPeerConnection(); // onicecandidate হ্যান্ডলার এখানেই বসে যাচ্ছে

      const { callService } = await import('./callService');

      callService.listenCandidates(callId, this.userId, (items) => {
        this._handleIncomingCandidates(items);
      });

      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      await this._flushPendingCandidates();

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      await callService.setAnswer(callId, answer);

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
    this.callId = null;
    this.processedCandidateIds = new Set();
    this.pendingCandidates = [];
    this.remoteDescriptionSet = false;
  }
}
