# 📚 StudyQuest — Gamified Productivity & Study Platform

<div align="center">

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI_Quiz-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

**Level up your productivity.** A full-stack gamified study ecosystem featuring persistent session timers, zero-interruption background music streaming (Spotify, YouTube, Ambient), AI-powered quiz generation, real-time leaderboards, social study squads, and an in-game reward economy.

[Features](#-key-features) • [Tech Stack](#%EF%B8%8F-technology-stack) • [Architecture](#-architecture--directory-structure) • [Database](#-database--security) • [Getting Started](#-getting-started)

</div>

---

## 🌟 Overview

**StudyQuest** bridges the gap between deep focus and gamification. Traditional timers are isolated and easy to abandon; StudyQuest turns study hours into experience points, coins, customizable profile cosmetics, and squad competition—all backed by ambient music and generative AI study tools.

---

## ✨ Key Features

### ⏱️ Persistent Study Session & Smart Timer
* **App-Wide Persistence:** Study sessions run globally via React Context. You can explore your profile, take AI quizzes, check stats, or manage tasks without interrupting the active timer.
* **Dynamic Browser Title:** Tracks live elapsed time directly in the browser tab `(14:32) StudyQuest`.
* **Accidental Reload Protection:** Native browser `beforeunload` intercept prevents accidental page reloads or tab closures during active study sessions ($\ge 60$s).
* **Anti-Cheat Verification:** Minimum session thresholds and automated coin crediting based on verified study minutes.

### 🎵 Continuous Background Audio Hub
* **Multi-Source Streaming:**
  * **Ambient Soundscapes:** Built-in offline audio (Lofi Beats, Rain, Sunset) with volume controls.
  * **Spotify Embeds:** Stream curated study playlists or import your own Spotify playlists, albums, and tracks.
  * **YouTube & YouTube Music:** Stream 24/7 lofi livestreams, study beats, or custom playlists with automated URL parsing.
* **Zero-Interruption Playback:** Audio elements and iframes remain persistently mounted in the application shell across route navigation.
* **Floating Audio Mini-Player:** Quick-access floating pill when navigating outside the Study Room to control playback or jump back in 1 click.

### 🤖 AI-Powered Notes-to-Quiz Generator
* **Google Gemini Integration:** Paste raw study notes, lecture summaries, or textbook excerpts to instantly generate multiple-choice practice quizzes.
* **Instant Evaluation & Rewards:** Real-time scoring breakdown with bonus coins awarded for high test scores.

### 🏆 Economy, Milestone Badges & Cosmetics Shop
* **Coin Economy:** Earn coins for every verified minute of focused study.
* **Milestone Badges:** Automatically unlock tier badges (Novice, Scholar, Master, Sage) based on total cumulative study hours.
* **Perks & Customization Shop:** Spend earned coins on visual status upgrades, including **Diamond Frames**, **Gold Frames**, **Flame Auras**, and **Neon Glows**.

### 👥 Study Squads & Global Leaderboards
* **Live Global Rankings:** Filter top performers by **This Week**, **This Month**, or **All Time**.
* **Study Squads:** Create private study squads with custom 6-character invite codes and compete on dedicated squad leaderboards.
* **Public Profile Modals:** Inspect peer stats, unlocked achievements, active cosmetic auras, and study subjects.

### 📋 Task Management & Productivity Analytics
* **Task Manager:** Categorize tasks with priority tags (High, Medium, Low) and quick-toggle completion status.
* **Visual Analytics:** Interactive daily and weekly study charts, subject breakdown analytics, and habit streak counters.

### 🎨 Immersive Atmosphere & Themes
* **Theme Presets:** Dynamic visual backgrounds (**Canopy**, **Summit**, **Studio**, **Void**) with smooth transitions and backdrop blur.
* **PWA Ready:** Installable on Desktop, iOS, and Android for a distraction-free fullscreen desktop or mobile app experience.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite 5](https://vitejs.dev/) |
| **Styling & Design** | [Tailwind CSS 3](https://tailwindcss.com/), Glassmorphism, CSS Animations |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Routing** | [React Router DOM v6](https://reactrouter.com/) |
| **AI Integration** | [Google Gemini API (`@google/generative-ai`)](https://ai.google.dev/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL, Row-Level Security, Auth, RPCs) |
| **Audio Engine** | Web Audio API + Spotify Embed SDK + YouTube IFrame API |

---

## 📂 Architecture & Directory Structure

```
studyquest/
├── public/                    # Static audio tracks (.mp3), icons, PWA manifest
├── src/
│   ├── components/            # Reusable UI widgets
│   │   ├── BottomNav.tsx      # Mobile & desktop persistent navigation
│   │   ├── CoinBadge.tsx      # In-game coin counter
│   │   ├── FloatingAudioPill.tsx # Persistent floating mini-player
│   │   ├── PageHeader.tsx     # Standardized page headers
│   │   ├── SoundPlayer.tsx    # Multi-tab audio & streaming center
│   │   ├── StudyingNow.tsx    # Live active study session feed
│   │   └── ThemeSwitcher.tsx  # Dynamic background switcher
│   ├── context/               # Global state providers
│   │   ├── AudioContext.tsx   # Persistent ambient & embed music manager
│   │   ├── AuthContext.tsx    # Supabase authentication & user profile sync
│   │   ├── StudyContext.tsx   # Global study timer & session lifecycles
│   │   └── ThemeContext.tsx   # App-wide visual theme manager
│   ├── lib/                   # Utilities, constants & API clients
│   │   ├── badges.ts          # Achievement badge calculations
│   │   ├── constants.ts       # Subject presets, perks catalogue, coin math
│   │   ├── supabase.ts        # Supabase client initialization
│   │   └── types.ts           # Shared TypeScript interfaces & models
│   ├── pages/                 # Application views
│   │   ├── Admin.tsx          # Administrative oversight dashboard
│   │   ├── AIQuiz.tsx         # Gemini AI quiz generator & test runner
│   │   ├── Dashboard.tsx      # Main hub, quick start, streak & coin stats
│   │   ├── Leaderboard.tsx    # Global rankings & squad leaderboard
│   │   ├── Login.tsx          # Authentication (Sign In / Sign Up)
│   │   ├── Profile.tsx        # User profile, statistics & perks shop
│   │   ├── PublicProfile.tsx  # Shareable public profile route (/u/:username)
│   │   ├── Room.tsx           # Deep-focus timer interface
│   │   ├── Stats.tsx          # Study history breakdown & charts
│   │   └── Tasks.tsx          # Todo checklist with priority filters
│   ├── App.tsx                # Layout wrapper, persistent mounts & routes
│   └── main.tsx               # Application entry point
├── supabase/
│   └── migrations/            # PostgreSQL migrations, schema, RLS & RPCs
├── tailwind.config.js         # Custom palette (warm coffee, accents, animations)
└── tsconfig.json              # TypeScript compiler configuration
```

---

## 🔒 Database & Security

StudyQuest runs on a hardened **PostgreSQL** schema on **Supabase** with **Row-Level Security (RLS)** applied across all tables:

* `profiles`: User information, coin balances, display names, and main subjects.
* `study_logs`: Immutable records of completed focus sessions (user ID, subject, duration, timestamp).
* `tasks`: Personal todo items with priority levels and completion tracking.
* `groups` & `group_members`: Squad definitions and membership management.
* `perks`: Unlocked cosmetic upgrades linked to user profiles.
* **Stored Procedures (RPCs)**:
  * `get_global_leaderboard(p_timeframe)`: Optimized leaderboard aggregation calculating total hours over weekly, monthly, or all-time intervals.
  * `get_group_leaderboard(p_group_id, p_timeframe)`: Group-scoped leaderboard ranking.
  * `get_public_profile(p_username)`: Secure public view of stats without exposing private auth data.

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
* A free [Supabase](https://supabase.com/) project
* *(Optional)* A free [Google Gemini API Key](https://aistudio.google.com/) for the AI Quiz feature

### 1. Clone the Repository
```bash
git clone https://github.com/Adiiitya789/studyquest.git
cd studyquest
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-google-gemini-api-key
```

### 4. Database Setup
Run the SQL migrations located in `supabase/migrations/` inside your Supabase project's **SQL Editor** to create the tables, RPCs, and RLS policies.

### 5. Run Locally
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Production Build & Quality Checks

```bash
# Type check TypeScript files
npm run typecheck

# Lint with ESLint
npm run lint

# Compile production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and contribute!

<div align="center">
  <sub>Built with focus, discipline, and lots of coffee ☕</sub>
</div>
