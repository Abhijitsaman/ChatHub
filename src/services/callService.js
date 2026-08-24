import { db } from '../firebase/config';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection,
  addDoc, getDocs, onSnapshot, query, where
} from 'firebase/firestore';
import { FirebaseService } from './firebaseService';

export const callService = {
  async endStaleCalls(userA, userB) {
    const callsRef = collection(db, 'calls');
    const q1 = query(callsRef, where('callerId', '==', userA), where('calleeId', '==', userB), where('status', '==', 'calling'));
    const q2 = query(callsRef, where('callerId', '==', userB), where('calleeId', '==', userA), where('status', '==', 'calling'));

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const staleDocs = [...snap1.docs, ...snap2.docs];

    await Promise.all(
      staleDocs.map((d) =>
        updateDoc(d.ref, { status: 'ended', endedAt: FirebaseService.getTimestamp() })
      )
    );
  },

  async createCall(callerId, calleeId, type) {
    // Clean up any leftover "calling" documents between these two users first
    await this.endStaleCalls(callerId, calleeId);

    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const callRef = doc(db, 'calls', callId);

    await setDoc(callRef, {
      callerId,
      calleeId,
      type,
      status: 'calling',
      createdAtMs: Date.now(),
      createdAt: FirebaseService.getTimestamp(),
      updatedAt: FirebaseService.getTimestamp(),
    });

    return callId;
  },

  async acceptCall(callId) {
    await updateDoc(doc(db, 'calls', callId), {
      status: 'connected',
      acceptedAt: FirebaseService.getTimestamp(),
      updatedAt: FirebaseService.getTimestamp(),
    });
  },

  async rejectCall(callId) {
    await updateDoc(doc(db, 'calls', callId), {
      status: 'rejected',
      endedAt: FirebaseService.getTimestamp(),
      updatedAt: FirebaseService.getTimestamp(),
    });
  },

  async endCall(callId) {
    await updateDoc(doc(db, 'calls', callId), {
      status: 'ended',
      endedAt: FirebaseService.getTimestamp(),
      updatedAt: FirebaseService.getTimestamp(),
    });
  },

  async setOffer(callId, offer) {
    await updateDoc(doc(db, 'calls', callId), {
      offer: JSON.stringify(offer),
      updatedAt: FirebaseService.getTimestamp(),
    });
  },

  async setAnswer(callId, answer) {
    await updateDoc(doc(db, 'calls', callId), {
      answer: JSON.stringify(answer),
      updatedAt: FirebaseService.getTimestamp(),
    });
  },

  async addIceCandidate(callId, candidate) {
    const candidatesRef = collection(db, 'calls', callId, 'candidates');
    await addDoc(candidatesRef, {
      candidate: JSON.stringify(candidate),
      timestamp: FirebaseService.getTimestamp(),
    });
  },

  async getIceCandidates(callId) {
    const candidatesRef = collection(db, 'calls', callId, 'candidates');
    const snapshot = await getDocs(candidatesRef);
    return snapshot.docs.map(d => JSON.parse(d.data().candidate));
  },

  listenCall(callId, callback) {
    return onSnapshot(doc(db, 'calls', callId), (snapshot) => {
      callback(snapshot.exists() ? snapshot.data() : null);
    });
  },

  listenCandidates(callId, callback) {
    const candidatesRef = collection(db, 'calls', callId, 'candidates');
    return onSnapshot(candidatesRef, (snapshot) => {
      const candidateList = snapshot.docs.map(d => JSON.parse(d.data().candidate));
      callback(candidateList);
    });
  },

  async getCall(callId) {
    const snapshot = await getDoc(doc(db, 'calls', callId));
    return snapshot.exists() ? snapshot.data() : null;
  },

  async cleanupCall(callId) {
    await deleteDoc(doc(db, 'calls', callId));
  },

  listenIncomingCalls(userId, callback) {
    const callsRef = collection(db, 'calls');
    const q = query(callsRef, where('calleeId', '==', userId), where('status', '==', 'calling'));
    return onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const incomingCalls = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        // Ignore stale calls older than 45 seconds — prevents "phantom" calls
        .filter(call => !call.createdAtMs || (now - call.createdAtMs) < 45000);
      callback(incomingCalls);
    });
  },
};
