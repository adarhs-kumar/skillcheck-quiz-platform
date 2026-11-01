import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_MESSAGES = [
  "Analyzing topic...",
  "Querying Llama 3...",
  "Validating question structure...",
  "Finalizing quiz..."
];

export const LoadingScreen: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className="glass-panel"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}
    >
      <div className="spinner" style={{ width: '60px', height: '60px', marginBottom: '2rem', borderWidth: '4px' }}></div>
      
      <div style={{ height: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.h3
            key={messageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}
          >
            {LOADING_MESSAGES[messageIndex]}
          </motion.h3>
        </AnimatePresence>
      </div>
      
      <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        This usually takes a few seconds.
      </p>
    </motion.div>
  );
};
