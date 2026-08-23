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

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
