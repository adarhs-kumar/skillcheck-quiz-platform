import React, { useState, useEffect } from 'react';
import { useSocket } from './contexts/SocketContext';
import { QuizForm } from './components/QuizForm';
import { QuizDisplay, QuizData } from './components/QuizDisplay';
import { LoadingScreen } from './components/LoadingScreen';
import { Leaderboard } from './components/Leaderboard';
import { History } from './components/History';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { socket, isConnected } = useSocket();
  const { user, login, logout } = useAuth();
  
  const [currentView, setCurrentView] = useState<'quiz' | 'history' | 'leaderboard'>('quiz');
  const [isLoading, setIsLoading] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStrictMode, setIsStrictMode] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('quiz_generated', (data: { success: boolean; quiz: QuizData }) => {
      console.log('Received quiz_generated event', data);
      if (data.success && data.quiz) {
        setQuizData(data.quiz);
        setError(null);
      } else {
        setError('Failed to load quiz data.');
      }
      setIsLoading(false);
    });

    socket.on('quiz_error', (data: { success: boolean; error: string }) => {
      console.error('Received quiz_error event', data);
      setError(data.error || 'An error occurred generating the quiz.');
      setIsLoading(false);
    });

    return () => {
      socket.off('quiz_generated');
      socket.off('quiz_error');
    };
  }, [socket]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await fetch('http://localhost:3002/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });
      const data = await res.json();
      if (data.success) {
        login(data.token, data.user);
      }
    } catch (e) {
      console.error('Login failed', e);
      setError('Login failed. Check server logs.');
    }
  };

  const handleGenerateQuiz = async (topic: string, difficulty: string, questionCount: number, strictMode: boolean) => {
    if (!socket || !socket.id) {
      setError('Not connected to the server. Please try again.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setQuizData(null);
    setIsStrictMode(strictMode);

    try {
      const response = await fetch('http://localhost:3002/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic,
          socketId: socket.id,
          difficulty,
          questionCount
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to start quiz generation');
      }
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setQuizData(null);
    setError(null);
  };

  return (
    <div className="container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="text-gradient" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('quiz')}>SkillCheck</h1>
          <p>AI-Powered Technical Assessments</p>
          {!isConnected && (
            <div style={{ marginTop: '1rem', color: 'var(--error)', fontSize: '0.875rem' }}>
              Disconnected from server...
            </div>
          )}
        </div>

        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            className="btn" 
            style={{ background: 'transparent', color: currentView === 'quiz' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: currentView === 'quiz' ? 'bold' : 'normal', border: 'none', padding: '0.5rem 1rem' }}
            onClick={() => setCurrentView('quiz')}
          >
            New Quiz
          </button>
          <button 
            className="btn" 
            style={{ background: 'transparent', color: currentView === 'history' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: currentView === 'history' ? 'bold' : 'normal', border: 'none', padding: '0.5rem 1rem' }}
            onClick={() => setCurrentView('history')}
          >
            My History
          </button>
          <button 
            className="btn" 
            style={{ background: 'transparent', color: currentView === 'leaderboard' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: currentView === 'leaderboard' ? 'bold' : 'normal', border: 'none', padding: '0.5rem 1rem' }}
            onClick={() => setCurrentView('leaderboard')}
          >
            Leaderboard
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              ) : (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {user.name.charAt(0)}
                </div>
              )}
              <span style={{ fontWeight: 500 }}>{user.name}</span>
              <button 
                onClick={logout}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', padding: '0.25rem' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.error('Login Failed')}
              theme="filled_black"
              shape="pill"
            />
          )}
        </div>
      </header>

      <main style={{ position: 'relative', marginTop: '2rem' }}>
        {error && (
          <div style={{ background: 'var(--error-glow)', color: 'var(--error)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', border: '1px solid var(--error)' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {currentView === 'history' && <History />}
        {currentView === 'leaderboard' && <Leaderboard />}
        
        {currentView === 'quiz' && (
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <LoadingScreen />
              </motion.div>
            )}

            {!isLoading && !quizData && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <QuizForm onSubmit={handleGenerateQuiz} isLoading={isLoading} />
              </motion.div>
            )}

            {!isLoading && quizData && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{quizData.title}</h2>
                </div>
                <QuizDisplay quiz={quizData} onReset={handleReset} isStrictMode={isStrictMode} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

export default App;
