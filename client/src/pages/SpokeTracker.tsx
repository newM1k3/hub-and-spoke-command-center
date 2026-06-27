/* ============================================================
   SpokeTracker.tsx — Assign Active Agent to each GitHub repo
   Theme: Minimal Dark Forge
   Style Review Applied:
   - CLI-native copy ("assign agent →", "→ filter by agent")
   - Stronger surface elevation with agent-colored left accent
   - Agent taxonomy always visible even for unassigned repos
   - Summary bar shows agent distribution at a glance
   ============================================================ */
import { useEffect, useState } from "react";
import {
  GitBranch,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Clock,
  Search,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchRepos,
  timeAgo,
  getLanguageColor,
  GITHUB_USERNAME,
  type GitHubRepo,
} from "@/lib/github";
import {
  loadAssignments,
  saveAssignments,
  AGENTS,
  AGENT_BADGE_CLASS,
  type AgentName,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* Agent accent colors for left-border treatment */
const AGENT_ACCENT: Record<AgentName, string> = {
  "Bolt.new": "oklch(0.72 0.18 55)",
  "Manus":    "oklch(0.75 0.22 290)",
  "Replit":   "oklch(0.72 0.18 145)",
  "Cursor":   "oklch(0.75 0.22 240)",
  "None":     "transparent",
};

export default function SpokeTracker() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [assignments, setAssignments] = useState<Record<string, AgentName>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterAgent, setFilterAgent] = useState<AgentName | "All">("All");

  async function loadRepos() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRepos(GITHUB_USERNAME);
      setRepos(data);
      setAssignments(loadAssignments());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch repos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRepos();
  }, []);

  function handleAssign(repoName: string, agent: AgentName) {
    const updated = { ...assignments, [repoName]: agent };
    setAssignments(updated);
    saveAssignments(updated);
    if (agent !== "None") {
      toast.success(`→ ${repoName}`, {
        description: `assigned to ${agent}`,
        duration: 2000,
      });
    }
  }

  const filtered = repos.filter((repo) => {
    const matchesSearch =
      search === "" ||
      repo.name.toLowerCase().includes(search.toLowerCase()) ||
      (repo.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filterAgent === "All" ||
      (assignments[repo.name] ?? "None") === filterAgent;
    return matchesSearch && matchesFilter;
  });

  const agentCounts = AGENTS.reduce<Record<string, number>>((acc, agent) => {
    acc[agent] = repos.filter((r) => (assignments[r.name] ?? "None") === agent).length;
    return acc;
  }, {});

  const assignedCount = repos.filter((r) => (assignments[r.name] ?? "None") !== "None").length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.92 0.005 264)" }}
          >
            // spoke tracker
          </h1>
          <p
            className="text-xs mt-1"
            style={{ color: "oklch(0.88 0.18 196 / 70%)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            → assign agent to each repo · {assignedCount}/{repos.length} mapped
          </p>
        </div>
        <button
          onClick={loadRepos}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all"
          style={{
            background: "oklch(0.165 0.012 264)",
            border: "1px solid oklch(1 0 0 / 8%)",
            color: "oklch(0.65 0.01 264)",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          sync
        </button>
      </div>

      {/* ── Agent Filter Bar ── */}
      <div
        className="rounded-xl p-4"
        style={{
          background: "oklch(0.148 0.012 264)",
          border: "1px solid oklch(1 0 0 / 6%)",
        }}
      >
        <div
          className="text-[10px] uppercase tracking-widest mb-3"
          style={{ color: "oklch(0.42 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
        >
          → filter by agent
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", ...AGENTS] as (AgentName | "All")[]).map((agent) => {
            const isActive = filterAgent === agent;
            const count = agent === "All" ? repos.length : (agentCounts[agent] ?? 0);
            const badgeClass = agent !== "All" ? AGENT_BADGE_CLASS[agent as AgentName] : "";
            return (
              <button
                key={agent}
                onClick={() => setFilterAgent(agent)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all",
                  isActive
                    ? agent === "All"
                      ? "font-semibold"
                      : cn(badgeClass, "font-semibold")
                    : "hover:opacity-80"
                )}
                style={
                  isActive && agent === "All"
                    ? {
                        background: "oklch(0.88 0.18 196 / 15%)",
                        color: "oklch(0.88 0.18 196)",
                        border: "1px solid oklch(0.88 0.18 196 / 35%)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }
                    : !isActive
                    ? {
                        background: "oklch(1 0 0 / 4%)",
                        color: "oklch(0.52 0.01 264)",
                        border: "1px solid oklch(1 0 0 / 8%)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }
                    : { fontFamily: "'JetBrains Mono', monospace" }
                }
              >
                {agent === "All" ? "all" : agent.toLowerCase()}
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{ background: "oklch(0 0 0 / 20%)" }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "oklch(0.38 0.01 264)" }}
        />
        <input
          type="text"
          placeholder="search repos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-xs outline-none transition-all"
          style={{
            background: "oklch(0.148 0.012 264)",
            border: "1px solid oklch(1 0 0 / 8%)",
            color: "oklch(0.85 0.005 264)",
            fontFamily: "'JetBrains Mono', monospace",
          }}
          onFocus={(e) => (e.target.style.borderColor = "oklch(0.88 0.18 196 / 40%)")}
          onBlur={(e) => (e.target.style.borderColor = "oklch(1 0 0 / 8%)")}
        />
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{
            background: "oklch(0.62 0.22 25 / 8%)",
            border: "1px solid oklch(0.62 0.22 25 / 25%)",
          }}
        >
          <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: "oklch(0.75 0.22 25)" }} />
          <p
            className="text-xs"
            style={{ color: "oklch(0.75 0.22 25)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            {error}
          </p>
        </div>
      )}

      {/* ── Repo List ── */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl p-4 animate-pulse"
              style={{ background: "oklch(0.148 0.012 264)", border: "1px solid oklch(1 0 0 / 5%)" }}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 rounded w-1/3" style={{ background: "oklch(1 0 0 / 8%)" }} />
                  <div className="h-3 rounded w-2/3" style={{ background: "oklch(1 0 0 / 5%)" }} />
                </div>
                <div className="h-8 w-32 rounded-lg" style={{ background: "oklch(1 0 0 / 8%)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ background: "oklch(0.148 0.012 264)", border: "1px solid oklch(1 0 0 / 5%)" }}
        >
          <p
            className="text-xs"
            style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            → no repos match filter
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((repo, i) => {
            const currentAgent = assignments[repo.name] ?? "None";
            const badgeClass = AGENT_BADGE_CLASS[currentAgent];
            const accentColor = AGENT_ACCENT[currentAgent];
            const hasAgent = currentAgent !== "None";
            return (
              <div
                key={repo.id}
                className={cn(
                  "rounded-xl p-3.5 group transition-all duration-150 animate-fade-slide-up",
                  `stagger-${Math.min(i + 1, 6)}`
                )}
                style={{
                  background: hasAgent ? "oklch(0.158 0.012 264)" : "oklch(0.148 0.012 264)",
                  border: "1px solid oklch(1 0 0 / 6%)",
                  borderLeft: hasAgent ? `3px solid ${accentColor}` : "3px solid oklch(1 0 0 / 6%)",
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Repo info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <GitBranch
                        size={12}
                        style={{ color: hasAgent ? accentColor : "oklch(0.38 0.01 264)" }}
                        className="shrink-0"
                      />
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold truncate transition-colors hover:text-[oklch(0.88_0.18_196)]"
                        style={{
                          color: "oklch(0.85 0.005 264)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {repo.name}
                      </a>
                      <ExternalLink
                        size={10}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "oklch(0.38 0.01 264)" }}
                      />
                    </div>
                    {repo.description && (
                      <p
                        className="text-xs truncate mb-1.5 pl-5"
                        style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'Inter', sans-serif" }}
                      >
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 pl-5">
                      {repo.language && (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: getLanguageColor(repo.language) }}
                          />
                          <span
                            className="text-[11px]"
                            style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {repo.language}
                          </span>
                        </div>
                      )}
                      <div
                        className="flex items-center gap-1"
                        style={{ color: "oklch(0.38 0.01 264)" }}
                      >
                        <Clock size={10} />
                        <span
                          className="text-[11px]"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {timeAgo(repo.pushed_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Agent selector */}
                  <div className="shrink-0">
                    <Select
                      value={currentAgent}
                      onValueChange={(val) => handleAssign(repo.name, val as AgentName)}
                    >
                      <SelectTrigger
                        className={cn("w-32 h-7 text-[11px] border-0 rounded-lg", badgeClass)}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                        style={{
                          background: "oklch(0.185 0.012 264)",
                          border: "1px solid oklch(1 0 0 / 12%)",
                        }}
                      >
                        {AGENTS.map((agent) => (
                          <SelectItem
                            key={agent}
                            value={agent}
                            className="text-xs"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              color: "oklch(0.85 0.005 264)",
                            }}
                          >
                            {agent}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p
        className="text-[11px] text-center pb-4"
        style={{ color: "oklch(0.38 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
      >
        → {filtered.length}/{repos.length} repos · assignments persisted locally
      </p>
    </div>
  );
}
