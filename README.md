# Hub-and-Spoke Command Center

> **Phase 1** — AI-assisted development dashboard for tracking GitHub projects, assigning active agents, and managing system prompts.

A clean, minimal, dark-mode web dashboard built with React + Vite + TypeScript + Tailwind CSS. Designed for the `newM1k3` GitHub workflow.

---

## Features

| Feature | Description |
|---|---|
| **GitHub Dashboard** | Fetches public repos and recent commits for `newM1k3` via the GitHub REST API |
| **Spoke Tracker** | Manually assign an Active Agent (Bolt.new, Manus, Replit, Cursor) to each repository |
| **Prompt Vault** | Full CRUD for frequently-used system prompts — create, edit, copy, tag, delete |

---

## Tech Stack

- **Framework**: React 19 + Vite 7
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Routing**: Wouter
- **Persistence**: `localStorage` (no backend required)
- **Deployment**: Netlify (static)

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/newM1k3/hub-and-spoke-command-center.git
cd hub-and-spoke-command-center/client
```

### 2. Install dependencies

```bash
npm install
# or
pnpm install
```

### 3. Configure environment variables

Create a `.env` file in the `client/` directory:

```bash
# client/.env
# ──────────────────────────────────────────────────────────────
# GitHub Personal Access Token (PAT)
# ──────────────────────────────────────────────────────────────
# REQUIRED for higher API rate limits (5000 req/hr vs 60 req/hr unauthenticated)
# Without this token, the app still works but may hit rate limits quickly.
#
# How to generate your PAT:
# 1. Go to https://github.com/settings/tokens → "Tokens (classic)"
# 2. Click "Generate new token (classic)"
# 3. Name it: "hub-spoke-command-center-local"
# 4. Set expiry: 90 days or 1 year
# 5. Select scope: "public_repo" (read-only access to public repos is sufficient)
# 6. Click "Generate token" and copy the value below
# 7. NEVER commit this file to git (it is already in .gitignore)
#
VITE_GITHUB_TOKEN=ghp_your_token_here
```

> **Security note:** The `.env` file is listed in `.gitignore` and will never be committed. The `VITE_` prefix is required for Vite to expose the variable to the browser bundle. Because this is a public-facing static site, use a **read-only `public_repo` scope** PAT — never a full-access token.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Netlify Deployment

### Build settings (auto-detected from `netlify.toml`)

| Setting | Value |
|---|---|
| Base directory | `client` |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | `20` |

### Setting up the GitHub PAT in Netlify

The `VITE_GITHUB_TOKEN` environment variable must be configured in the Netlify dashboard for production builds. **Do not rely on the local `.env` file for deployments.**

**Steps:**

1. Log in to [app.netlify.com](https://app.netlify.com)
2. Navigate to your site → **Site configuration** → **Environment variables**
3. Click **Add a variable**
4. Set:
   - **Key**: `VITE_GITHUB_TOKEN`
   - **Value**: Your GitHub PAT (same token as local, or generate a new one named `hub-spoke-netlify`)
   - **Scopes**: Select **Builds** (required for Vite to embed it at build time)
5. Click **Save**
6. Trigger a new deploy: **Deploys** → **Trigger deploy** → **Deploy site**

> **Important:** Because Vite embeds `VITE_*` variables at **build time** (not runtime), you must redeploy the site every time you rotate your GitHub PAT. Set a calendar reminder before your token expires.

### Connecting to GitHub for auto-deploy

1. In Netlify, go to **Site configuration** → **Build & deploy** → **Continuous deployment**
2. Connect to GitHub and select the `newM1k3/hub-and-spoke-command-center` repository
3. Netlify will auto-deploy on every push to `master`

---

## Project Structure

```
hub-and-spoke-command-center/
├── netlify.toml              ← Build config + SPA redirect + security headers
├── README.md
└── client/
    ├── .env                  ← Local env vars (git-ignored)
    ├── index.html
    ├── vite.config.ts
    ├── package.json
    └── src/
        ├── App.tsx           ← Routes + ThemeProvider
        ├── index.css         ← Design tokens (Minimal Dark Forge theme)
        ├── components/
        │   └── DashboardLayout.tsx   ← Sidebar + mobile nav
        ├── lib/
        │   ├── github.ts     ← GitHub API fetch utilities + types
        │   └── store.ts      ← localStorage persistence (assignments + prompts)
        └── pages/
            ├── Dashboard.tsx       ← GitHub overview + stats
            ├── SpokeTracker.tsx    ← Agent assignment per repo
            └── PromptVault.tsx     ← System prompt CRUD
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `VITE_GITHUB_TOKEN` | Recommended | GitHub PAT with `public_repo` read scope. Without it, the GitHub API allows only 60 unauthenticated requests/hour. |

---

## Agent Badge Reference

| Agent | Color |
|---|---|
| Bolt.new | Amber |
| Manus | Violet |
| Replit | Emerald |
| Cursor | Blue |

---

## Roadmap (Phase 2+)

- [ ] Private repo support (requires elevated PAT scope)
- [ ] GitHub Actions workflow status per repo
- [ ] Prompt Vault cloud sync (PocketBase backend)
- [ ] Agent activity log / timeline
- [ ] Keyboard shortcuts (⌘K command palette)

---

## License

MIT — built for the MJW Platform by `newM1k3`.
