# AI Practice Coach — Project Instructions

These instructions apply to all work in this repository. Copilot reads them automatically on every request.
Full design lives in [docs/AI-Practice-Coach-Design.md](../docs/AI-Practice-Coach-Design.md).

## What this project is

**AI Practice Coach** is an AI-powered coaching platform that learns from a user's performance,
identifies weaknesses, builds training plans, generates exercises, and acts as a long-term coach.
**Typing is only the first skill module** — the architecture must support future modules
(Coding, Interview Prep, Vocabulary, Language Learning) **without major refactoring**.

## Guiding principles

- Ship a deployable MVP first; **introduce AI only after the foundation exists** (Phase 3+).
- Keep everything on **free tiers**. Optimize for simplicity, maintainability, and fast delivery.
- Prefer a **modular monolith** — do NOT add microservices, Kafka, Redis, event buses, vector
  databases, or Kubernetes unless explicitly justified and requested.
- Keep AI providers **replaceable** — isolate Groq behind an `ai` module/interface.
- Preserve user history **permanently** (long-term memory is a core requirement).

## Tech stack

- **Frontend:** React + Vite + TypeScript, TailwindCSS, React Query (server state),
  React Router, Zustand (client state), Recharts (charts).
- **Backend:** NestJS + TypeScript, modular monolith.
- **Database:** MongoDB Atlas (Mongoose schemas).
- **Auth:** JWT.
- **AI:** Groq API (Phase 3+); later LangGraph agents (Phase 6).
- **Deploy:** Vercel (web), Render (api), MongoDB Atlas (db). CI/CD via GitHub Actions; Docker.

Do not introduce other major dependencies without asking.

## Architecture conventions

- **Backend NestJS modules:** `auth`, `users`, `typing`, `sessions`, `learning-profile`,
  `analytics`, `coach`, `ai`, `agents`, `common`. Each module defines controllers, services,
  DTOs (with validation), and Mongo schemas.
- **MongoDB collections:** Users, TypingSessions, LearningProfiles, Diagnoses, TrainingPlans,
  Milestones, CoachConversations, GeneratedExercises. Include indexes and relationships.
- **Frontend pages:** Login, Register, Dashboard, Typing Test, Session History, Learning
  Profile, AI Coach, Settings.
- Target repo layout: `apps/web` (frontend) and `apps/api` (backend).

## Code style

- Use strict, modern **TypeScript** on both ends; avoid `any`.
- Validate all API inputs with DTOs + `class-validator`.
- Keep typing metrics logic (WPM, accuracy, mistyped-word/backspace tracking) in the
  `typing` domain, separate from UI.
- Never hardcode secrets — use environment variables (`.env`, already git-ignored).

## Conventions

- WPM = (characters typed ÷ 5) ÷ minutes elapsed.
- Accuracy = correct characters ÷ total typed characters, as a percentage.

## When suggesting changes

- Explain new concepts briefly — I'm learning, so favor clarity over cleverness.
- Respect the phase order from the design doc; don't jump ahead to AI before the MVP works.
- Implement complete, runnable changes rather than leaving TODOs.
- Don't add infrastructure, frameworks, or backend services beyond the stack above without asking first.
