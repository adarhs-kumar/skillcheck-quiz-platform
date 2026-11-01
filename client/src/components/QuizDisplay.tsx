import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';

interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizData {
  title: string;
  difficulty: string;
  questions: Question[];
}

interface QuizDisplayProps {
  quiz: QuizData;
  onReset: () => void;
  isStrictMode: boolean;
}

export const QuizDisplay: React.FC<QuizDisplayProps> = ({ quiz, onReset, isStrictMode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { token, guestUserId } = useAuth();
  
  // Timer state
  const totalSeconds = quiz.questions.length * 30;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);

  const currentQuestion = quiz.questions[currentIndex];
  const isLastQuestion = currentIndex === quiz.questions.length - 1;
  const hasSelectedAnswer = selectedAnswers[currentIndex] !== undefined;

  const submitQuiz = async (finalTime: number) => {
    setIsSubmitted(true);
    setTimeTaken(finalTime);
    
    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) correct++;
    });

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch('http://localhost:3002/api/quiz/save', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic: quiz.title.replace('Mock Quiz: ', ''),
          difficulty: quiz.difficulty,
          score: correct,
          totalQuestions: quiz.questions.length,
          timeTaken: finalTime,
          guestUserId
        })
      });
    } catch (e) {
      console.error('Failed to save quiz attempt', e);
    }
  };

  useEffect(() => {
    if (isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          submitQuiz(totalSeconds);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, totalSeconds]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleNextOrSubmit = () => {
    if (isLastQuestion) {
      submitQuiz(totalSeconds - timeLeft);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const calculateStats = () => {
    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) correct++;
    });
    const wrong = quiz.questions.length - correct;
    const accuracy = Math.round((correct / quiz.questions.length) * 100);
    return { correct, wrong, accuracy };
  };

  if (isSubmitted) {
    const stats = calculateStats();
    const finalTimeTaken = timeTaken ?? (totalSeconds - timeLeft);
    
    const chartData = [
      { name: 'Correct', value: stats.correct, color: '#10b981' }, // success color
      { name: 'Incorrect', value: stats.wrong, color: '#ef4444' }  // error color
    ];

    return (
      <motion.div 
        className="glass-panel" 
        style={{ padding: '3rem', maxWidth: '900px', margin: '0 auto' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Quiz Results Dashboard</h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1.5rem', 
            marginBottom: '2rem' 
          }}>
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Score</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{stats.correct} <span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>/ {quiz.questions.length}</span></div>
            </div>
            
            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Accuracy</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: stats.accuracy >= 70 ? 'var(--success)' : stats.accuracy >= 40 ? '#f59e0b' : 'var(--error)' }}>{stats.accuracy}%</div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Time Taken</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{formatTime(finalTimeTaken)}</div>
            </div>
          </div>

          <div style={{ height: '220px', width: '100%', marginBottom: '2rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <button className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }} onClick={onReset}>
            Take Another Quiz
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', fontSize: '1.5rem' }}>Detailed Review</h3>
          {quiz.questions.map((q, idx) => {
            const userAnswer = selectedAnswers[idx];
            const isCorrect = userAnswer === q.correctAnswerIndex;
            return (
              <motion.div 
                key={idx} 
                style={{ 
                  background: 'rgba(15,23,42,0.6)', 
                  padding: '2rem', 
                  borderRadius: 'var(--radius-lg)',
                  borderLeft: `4px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}`
                }}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', fontSize: '1.25rem', lineHeight: 1.4 }}>
                  <span style={{ 
                    color: isCorrect ? 'var(--success)' : 'var(--error)', 
                    background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                  {q.question}
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                  {q.options.map((opt, optIdx) => {
                    let className = "quiz-option";
                    const isTheCorrectAnswer = optIdx === q.correctAnswerIndex;
                    const isTheUserAnswer = optIdx === userAnswer;
                    
                    if (isTheCorrectAnswer) {
                      className += " correct";
                    } else if (isTheUserAnswer && !isCorrect) {
                      className += " wrong";
                    }
                    
                    return (
                      <div key={optIdx} className={className} style={{ pointerEvents: 'none', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{opt}</span>
                        {isTheUserAnswer && <span style={{ fontWeight: 'bold' }}>(Your Answer)</span>}
                        {isTheCorrectAnswer && !isTheUserAnswer && <span style={{ fontWeight: 'bold' }}>(Correct Answer)</span>}
                      </div>
                    );
                  })}
                </div>
                
                <div style={{ 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  padding: '1.25rem', 
                  borderRadius: 'var(--radius-md)', 
                  borderTop: '2px solid var(--accent-primary)',
                  color: 'var(--text-primary)'
                }}>
                  <strong style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: '0.5rem' }}>💡 Explanation</strong> 
                  <span style={{ lineHeight: 1.6 }}>{q.explanation}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  const progressPercent = ((currentIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '700px', margin: '0 auto', overflowX: 'hidden' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <span className="badge">{quiz.difficulty}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ color: timeLeft < 30 ? 'var(--error)' : 'var(--text-primary)', fontWeight: 600, fontFamily: 'monospace', fontSize: '1.25rem', transition: 'color 0.3s' }}>
            ⏱ {formatTime(timeLeft)}
          </span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
            Question {currentIndex + 1} of {quiz.questions.length}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <motion.div 
            style={{ height: '100%', background: 'var(--accent-primary)', borderRadius: '4px' }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', lineHeight: 1.4 }}>
            {currentQuestion.question}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                className={`quiz-option ${selectedAnswers[currentIndex] === idx ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(idx)}
              >
                {option}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          className="btn" 
          style={{ 
            background: 'transparent', 
            border: '1px solid var(--border-light)', 
            color: 'var(--text-primary)',
            opacity: (currentIndex === 0 || isStrictMode) ? 0.3 : 1 
          }}
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0 || isStrictMode}
          title={isStrictMode ? "Disabled in Strict Mode" : ""}
        >
          Previous
        </button>

        <button 
          className="btn btn-primary"
          onClick={handleNextOrSubmit}
          disabled={!hasSelectedAnswer}
        >
          {isLastQuestion ? 'Submit Quiz' : 'Next Question'}
        </button>
      </div>
    </div>
  );
};
