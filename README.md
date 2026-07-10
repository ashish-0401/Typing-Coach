# 🧠 AI Practice Coach

An **AI-powered coaching platform** that learns from a user's performance over time,
identifies weaknesses, builds personalized training plans, generates exercises, tracks
improvement, and acts as a long-term coach.

> **Typing is only the first skill module.** The architecture is designed to add more
> skills (Coding, Interview Prep, Vocabulary, Language Learning) without major refactoring.

> Status: all six phases (MVP through the LangGraph agents) are implemented and run
> locally. The remaining work is shipping it (CI, Docker, hosting). ·
> Full design: [docs/AI-Practice-Coach-Design.md](docs/AI-Practice-Coach-Design.md)

## 🎯 Goals

- Build a real, deployable product — all on **free tiers**.
- Ship the MVP quickly; **introduce AI only after the foundation exists**.
- Keep AI providers replaceable.
- Preserve user history **permanently** so the coach has long-term memory.
- Avoid unnecessary complexity (modular monolith, not microservices).

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Vite, TypeScript, TailwindCSS, React Query, React Router, Zustand, Recharts |
| **Backend** | NestJS, TypeScript (modular monolith) |
| **Database** | MongoDB Atlas (Free Tier) |
| **Auth** | JWT |
| **AI** | Groq API (added in Phase 3) |
| **Deployment** | Vercel (web) · Render (API) · MongoDB Atlas (db) |
| **Tooling** | GitHub · GitHub Actions (CI/CD) · Docker |

**Intentionally avoided** unless justified: Kafka, Redis, microservices, event buses,
vector databases, Kubernetes.

## 🗺️ Roadmap

> All six phases below are implemented and running locally.

| Phase | Focus | Highlights |
|---|---|---|
| **1 — MVP** | Typing platform (no AI yet) | Auth, typing engine (live WPM/accuracy, mistyped-word & backspace tracking), dashboard, session persistence |
| **2** | Learning Profile | Permanent profile updated after every session |
| **3** | AI Diagnosis | Groq analyzes history to find patterns (e.g. IE/EI spelling) |
| **4** | AI Coach | Conversational coach aware of full history |
| **5** | Exercise Generator | Personalized passages targeting weaknesses |
| **6** | Agentic AI | LangGraph agents: Observation → Memory → Diagnosis → Planning → Generation → Evaluation |

## 🧩 Architecture at a Glance

**Backend modules (NestJS):**
`auth` · `users` · `typing` · `sessions` · `learning-profile` · `analytics` · `coach` · `ai` · `agents` · `common`

**Database collections (MongoDB):**
Users · TypingSessions · LearningProfiles · Diagnoses · TrainingPlans · Milestones · CoachConversations · GeneratedExercises

**Frontend pages:**
Login · Register · Dashboard · Typing Test · Session History · Learning Profile · AI Coach · Settings

## 📁 Repository Layout (target)

```text
ai-practice-coach/
├─ apps/
│  ├─ web/          # React + Vite + TypeScript frontend
│  └─ api/          # NestJS backend (modular monolith)
├─ docs/            # Design docs
│  └─ AI-Practice-Coach-Design.md
└─ README.md
```

> The monorepo layout is the target; folders are added as each phase is built.

## 🚀 Getting Started

**Prerequisites:** Node 20+, npm, and a free MongoDB Atlas connection string.

```bash
# 1. Clone
git clone https://github.com/ashish-0401/Typing-Coach.git
cd Typing-Coach

# 2. Backend (apps/api)
cd apps/api
npm install
cp .env.example .env      # fill in MONGODB_URI, JWT_SECRET, GROQ_API_KEY
npm run start:dev         # serves http://localhost:3000

# 3. Frontend (apps/web), in a second terminal
cd apps/web
npm install
npm run dev               # serves http://localhost:5173
```

The web app calls the API at `http://localhost:3000` by default; override it with
`VITE_API_URL` in `apps/web/.env`. To run both in containers instead, set the API
environment variables and run `docker compose up --build` from the repo root.

## 📝 How WPM & Accuracy Are Measured

- **WPM** = (characters typed ÷ 5) ÷ minutes elapsed — the standard "word = 5 chars" definition.
- **Accuracy** = correct characters ÷ total characters typed, as a percentage.

## ⏱️ Constraints

Built in roughly **1 hour/day**, optimizing for simplicity, maintainability, fast
delivery, and portfolio quality. Target: production-quality MVP in **6–8 weeks**.

## 📄 License

Personal portfolio project — license to be decided.

---

> 📝 **Note:** The GitHub repo is currently named `Typing-Coach` and will be renamed to
> reflect **AI Practice Coach** later.
