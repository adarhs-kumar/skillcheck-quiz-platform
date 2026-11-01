import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  _id: string;
  topic: string;
  difficulty: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  user?: {
    name: string;
    avatar?: string;
  };
}

export const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('http://localhost:3002/api/quiz/leaderboard');
        const data = await res.json();
        if (data.success) {
          setEntries(data.leaderboard);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading leaderboard...</div>;
  }

  return (
    <motion.div 
      className="glass-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '2.5rem', maxWidth: '800px', margin: '0 auto' }}
    >
      <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>Global Leaderboard</h2>
      {entries.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No leaderboard data yet. Be the first!</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-secondary)', textAlign: 'left' }}>
              <th style={{ padding: '1rem', width: '50px' }}>Rank</th>
              <th style={{ padding: '1rem' }}>User</th>
              <th style={{ padding: '1rem' }}>Topic</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Score</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => (
              <tr key={entry._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold', fontSize: '1.2rem', color: idx < 3 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                  #{idx + 1}
                </td>
                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {entry.user ? (
                    <>
                      {entry.user.avatar ? (
                        <img src={entry.user.avatar} alt={entry.user.name} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                      ) : (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {entry.user.name.charAt(0)}
                        </div>
                      )}
                      <span>{entry.user.name}</span>
                    </>
                  ) : (
                    <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>Anonymous</span>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {entry.topic} <span className="badge" style={{ fontSize: '0.65rem' }}>{entry.difficulty}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
                  {entry.score} / {entry.totalQuestions}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                  {Math.floor(entry.timeTaken / 60)}m {entry.timeTaken % 60}s
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </motion.div>
  );
};
