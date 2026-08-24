import { db } from '../firebase/config';
import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection,
  getDocs, onSnapshot, query, where
} from 'firebase/firestore';
import { FirebaseService } from './firebaseService';
import { messageService } from './messageService';

export const conversationService = {
  getConversationId(userId1, userId2) {
    const sorted = [userId1, userId2].sort();
    return `conv_${sorted.join('_')}`;
  },

  async getConversation(conversationId) {
    const snapshot = await getDoc(doc(db, 'conversations', conversationId));
    return snapshot.exists() ? snapshot.data() : null;
  },

  async getOrCreateConversation(userId1, userId2) {
    const conversationId = this.getConversationId(userId1, userId2);
    const convRef = doc(db, 'conversations', conversationId);
    const snapshot = await getDoc(convRef);

    if (!snapshot.exists()) {
      await setDoc(convRef, {
        participants: { [userId1]: true, [userId2]: true },
        createdAt: FirebaseService.getTimestamp(),
        lastMessage: '',
        lastMessageAt: null,
        lastSenderId: null,
      });
    }

    return conversationId;
  },

  async getOtherUserProfile(userId) {
    const snapshot = await getDoc(doc(db, 'users', userId));
    return snapshot.exists() ? snapshot.data() : null;
  },

  async getUserConversations(userId) {
    const convRef = collection(db, 'conversations');
    const q = query(convRef, where(`participants.${userId}`, '==', true));
    const snapshot = await getDocs(q);

    const userConversations = [];
    for (const docSnap of snapshot.docs) {
      const conv = docSnap.data();
      const otherUserId = Object.keys(conv.participants).find(id => id !== userId);
      const userProfile = await this.getOtherUserProfile(otherUserId);
      const unreadCount = await messageService.getUnreadCount(docSnap.id, userId);

      userConversations.push({
        id: docSnap.id,
        otherUserId,
        otherUser: userProfile,
        lastMessage: conv.lastMessage || '',
        lastMessageAt: conv.lastMessageAt || null,
        unreadCount,
        participants: conv.participants,
      });
    }

    userConversations.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });

    return userConversations;
  },

  async updateConversationLastMessage(conversationId, message) {
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: message.text,
      lastMessageAt: message.createdAt || FirebaseService.getTimestamp(),
      lastSenderId: message.senderId,
    });
  },

  listenConversations(userId, callback) {
    const convRef = collection(db, 'conversations');
    const q = query(convRef, where(`participants.${userId}`, '==', true));

    return onSnapshot(q, async (snapshot) => {
      const userConversations = [];
      for (const docSnap of snapshot.docs) {
        const conv = docSnap.data();
        const otherUserId = Object.keys(conv.participants).find(id => id !== userId);
        const userProfile = await this.getOtherUserProfile(otherUserId);

        userConversations.push({
          id: docSnap.id,
          otherUserId,
          otherUser: userProfile,
          lastMessage: conv.lastMessage || '',
          lastMessageAt: conv.lastMessageAt || null,
          participants: conv.participants,
        });
      }

      userConversations.sort((a, b) => {
        const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return timeB - timeA;
      });

      callback(userConversations);
    });
  },

  async deleteConversation(conversationId) {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const msgSnapshot = await getDocs(messagesRef);
    await Promise.all(msgSnapshot.docs.map(d => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'conversations', conversationId));
  },
};
