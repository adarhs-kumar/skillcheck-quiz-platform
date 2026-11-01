import { io } from 'socket.io-client';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;
const API_URL = `http://localhost:${PORT}/api/quiz/generate`;
const SOCKET_URL = `http://localhost:${PORT}`;

async function runTest() {
  console.log('Starting quiz flow test...');
  
  // 1. Connect socket
  const socket = io(SOCKET_URL);
  
  socket.on('connect', async () => {
    console.log(`✅ Connected to WebSocket with ID: ${socket.id}`);
    
    try {
      console.log(`Sending POST request to ${API_URL}...`);
      // 2. Trigger generation
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'React Hooks Basics',
          socketId: socket.id
        })
      });
      
      const data = await response.json();
      console.log(`✅ API Response [${response.status}]:`, data);
      console.log('⏳ Waiting for quiz_generated event over WebSocket...');
    } catch (err: any) {
      console.error('❌ API Request failed:', err.message);
      socket.disconnect();
      process.exit(1);
    }
  });

  // 3. Listen for result
  socket.on('quiz_generated', (data) => {
    console.log('\n🎉 Received quiz_generated event via WebSocket!');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.quiz && data.quiz.difficulty) {
      console.log(`\n✅ Verified difficulty field: ${data.quiz.difficulty}`);
    } else {
      console.error('\n❌ Missing difficulty field in response!');
    }
    
    socket.disconnect();
    process.exit(0);
  });

  socket.on('quiz_error', (data) => {
    console.error('\n❌ Received quiz_error event:', data);
    socket.disconnect();
    process.exit(1);
  });
  
  socket.on('connect_error', (err) => {
    console.error('❌ Socket connection error:', err.message);
    process.exit(1);
  });
}

runTest();
