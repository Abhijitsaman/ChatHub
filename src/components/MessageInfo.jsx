import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Check, CheckCheck, Eye } from 'lucide-react';
import { messageService } from '../services/messageService';
import '../styles/MessageInfo.css';

function MessageInfo({ messageId, conversationId, onClose }) {
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMessage = async () => {
      setLoading(true);
      try {
        const msg = await messageService.getMessageStatus(conversationId, messageId);
        setMessage(msg);
      } catch (error) {
        console.error('Load message error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMessage();

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [messageId, conversationId, onClose]);

  const toJsDate = (timestamp) => {
    if (!timestamp) return null;
    const date = typeof timestamp.toDate === 'function'
      ? timestamp.toDate()
      : new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  };

  const formatDateTime = (timestamp) => {
    const date = toJsDate(timestamp);
    if (!date) return null;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = () => {
    if (!message) return '';
    if (message.status === 'seen') return 'Read';
    if (message.status === 'delivered') return 'Delivered';
    return 'Sent';
  };

  const getStatusIcon = () => {
    if (!message) return null;
    if (message.status === 'seen') return <Eye size={16} className="info-status-icon seen" />;
    if (message.status === 'delivered') return <CheckCheck size={16} className="info-status-icon delivered" />;
    return <Check size={16} className="info-status-icon sent" />;
  };

  if (loading) {
    return (
      <div className="message-info-overlay" onClick={onClose}>
        <div className="message-info-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="message-info-loading">
            <div className="message-info-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!message) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="message-info-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="message-info-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="message-info-header">
            <span className="message-info-title">Message Info</span>
            <button className="message-info-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="message-info-content">
            <div className="message-info-preview">
              <div className="message-info-text">{message.text}</div>
            </div>

            <div className="message-info-status-section">
              <div className="message-info-status-item">
                <div className="message-info-status-left">
                  <Clock size={16} className="info-icon" />
                  <span>Sent</span>
                </div>
                <span className="message-info-value">
                  {formatDateTime(message.createdAt) || 'Pending'}
                </span>
              </div>

              <div className="message-info-status-item">
                <div className="message-info-status-left">
                  <Check size={16} className="info-icon" />
                  <span>Delivered</span>
                </div>
                <span className="message-info-value">
                  {message.deliveredAt ? formatDateTime(message.deliveredAt) : 'Not delivered yet'}
                </span>
              </div>

              <div className="message-info-status-item">
                <div className="message-info-status-left">
                  <Eye size={16} className="info-icon" />
                  <span>Read</span>
                </div>
                <span className="message-info-value">
                  {message.seenAt ? formatDateTime(message.seenAt) : 'Not seen yet'}
                </span>
              </div>
            </div>

            <div className="message-info-current-status">
              <div className="info-status-badge">
                {getStatusIcon()}
                <span>Status: {getStatusLabel()}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default MessageInfo;
