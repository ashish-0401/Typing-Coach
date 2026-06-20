# Typing Coach — Project Instructions

These instructions apply to all work in this repository. Copilot reads them automatically on every request.

## What this project is

Typing Coach is a browser-based typing trainer focused on improving typing speed (WPM) and accuracy. Keep it simple, readable, and beginner-friendly.

## Tech stack

- Plain **HTML + CSS + vanilla JavaScript** (no build step for now).
- Use **ES modules** (`<script type="module">`) to split JavaScript into files.
- Persist data with **localStorage** only — no backend or database.
- Do not add frameworks or npm dependencies unless explicitly asked.

## Code style

- Use modern JavaScript (`const`/`let`, arrow functions, template literals).
- Prefer small, single-purpose functions with clear names.
- Add brief comments only where the intent isn't obvious.
- Keep typing logic (WPM, accuracy, text comparison) in `js/engine.js`, separate from DOM/UI code in `js/app.js`.
- Use semantic HTML and keep styling in `css/styles.css` (no inline styles).

## Conventions

- WPM = (characters typed ÷ 5) ÷ minutes elapsed.
- Accuracy = correct characters ÷ total typed characters, as a percentage.
- Store practice content (words, quotes, snippets) as JSON under `data/`.

## When suggesting changes

- Explain new concepts briefly — I'm learning, so favor clarity over cleverness.
- Implement complete, runnable changes rather than leaving TODOs.
- Don't introduce a build tool, framework, or backend without asking first.
