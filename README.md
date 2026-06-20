# 🧠 AI Practice Coach

An **AI-powered coaching platform** that learns from a user's performance over time,
identifies weaknesses, builds personalized training plans, generates exercises, tracks
improvement, and acts as a long-term coach.

> **Typing is only the first skill module.** The architecture is designed to add more
> skills (Coding, Interview Prep, Vocabulary, Language Learning) without major refactoring.

> Status: 🌱 Phase 1 (MVP) — in progress ·
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

> Setup commands will be filled in once the `web` and `api` apps are scaffolded.
> Planned: `npm install` per app, a MongoDB Atlas connection string via `.env`, and
> `npm run dev` to run frontend and backend locally.

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
