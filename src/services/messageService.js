import { db } from '../firebase/config';
import {
  doc, getDoc, updateDoc, collection, addDoc,
  getDocs, onSnapshot, query, orderBy, limit, writeBatch
} from 'firebase/firestore';
import { FirebaseService } from './firebaseService';
import { conversationService } from './conversationService';

export const messageService = {
  async sendMessage(conversationId, senderId, receiverId, text) {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');

    const message = {
      senderId,
      receiverId,
      text: text.trim(),
      createdAt: FirebaseService.getTimestamp(),
      status: 'sent',
      deletedFor: {},
      deletedForEveryone: false,
    };

    const docRef = await addDoc(messagesRef, message);

    await conversationService.updateConversationLastMessage(conversationId, {
      text: text.trim(),
      senderId,
      createdAt: FirebaseService.getTimestamp(),
    });

    return { ...message, id: docRef.id };
  },

  async getMessages(conversationId, limitCount = 30) {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  listenMessages(conversationId, callback) {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(messageList);
    });
  },

  async markDelivered(conversationId, messageId) {
    await updateDoc(doc(db, 'conversations', conversationId, 'messages', messageId), {
      status: 'delivered',
      deliveredAt: FirebaseService.getTimestamp(),
    });
  },

  async markSeen(conversationId, messageId) {
    await updateDoc(doc(db, 'conversations', conversationId, 'messages', messageId), {
      status: 'seen',
      seenAt: FirebaseService.getTimestamp(),
    });
  },

  async markAllSeen(conversationId, userId) {
    const messages = await this.getMessages(conversationId, 50);
    const toUpdate = messages.filter(
      msg => msg.receiverId === userId && msg.status !== 'seen' && msg.status !== 'deleted'
    );

    if (toUpdate.length === 0) return;

    const batch = writeBatch(db);
    toUpdate.forEach(msg => {
      const msgRef = doc(db, 'conversations', conversationId, 'messages', msg.id);
      batch.update(msgRef, { status: 'seen', seenAt: FirebaseService.getTimestamp() });
    });
    await batch.commit();
  },

  async getUnreadCount(conversationId, userId) {
    const messages = await this.getMessages(conversationId, 50);
    return messages.filter(msg => msg.receiverId === userId && msg.status !== 'seen' && msg.status !== 'deleted').length;
  },

  async deleteForMe(conversationId, messageId, userId) {
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const snapshot = await getDoc(msgRef);
    const message = snapshot.data();

    if (!message) throw new Error('Message not found');

    const deletedFor = message.deletedFor || {};
    deletedFor[userId] = true;

    await updateDoc(msgRef, { deletedFor });
  },

  async deleteForEveryone(conversationId, messageId, userId) {
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const snapshot = await getDoc(msgRef);
    const message = snapshot.data();

    if (!message) throw new Error('Message not found');
    if (message.senderId !== userId) throw new Error("Cannot delete another user's message");

    await updateDoc(msgRef, {
      deletedForEveryone: true,
      text: 'This message was deleted',
      status: 'deleted',
    });
  },

  async getMessageStatus(conversationId, messageId) {
    const snapshot = await getDoc(doc(db, 'conversations', conversationId, 'messages', messageId));
    return snapshot.exists() ? snapshot.data() : null;
  },
};
