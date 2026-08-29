import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Eye } from 'lucide-react';
import '../styles/MessageBubble.css';

function MessageBubble({ message, isOwn, onLongPress, onInfo, isDeleted }) {
  const [showTimestamp, setShowTimestamp] = useState(false);

  const toJsDate = (timestamp) => {
    if (!timestamp) return null;
    const date = typeof timestamp.toDate === 'function'
      ? timestamp.toDate()
      : new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  };

  const formatTime = (timestamp) => {
    const date = toJsDate(timestamp);
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = () => {
    if (isDeleted) return null;
    if (!isOwn) return null;

    if (message.status === 'seen') {
      return <Eye size={14} className="status-icon seen" />;
    }
    if (message.status === 'delivered') {
      return <CheckCheck size={14} className="status-icon delivered" />;
    }
    return <Check size={14} className="status-icon sent" />;
  };

  const handleClick = () => {
    setShowTimestamp(!showTimestamp);
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress();
    }
  };

  const handleInfo = () => {
    if (onInfo) {
      onInfo();
    }
  };

  let pressTimer = null;
  const handleTouchStart = () => {
    pressTimer = setTimeout(() => {
      handleLongPress();
    }, 500);
  };

  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  const handleTouchMove = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  if (isDeleted) {
    return (
      <div className={`message-bubble-wrapper ${isOwn ? 'own' : 'other'}`}>
        <div className="message-bubble deleted">
          <span className="deleted-text">This message was deleted</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`message-bubble-wrapper ${isOwn ? 'own' : 'other'}`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
        <div className="message-text">{message.text}</div>
        <div className="message-footer">
          <span className="message-time">{formatTime(message.createdAt)}</span>
          <div className="message-status">
            {getStatusIcon()}
          </div>
        </div>
        {showTimestamp && isOwn && (
          <div className="message-timestamp-detail">
            {formatTime(message.createdAt)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default MessageBubble;
