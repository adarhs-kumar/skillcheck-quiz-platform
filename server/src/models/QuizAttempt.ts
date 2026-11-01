import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Optional until auth is added
  guestUserId: { type: String, required: false },
  topic: { type: String, required: true },
  difficulty: { type: String, required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  timeTaken: { type: Number, required: true },
}, {
  timestamps: true
});

export const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
