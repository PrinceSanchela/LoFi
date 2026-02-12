# 💖 Love Finder (LoFi) — The Cosmic AI Matchmaker

[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

> **Unlock the secrets of the stars. Discover your true valentine and destiny with our premium AI astrology engine.**

Love Finder is a sophisticated, visually stunning web application designed to find your "Cosmic Match" using advanced AI algorithms and celestial calculations. Built with a focus on premium aesthetics and interactive user experience, it blends the magic of astrology with the power of Google's Gemini AI.

---

## ✨ Key Features

### 🌌 AI-Powered Astrology Engine
Harnesses **Google Gemini AI** to analyze your personal details and generate a unique, poetic, and meaningful "Cosmic Match" tailored specifically to your energy.

### 🍱 Premium Glassmorphism UI
A state-of-the-art interface featuring:
- **Heart Particles**: A dynamic backdrop of floating hearts.
- **Magic Trail**: An interactive cursor following trail that responds to your every movement.
- **Shooting Stars**: Randomized celestial events that make the experience feel alive.
- **Smooth Transitions**: Powered by Framer Motion for a fluid, premium app feel.

### 🌏 Region-Aware Intelligence
The system intelligently detects whether names are **Indian or Global**, ensuring that the generated match names and cultural context are authentic and relevant.

### 🛡️ Intelligent Validation
- **Real-time DOB Validation**: Smart date picker that prevents impossible date combinations.
- **Gender Dissonance Detection**: A unique feature that warns users if their name traditionally aligns with a different gender than selected, ensuring cosmic accuracy.
- **Gibberish Detection**: Filters out random key-mashing to keep the cosmic database clean.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI Integration**: [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Gemini API)
- **Styling**: Vanilla CSS with modern Flexbox/Grid and Glassmorphism effects.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (Latest LTS version recommended)
- A Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lofi.git
   cd lofi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

---

## 🌠 Project Structure

```text
LoFi/
├── src/
│   ├── assets/       # Static assets
│   ├── lib/          # Core logic & AI integration (gemini.ts)
│   ├── App.tsx       # Main Application Logic & UI
│   ├── App.css       # Premium Styling
│   ├── main.tsx      # Entry point
│   └── index.css     # Global styles & Design Tokens
├── public/           # Publicly served files
└── vite.config.ts    # Vite configuration
```

---

## 🧪 Cosmic Engine Logic

The application uses an **"AI-First, Fallback-Deterministic"** approach:
1. **Primary**: Query Google Gemini for a personalized, whimsical match.
2. **Special**: Hardcoded "Easter Eggs" for specific names (try "Prince Sanchela" 😉).
3. **Fallback**: If the API is unreachable, a complex deterministic hash-based algorithm takes over to ensure you *always* find your match, even without an internet connection.

---

## 📜 License

Created with ❤️ for Valentine's Week By Prince Sanchela.

---

*“The stars don't just guide you; they're waiting for you to ask.”* 🌟
