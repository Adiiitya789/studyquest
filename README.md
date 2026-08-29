# StudyQuest 📚

<div align="center">

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini_API-AI_Quiz-8E75B2?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

A gamified study tracker with persistent timers, background music, AI quiz generation, and leaderboards.

</div>

---

## ✨ Features

* **Persistent Study Timer:** Runs continuously in the background across page navigation with live tab title updates `(MM:SS)` and reload protection.
* **Music & Ambient Audio:** Built-in ambient sounds (Lofi, Rain, Sunset) + Spotify and YouTube/YT Music playlist embeds that keep playing seamlessly across pages.
* **AI Quiz Generator:** Generates multiple-choice quizzes directly from study notes using the Gemini API, with automatic grading and bonus coins.
* **Gamification & Rewards:** Earn 1 coin per minute studied, unlock cumulative hour badges, and buy avatar frames/auras in the shop.
* **Leaderboards & Squads:** Global weekly/monthly/all-time leaderboards and private study squads with invite codes.
* **Tasks & Analytics:** Priority-tagged todo list, study streaks, and visual time breakdown charts.
* **Themes & PWA:** 4 atmospheric theme backgrounds (Canopy, Summit, Studio, Void) and installable PWA support.

---

## 🛠️ Tech Stack

| Layer | Tech |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Backend & Auth** | Supabase (PostgreSQL, Row-Level Security, RPCs) |
| **AI** | Google Gemini API (`@google/generative-ai`) |
| **Audio** | HTML5 Audio + Spotify / YouTube IFrame Embeds |

---

## 📂 Project Structure

```
src/
├── components/        # UI components (SoundPlayer, FloatingAudioPill, BottomNav, etc.)
├── context/           # Global state (StudyContext, AudioContext, AuthContext, ThemeContext)
├── lib/               # Supabase client, badge calculations, constants, types
└── pages/             # Route views (Room, AIQuiz, Leaderboard, Profile, Tasks, Stats)
```

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Adiiitya789/studyquest.git
cd studyquest
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-google-gemini-api-key
```

### 3. Run

```bash
npm run dev
```

The app will be live at `http://localhost:5173`.

---

## 📜 Scripts

* `npm run dev` — Start local Vite development server
* `npm run build` — Build production bundle (`dist/`)
* `npm run typecheck` — Run TypeScript type checking
* `npm run lint` — Lint code with ESLint

---

## 📄 License

MIT
