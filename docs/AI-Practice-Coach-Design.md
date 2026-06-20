# AI Practice Coach — Design Document

> Clean Markdown version of `AI Practice Coach Design.pdf` for easy reading.

## Overview

**AI Practice Coach** is an AI-powered coaching platform that learns from a user's
performance over time, identifies weaknesses, creates personalized training plans,
generates exercises, tracks improvement, and acts as a long-term coach.

- The goal is **NOT** to build a typing website.
- **Typing is only the first skill module.**
- The architecture must support future skill modules **without major refactoring**.

### Future skill modules

- Coding Practice
- Interview Preparation
- Vocabulary Building
- Language Learning

## Project Goals

1. Build a real, deployable product.
2. Keep all development and deployment free.
3. Avoid unnecessary complexity.
4. Ship an MVP quickly.
5. Introduce AI only after the foundation exists.
6. Design the system so AI providers can be replaced later.
7. Preserve user history permanently.
8. Demonstrate strong software engineering and practical AI usage.

## Tech Stack

### Frontend
- React
- Vite
- TypeScript
- TailwindCSS
- React Query
- React Router
- Zustand
- Recharts

### Backend
- NestJS
- TypeScript

### Database
- MongoDB Atlas (Free Tier)

### Authentication
- JWT

### AI
- Groq API

### Deployment
- Frontend: Vercel (Free Tier)
- Backend: Render (Free Tier)
- Database: MongoDB Atlas (Free Tier)

### Tooling
- Version Control: GitHub
- CI/CD: GitHub Actions
- Containerization: Docker

## Important Constraints

- Roughly **1 hour per day** available.
- Architecture must optimize for: **simplicity, maintainability, fast delivery, portfolio quality**.
- Do not introduce unnecessary infrastructure.
- **Avoid** (unless strongly justified): Kafka, Redis, Microservices, Event buses, Vector databases, Kubernetes.
- Prefer a **modular monolith** architecture using NestJS.

## Long-Term Memory Requirement

The system must preserve user history **permanently**. A user may return after 1 day,
1 week, 1 month, or 6 months. The AI Coach should remember:

- Historical sessions
- Historical weaknesses
- Historical strengths
- Previous diagnoses
- Previous training plans
- Milestones
- Trends

The user should feel like they have a personal coach rather than a stateless chatbot.

> Example: "Welcome back. Before your break, your biggest challenge was double-letter
> words. Your accuracy improved from 81% to 90% during your previous training cycle."

## Phases

### Phase 1 — MVP
Build a fully functional typing platform **before** adding AI.

- **Authentication:** Register, Login, Logout
- **Typing Engine:** Real-time WPM, Real-time Accuracy, Mistyped Word Tracking, Backspace Tracking, Session Completion
- **Dashboard:** Current WPM, Best WPM, Average Accuracy, Session History
- **Database Persistence:** Store every typing session permanently.

```json
{
  "userId": "...",
  "date": "...",
  "wpm": 67,
  "accuracy": 92,
  "backspaces": 22,
  "mistakes": ["receive", "committee"]
}
```

The MVP should be deployable.

### Phase 2 — Learning Profile
Create a permanent Learning Profile that updates after every session.

```json
{
  "userId": "...",
  "currentWpm": 67,
  "bestWpm": 81,
  "averageAccuracy": 91,
  "primaryWeaknesses": [],
  "strengths": [],
  "milestones": [],
  "learningStyle": null,
  "plateauDetected": false
}
```

### Phase 3 — AI Diagnosis
Integrate Groq. The AI analyzes session history, mistyped words, learning profile, and
performance trends to identify patterns.

> Example — Mistyped Words: `receive believe piece chief`
> Diagnosis: User struggles with IE/EI spelling patterns.

The AI should explain *why* it reached the conclusion. Store all diagnoses.

### Phase 4 — AI Coach
Build a conversational AI Coach with access to user history, learning profile, diagnoses,
milestones, and recent sessions. It provides progress analysis, recommendations, goals,
and personalized advice, referencing historical progress when responding.

### Phase 5 — Exercise Generator
Generate personalized typing exercises.

- **Input:** weakness, difficulty, learning history
- **Output:** natural-language passages targeting the weakness (avoid repetitive word lists)
- Store generated exercises.

### Phase 6 — Agentic AI
Introduce **LangGraph** only after Phases 1–5 are complete.

- **Agents:** Observation, Memory, Diagnosis, Planning, Content Generation, Evaluation
- **Workflow:** Observation → Memory Retrieval → Diagnosis → Planning → Exercise Generation → Evaluation → Learning Profile Update
- The Learning Profile acts as long-term memory.

## Backend Modules (Modular Monolith, NestJS)

```text
auth/  users/  typing/  sessions/  learning-profile/
analytics/  coach/  ai/  agents/  common/
```

For each module define: Controllers, Services, DTOs, Validation, Mongo Schemas.

## Database Design

Collections:
- Users
- TypingSessions
- LearningProfiles
- Diagnoses
- TrainingPlans
- Milestones
- CoachConversations
- GeneratedExercises

Include indexes and relationships.

## Frontend Pages

- Login
- Register
- Dashboard
- Typing Test
- Session History
- Learning Profile
- AI Coach
- Settings

## Deliverables (from the design brief)

The design should prioritize shipping a production-quality MVP within **6–8 weeks** while
keeping the architecture extensible for future AI capabilities. Expected design outputs:

1. Complete project architecture
2. Folder structure
3. Database schema design
4. API design
5. NestJS module design
6. React application structure
7. MongoDB indexes
8. Authentication design
9. Deployment architecture
10. Development roadmap
11. Sprint-by-sprint implementation plan
12. Future AI architecture
