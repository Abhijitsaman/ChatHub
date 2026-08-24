import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';

export const blockService = {
  async blockUser(blockerId, blockedId) {
    const blockRef = doc(db, 'blocks', blockerId);
    await setDoc(blockRef, { [blockedId]: true }, { merge: true });
  },

  async unblockUser(blockerId, blockedId) {
    const blockRef = doc(db, 'blocks', blockerId);
    await updateDoc(blockRef, { [blockedId]: deleteField() });
  },

  async isBlocked(blockerId, blockedId) {
    const blockRef = doc(db, 'blocks', blockerId);
    const snapshot = await getDoc(blockRef);
    return snapshot.exists() && snapshot.data()[blockedId] === true;
  },

  async getBlockedUsers(userId) {
    const blockRef = doc(db, 'blocks', userId);
    const snapshot = await getDoc(blockRef);
    if (!snapshot.exists()) return [];
    return Object.keys(snapshot.data());
  },

  async checkAnyBlock(userId1, userId2) {
    const block1 = await this.isBlocked(userId1, userId2);
    const block2 = await this.isBlocked(userId2, userId1);
    return block1 || block2;
  },
};
