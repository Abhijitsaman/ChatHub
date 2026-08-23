import { db } from '../firebase/config';
import { ref, get, set, update, push, query, orderByChild, limitToLast, onValue, off } from 'firebase/database';
import { FirebaseService } from './firebaseService';
import { messageService } from './messageService';

export const conversationService = {
  getConversationId(userId1, userId2) {
    const sorted = [userId1, userId2].sort();
    return `conv_${sorted.join('_')}`;
  },

  async getOrCreateConversation(userId1, userId2) {
    const conversationId = this.getConversationId(userId1, userId2);
    const convRef = ref(db, `conversations/${conversationId}`);
    const snapshot = await get(convRef);
    
    if (!snapshot.exists()) {
      const participants = {};
      participants[userId1] = true;
      participants[userId2] = true;
      
      await set(convRef, {
        participants,
        createdAt: FirebaseService.getTimestamp(),
        lastMessage: '',
        lastMessageAt: null,
        lastSenderId: null,
      });
    }
    
    return conversationId;
  },

  async getUserConversations(userId) {
    const conversationsRef = ref(db, 'conversations');
    const snapshot = await get(conversationsRef);
    
    if (!snapshot.exists()) return [];
    
    const conversations = snapshot.val();
    const userConversations = [];
    
    for (const [convId, conv] of Object.entries(conversations)) {
      if (conv.participants && conv.participants[userId]) {
        const otherUserId = Object.keys(conv.participants).find(id => id !== userId);
        const userProfile = await this.getOtherUserProfile(otherUserId);
        
        const lastMessage = conv.lastMessage || '';
        const lastMessageAt = conv.lastMessageAt || null;
        
        const unreadCount = await messageService.getUnreadCount(convId, userId);
        
        userConversations.push({
          id: convId,
          otherUserId,
          otherUser: userProfile,
          lastMessage,
          lastMessageAt,
          unreadCount,
          participants: conv.participants,
        });
      }
    }
    
    userConversations.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });
    
    return userConversations;
  },

  async getOtherUserProfile(userId) {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    return snapshot.val();
  },

  async updateConversationLastMessage(conversationId, message) {
    const convRef = ref(db, `conversations/${conversationId}`);
    await update(convRef, {
      lastMessage: message.text,
      lastMessageAt: message.createdAt || FirebaseService.getTimestamp(),
      lastSenderId: message.senderId,
    });
  },

  listenConversations(userId, callback) {
    const convRef = ref(db, 'conversations');
    return onValue(convRef, async (snapshot) => {
      const conversations = snapshot.val();
      if (!conversations) {
        callback([]);
        return;
      }
      
      const userConversations = [];
      for (const [convId, conv] of Object.entries(conversations)) {
        if (conv.participants && conv.participants[userId]) {
          const otherUserId = Object.keys(conv.participants).find(id => id !== userId);
          const userProfile = await this.getOtherUserProfile(otherUserId);
          
          userConversations.push({
            id: convId,
            otherUserId,
            otherUser: userProfile,
            lastMessage: conv.lastMessage || '',
            lastMessageAt: conv.lastMessageAt || null,
            participants: conv.participants,
          });
        }
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
    const convRef = ref(db, `conversations/${conversationId}`);
    await remove(convRef);
    const messagesRef = ref(db, `messages/${conversationId}`);
    await remove(messagesRef);
  },
};
