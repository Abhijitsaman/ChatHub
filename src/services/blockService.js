import { db } from '../firebase/config';
import { ref, get, set, remove, update } from 'firebase/database';
import { FirebaseService } from './firebaseService';

export const blockService = {
  async blockUser(blockerId, blockedId) {
    const blockRef = ref(db, `blocks/${blockerId}/${blockedId}`);
    await set(blockRef, true);
  },

  async unblockUser(blockerId, blockedId) {
    const blockRef = ref(db, `blocks/${blockerId}/${blockedId}`);
    await remove(blockRef);
  },

  async isBlocked(blockerId, blockedId) {
    const blockRef = ref(db, `blocks/${blockerId}/${blockedId}`);
    const snapshot = await get(blockRef);
    return snapshot.exists();
  },

  async getBlockedUsers(userId) {
    const blocksRef = ref(db, `blocks/${userId}`);
    const snapshot = await get(blocksRef);
    if (!snapshot.exists()) return [];
    const blocks = snapshot.val();
    return Object.keys(blocks);
  },

  async checkAnyBlock(userId1, userId2) {
    const block1 = await this.isBlocked(userId1, userId2);
    const block2 = await this.isBlocked(userId2, userId1);
    return block1 || block2;
  },
};
