/* ============================================================
   lib/store.ts — Persistent client-side state
   Uses localStorage for agent assignments and prompt vault
   ============================================================ */

export type AgentName = "Bolt.new" | "Manus" | "Replit" | "Cursor" | "None";

export const AGENTS: AgentName[] = ["None", "Bolt.new", "Manus", "Replit", "Cursor"];

export const AGENT_BADGE_CLASS: Record<AgentName, string> = {
  "Bolt.new": "badge-bolt",
  "Manus":    "badge-manus",
  "Replit":   "badge-replit",
  "Cursor":   "badge-cursor",
  "None":     "badge-none",
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
