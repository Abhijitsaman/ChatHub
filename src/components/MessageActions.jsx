import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Trash2, X } from 'lucide-react';
import '../styles/MessageActions.css';

function MessageActions({ messageId, isOwn, onClose, onAction }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleAction = (action) => {
    onAction(messageId, action);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="message-actions-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        ref={overlayRef}
      >
        <motion.div
          className="message-actions-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="message-actions-header">
            <span className="message-actions-title">Message Actions</span>
            <button className="message-actions-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="message-actions-list">
            <button 
              className="message-action-item"
              onClick={() => handleAction('info')}
            >
              <Info size={20} />
              <span>Message Info</span>
            </button>

            {isOwn && (
              <>
                <button 
                  className="message-action-item"
                  onClick={() => handleAction('deleteForMe')}
                >
                  <Trash2 size={20} color="#f87171" />
                  <span style={{ color: '#f87171' }}>Delete for Me</span>
                </button>
                <button 
                  className="message-action-item"
                  onClick={() => handleAction('deleteForEveryone')}
                >
                  <Trash2 size={20} color="#ef4444" />
                  <span style={{ color: '#ef4444' }}>Delete for Everyone</span>
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default MessageActions;
