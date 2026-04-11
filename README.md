# Weather Agent Showcase 🌦️

A premium, frontend-only AI Agent application that answers weather queries using a **ReAct-style loop** (Reason → Act → Observe).
Live: https://weatheragent27.netlify.app/
## 🚀 Overview

This app features a fully autonomous AI agent running entirely in the browser. It intelligently uses tools to fetch real-world data and provide accurate, context-aware answers.

### ✨ Key Features
- **ReAct Agent Loop**: Watch the AI "think" through Plan, Action, Observe, and Output steps in real-time.
- **Color-Coded Feedback**: Each step of the ReAct process is visually distinct for better understanding.
- **Glassmorphism UI**: A sleek, modern design with frosted glass effects and vibrant accents.
- **Local Usage Limits**: Built-in daily query tracking (5 queries/day) using `localStorage`.
- **Flexible Tokens**: Detects environment API keys automatically, with a fallback for user-provided tokens.

## 🛠️ Technical Stack
- **Framework**: React + Vite
- **AI Backend**: GitHub AI Inference API (GPT-4o-mini)
- **Data Source**: `wttr.in` (for real-time weather)
- **Styling**: Vanilla CSS (Modern CSS variables, Flexbox/Grid)

## 📦 Getting Started

1. **Clone the repo:**
   ```bash
   git clone https://github.com/Prodipsen27/weather_agent.git
   ```
2. **Setup environment:**
   Create a `.env` file in the root directory:
   ```env
   VITE_GITHUB_TOKEN=your_github_token_here
   ```
3. **Install and Run:**
   ```bash
   npm install
   npm run dev
   ```

## 🌐 Deployment

This project is configured for one-click deployment to **Netlify**. Simply connect your GitHub repo and add the `VITE_GITHUB_TOKEN` to your environment variables.
