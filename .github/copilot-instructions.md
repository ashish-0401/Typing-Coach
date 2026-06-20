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
- **Guest mode (try-before-signup):** the Typing Test is **public** so visitors can try it
  without an account. Guest results are **local-only** (component state / `localStorage`) and are
  **never persisted to MongoDB** — this keeps the permanent-history model tied to real accounts.
  Anything implying identity (Dashboard, Session History, Learning Profile, `POST /sessions`) stays
  behind the auth guard. Do NOT create anonymous/guest DB user records. On first signup we may
  optionally migrate the guest's last local session into the new account.

## Code style

- Use strict, modern **TypeScript** on both ends; avoid `any`.
- Validate all API inputs with DTOs + `class-validator`.
- Keep typing metrics logic (WPM, accuracy, mistyped-word/backspace tracking) in the
  `typing` domain, separate from UI.
- Never hardcode secrets — use environment variables (`.env`, already git-ignored).
- For UI/UX design, use the `ui-ux-pro-max` skill and default to `--stack react`
  (this project uses React + TailwindCSS) unless told otherwise.
- **Desktop-first, not mobile.** This is a keyboard-driven app (typing test), so design and
  style for desktop viewports only. Do NOT add mobile/responsive variants
  unless solving a real desktop sizing issue. The only concession to small screens is a single
  "use a desktop with a physical keyboard" fallback message — never a mobile layout.

## Conventions

- WPM = (characters typed ÷ 5) ÷ minutes elapsed.
- Accuracy = correct characters ÷ total typed characters, as a percentage.

## Git & branching workflow

Use a lightweight **GitHub Flow**. Never commit straight to `main` — all work lands via
short-lived feature branches and Pull Requests. Keep branches **few and focused**: roughly
**one branch per major task / feature slice** (e.g. auth, typing engine, dashboard), not one
per tiny change.

- **Branch names:** `<type>/<short-kebab-summary>` where `<type>` is one of
  `feat` · `fix` · `chore` · `docs` · `refactor` · `test` (e.g. `feat/typing-test`,
  `fix/wpm-rounding`).
- **Commits:** use [Conventional Commits](https://www.conventionalcommits.org)
  (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`). Commit in small, logical steps.
- **Flow:**
  1. Branch off the latest `main`: `git switch main && git pull && git switch -c feat/<name>`.
  2. Implement + commit. Push the branch.
  3. Open a **PR into `main`** with a short *what & why* description.
  4. Make sure **CI is green** (lint, typecheck, test, build) and self-review the diff.
  5. **Squash-merge**, then delete the branch. `git pull` on `main` before the next task.
- **Granularity:** a roadmap phase may span a few PRs — aim for a PR reviewable in one sitting.
  Don't let a branch live for weeks; merge or rebase onto `main` regularly to avoid conflicts.
- **Agent behavior:** I (Copilot) may create branches, commit, and prepare PRs, but I will
  **ask for confirmation before pushing or merging**, since those affect the remote/shared repo.

## When suggesting changes

- Explain new concepts briefly — I'm learning, so favor clarity over cleverness.
- Respect the phase order from the design doc; don't jump ahead to AI before the MVP works.
- Implement complete, runnable changes rather than leaving TODOs.
- Don't add infrastructure, frameworks, or backend services beyond the stack above without asking first.
