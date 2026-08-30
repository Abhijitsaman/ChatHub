import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { conversationService } from '../services/conversationService';
import { userService } from '../services/userService';
import { MessageCircle, Loader2 } from 'lucide-react';
import Avatar from '../components/Avatar';
import '../styles/ChatList.css';

function ChatList() {
  const { user } = useAuth();
  const { conversations, setConversations, loadConversations } = useChat();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const loadChats = async () => {
      setLoading(true);
      setError(null);
      try {
        await loadConversations(user.uid);
      } catch (err) {
        console.error('Load chats error:', err);
        setError('Unable to load conversations');
      } finally {
        setLoading(false);
      }
    };

    loadChats();

    const unsubscribe = conversationService.listenConversations(user.uid, (convs) => {
      setConversations(convs);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, loadConversations, setConversations]);

  const toJsDate = (timestamp) => {
    if (!timestamp) return null;
    const date = typeof timestamp.toDate === 'function'
      ? timestamp.toDate()
      : new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  };

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const formatTime = (timestamp) => {
    const date = toJsDate(timestamp);
    if (!date) return '';

    const now = new Date();

    // আজকের মেসেজ হলে সময় দেখাবে
    if (isSameDay(date, now)) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    // গতকালের মেসেজ হলে "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (isSameDay(date, yesterday)) {
      return 'Yesterday';
    }

    // তার আগের হলে DD/MM/YYYY ফরম্যাটে তারিখ
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleChatClick = (conversationId, otherUserId) => {
    navigate(`/chat/${conversationId}`, { state: { otherUserId } });
  };

  if (loading) {
    return (
      <div className="chatlist-container">
        <div className="chatlist-header">
          <h1>Chats</h1>
        </div>
        <div className="chatlist-loading">
          <Loader2 className="spinner" size={32} />
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chatlist-container">
        <div className="chatlist-header">
          <h1>Chats</h1>
        </div>
        <div className="chatlist-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chatlist-container">
      <div className="chatlist-header">
        <h1>Chats</h1>
      </div>

      {conversations.length === 0 ? (
        <div className="chatlist-empty">
          <MessageCircle size={48} />
          <h3>No conversations yet</h3>
          <p>Search for friends to start chatting</p>
          <button className="empty-search-btn" onClick={() => navigate('/search')}>
            Find People
          </button>
        </div>
      ) : (
        <div className="chatlist-items">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className="chat-item"
              onClick={() => handleChatClick(conv.id, conv.otherUserId)}
            >
              <Avatar
                src={conv.otherUser?.photoURL}
                name={conv.otherUser?.displayName || 'User'}
                size={48}
              />
              <div className="chat-item-content">
                <div className="chat-item-top">
                  <span className="chat-item-name">
                    {conv.otherUser?.displayName || 'Unknown User'}
                  </span>
                  <span className="chat-item-time">
                    {formatTime(conv.lastMessageAt)}
                  </span>
                </div>
                <div className="chat-item-bottom">
                  <span className="chat-item-preview">
                    {conv.lastMessage || 'Start chatting'}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span className="chat-item-unread">{conv.unreadCount}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatList;
