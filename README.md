# CodeLens AI

AI-powered code analyzer — paste code, get a plain-English breakdown (summary, line-by-line
explanation, concepts used, issues, and time/space complexity).

- Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui
- Backend: local Express server that calls the Gemini API directly

## 1. Setup

```bash
npm install
```

Copy the env template and add your own Gemini API key (free from
https://aistudio.google.com/apikey):

```bash
cp .env.example .env
```

Then open `.env` and paste your key into `GEMINI_API_KEY`.

## 2. Run locally

This runs both the frontend (Vite, port 5173) and the backend (Express, port 3001) together:

```bash
npm run dev:all
```

Or run them separately in two terminals:

```bash
npm run server   # backend on http://localhost:3001
npm run dev      # frontend on http://localhost:5173
```

Open http://localhost:5173 in your browser.

## 3. Build for production

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  components/CodeLens.tsx   # main UI — editor, analyze button, results panel
  lib/api.ts                # calls the local backend (POST /api/analyze-code)
  types/analysis.ts         # AnalysisResult / HistoryItem types + sample snippets
  pages/Index.tsx           # renders CodeLens
  pages/NotFound.tsx        # 404 page
server/
  server.js                 # Express server, proxies requests to the Gemini API
```

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/CodeLens.git
git push -u origin main
```

`.env` is already in `.gitignore`, so your API key won't be pushed. Anyone cloning the repo
just needs to copy `.env.example` to `.env` and add their own key.
