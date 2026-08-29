import { db } from '../firebase/config';
import {
  doc, getDoc, setDoc, updateDoc, collection,
  query, where, getDocs, onSnapshot, limit as fbLimit
} from 'firebase/firestore';
import { FirebaseService } from './firebaseService';

export const userService = {
  async createUserProfile(uid, data) {
    const userRef = doc(db, 'users', uid);
    const profile = {
      uid,
      displayName: data.displayName || '',
      username: data.username || '',
      usernameNormalized: data.username ? data.username.toLowerCase() : '',
      bio: data.bio || '',
      photoURL: data.photoURL || '',
      darkMode: false,
      createdAt: FirebaseService.getTimestamp(),
      lastSeen: FirebaseService.getTimestamp(),
      online: false,
    };
    await setDoc(userRef, profile);
    return profile;
  },

  async getUserProfile(uid) {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  async updateUserProfile(uid, data) {
    const userRef = doc(db, 'users', uid);
    const updates = {};
    if (data.displayName !== undefined) updates.displayName = data.displayName;
    if (data.bio !== undefined) updates.bio = data.bio;
    if (data.photoURL !== undefined) updates.photoURL = data.photoURL;
    if (data.darkMode !== undefined) updates.darkMode = data.darkMode;
    if (data.username !== undefined) {
      updates.username = data.username;
      updates.usernameNormalized = data.username.toLowerCase();
    }
    await updateDoc(userRef, updates);
    return updates;
  },

  async getUserByUsername(username) {
    const usernameNormalized = username.toLowerCase();
    const usernameRef = doc(db, 'usernames', usernameNormalized);
    const snapshot = await getDoc(usernameRef);
    if (snapshot.exists()) {
      const uid = snapshot.data().uid;
      return this.getUserProfile(uid);
    }
    return null;
  },

  async checkUsernameAvailability(username) {
    const usernameNormalized = username.toLowerCase();
    const usernameRef = doc(db, 'usernames', usernameNormalized);
    const snapshot = await getDoc(usernameRef);
    return !snapshot.exists();
  },

  async reserveUsername(uid, username) {
    const usernameNormalized = username.toLowerCase();
    const usernameRef = doc(db, 'usernames', usernameNormalized);
    const snapshot = await getDoc(usernameRef);

    if (snapshot.exists()) {
      throw new Error('Username already taken');
    }

    await setDoc(usernameRef, { uid });
    await this.updateUserProfile(uid, { username });
    return true;
  },

  async updateUsername(uid, newUsername) {
    const oldUser = await this.getUserProfile(uid);
    if (!oldUser) throw new Error('User not found');

    const newUsernameNormalized = newUsername.toLowerCase();
    const usernameRef = doc(db, 'usernames', newUsernameNormalized);
    const snapshot = await getDoc(usernameRef);

    if (snapshot.exists() && snapshot.data().uid !== uid) {
      throw new Error('Username already taken');
    }

    if (oldUser.username) {
      const oldUsernameRef = doc(db, 'usernames', oldUser.username.toLowerCase());
      await setDoc(oldUsernameRef, { uid: null }, { merge: false });
    }

    await setDoc(usernameRef, { uid });
    await this.updateUserProfile(uid, { username: newUsername });
    return true;
  },

  async searchUsers(searchQuery, limitCount = 20) {
    if (!searchQuery || searchQuery.length < 1) return [];

    const searchTerm = searchQuery.toLowerCase();
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    const results = [];
    snapshot.forEach((docSnap) => {
      const user = docSnap.data();
      if (user.username) {
        const usernameLower = user.username.toLowerCase();
        if (usernameLower.includes(searchTerm) || user.displayName?.toLowerCase().includes(searchTerm)) {
          results.push({ ...user, uid: docSnap.id });
        }
      }
    });

    return results.slice(0, limitCount);
  },

  listenPresence(uid, callback) {
    const presenceRef = doc(db, 'presence', uid);
    return onSnapshot(presenceRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.data() : null);
    });
  },

  async updatePresence(uid, online) {
    const presenceRef = doc(db, 'presence', uid);
    await setDoc(presenceRef, {
      online,
      lastSeen: FirebaseService.getTimestamp(),
    });
  },

  async getOnlineStatus(uid) {
    const presenceRef = doc(db, 'presence', uid);
    const snapshot = await getDoc(presenceRef);
    return snapshot.exists() ? snapshot.data() : null;
  },
};
