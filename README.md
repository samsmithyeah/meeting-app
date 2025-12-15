# Meeting Facilitator App

A real-time meeting facilitation app for gathering and revealing team responses simultaneously. Perfect for retrospectives, brainstorming sessions, and team feedback.

## Features

- **Create meetings** with custom questions
- **Share join codes** for easy participant access
- **Real-time answer submission** via Socket.io
- **Simultaneous reveal** of all answers
- **AI-powered summaries** of responses (via OpenAI)
- **Optional anonymity** - facilitator chooses per-meeting
- **Optional timers** per question
- **Mobile-friendly** participant view

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, Socket.io
- **Database**: PostgreSQL via Supabase
- **Cache**: Redis (for real-time session state)
- **AI**: OpenAI API (GPT-4o-mini)

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Redis (local or cloud)
- OpenAI API key (optional, for AI summaries)

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy the contents of `supabase-schema.sql` and run it
4. Go to **Settings > API** and copy:
   - Project URL
   - anon/public key

### 3. Redis Setup

**Option A: Local Redis (for development)**

```bash
# macOS with Homebrew
brew install redis
brew services start redis

# Or run directly
redis-server
```

**Option B: Cloud Redis**

- [Upstash](https://upstash.com) - Free tier available
- [Redis Cloud](https://redis.com/try-free/)

### 4. OpenAI Setup (Optional)

1. Get an API key from [platform.openai.com](https://platform.openai.com/api-keys)
2. Add to your server `.env` file

### 5. Configure Environment

```bash
# In the server directory
cd server
cp .env.example .env
```

Edit `.env` with your credentials:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-your-key-here
PORT=3001
CLIENT_URL=http://localhost:5173
```

### 6. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 7. Start the Application

**Terminal 1 - Start the server:**

```bash
cd server
npm run dev
```

**Terminal 2 - Start the client:**

```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

### As a Facilitator

1. Click **Create a Meeting**
2. Enter a title and add your questions
3. Configure options (anonymity, time limits)
4. Click **Create Meeting**
5. Share the participant code with your team
6. Click **Start Meeting** when everyone has joined
7. Click **Start Question** to begin collecting answers
8. Click **Reveal Answers** when ready (or wait for timer)
9. Discuss the AI summary and answers
10. Click **Next Question** to continue

### As a Participant

1. Click **Join a Meeting**
2. Enter the 6-character code shared by your facilitator
3. Enter your name
4. Wait for questions to appear
5. Type your answer(s) and submit
6. View revealed answers and discussion

## Project Structure

```
meeting-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context (Socket.io)
│   │   ├── pages/          # Route pages
│   │   └── ...
│   └── ...
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── config/          # Supabase, Redis setup
│   │   ├── routes/         # REST API endpoints
│   │   ├── services/       # AI service
│   │   ├── socket/         # Socket.io handlers
│   │   └── index.ts        # Entry point
│   └── ...
└── supabase-schema.sql     # Database schema
```

## API Endpoints

| Method | Endpoint                     | Description              |
| ------ | ---------------------------- | ------------------------ |
| POST   | /api/meetings                | Create a new meeting     |
| GET    | /api/meetings/code/:code     | Get meeting by join code |
| POST   | /api/meetings/:id/start      | Start the meeting        |
| POST   | /api/meetings/:id/questions  | Add questions            |
| POST   | /api/questions/:id/summarize | Generate AI summary      |

## Socket.io Events

| Event            | Direction     | Description             |
| ---------------- | ------------- | ----------------------- |
| join-meeting     | Client→Server | Participant joins       |
| facilitator-join | Client→Server | Facilitator joins       |
| start-question   | Client→Server | Begin accepting answers |
| submit-answer    | Client→Server | Submit answer(s)        |
| reveal-answers   | Client→Server | Reveal all answers      |
| question-started | Server→Client | Question is active      |
| answers-revealed | Server→Client | Answers + summary       |

## Troubleshooting

**Redis connection errors:**

- Ensure Redis is running: `redis-cli ping` should return `PONG`
- Check your `REDIS_URL` in `.env`

**Supabase errors:**

- Verify your API keys are correct
- Ensure the schema was created successfully
- Check Supabase dashboard for any errors

**Socket.io not connecting:**

- Check that the server is running on port 3001
- Verify CORS settings match your client URL

## License

MIT
