import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { messageService } from '../services/messageService';
import { conversationService } from '../services/conversationService';
import { userService } from '../services/userService';
import { blockService } from '../services/blockService';
import MessageBubble from '../components/MessageBubble';
import MessageActions from '../components/MessageActions';
import MessageInfo from '../components/MessageInfo';
import Avatar from '../components/Avatar';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Loader2 } from 'lucide-react';
import '../styles/ChatWindow.css';

function ChatWindow() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const { messages, setMessages, sendMessage } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const otherUserId = location.state?.otherUserId;

  const [otherUser, setOtherUser] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showActions, setShowActions] = useState(null);
  const [showInfo, setShowInfo] = useState(null);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!conversationId || !user) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        let otherId = otherUserId;
        if (!otherId) {
          const convData = await conversationService.getConversation(conversationId);
          if (convData) {
            const participants = Object.keys(convData.participants || {});
            otherId = participants.find(id => id !== user.uid);
          }
        }

        if (otherId) {
          const profile = await userService.getUserProfile(otherId);
          setOtherUser(profile);
          
          const blocked = await blockService.isBlocked(user.uid, otherId);
          setIsBlocked(blocked);
        }

        await messageService.markAllSeen(conversationId, user.uid);
      } catch (err) {
        console.error('Load chat error:', err);
        setError('Unable to load conversation');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const unsubscribe = messageService.listenMessages(conversationId, (msgs) => {
      setMessages(msgs);
      
      const hasUnread = msgs.some(msg => 
        msg.receiverId === user.uid && msg.status !== 'seen' && msg.status !== 'deleted'
      );
      if (hasUnread) {
        messageService.markAllSeen(conversationId, user.uid);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [conversationId, user, otherUserId, setMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || sending || !otherUser) return;
    
    setSending(true);
    try {
      await sendMessage(conversationId, user.uid, otherUser.uid, inputText.trim());
      setInputText('');
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Send error:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBack = () => {
    navigate('/chats');
  };

  const handleCall = (type) => {
    navigate(`/call/new`, { 
      state: { 
        calleeId: otherUser?.uid,
        type,
        callerId: user.uid,
      } 
    });
  };

  const handleMessageAction = (messageId, action) => {
    if (action === 'info') {
      setShowInfo(messageId);
    } else if (action === 'deleteForMe') {
      messageService.deleteForMe(conversationId, messageId, user.uid);
    } else if (action === 'deleteForEveryone') {
      messageService.deleteForEveryone(conversationId, messageId, user.uid);
    }
    setShowActions(null);
  };

  if (loading) {
    return (
      <div className="chat-window">
        <div className="chat-loading">
          <Loader2 className="spinner" size={32} />
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-window">
        <div className="chat-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window" ref={containerRef}>
      <div className="chat-header">
        <button className="chat-back-btn" onClick={handleBack} aria-label="Back">
          <ArrowLeft size={24} />
        </button>
        <Avatar src={otherUser?.photoURL} name={otherUser?.displayName || 'User'} size={36} />
        <div className="chat-header-info">
          <span className="chat-header-name">{otherUser?.displayName || 'Unknown User'}</span>
          {isBlocked && <span className="chat-header-blocked">Blocked</span>}
        </div>
        <div className="chat-header-actions">
          <button 
            className="header-action-btn" 
            onClick={() => handleCall('voice')}
            aria-label="Voice call"
            disabled={isBlocked}
          >
            <Phone size={20} />
          </button>
          <button 
            className="header-action-btn" 
            onClick={() => handleCall('video')}
            aria-label="Video call"
            disabled={isBlocked}
          >
            <Video size={20} />
          </button>
          <button className="header-action-btn" aria-label="More options">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>No messages yet</p>
            <span>Say hello to start the conversation</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === user.uid;
            const isDeletedForMe = msg.deletedFor && msg.deletedFor[user.uid];
            const isDeletedForEveryone = msg.deletedForEveryone;
            
            if (isDeletedForMe) return null;
            
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={isOwn}
                onLongPress={() => setShowActions(msg.id)}
                onInfo={() => setShowInfo(msg.id)}
                isDeleted={isDeletedForEveryone}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {isBlocked ? (
        <div className="chat-blocked-banner">
          <p>You have blocked this user</p>
        </div>
      ) : (
        <div className="chat-composer">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={sending}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            aria-label="Send message"
          >
            {sending ? <Loader2 className="send-spinner" size={20} /> : <Send size={20} />}
          </button>
        </div>
      )}

      {showActions && (
        <MessageActions
          messageId={showActions}
          isOwn={messages.find(m => m.id === showActions)?.senderId === user.uid}
          onClose={() => setShowActions(null)}
          onAction={handleMessageAction}
        />
      )}

      {showInfo && (
        <MessageInfo
          messageId={showInfo}
          conversationId={conversationId}
          onClose={() => setShowInfo(null)}
        />
      )}
    </div>
  );
}

export default ChatWindow;
