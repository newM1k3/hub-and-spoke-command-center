/* ============================================================
   SpokeTracker.tsx — Assign Active Agent to each GitHub repo
   Theme: Minimal Dark Forge
   Agents: Bolt.new, Manus, Replit, Cursor, None
   ============================================================ */
import { useEffect, useState } from "react";
import {
  GitBranch,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Clock,
  Search,
  Filter,
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
      toast.success(`${repoName} → ${agent}`, {
        description: "Agent assignment saved.",
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
    acc[agent] = Object.values(assignments).filter((a) => a === agent).length;
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.92 0.005 264)" }}
          >
            // spoke tracker
          </h1>
          <p className="text-sm mt-1" style={{ color: "oklch(0.58 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>
            assign active agents to repositories
          </p>
        </div>
        <button
          onClick={loadRepos}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all"
          style={{
            background: "oklch(0.185 0.012 264)",
            border: "1px solid oklch(1 0 0 / 10%)",
            color: "oklch(0.72 0.01 264)",
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── Agent Summary Pills ── */}
      <div className="flex flex-wrap gap-2">
        {(["All", ...AGENTS] as (AgentName | "All")[]).map((agent) => {
          const isActive = filterAgent === agent;
          const count = agent === "All" ? repos.length : (agentCounts[agent] ?? 0);
          return (
            <button
              key={agent}
              onClick={() => setFilterAgent(agent)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all",
                isActive
                  ? agent === "All"
                    ? "bg-[oklch(0.88_0.18_196)] text-[oklch(0.118_0.012_264)] font-medium"
                    : cn(AGENT_BADGE_CLASS[agent as AgentName], "font-medium")
                  : "border border-[oklch(1_0_0_/_10%)] text-[oklch(0.58_0.01_264)] hover:border-[oklch(1_0_0_/_20%)]"
              )}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {agent}
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                  isActive ? "bg-[oklch(0_0_0_/_20%)]" : "bg-[oklch(1_0_0_/_8%)]"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "oklch(0.42 0.01 264)" }} />
        <input
          type="text"
          placeholder="search repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
          style={{
            background: "oklch(0.155 0.012 264)",
            border: "1px solid oklch(1 0 0 / 10%)",
            color: "oklch(0.92 0.005 264)",
            fontFamily: "'Inter', sans-serif",
          }}
          onFocus={(e) => (e.target.style.borderColor = "oklch(0.88 0.18 196 / 50%)")}
          onBlur={(e) => (e.target.style.borderColor = "oklch(1 0 0 / 10%)")}
        />
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          className="flex items-start gap-3 p-4 rounded-lg"
          style={{ background: "oklch(0.62 0.22 25 / 10%)", border: "1px solid oklch(0.62 0.22 25 / 30%)" }}
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: "oklch(0.75 0.22 25)" }} />
          <p className="text-sm" style={{ color: "oklch(0.85 0.1 25)" }}>{error}</p>
        </div>
      )}

      {/* ── Repo List ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card-surface p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 rounded w-1/3" style={{ background: "oklch(1 0 0 / 8%)" }} />
                  <div className="h-3 rounded w-2/3" style={{ background: "oklch(1 0 0 / 5%)" }} />
                </div>
                <div className="h-9 w-36 rounded-md" style={{ background: "oklch(1 0 0 / 8%)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-surface p-10 text-center">
          <Filter size={28} className="mx-auto mb-3" style={{ color: "oklch(0.42 0.01 264)" }} />
          <p className="text-sm" style={{ color: "oklch(0.58 0.01 264)" }}>
            No repositories match your filter.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((repo, i) => {
            const currentAgent = assignments[repo.name] ?? "None";
            const badgeClass = AGENT_BADGE_CLASS[currentAgent];
            return (
              <div
                key={repo.id}
                className={cn(
                  "card-surface p-4 group hover:border-[oklch(1_0_0_/_15%)] transition-all duration-150 animate-fade-slide-up",
                  `stagger-${Math.min(i + 1, 6)}`
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Repo info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <GitBranch size={13} style={{ color: "oklch(0.42 0.01 264)" }} className="shrink-0" />
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium truncate hover:text-[oklch(0.88_0.18_196)] transition-colors"
                        style={{ color: "oklch(0.88 0.005 264)", fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {repo.name}
                      </a>
                      <ExternalLink
                        size={11}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "oklch(0.42 0.01 264)" }}
                      />
                    </div>
                    {repo.description && (
                      <p
                        className="text-xs truncate mb-2"
                        style={{ color: "oklch(0.58 0.01 264)", fontFamily: "'Inter', sans-serif" }}
                      >
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      {repo.language && (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: getLanguageColor(repo.language) }}
                          />
                          <span className="text-[11px]" style={{ color: "oklch(0.58 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>
                            {repo.language}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1" style={{ color: "oklch(0.42 0.01 264)" }}>
                        <Clock size={11} />
                        <span className="text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
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
                        className={cn("w-36 h-8 text-xs border-0", badgeClass)}
                        style={{ fontFamily: "'Inter', sans-serif" }}
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
                            style={{ fontFamily: "'Inter', sans-serif", color: "oklch(0.92 0.005 264)" }}
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
        className="text-xs text-center pb-4"
        style={{ color: "oklch(0.42 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
      >
        {filtered.length} of {repos.length} repos shown · assignments saved locally
      </p>
    </div>
  );
}
