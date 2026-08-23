import { db } from '../firebase/config';
import { ref, get, set, push, update, remove, query, orderByChild, limitToLast, onValue, off, serverTimestamp } from 'firebase/database';
import { FirebaseService } from './firebaseService';
import { conversationService } from './conversationService';

export const messageService = {
  async sendMessage(conversationId, senderId, receiverId, text) {
    const messagesRef = ref(db, `messages/${conversationId}`);
    const newMessageRef = push(messagesRef);
    
    const message = {
      senderId,
      receiverId,
      text: text.trim(),
      createdAt: FirebaseService.getTimestamp(),
      status: 'sent',
      deletedFor: {},
      deletedForEveryone: false,
    };
    
    await set(newMessageRef, message);
    const messageId = newMessageRef.key;
    
    await conversationService.updateConversationLastMessage(conversationId, {
      text: text.trim(),
      senderId,
      createdAt: FirebaseService.getTimestamp(),
    });
    
    return { ...message, id: messageId };
  },

  async getMessages(conversationId, limit = 30) {
    const messagesRef = ref(db, `messages/${conversationId}`);
    const messagesQuery = query(messagesRef, orderByChild('createdAt'), limitToLast(limit));
    const snapshot = await get(messagesQuery);
    
    if (!snapshot.exists()) return [];
    
    const messages = snapshot.val();
    const messageList = Object.entries(messages).map(([id, msg]) => ({
      id,
      ...msg,
    }));
    
    return messageList.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });
  },

  listenMessages(conversationId, callback) {
    const messagesRef = ref(db, `messages/${conversationId}`);
    const messagesQuery = query(messagesRef, orderByChild('createdAt'));
    
    return onValue(messagesQuery, (snapshot) => {
      const messages = snapshot.val();
      if (!messages) {
        callback([]);
        return;
      }
      
      const messageList = Object.entries(messages).map(([id, msg]) => ({
        id,
        ...msg,
      }));
      
      messageList.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
      
      callback(messageList);
    });
  },

  async markDelivered(conversationId, messageId) {
    const msgRef = ref(db, `messages/${conversationId}/${messageId}`);
    await update(msgRef, {
      status: 'delivered',
      deliveredAt: FirebaseService.getTimestamp(),
    });
  },

  async markSeen(conversationId, messageId) {
    const msgRef = ref(db, `messages/${conversationId}/${messageId}`);
    await update(msgRef, {
      status: 'seen',
      seenAt: FirebaseService.getTimestamp(),
    });
  },

  async markAllSeen(conversationId, userId) {
    const messagesRef = ref(db, `messages/${conversationId}`);
    const snapshot = await get(messagesRef);
    
    if (!snapshot.exists()) return;
    
    const messages = snapshot.val();
    const updates = {};
    
    for (const [msgId, msg] of Object.entries(messages)) {
      if (msg.receiverId === userId && msg.status !== 'seen' && msg.status !== 'deleted') {
        updates[`${msgId}/status`] = 'seen';
        updates[`${msgId}/seenAt`] = FirebaseService.getTimestamp();
      }
    }
    
    if (Object.keys(updates).length > 0) {
      const path = `messages/${conversationId}`;
      const updatesWithPath = {};
      for (const [key, value] of Object.entries(updates)) {
        updatesWithPath[`${path}/${key}`] = value;
      }
      await update(ref(db), updatesWithPath);
    }
  },

  async getUnreadCount(conversationId, userId) {
    const messages = await this.getMessages(conversationId, 50);
    return messages.filter(msg => msg.receiverId === userId && msg.status !== 'seen' && msg.status !== 'deleted').length;
  },

  async deleteForMe(conversationId, messageId, userId) {
    const msgRef = ref(db, `messages/${conversationId}/${messageId}`);
    const snapshot = await get(msgRef);
    const message = snapshot.val();
    
    if (!message) throw new Error('Message not found');
    
    const deletedFor = message.deletedFor || {};
    deletedFor[userId] = true;
    
    await update(msgRef, { deletedFor });
  },

  async deleteForEveryone(conversationId, messageId, userId) {
    const msgRef = ref(db, `messages/${conversationId}/${messageId}`);
    const snapshot = await get(msgRef);
    const message = snapshot.val();
    
    if (!message) throw new Error('Message not found');
    if (message.senderId !== userId) throw new Error('Cannot delete another user\'s message');
    
    await update(msgRef, {
      deletedForEveryone: true,
      text: 'This message was deleted',
      status: 'deleted',
    });
  },

  async getMessageStatus(conversationId, messageId) {
    const msgRef = ref(db, `messages/${conversationId}/${messageId}`);
    const snapshot = await get(msgRef);
    return snapshot.val();
  },
};
