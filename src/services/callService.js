import { db } from '../firebase/config';
import { ref, get, set, update, remove, push, onValue, off, serverTimestamp } from 'firebase/database';
import { FirebaseService } from './firebaseService';

export const callService = {
  async createCall(callerId, calleeId, type) {
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const callRef = ref(db, `calls/${callId}`);
    
    await set(callRef, {
      callerId,
      calleeId,
      type,
      status: 'calling',
      createdAt: FirebaseService.getTimestamp(),
      updatedAt: FirebaseService.getTimestamp(),
    });
    
    return callId;
  },

  async acceptCall(callId) {
    const callRef = ref(db, `calls/${callId}`);
    await update(callRef, {
      status: 'connected',
      acceptedAt: FirebaseService.getTimestamp(),
      updatedAt: FirebaseService.getTimestamp(),
    });
  },

  async rejectCall(callId) {
    const callRef = ref(db, `calls/${callId}`);
    await update(callRef, {
      status: 'rejected',
      endedAt: FirebaseService.getTimestamp(),
      updatedAt: FirebaseService.getTimestamp(),
    });
  },

  async endCall(callId) {
    const callRef = ref(db, `calls/${callId}`);
    await update(callRef, {
      status: 'ended',
      endedAt: FirebaseService.getTimestamp(),
      updatedAt: FirebaseService.getTimestamp(),
    });
  },

  async setOffer(callId, offer) {
    const callRef = ref(db, `calls/${callId}`);
    await update(callRef, {
      offer: JSON.stringify(offer),
      updatedAt: FirebaseService.getTimestamp(),
    });
  },

  async setAnswer(callId, answer) {
    const callRef = ref(db, `calls/${callId}`);
    await update(callRef, {
      answer: JSON.stringify(answer),
      updatedAt: FirebaseService.getTimestamp(),
    });
  },

  async addIceCandidate(callId, candidate) {
    const candidatesRef = ref(db, `calls/${callId}/candidates`);
    const newCandidateRef = push(candidatesRef);
    await set(newCandidateRef, {
      candidate: JSON.stringify(candidate),
      timestamp: FirebaseService.getTimestamp(),
    });
  },

  async getIceCandidates(callId) {
    const candidatesRef = ref(db, `calls/${callId}/candidates`);
    const snapshot = await get(candidatesRef);
    if (!snapshot.exists()) return [];
    const candidates = snapshot.val();
    return Object.values(candidates).map(c => JSON.parse(c.candidate));
  },

  listenCall(callId, callback) {
    const callRef = ref(db, `calls/${callId}`);
    return onValue(callRef, (snapshot) => {
      callback(snapshot.val());
    });
  },

  listenCandidates(callId, callback) {
    const candidatesRef = ref(db, `calls/${callId}/candidates`);
    return onValue(candidatesRef, (snapshot) => {
      const candidates = snapshot.val();
      if (!candidates) {
        callback([]);
        return;
      }
      const candidateList = Object.values(candidates).map(c => JSON.parse(c.candidate));
      callback(candidateList);
    });
  },

  async getCall(callId) {
    const callRef = ref(db, `calls/${callId}`);
    const snapshot = await get(callRef);
    return snapshot.val();
  },

  async cleanupCall(callId) {
    const callRef = ref(db, `calls/${callId}`);
    await remove(callRef);
  },

  listenIncomingCalls(userId, callback) {
    const callsRef = ref(db, 'calls');
    return onValue(callsRef, (snapshot) => {
      const calls = snapshot.val();
      if (!calls) {
        callback([]);
        return;
      }
      
      const incomingCalls = [];
      for (const [callId, call] of Object.entries(calls)) {
        if (call.calleeId === userId && call.status === 'calling') {
          incomingCalls.push({ id: callId, ...call });
        }
      }
      callback(incomingCalls);
    });
  },
};
