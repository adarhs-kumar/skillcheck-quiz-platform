import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectDB } from './config/db';
import quizRouter from './routes/quiz.routes';
import authRouter from './routes/auth.routes';
import { initQuizWorker } from './queues/quiz.worker';

const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.use('/api/quiz', quizRouter);
app.use('/api/auth', authRouter);

// Socket.io setup
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize Queues/Workers
initQuizWorker();

const PORT = process.env.PORT || 3002;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
