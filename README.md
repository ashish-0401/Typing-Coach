# ⌨️ Typing Coach

A browser-based typing trainer that helps you improve typing **speed** and **accuracy** with real-time feedback, multiple practice modes, and progress tracking.

> Status: 🌱 Early development

## ✨ Planned Features

| Feature | Description |
|---|---|
| Real-time test | Type a passage while live highlighting shows correct/incorrect keystrokes |
| WPM & accuracy | Words-per-minute and accuracy calculated live and shown on a results screen |
| Practice modes | Common words, quotes, and code snippets |
| Timed runs | 15s / 30s / 60s test durations |
| Progress history | Past results saved in the browser (localStorage) and shown as a trend |
| Virtual keyboard | On-screen keyboard highlights the next key (later phase) |

## 🧱 Tech Stack

Starting simple, with room to grow:

- **HTML + CSS + vanilla JavaScript** — no build step, runs by opening a file
- **localStorage** — to save results between sessions
- *(Optional later)* migrate to **React + Vite** once the core works

## 🚀 Getting Started

No installation needed for the starting stack — just open the page in a browser.

```powershell
# From the project folder
Start-Process .\index.html
```

Once a build step is added (e.g. Vite), this section will be updated with `npm install` / `npm run dev`.

## 📁 Project Structure

```text
Typing-Coach/
├─ index.html        # App entry point
├─ css/
│  └─ styles.css     # Styling
├─ js/
│  ├─ app.js         # App wiring / UI
│  ├─ engine.js      # Typing logic (WPM, accuracy, comparison)
│  └─ content.js     # Word/quote/snippet sources
├─ data/             # Practice content (JSON)
└─ README.md
```

> This is the target layout — files get added as each phase is built.

## 🗺️ Roadmap

- [ ] **Phase 1 — Core test:** show a passage, capture typing, highlight errors
- [ ] **Phase 2 — Metrics:** live WPM + accuracy, results screen
- [ ] **Phase 3 — Modes & timer:** word/quote/code modes, timed runs
- [ ] **Phase 4 — Progress:** save history to localStorage, show a trend chart
- [ ] **Phase 5 — Polish:** virtual keyboard, themes, sound, settings

## 📝 How WPM & Accuracy Are Measured

- **WPM** = (characters typed ÷ 5) ÷ minutes elapsed — the standard "word = 5 chars" definition.
- **Accuracy** = correct characters ÷ total characters typed, as a percentage.

## 📄 License

Personal project — license to be decided.
