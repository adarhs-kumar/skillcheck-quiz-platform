import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface Attempt {
  _id: string;
  topic: string;
  difficulty: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  createdAt: string;
}

export const History: React.FC = () => {
  const [history, setHistory] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, guestUserId } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch(`http://localhost:3002/api/quiz/history?guestUserId=${guestUserId}`, {
          headers
        });
        const data = await res.json();
        if (data.success) {
          setHistory(data.history);
        }
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token, guestUserId]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading history...</div>;
  }

  return (
    <motion.div 
      className="glass-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '2.5rem', maxWidth: '800px', margin: '0 auto' }}
    >
      <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '2rem' }}>My Quiz History</h2>
      {history.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No quizzes taken yet. Go generate one!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.map((attempt) => (
            <div key={attempt._id} style={{ 
              background: 'rgba(255,255,255,0.03)', 
              padding: '1.5rem', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {attempt.topic} 
                  <span className="badge" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>{attempt.difficulty}</span>
                </h3>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {new Date(attempt.createdAt).toLocaleDateString()} at {new Date(attempt.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                  {attempt.score} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ {attempt.totalQuestions}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {Math.floor(attempt.timeTaken / 60)}m {attempt.timeTaken % 60}s
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
