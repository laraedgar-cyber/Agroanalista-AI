<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AgroAnalista AI

App para interpretar análisis de suelo con IA y generar recomendaciones iniciales de fertilización.

View your app in AI Studio: https://ai.studio/apps/drive/1A4QTzTVoytPxXYdV03Zmo8QfUyg9-bbu

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Create `.env.local` from `.env.example` and set `GEMINI_API_KEY`.
3. Run the app with the local API:
   `npm run dev`

Then open the local URL shown by Vite, for example `http://127.0.0.1:5173/`.

Do not open `index.html` directly with `file://`; this is a Vite/React app and needs the local dev server or a production build server.

## Deploy to Vercel

1. Import the repository in Vercel.
2. Add the environment variable `GEMINI_API_KEY` in the Vercel project settings.
3. Use the default build command `npm run build`.
4. Use `dist` as the output directory.

The Gemini API key is used only by the serverless function at `/api/analyze-soil`; it is not injected into the browser bundle.
