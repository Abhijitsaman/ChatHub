import { db } from '../firebase/config';
import { ref, get, set, update, push, query, orderByChild, equalTo, onValue, off } from 'firebase/database';
import { FirebaseService } from './firebaseService';

export const userService = {
  async createUserProfile(uid, data) {
    const userRef = ref(db, `users/${uid}`);
    const profile = {
      uid,
      displayName: data.displayName || '',
      username: data.username || '',
      usernameNormalized: data.username ? data.username.toLowerCase() : '',
      bio: data.bio || '',
      photoURL: data.photoURL || '',
      createdAt: FirebaseService.getTimestamp(),
      lastSeen: FirebaseService.getTimestamp(),
      online: false,
    };
    await set(userRef, profile);
    return profile;
  },

  async getUserProfile(uid) {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    return snapshot.val();
  },

  async updateUserProfile(uid, data) {
    const userRef = ref(db, `users/${uid}`);
    const updates = {};
    if (data.displayName !== undefined) updates.displayName = data.displayName;
    if (data.bio !== undefined) updates.bio = data.bio;
    if (data.photoURL !== undefined) updates.photoURL = data.photoURL;
    if (data.username !== undefined) {
      updates.username = data.username;
      updates.usernameNormalized = data.username.toLowerCase();
    }
    await update(userRef, updates);
    return updates;
  },

  async getUserByUsername(username) {
    const usernameNormalized = username.toLowerCase();
    const usernameRef = ref(db, `usernames/${usernameNormalized}`);
    const snapshot = await get(usernameRef);
    if (snapshot.exists()) {
      const uid = snapshot.val();
      return this.getUserProfile(uid);
    }
    return null;
  },

  async checkUsernameAvailability(username) {
    const usernameNormalized = username.toLowerCase();
    const usernameRef = ref(db, `usernames/${usernameNormalized}`);
    const snapshot = await get(usernameRef);
    return !snapshot.exists();
  },

  async reserveUsername(uid, username) {
    const usernameNormalized = username.toLowerCase();
    const usernameRef = ref(db, `usernames/${usernameNormalized}`);
    const snapshot = await get(usernameRef);
    
    if (snapshot.exists()) {
      throw new Error('Username already taken');
    }

    await set(usernameRef, uid);
    await this.updateUserProfile(uid, { username });
    return true;
  },

  async updateUsername(uid, newUsername) {
    const oldUser = await this.getUserProfile(uid);
    if (!oldUser) throw new Error('User not found');

    const newUsernameNormalized = newUsername.toLowerCase();
    const usernameRef = ref(db, `usernames/${newUsernameNormalized}`);
    const snapshot = await get(usernameRef);
    
    if (snapshot.exists() && snapshot.val() !== uid) {
      throw new Error('Username already taken');
    }

    if (oldUser.username) {
      const oldUsernameRef = ref(db, `usernames/${oldUser.username.toLowerCase()}`);
      await remove(oldUsernameRef);
    }

    await set(usernameRef, uid);
    await this.updateUserProfile(uid, { username: newUsername });
    return true;
  },

  async searchUsers(query, limit = 20) {
    if (!query || query.length < 1) return [];
    
    const searchTerm = query.toLowerCase();
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) return [];
    
    const users = snapshot.val();
    const results = [];
    
    for (const [uid, user] of Object.entries(users)) {
      if (uid === user.uid && user.username) {
        const usernameLower = user.username.toLowerCase();
        if (usernameLower.includes(searchTerm) || user.displayName?.toLowerCase().includes(searchTerm)) {
          results.push({ ...user, uid });
          if (results.length >= limit) break;
        }
      }
    }
    
    return results;
  },

  listenPresence(uid, callback) {
    const presenceRef = ref(db, `presence/${uid}`);
    return onValue(presenceRef, (snapshot) => {
      callback(snapshot.val());
    });
  },

  async updatePresence(uid, online) {
    const presenceRef = ref(db, `presence/${uid}`);
    await set(presenceRef, {
      online,
      lastSeen: FirebaseService.getTimestamp(),
    });
  },

  async getOnlineStatus(uid) {
    const presenceRef = ref(db, `presence/${uid}`);
    const snapshot = await get(presenceRef);
    return snapshot.val();
  },
};
