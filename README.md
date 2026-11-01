# SkillCheck

SkillCheck is a full-stack, real-time technical quiz platform. Choose a topic, difficulty, and question count, then receive an AI-generated quiz, complete it against a timer, and review your results, history, and leaderboard.

## Features

- AI-generated technical quizzes using Groq
- Configurable topic, difficulty, and question count
- Real-time quiz delivery with Socket.IO
- Background generation with BullMQ and Redis
- Timed quizzes with explanations and scoring
- Guest usage with optional Google authentication
- Attempt history and leaderboard
- Local mock-AI mode for development without API usage
- MongoDB persistence for users and quiz attempts

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router, Framer Motion, Recharts |
| Backend | Node.js, Express, TypeScript, Socket.IO |
| AI | Groq API (`openai/gpt-oss-120b` by default) |
| Data and jobs | MongoDB, Mongoose, Redis, BullMQ |
| Authentication | Google OAuth, JWT |
| Infrastructure | Docker Compose |

## Architecture

```text
React + TypeScript
       │
       ├── REST API ───────────────┐
       └── Socket.IO ──────────────┤
                                   ▼
                         Express + Socket.IO
                              │        │
                         BullMQ      Mongoose
                              │        │
                            Redis    MongoDB
                              │
                         Quiz worker
                              │
                          Groq API
```

Quiz generation is asynchronous: the API places a job on the Redis-backed queue and acknowledges the request immediately. A worker calls Groq and emits the completed quiz to the requesting browser through Socket.IO.

## Prerequisites

- Node.js 18 or newer
- npm
- Docker Desktop or Docker Engine with Docker Compose
- A Groq API key for real AI generation
- A Google OAuth client ID for Google sign-in (optional)

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/skillcheck-quiz-platform.git
cd skillcheck-quiz-platform
```

### 2. Start MongoDB and Redis

```bash
docker compose up -d
docker compose ps
```

The services use these local ports:

- MongoDB: `27017`
- Redis: `6379`

### 3. Configure the server

```bash
cd server
cp .env.example .env
```

Edit `.env` and set your credentials:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
MONGO_URI=mongodb://127.0.0.1:27017/skillcheck
REDIS_URL=redis://127.0.0.1:6379
USE_MOCK_AI=false
JWT_SECRET=replace_with_a_secure_secret
GOOGLE_CLIENT_ID=your_google_client_id
```

Never commit `.env` or any file containing credentials.

### 4. Install and start the backend

```bash
npm install
npm run dev
```

The backend runs at `http://localhost:3002`.

### 5. Install and start the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Development Without Groq

To run quiz generation locally without making Groq API requests, set this in `server/.env`:

```env
USE_MOCK_AI=true
```

The server returns deterministic sample quiz data in mock mode.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `GROQ_API_KEY` | Real AI only | Groq API credential |
| `GROQ_MODEL` | No | Groq model ID; defaults to `openai/gpt-oss-120b` |
| `MONGO_URI` | No | MongoDB connection string |
| `REDIS_URL` | No | Redis connection string |
| `USE_MOCK_AI` | No | Set to `true` to use local mock generation |
| `JWT_SECRET` | Auth | Secret used to sign application JWTs |
| `GOOGLE_CLIENT_ID` | Google sign-in | Google OAuth client ID |

The current frontend uses the local backend URL `http://localhost:3002`. Update the frontend API and Socket.IO URLs before deploying to another environment.

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Check server health |
| `POST` | `/api/auth/google` | Authenticate with Google |
| `POST` | `/api/quiz/generate` | Queue quiz generation |
| `POST` | `/api/quiz/save` | Save a quiz attempt |
| `GET` | `/api/quiz/history` | Retrieve attempt history |
| `GET` | `/api/quiz/leaderboard` | Retrieve leaderboard results |

Socket.IO events:

- `quiz_generated` — quiz generation succeeded
- `quiz_error` — quiz generation failed

## Project Structure

```text
client/
  src/
    components/       Quiz UI, history, leaderboard, loading states
    contexts/         Authentication and Socket.IO state
    styles/           Global styles
server/
  src/
    controllers/      Request handling and validation
    models/           MongoDB schemas
    queues/           BullMQ queue and worker
    routes/           API route definitions
    services/         Groq integration
    config/           Database connection
docker-compose.yml    Local MongoDB and Redis services
```

## Useful Commands

### Server

```bash
cd server
npm run dev
```

### Client

```bash
cd client
npm run dev
npm run build
npm run preview
```

### Stop local infrastructure

```bash
docker compose down
```

To remove the persisted local database and Redis volumes as well:

```bash
docker compose down -v
```

## Security Notes

- Keep `server/.env` private.
- Use a strong, unique `JWT_SECRET` outside local development.
- Do not expose API keys in frontend code.
- Restrict CORS and configure production URLs before deployment.
- Rotate credentials immediately if they are accidentally committed or exposed.

## Current Limitations

- Frontend API and Socket.IO URLs are currently hard-coded for local development.
- Production deployment configuration is not included.
- Automated test coverage is limited.

## License

No license has been selected yet. Add a license before accepting external contributions or permitting reuse.

