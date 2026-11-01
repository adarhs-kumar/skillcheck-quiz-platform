import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { groqService } from '../services/groq.service';
import { io } from '../index'; // We will export `io` from index.ts

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });

export function initQuizWorker() {
  const worker = new Worker('quiz-generation', async (job: Job) => {
    const { topic, socketId, difficulty = 'Intermediate', questionCount = 5 } = job.data;
    console.log(`[Worker] Processing job ${job.id} for topic: "${topic}" (${difficulty}, ${questionCount} Qs) (Socket: ${socketId})`);

    try {
      // Generate Quiz via Groq (Llama 3)
      const quiz = await groqService.generateQuiz(topic, difficulty, questionCount);
      
      // Emit back to the specific user via Socket.io
      if (socketId) {
        io.to(socketId).emit('quiz_generated', {
          success: true,
          quiz
        });
        console.log(`[Worker] Emitted quiz_generated to socket ${socketId}`);
      }
      
      return quiz;
    } catch (error: any) {
      console.error(`[Worker] Job ${job.id} failed:`, error.message);
      
      if (socketId) {
        io.to(socketId).emit('quiz_error', {
          success: false,
          error: error.message || 'Failed to generate quiz'
        });
      }
      throw error;
    }
  }, {
    connection: redisConnection,
    concurrency: 5 // Process up to 5 generations concurrently
  });

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} has completed!`);
  });

  worker.on('failed', (job, err) => {
    console.log(`[Worker] Job ${job?.id} has failed with ${err.message}`);
  });

  return worker;
}
