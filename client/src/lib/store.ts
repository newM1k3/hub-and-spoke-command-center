/* ============================================================
   lib/store.ts — Persistent client-side state
   Phase 3.2: expanded 10-agent list + PAT token helpers
   All state uses localStorage — zero backend dependencies.
   Keys:
     hs_agent_assignments  → Record<repoName, AgentName>
     hs_repo_statuses      → Record<repoName, StatusName>
     hs_prompt_vault       → Prompt[]
     hs_github_pat         → string (GitHub Personal Access Token)
   ============================================================ */

// ── Agent Types ────────────────────────────────────────────────

export type AgentName =
  | "Bolt.new"
  | "Manus"
  | "Replit"
  | "Cursor"
  | "Gemini"
  | "Claude"
  | "Emergent"
  | "Qwen"
  | "Kimi"
  | "DeepThink"
  | "None";

export const AGENTS: AgentName[] = [
  "None",
  "Bolt.new",
  "Manus",
  "Replit",
  "Cursor",
  "Gemini",
  "Claude",
  "Emergent",
  "Qwen",
  "Kimi",
  "DeepThink",
];

export const AGENT_BADGE_CLASS: Record<AgentName, string> = {
  "Bolt.new":  "badge-bolt",
  "Manus":     "badge-manus",
  "Replit":    "badge-replit",
  "Cursor":    "badge-cursor",
  "Gemini":    "badge-gemini",
  "Claude":    "badge-claude",
  "Emergent":  "badge-emergent",
  "Qwen":      "badge-qwen",
  "Kimi":      "badge-kimi",
  "DeepThink": "badge-deepthink",
  "None":      "badge-none",
};

// ── Status Types ───────────────────────────────────────────────

export type StatusName = "Idea" | "Vibe Coding" | "Debugging" | "Deployed" | "None";

export const STATUSES: StatusName[] = ["None", "Idea", "Vibe Coding", "Debugging", "Deployed"];

export const STATUS_BADGE_CLASS: Record<StatusName, string> = {
  "Idea":        "badge-status-idea",
  "Vibe Coding": "badge-status-vibe",
  "Debugging":   "badge-status-debug",
  "Deployed":    "badge-status-deployed",
  "None":        "badge-none",
};

export const STATUS_ACCENT: Record<StatusName, string> = {
  "Idea":        "oklch(0.75 0.15 220)",
  "Vibe Coding": "oklch(0.72 0.18 55)",
  "Debugging":   "oklch(0.75 0.22 25)",
  "Deployed":    "oklch(0.72 0.18 145)",
  "None":        "transparent",
};

// ── Agent Assignments ──────────────────────────────────────────

const ASSIGNMENTS_KEY = "hs_agent_assignments";

export function loadAssignments(): Record<string, AgentName> {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveAssignments(assignments: Record<string, AgentName>): void {
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
}

// ── Repo Statuses ──────────────────────────────────────────────

const STATUSES_KEY = "hs_repo_statuses";

export function loadStatuses(): Record<string, StatusName> {
  try {
    const raw = localStorage.getItem(STATUSES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStatuses(statuses: Record<string, StatusName>): void {
  localStorage.setItem(STATUSES_KEY, JSON.stringify(statuses));
}

// ── GitHub PAT Token ───────────────────────────────────────────

const PAT_KEY = "hs_github_pat";

export function loadPAT(): string {
  try {
    return localStorage.getItem(PAT_KEY) ?? "";
  } catch {
    return "";
  }
}

export function savePAT(token: string): void {
  if (token.trim()) {
    localStorage.setItem(PAT_KEY, token.trim());
  } else {
    localStorage.removeItem(PAT_KEY);
  }
}

export function clearPAT(): void {
  localStorage.removeItem(PAT_KEY);
}

// ── Spoke Tracker Sort Preference ────────────────────────────

export type SortKey = "pushed" | "stars" | "agent" | "status";
export type SortDir = "asc" | "desc";

const SORT_KEY_KEY = "hs_sort_key";
const SORT_DIR_KEY = "hs_sort_dir";

export function loadSortPreference(): { key: SortKey; dir: SortDir } {
  try {
    const key = (localStorage.getItem(SORT_KEY_KEY) as SortKey) ?? "pushed";
    const dir = (localStorage.getItem(SORT_DIR_KEY) as SortDir) ?? "desc";
    return { key, dir };
  } catch {
    return { key: "pushed", dir: "desc" };
  }
}

export function saveSortPreference(key: SortKey, dir: SortDir): void {
  localStorage.setItem(SORT_KEY_KEY, key);
  localStorage.setItem(SORT_DIR_KEY, dir);
}

// ── Netlify Build Hooks ───────────────────────────────────────

const BUILD_HOOKS_KEY = "hs_build_hooks";

export function loadBuildHooks(): Record<string, string> {
  try {
    const raw = localStorage.getItem(BUILD_HOOKS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveBuildHooks(hooks: Record<string, string>): void {
  localStorage.setItem(BUILD_HOOKS_KEY, JSON.stringify(hooks));
}

/**
 * Fires a Netlify build hook URL via POST.
 * Returns true on success (2xx), false on network or HTTP error.
 */
export async function triggerNetlifyBuild(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "POST" });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Prompt Vault ───────────────────────────────────────────────

export interface Prompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const PROMPTS_KEY = "hs_prompt_vault";

export function loadPrompts(): Prompt[] {
  try {
    const raw = localStorage.getItem(PROMPTS_KEY);
    return raw ? JSON.parse(raw) : getDefaultPrompts();
  } catch {
    return getDefaultPrompts();
  }
}

export function savePrompts(prompts: Prompt[]): void {
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts));
}

function getDefaultPrompts(): Prompt[] {
  const now = new Date().toISOString();
  return [
    {
      id: "default-1",
      title: "React Component Generator",
      content: `You are an expert React developer. Generate a clean, typed React component based on the following requirements. Use TypeScript, Tailwind CSS for styling, and follow these conventions:
- Functional components with hooks
- Props interface defined above the component
- Export as default
- No inline styles, use Tailwind classes only

Requirements: [DESCRIBE YOUR COMPONENT HERE]`,
      tags: ["react", "typescript", "component"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "default-2",
      title: "Git Commit Message Writer",
      content: `Write a concise, conventional commit message for the following changes. Follow the format:
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore
Keep the description under 72 characters.
Use imperative mood ("add" not "added").

Changes: [DESCRIBE YOUR CHANGES HERE]`,
      tags: ["git", "workflow"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "default-3",
      title: "Code Review Assistant",
      content: `Review the following code and provide structured feedback covering:
1. **Correctness** — bugs, edge cases, logic errors
2. **Performance** — inefficiencies, unnecessary re-renders, N+1 queries
3. **Security** — vulnerabilities, unsafe patterns
4. **Readability** — naming, structure, comments
5. **Suggestions** — specific improvements with code examples

Be direct and specific. Skip praise unless it reinforces a pattern worth keeping.

Code: [PASTE CODE HERE]`,
      tags: ["review", "quality"],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function generateId(): string {
  return `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
