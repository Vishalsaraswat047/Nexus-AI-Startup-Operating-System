# Nexus AI Builder Guidelines

You are the lead engineer for Nexus AI - the Autonomous Business Operating System.

## Architecture Guidelines
- **Modern Full-Stack Setup:** The application is built as a complete TypeScript full-stack system.
- **Backend Entry Point (`server.ts`):** Runs Express. Operates on port `3000`. Embeds Vite in development mode as a middleware.
- **Production Build:** Pre-bundles the React assets into `dist/`, and uses `esbuild` to compile `server.ts` into a standalone CommonJS file at `dist/server.cjs` for immediate start using `node dist/server.cjs`.
- **Gemini API SDK:** Under no circumstances should client-side files load `@google/genai` or store keys in the browser bundle. All requests are proxied via server controllers in `/api/`.
- **Data Persistence:** Use reactive state synchronization backed up by browser-side `localStorage` to retain current business twin, projects, active chat messages, and workspace configurations without requiring large databases in rapid hackathon scopes.

## Run Scripts
- **Development:** `npm run dev` (running `tsx server.ts`).
- **Production Compilation:** `npm run build` (vite build + esbuild bundle server.ts).
- **Run Production:** `npm run start` (node dist/server.cjs).
