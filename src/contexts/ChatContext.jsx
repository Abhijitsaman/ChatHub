import React, { createContext, useContext, useState, useCallback } from 'react';
import { conversationService } from '../services/conversationService';
import { messageService } from '../services/messageService';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadConversations = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const convs = await conversationService.getUserConversations(userId);
      setConversations(convs);
      return convs;
    } catch (error) {
      console.error('Load conversations error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const msgs = await messageService.getMessages(conversationId);
      setMessages(msgs);
      return msgs;
    } catch (error) {
      console.error('Load messages error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (conversationId, senderId, receiverId, text) => {
    if (!text.trim()) return;
    try {
      const message = await messageService.sendMessage(
        conversationId,
        senderId,
        receiverId,
        text.trim()
      );
      return message;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }, []);

  const value = {
    activeConversation,
    setActiveConversation,
    conversations,
    setConversations,
    messages,
    setMessages,
    loading,
    loadConversations,
    loadMessages,
    sendMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
