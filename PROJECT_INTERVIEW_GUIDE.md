# SkillCheck — Project Interview Guide

This guide summarizes the implementation in this repository for technical interview preparation. It describes current behavior and flags known limitations; avoid presenting planned improvements as implemented features.

## Project overview

SkillCheck is a full-stack technical quiz application. Users choose a topic, difficulty, and question count; the app generates quiz questions with Groq (`openai/gpt-oss-120b` by default), delivers them asynchronously, runs a timed quiz, and stores attempts for history and a leaderboard. It supports guest usage and Google sign-in.

### End-to-end flow

1. The React client connects to the Socket.IO server and obtains a socket ID.
2. It posts topic, difficulty, question count, and socket ID to the quiz generation endpoint.
3. Express enqueues a BullMQ job in Redis and immediately returns HTTP 202 with a job ID.
4. A worker calls Groq, parses the JSON response, and emits `quiz_generated` (or `quiz_error`) to the requesting socket.
5. The client presents a timed quiz, calculates the result, and saves an attempt to MongoDB.
6. History and leaderboard screens read saved attempts from MongoDB.

## Architecture

```text
React + TypeScript (Vite)
  ├── REST requests: auth, generation, save, history, leaderboard
  └── Socket.IO client: quiz_generated / quiz_error
                 │
                 ▼
Express + TypeScript + Socket.IO (default port 3002)
  ├── Auth and quiz routes/controllers
  ├── BullMQ producer ─── Redis
  └── Mongoose ────────── MongoDB
            BullMQ worker ── Groq API or mock generator
                    └─────── emits result to browser socket
```

| Area | Files | Responsibility |
|---|---|---|
| Frontend orchestration | `client/src/App.tsx` | Views, auth callback, generation request, socket events |
| Frontend UI | `client/src/components/` | Quiz form/display, results, history, leaderboard, loading |
| Frontend shared state | `client/src/contexts/` | Auth/local storage and Socket.IO connection |
| Server bootstrap | `server/src/index.ts` | Express, CORS/JSON middleware, Socket.IO, routes, worker and startup |
| API | `server/src/routes/`, `server/src/controllers/` | Endpoint definitions, validation, queueing, queries and saves |
| Background jobs | `server/src/queues/` | BullMQ queue and worker (concurrency 5) |
| AI integration | `server/src/services/groq.service.ts` | Prompt, JSON response request, parsing, mock mode |
| Persistence | `server/src/models/`, `server/src/config/db.ts` | MongoDB schemas and connection |
| Local infrastructure | `docker-compose.yml` | Redis 7 and MongoDB 6 with persistent volumes |

### Key design decisions

- Queueing keeps potentially slow AI generation out of the HTTP request path. The API acknowledges the job immediately; Redis/BullMQ manages background processing.
- Socket.IO provides an event-driven way to deliver the completed result to the requesting browser. The job stores the client's socket ID.
- `USE_MOCK_AI=true` enables local mock generation without a Groq API call.
- Attempts can reference a signed-in user or a client-generated guest ID.

## APIs and events

Base URL hardcoded in the current client: `http://localhost:3002`.

| Method/path | Route auth middleware | Request | Behavior/response |
|---|---|---|---|
| `GET /health` | No | — | `{ status: "ok" }` |
| `POST /api/auth/google` | No | `{ token }` Google credential | Verifies credential, finds/creates user, returns `{ success, token, user }`; returned token is the app JWT. |
| `POST /api/quiz/generate` | No | `{ topic, socketId, difficulty?, questionCount? }` | Enqueues work; returns HTTP 202 `{ message, jobId }`. Quiz arrives over Socket.IO. Defaults are `Intermediate` and 5. |
| `POST /api/quiz/save` | `requireAuth` (currently permissive) | `{ topic, difficulty, score, totalQuestions, timeTaken, guestUserId? }` | Saves an attempt; returns HTTP 201 `{ success, attempt }`. |
| `GET /api/quiz/history` | `requireAuth` (currently permissive) | Bearer app JWT or `?guestUserId=...` | Up to 50 matching attempts, newest first. |
| `GET /api/quiz/leaderboard` | No | — | Up to 10 attempts, sorted by score descending then time ascending; user details are populated if present. |

Generation example:

```json
{
  "topic": "React Hooks",
  "socketId": "socket-id-from-client",
  "difficulty": "Intermediate",
  "questionCount": 5
}
```

The generated quiz shape is `{ title, difficulty, questions }`. Each question is expected to have `{ question, options, correctAnswerIndex, explanation }`, with four options and a zero-based correct answer index.

| Socket.IO event | Payload |
|---|---|
| `quiz_generated` | `{ success: true, quiz }` |
| `quiz_error` | `{ success: false, error }` |

## Authentication and data

The browser obtains a Google credential and posts it to `/api/auth/google`. The server verifies it using `google-auth-library`, finds or creates a MongoDB user by email, then signs an internal JWT with a 7-day expiry. The frontend stores the app JWT/user in local storage and sends `Authorization: Bearer <JWT>`.

The guest ID is generated once in browser local storage (`skillcheck_guest_id`) and accompanies guest saves/history requests.

```text
User: name?, email? (unique/sparse), googleId?, timestamps

QuizAttempt:
  user? -> User ObjectId
  guestUserId?
  topic, difficulty, score, totalQuestions, timeTaken (seconds)
  timestamps
```

## Important code paths

- `client/src/components/QuizForm.tsx`: captures topic, difficulty, count (5/10/15/20), strict-mode toggle.
- `client/src/App.tsx`: posts generation request; listens for generated/error events.
- `server/src/controllers/quiz.controller.ts`: validates topic/socket ID and queues job.
- `server/src/queues/quiz.worker.ts`: processes jobs, calls AI service and emits result; logs completion/failure.
- `server/src/services/groq.service.ts`: builds prompt/schema instructions, requests JSON-object output, parses JSON. Mock mode supplies local questions.
- `client/src/components/QuizDisplay.tsx`: stores answers, runs timer (30 seconds per question), calculates score and saves attempt; results include answer explanations.
- `server/src/models/QuizAttempt.ts`: persistence model used by save/history/leaderboard.

## Local setup

Prerequisites: Node.js/npm and Docker Compose.

1. Start dependencies: `docker compose up -d` (MongoDB port 27017; Redis port 6379).
2. Create/configure `server/.env` (never commit secrets).
3. In `server/`: `npm install`, then `npm run dev` (server defaults to port 3002).
4. In `client/`: `npm install`, then `npm run dev`.
5. Use `USE_MOCK_AI=true` for local quiz generation without Groq. Configure Google OAuth client ID for sign-in.

| Server environment variable | Purpose | Default/note |
|---|---|---|
| `PORT` | HTTP port | `3002` |
| `MONGO_URI` | MongoDB connection | `mongodb://127.0.0.1:27017/skillcheck` |
| `REDIS_URL` | BullMQ Redis connection | `redis://127.0.0.1:6379` |
| `GROQ_API_KEY` | Groq credential | Needed for real generation |
| `GROQ_MODEL` | Groq chat model ID | `openai/gpt-oss-120b` |
| `USE_MOCK_AI` | Mock generation switch | Literal `true` enables it |
| `GOOGLE_CLIENT_ID` | Google credential audience | Needed for proper verification |
| `JWT_SECRET` | Internal JWT signing/verifying | Set a strong private value outside local development |

## Interview-ready explanation

“I built SkillCheck, a React and TypeScript quiz app that generates technical questions from a topic. Generation runs asynchronously: an Express endpoint puts a BullMQ job in Redis, a worker calls Groq, then Socket.IO delivers the quiz to the browser. The frontend handles the timed quiz and results, while MongoDB stores user identities and attempts for history and a leaderboard. Google sign-in and mock AI mode are also included.”

### Topics to explain

1. **Why a queue?** AI generation is slower and less predictable than normal API work. The queue decouples request latency from processing and supports concurrent workers. This implementation does not yet expose a job-status polling endpoint.
2. **Why Socket.IO?** It provides asynchronous result delivery after the HTTP request has completed. The socket ID associates a job with its requesting browser.
3. **How is output formatted?** The prompt includes a JSON schema and Groq is asked for JSON-object output, which the service parses. Parsing alone does not guarantee schema correctness; validation is a worthwhile follow-up.
4. **How does auth work?** Google credential verification, Mongo user lookup/create, internal JWT issuance, and bearer token decoding.
5. **How are guests supported?** A locally persisted guest ID associates attempts without sign-in, but it is not a verified identity.
6. **How could ranking improve?** Rank by normalized accuracy before time so quizzes with different question counts are comparable.

## Current limitations / improvements to discuss honestly

- `requireAuth` currently calls `next()` even when no valid JWT is supplied. Thus routes carrying that middleware are not actually protected; implement a 401 response for protected routes.
- Google auth falls back to `jwt.decode()` if verification fails. Decoding does not verify identity; remove this development fallback for production.
- `JWT_SECRET` has a development fallback. Require a strong configured secret in production.
- Server CORS allows `*`; configure allowed origins for deployment. The frontend API URL is hardcoded to localhost.
- Leaderboard compares raw scores even when quizzes have different lengths; normalize by accuracy.
- AI output is parsed but not validated for requested question count, four choices, or valid answer indexes.
- Strict mode disables backward navigation, but the timer runs in either mode; the UI label says “Timer active” although it is always active.
- Socket delivery depends on the originating socket remaining connected. Persist results and provide job status/retrieval for reconnect resilience.
- `server/scripts/test-quiz-flow.ts` defaults to port 3001, while the server defaults to 3002; align the port before running it.
- Server `npm test` is a placeholder that exits with “no test specified”. Do not claim a test suite exists.

## Repository map

```text
client/src/App.tsx                    Main UI orchestration
client/src/components/                Quiz, history, leaderboard and loading UI
client/src/contexts/                  Auth and Socket.IO contexts
server/src/index.ts                   Express/Socket.IO startup
server/src/routes/                    REST endpoints
server/src/controllers/               HTTP handlers
server/src/queues/                    BullMQ queue and worker
server/src/services/groq.service.ts   AI integration and mock mode
server/src/models/                    Mongoose models
server/src/middleware/                JWT middleware
server/scripts/test-quiz-flow.ts      Manual REST + socket flow script
docker-compose.yml                    Local Redis and MongoDB
```

Prepared from the current source files. Update this guide when implementation changes.
