/* ============================================================
   CommandPalette.tsx
   Global ⌘K / Ctrl+K command palette using cmdk.
   Groups:
     • Navigation  — jump to Dashboard / Spoke Tracker / Prompt Vault
     • Repos        — search fetched repos, open on GitHub
     • Assign Agent — set the active agent for a repo
   ============================================================ */
import { useEffect, useState, useCallback, useRef } from "react";
import { Command } from "cmdk";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  GitBranch,
  BookMarked,
  ExternalLink,
  Zap,
  Search,
  ArrowRight,
  X,
} from "lucide-react";
import {
  loadAssignments,
  saveAssignments,
  AGENTS,
  type AgentName,
} from "@/lib/store";
import {
  GITHUB_USERNAME,
  type GitHubRepo,
} from "@/lib/github";
import { toast } from "sonner";

/* ── Types ── */
interface CommandPaletteProps {
  repos: GitHubRepo[];
}

/* ── Agent accent colors (same as SpokeTracker) ── */
const AGENT_DOT: Record<AgentName, string> = {
  "Bolt.new":  "oklch(0.72 0.18 55)",
  "Manus":     "oklch(0.75 0.22 290)",
  "Replit":    "oklch(0.72 0.18 145)",
  "Cursor":    "oklch(0.75 0.22 240)",
  "Gemini":    "oklch(0.72 0.18 196)",
  "Claude":    "oklch(0.75 0.18 30)",
  "Emergent":  "oklch(0.72 0.20 320)",
  "Qwen":      "oklch(0.72 0.18 170)",
  "Kimi":      "oklch(0.75 0.15 260)",
  "DeepThink": "oklch(0.72 0.22 10)",
  "None":      "oklch(1 0 0 / 25%)",
};

const NAV_ITEMS = [
  { label: "Dashboard",     path: "/",               icon: LayoutDashboard, hint: "overview" },
  { label: "Spoke Tracker", path: "/spoke-tracker",  icon: GitBranch,       hint: "agent assign" },
  { label: "Prompt Vault",  path: "/prompt-vault",   icon: BookMarked,      hint: "system prompts" },
];

export default function CommandPalette({ repos }: CommandPaletteProps) {
  const [open, setOpen]               = useState(false);
  const [query, setQuery]             = useState("");
  const [mode, setMode]               = useState<"root" | "assign">("root");
  const [assignTarget, setAssignTarget] = useState<GitHubRepo | null>(null);
  const [, navigate]                  = useLocation();
  const inputRef                      = useRef<HTMLInputElement>(null);

  /* ── Open / close keyboard shortcut ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        if (mode === "assign") {
          setMode("root");
          setAssignTarget(null);
          setQuery("");
        } else {
          setOpen(false);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  /* ── Focus input when opened ── */
  useEffect(() => {
    if (open) {
      setQuery("");
      setMode("root");
      setAssignTarget(null);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const handleNav = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  const handleOpenGitHub = useCallback((repo: GitHubRepo) => {
    window.open(repo.html_url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }, []);

  const handleStartAssign = useCallback((repo: GitHubRepo) => {
    setAssignTarget(repo);
    setMode("assign");
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 40);
  }, []);

  const handleAssign = useCallback((agent: AgentName) => {
    if (!assignTarget) return;
    const assignments = loadAssignments();
    assignments[assignTarget.name] = agent;
    saveAssignments(assignments);
    toast.success(`→ ${assignTarget.name}`, {
      description: `agent: ${agent}`,
      duration: 1800,
    });
    setOpen(false);
  }, [assignTarget]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: "oklch(0 0 0 / 65%)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        className="w-full max-w-xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "oklch(0.165 0.012 264)",
          border: "1px solid oklch(1 0 0 / 12%)",
          boxShadow: "0 24px 80px oklch(0 0 0 / 60%), 0 0 0 1px oklch(0.88 0.18 196 / 8%)",
        }}
      >
        <Command
          shouldFilter={mode === "root"}
          loop
        >
          {/* ── Input ── */}
          <div
            className="flex items-center gap-3 px-4 py-3.5"
            style={{ borderBottom: "1px solid oklch(1 0 0 / 8%)" }}
          >
            {mode === "assign" && assignTarget ? (
              <>
                <button
                  onClick={() => { setMode("root"); setAssignTarget(null); setQuery(""); }}
                  className="shrink-0 transition-opacity hover:opacity-70"
                  style={{ color: "oklch(0.88 0.18 196)" }}
                >
                  <ArrowRight size={14} className="rotate-180" />
                </button>
                <span
                  className="text-xs shrink-0"
                  style={{ color: "oklch(0.55 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
                >
                  assign agent →
                </span>
                <span
                  className="text-xs font-medium truncate"
                  style={{ color: "oklch(0.88 0.18 196)", fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {assignTarget.name}
                </span>
              </>
            ) : (
              <>
                <Search size={14} style={{ color: "oklch(0.45 0.01 264)" }} className="shrink-0" />
                <Command.Input
                  ref={inputRef}
                  value={query}
                  onValueChange={setQuery}
                  placeholder="search commands, repos, agents..."
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-[oklch(0.38_0.01_264)]"
                  style={{ color: "oklch(0.88 0.005 264)", fontFamily: "'Space Grotesk', sans-serif" }}
                />
                {query && (
                  <button onClick={() => setQuery("")} className="shrink-0 transition-opacity hover:opacity-70" style={{ color: "oklch(0.45 0.01 264)" }}>
                    <X size={13} />
                  </button>
                )}
                <kbd
                  className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] shrink-0"
                  style={{ background: "oklch(1 0 0 / 6%)", color: "oklch(0.45 0.01 264)", fontFamily: "'JetBrains Mono', monospace", border: "1px solid oklch(1 0 0 / 10%)" }}
                >
                  esc
                </kbd>
              </>
            )}
          </div>

          {/* ── List ── */}
          <Command.List
            className="overflow-y-auto"
            style={{ maxHeight: "360px" }}
          >
            <Command.Empty
              className="py-10 text-center text-xs"
              style={{ color: "oklch(0.45 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              → no results
            </Command.Empty>

            {/* ── Assign mode: show agent list ── */}
            {mode === "assign" && (
              <Command.Group
                heading="select agent"
                className="px-2 py-1.5"
              >
                {AGENTS.map((agent) => (
                  <Command.Item
                    key={agent}
                    value={agent}
                    onSelect={() => handleAssign(agent as AgentName)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: AGENT_DOT[agent as AgentName] }}
                    />
                    <span className="text-sm" style={{ color: "oklch(0.82 0.005 264)" }}>
                      {agent}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* ── Root mode ── */}
            {mode === "root" && (
              <>
                {/* Navigation */}
                <Command.Group heading="navigation" className="px-2 py-1.5">
                  {NAV_ITEMS.map((item) => (
                    <Command.Item
                      key={item.path}
                      value={`navigate ${item.label} ${item.hint}`}
                      onSelect={() => handleNav(item.path)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                    >
                      <item.icon size={14} style={{ color: "oklch(0.88 0.18 196)" }} className="shrink-0" />
                      <span className="text-sm flex-1" style={{ color: "oklch(0.82 0.005 264)", fontFamily: "'Space Grotesk', sans-serif" }}>
                        {item.label}
                      </span>
                      <span className="text-[10px]" style={{ color: "oklch(0.38 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {item.hint}
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>

                {/* Repos */}
                {repos.length > 0 && (
                  <Command.Group heading="repositories" className="px-2 py-1.5">
                    {repos.slice(0, 20).map((repo) => (
                      <Command.Item
                        key={repo.name}
                        value={`repo ${repo.name} ${repo.description ?? ""} ${repo.language ?? ""}`}
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                        onSelect={() => handleOpenGitHub(repo)}
                      >
                        <GitBranch size={13} style={{ color: "oklch(0.45 0.01 264)" }} className="shrink-0" />
                        <span className="text-sm flex-1 truncate" style={{ color: "oklch(0.82 0.005 264)", fontFamily: "'Space Grotesk', sans-serif" }}>
                          {repo.name}
                        </span>
                        {repo.language && (
                          <span className="text-[10px] shrink-0" style={{ color: "oklch(0.45 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>
                            {repo.language}
                          </span>
                        )}
                        {/* Assign button appears on hover via group */}
                        <button
                          className="shrink-0 opacity-0 group-data-[selected=true]:opacity-100 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-all"
                          style={{
                            background: "oklch(0.88 0.18 196 / 12%)",
                            color: "oklch(0.88 0.18 196)",
                            border: "1px solid oklch(0.88 0.18 196 / 25%)",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartAssign(repo);
                          }}
                        >
                          <Zap size={9} /> assign
                        </button>
                        <ExternalLink size={11} style={{ color: "oklch(0.38 0.01 264)" }} className="shrink-0 opacity-0 group-data-[selected=true]:opacity-100 transition-opacity" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Quick actions */}
                <Command.Group heading="quick actions" className="px-2 py-1.5">
                  <Command.Item
                    value="open github profile newM1k3"
                    onSelect={() => { window.open(`https://github.com/${GITHUB_USERNAME}`, "_blank", "noopener,noreferrer"); setOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
                  >
                    <ExternalLink size={13} style={{ color: "oklch(0.45 0.01 264)" }} className="shrink-0" />
                    <span className="text-sm" style={{ color: "oklch(0.82 0.005 264)", fontFamily: "'Space Grotesk', sans-serif" }}>
                      Open GitHub Profile
                    </span>
                    <span className="text-[10px] ml-auto" style={{ color: "oklch(0.38 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>
                      github.com/{GITHUB_USERNAME}
                    </span>
                  </Command.Item>
                </Command.Group>
              </>
            )}
          </Command.List>

          {/* ── Footer ── */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderTop: "1px solid oklch(1 0 0 / 6%)" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px]" style={{ color: "oklch(0.35 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>
                ↑↓ navigate
              </span>
              <span className="text-[10px]" style={{ color: "oklch(0.35 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>
                ↵ select
              </span>
              {mode === "assign" && (
                <span className="text-[10px]" style={{ color: "oklch(0.35 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>
                  esc back
                </span>
              )}
            </div>
            <span className="text-[10px]" style={{ color: "oklch(0.35 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>
              ⌘K
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}

/* ── Export the open trigger so DashboardLayout can wire the shortcut hint ── */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((p) => !p), []);
  return { open, setOpen, toggle };
}
