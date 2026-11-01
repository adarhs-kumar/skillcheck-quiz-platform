import React, { useState } from 'react';

interface QuizFormProps {
  onSubmit: (topic: string, difficulty: string, questionCount: number, isStrictMode: boolean) => void;
  isLoading: boolean;
}

const CATEGORIES = ['React', 'Node.js', 'Java', 'SQL', 'AWS', 'Docker', 'Kubernetes', 'System Design', 'OOPS', 'OS', 'DBMS'];

export const QuizForm: React.FC<QuizFormProps> = ({ onSubmit, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [questionCount, setQuestionCount] = useState(5);
  const [isStrictMode, setIsStrictMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) {
      onSubmit(topic.trim(), difficulty, questionCount, isStrictMode);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '600px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div>
          <label htmlFor="topic" style={{ display: 'block', marginBottom: '1rem', fontWeight: 600, fontSize: '1.1rem' }}>
            What do you want to test your skills on?
          </label>
          <input
            id="topic"
            type="text"
            className="input-field"
            placeholder="e.g., React Hooks, Docker basics..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
            style={{ fontSize: '1.1rem', padding: '1.25rem' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            Or choose a popular topic:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                className="badge"
                style={{ 
                  cursor: 'pointer', 
                  background: topic === cat ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  color: topic === cat ? 'white' : 'var(--text-secondary)',
                  border: '1px solid',
                  borderColor: topic === cat ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setTopic(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="difficulty" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Difficulty
            </label>
            <select
              id="difficulty"
              className="input-field"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={isLoading}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          
          <div style={{ flex: 1 }}>
            <label htmlFor="count" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Questions
            </label>
            <select
              id="count"
              className="input-field"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              disabled={isLoading}
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
              <option value={20}>20 Questions</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
          <input
            type="checkbox"
            id="strictMode"
            checked={isStrictMode}
            onChange={(e) => setIsStrictMode(e.target.checked)}
            disabled={isLoading}
            style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
          />
          <label htmlFor="strictMode" style={{ cursor: 'pointer', fontWeight: 500 }}>
            Strict Mode (Timer active, no going back)
          </label>
        </div>

        <button type="submit" className="btn btn-primary" style={{ padding: '1.25rem', fontSize: '1.1rem', marginTop: '1rem' }} disabled={!topic.trim() || isLoading}>
          {isLoading ? 'Generating...' : 'Generate Quiz'}
        </button>
      </form>
    </div>
  );
};
