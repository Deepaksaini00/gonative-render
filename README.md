# 🌐 LangLearn — AI-Powered Language Learning (Hindi → English)

A full-stack web app that teaches English to Hindi speakers using Gemini AI. The AI generates lessons, explains concepts in Hindi, quizzes learners, corrects mistakes instantly, and provides daily revision.

---

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Framer Motion, Zustand |
| Backend | FastAPI (Python), SQLAlchemy (async), SQLite |
| AI | Google Gemini 1.5 Flash API |
| Auth | JWT (python-jose + passlib bcrypt) |

---

## 📁 Project Structure

```
langlearn/
├── backend/
│   ├── app/
│   │   ├── api/           # FastAPI route handlers
│   │   │   ├── auth.py    # Register / Login / Me
│   │   │   ├── lessons.py # List, get, generate, seed lessons
│   │   │   ├── quiz.py    # Submit quiz, daily review
│   │   │   ├── chat.py    # AI tutor chat
│   │   │   └── progress.py# User stats
│   │   ├── core/
│   │   │   ├── config.py  # Settings from .env
│   │   │   ├── database.py# Async SQLAlchemy engine
│   │   │   └── security.py# JWT + password hashing
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── gemini_service.py  # All Gemini AI calls
│   │   │   ├── lesson_service.py  # Lesson CRUD + generation
│   │   │   └── user_service.py    # User CRUD
│   │   └── main.py        # FastAPI app + CORS + lifespan
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   ├── DashboardPage.tsx  # Lesson list + stats
    │   │   ├── LessonPage.tsx     # Vocab, grammar, dialogue, AI chat
    │   │   ├── QuizPage.tsx       # Quiz with instant AI feedback
    │   │   ├── DailyReviewPage.tsx# Morning revision quiz
    │   │   └── ProfilePage.tsx    # XP, streak, history
    │   ├── components/
    │   │   └── dashboard/Layout.tsx  # Sidebar navigation
    │   ├── store/authStore.ts     # Zustand auth state
    │   ├── lib/
    │   │   ├── api.ts             # Axios client
    │   │   └── utils.ts           # Helpers, XP calc
    │   ├── types/index.ts         # TypeScript types
    │   └── App.tsx                # Routes
    ├── package.json
    └── vite.config.ts
```

---

## ⚙️ Setup

### 1. Prerequisites

- Node.js 18+
- Python 3.11+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set your GEMINI_API_KEY

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be live at: `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be at: `http://localhost:5173`

---

### 4. First-Time Usage

1. Open `http://localhost:5173`
2. Register an account
3. On the Dashboard, click **"Generate Lessons"** — this calls Gemini to create your first 3 lessons
4. Click any lesson to start learning
5. After reading the lesson, click **"Take Quiz"**
6. Come back tomorrow and use **Daily Review** to revise

---

## 🤖 How the AI Works

### Lesson Generation (`/api/lessons/generate` or `/api/lessons/seed`)
Gemini receives a structured prompt specifying:
- Source language (Hindi), target language (English)
- Level (Beginner/Elementary/Intermediate)
- Category (greetings, grammar, numbers, etc.)

It returns a JSON lesson with: vocabulary, grammar rules, a bilingual dialogue, summary, and study tips — all with Hindi explanations.

### Quiz Generation
After lesson creation, Gemini generates 8 quiz questions:
- Multiple choice (4 options)
- Translation questions
- Fill-in-the-blank

### Instant Correction
When a learner answers wrong, Gemini generates a personalized correction message mixing Hindi and English — like a real teacher would speak.

### Daily Review
Gemini creates 5 fresh questions based on the last 3 completed lessons, so learners revise what they've studied.

### AI Tutor Chat
An in-lesson chat interface where learners can ask questions in Hindi or English. Gemini responds bilingually, using lesson context to give relevant answers.

---

## 🎮 Features

| Feature | Description |
|---------|-------------|
| 📚 AI Lessons | Gemini generates full structured lessons per topic |
| 🧪 Quizzes | 8-question quiz after each lesson, 70% to pass |
| 💬 Instant Feedback | AI explains each wrong answer in Hindi+English |
| 🌅 Daily Review | 5 questions every day from recent lessons |
| 🤖 AI Tutor Chat | Ask anything about the lesson in real-time |
| ⭐ XP System | Earn XP for passing quizzes, level up |
| 🔥 Streaks | Daily streak tracking |
| 🔒 Lesson Unlock | Complete lessons in order (previous must pass 70%) |
| 📊 Progress Tracking | Score history, avg score, completion % |

---

## 🔑 Environment Variables

```env
# backend/.env
GEMINI_API_KEY=your_key_here
SECRET_KEY=change_this_to_a_random_string
DATABASE_URL=sqlite+aiosqlite:///./langlearn.db
CORS_ORIGINS=http://localhost:5173
```

---

## 🚀 Production Deployment

### Backend (e.g. Render, Railway)
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```
Set environment variables in your platform dashboard.

### Frontend (e.g. Vercel, Netlify)
```bash
npm run build
# Deploy the dist/ folder
```
Update `vite.config.ts` proxy target or set `VITE_API_URL` to your backend URL.

---

## 📦 Adding More Languages

The app is built for Hindi→English but supports any language pair. To add a new pair:
1. Users select `native_language` and `target_language` at registration
2. All Gemini prompts use these variables
3. The curriculum categories in `gemini_service.py` work for any language

---

## 🛠️ API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/auth/me` | Current user |
| GET | `/api/lessons` | All lessons with progress |
| POST | `/api/lessons/seed` | Generate first 3 lessons |
| GET | `/api/lessons/:id` | Single lesson |
| GET | `/api/lessons/:id/questions` | Quiz questions |
| POST | `/api/quiz/submit` | Submit answers, get AI feedback |
| GET | `/api/quiz/daily-review/full` | Today's review questions |
| POST | `/api/chat` | Chat with AI tutor |
| GET | `/api/progress/stats` | User statistics |
