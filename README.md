# Lumo

A guided programming learning platform that teaches beginners to think like programmers — through structured exercises, real-time diagnostics, and mentor feedback.

Lumo is not a chatbot and not a code generator. It is a learning system with a clear pedagogical model: the learner works through exercises, submits answers, receives targeted feedback, and advances only when they demonstrate understanding.

## Problem & Motivation

Learning to program is hard — not because information is scarce, but because beginners lack two things:

- **Feedback on their thinking**, not just their syntax
- **Structured progression** that builds confidence through practice

Most platforms either dump static content (courses) or hand out solutions (AI chatbots). Neither teaches the learner to reason independently.

## Solution

Lumo provides a structured learning path where every exercise is backed by:

- **AST-based diagnostics** that catch real code issues (syntax errors, undefined names, type mismatches, infinite loops)
- **A mentor engine** that responds with hints, encouragement, and next-action guidance — never full solutions
- **Correctness gating** — the learner advances only when their answer passes validation

The mentor adapts its tone based on the learner's skill level and confidence, making feedback more supportive for beginners and more concise for experienced users.

## Real User Flow

```
1. Sign up / Log in (JWT auth)
2. Complete onboarding questionnaire
   → System builds a learner profile (skill level, learning style, pacing)
   → System initializes learning state (starting module + exercise)
3. Fetch current exercise
   → Exercise includes: prompt, instructions, starter code, answer mode
4. Submit answer
   → Text mode: compare against expected output
   → Code mode: run AST diagnostics, check for errors
5. Receive feedback
   → Diagnostics summary (error/warning counts)
   → Mentor response (hint + encouragement + next action)
6. Advance only if passed == true
   → Next exercise in module, or next module, or curriculum complete
```

## Core Features

- **JWT authentication** — signup, login, token-based session management
- **Onboarding profiler** — determines skill level, learning style, and pacing from questionnaire responses
- **Curriculum-as-data** — modules and exercises defined in YAML, loaded at runtime
- **Two answer modes**:
  - `text` — learner predicts output; validated against `expected_output`
  - `code` — learner writes code; validated via AST-based static analysis
- **AST diagnostics engine** — detects syntax errors, indentation errors, undefined names, type mismatches, possible infinite loops
- **Mentor response engine** — rule-driven, template-based guidance adapted to learner profile
- **Pacing-aware exercise selection** — fast-track learners can skip exercises; normal/slow learners progress sequentially
- **Structured observability** — per-request trace IDs, HMAC-hashed user refs, structured log fields
- **Full persistence** — users, profiles, learning state, exercise snapshots, and attempts stored in SQLite via SQLModel

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI, Uvicorn |
| Database | SQLite via SQLModel (Pydantic + SQLAlchemy) |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Code Analysis | Python `ast` standard library |
| Curriculum | YAML (PyYAML) |
| Frontend | React 19, TypeScript 5.9, Vite 8 |
| UI | TailwindCSS 4, Lucide icons |
| Editor | CodeMirror 6 (Python mode) |
| Data Fetching | React Query (TanStack), React Hook Form + Zod |
| Routing | React Router 7 |
| Containerization | Docker Compose (Python 3.11-slim + Node 20-slim) |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│  React + CodeMirror + React Query                   │
│  Vite dev server proxies /api → backend:8000        │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│               FastAPI Backend                        │
│                                                      │
│  ┌─────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Auth   │  │  API Routes  │  │  Middleware     │  │
│  │ signup  │  │  onboarding  │  │  request log    │  │
│  │ login   │  │  exercise    │  │  trace_id       │  │
│  │ JWT     │  │  attempt     │  │  duration       │  │
│  └─────────┘  └──────┬───────┘  └────────────────┘  │
│                      │                               │
│  ┌───────────────────▼───────────────────────────┐   │
│  │           Deterministic Core                   │   │
│  │  UserProfilerAgent  · CurriculumAgent          │   │
│  │  MentorAgent        · DiagnosticsEngine (AST)  │   │
│  │  ExerciseSelector   · CurriculumLoader (YAML)  │   │
│  └───────────────────┬───────────────────────────┘   │
│                      │                               │
│  ┌───────────────────▼───────────────────────────┐   │
│  │         Database (SQLModel + SQLite)           │   │
│  │  User · UserState · UserProfileRecord          │   │
│  │  ExerciseInstance · Attempt                    │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  ┌───────────────────────────────────────────────┐   │
│  │         Observability                          │   │
│  │  Structured logging · trace_id · user_ref      │   │
│  │  HMAC-SHA256 hashing · email masking           │   │
│  └───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app + request logging middleware
│   │   ├── api/
│   │   │   ├── auth.py              # Signup, login, JWT dependency
│   │   │   ├── routes.py            # Onboarding, exercise, attempt endpoints
│   │   │   └── schemas.py           # Request/response models
│   │   ├── agents/
│   │   │   ├── user_profiler.py     # Onboarding → UserProfile
│   │   │   ├── curriculum.py        # Profile → CurriculumPlan
│   │   │   └── mentor.py            # Diagnostics → MentorResponse
│   │   ├── core/
│   │   │   ├── diagnostics.py       # AST-based code analysis
│   │   │   ├── curriculum_loader.py # YAML curriculum loading
│   │   │   ├── exercise_selector.py # Pacing-aware next exercise
│   │   │   ├── security.py          # JWT + password hashing
│   │   │   └── constants.py         # CURRICULUM_VERSION = "v1"
│   │   ├── db/
│   │   │   ├── models.py            # SQLModel tables
│   │   │   ├── session.py           # Engine + session factory
│   │   │   └── repositories/        # CRUD per entity
│   │   ├── models/                   # Domain models (Pydantic)
│   │   └── observability/            # Logging, trace IDs, user hashing
│   ├── scripts/
│   │   └── seed_db.py               # Schema init + test user seeding
│   ├── tests/                        # 192 tests
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/                     # HTTP client + API modules
│   │   ├── features/
│   │   │   ├── auth/                # Login, signup, token storage
│   │   │   ├── learning/            # Exercise fetch, attempt submit
│   │   │   └── onboarding/          # Onboarding flow
│   │   ├── components/              # UI components
│   │   ├── routes/                  # Route guards + paths
│   │   └── pages/                   # Page components
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── curriculum/
│   └── v1/
│       ├── python_basic.md          # Human-readable curriculum design
│       └── python_basic.yaml        # Machine-readable exercise definitions
├── docker-compose.yml
├── requirements.txt
└── pytest.ini
```

## Getting Started

### Docker (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

To run in detached mode:

```bash
docker compose up --build -d
```

To stop and remove containers:

```bash
docker compose down
```

To stop and remove containers including the database volume:

```bash
docker compose down -v
```

### Local Development

**Backend:**

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp backend/.env.example backend/.env

# Seed the database (creates schema + test user)
python -m backend.scripts.seed_db

# Start the server
uvicorn backend.app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxies /api to backend on port 8000)
npm run dev
```

## Commands

### Backend

| Command | Description |
|---------|-------------|
| `uvicorn backend.app.main:app --reload --port 8000` | Start dev server |
| `python -m pytest backend/tests/ -q` | Run tests |
| `python -m backend.scripts.seed_db` | Seed database |

### Frontend

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Type-check + production build |
| `npm run lint` | Run ESLint |

### Docker

| Command | Description |
|---------|-------------|
| `docker compose up --build` | Build and start all services |
| `docker compose up --build -d` | Build and start in background |
| `docker compose down` | Stop and remove containers |
| `docker compose down -v` | Stop, remove containers and volumes |
| `docker compose logs -f backend` | Follow backend logs |
| `docker compose logs -f frontend` | Follow frontend logs |

## Environment Variables

Configured in `backend/.env` (see `backend/.env.example`):

| Variable | Purpose | Default |
|----------|---------|---------|
| `LUMO_JWT_SECRET` | JWT signing secret | Insecure dev fallback (with warning) |
| `LUMO_LOG_SALT` | HMAC salt for user ID hashing in logs | Insecure dev fallback (with warning) |
| `LUMO_SEED_USER_PASSWORD` | Password for seed user `test@lumo.dev` | `lumo-dev-123` |

Docker Compose sets these automatically for development. For production, set real values.

## Demo Flow

**Step-by-step walkthrough of a new user session:**

1. **Signup** — `POST /auth/signup` with name, email, password → receive JWT token
2. **Onboarding** — `POST /users/{id}/onboarding` with experience level, goals, pace preference → system returns skill level, learning style, pacing
3. **Fetch exercise** — `GET /users/{id}/current-exercise` → returns exercise prompt, instructions, starter code, and `answer_mode` (`"text"` or `"code"`)
4. **Submit attempt** — `POST /users/{id}/attempt` with answer
   - If `answer_mode == "text"`: answer is compared to `expected_output`
   - If `answer_mode == "code"`: answer is parsed and analyzed via AST
5. **Receive response** — `passed` boolean + diagnostics summary + mentor feedback (hint, encouragement, next action)
6. **If passed**: state advances to next exercise (or next module, or curriculum complete)
7. **If not passed**: state stays, learner retries with mentor guidance

**Test user:** `test@lumo.dev` / password from `LUMO_SEED_USER_PASSWORD` (default: `lumo-dev-123`)

## Observability & Logging

All backend logs use structured fields for correlation and privacy:

- **`trace_id`** — unique per-request correlation ID, generated by HTTP middleware and shared across API → repository → agent layers
- **`user_ref`** — HMAC-SHA256 hash of user UUID (format: `u_<12hex>`), never raw IDs in logs
- **`stage`** — component identifier (`http`, `api`, `auth`, `repo`, `agent`)
- **Email masking** — emails logged as `d***@example.com`
- **Request middleware** — logs method, path, status code, and duration for every request

No raw passwords, tokens, or unmasked user identifiers appear in logs.

## Current MVP Scope

### Implemented

- Full auth flow (signup, login, JWT, route guards)
- Onboarding → profile + learning state initialization
- Curriculum loading from YAML (6 modules, multiple exercise types)
- Two answer modes (text prediction + code writing)
- AST-based diagnostics (5 diagnostic codes)
- Rule-driven mentor feedback with tone adaptation
- Pacing-aware exercise selection and advancement
- Full persistence layer (users, profiles, state, exercise snapshots, attempts)
- Structured observability with trace correlation
- Docker Compose deployment
- 192 passing backend tests

### Not Implemented

- Real-time code execution / sandboxing
- LLM-powered mentor (current mentor is rule-driven / template-based)
- Multiple programming languages
- PostgreSQL (currently SQLite)
- Production deployment (HTTPS, secrets management)
- Redis / caching

## Known Limitations

- **SQLite** — single-writer, not suitable for concurrent production load. Schema is SQLModel-based and portable to PostgreSQL.
- **No code execution** — diagnostics are static (AST-only). The system detects structural issues but does not run learner code.
- **Rule-based mentor** — mentor responses use templates and heuristics, not an LLM. Effective for MVP but limited in nuance.
- **Single curriculum track** — Python basics only (v1). Curriculum is data-driven so adding tracks is straightforward.
- **Frontend `tsc` strict mode** — one pre-existing type error in the HTTP client (parameter property syntax vs `erasableSyntaxOnly`). Does not affect Vite builds.

## Future Improvements

- LLM-integrated mentor with pedagogical guardrails
- Code execution sandbox for runtime validation
- PostgreSQL for production persistence
- Additional curriculum tracks and programming languages
- Adaptive difficulty based on attempt history
- Learner analytics dashboard
- Performance instrumentation (OpenTelemetry)
