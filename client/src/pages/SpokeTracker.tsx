/* ============================================================
   SpokeTracker.tsx — Phase 3.1
   + LanguageBar per repo row
   + ChurnBadge with trend arrow per repo row
   + Language filter row (TypeScript, JavaScript, Python, etc.)
   - Agent assignment (persisted to localStorage)
   - Status tracking: Idea / Vibe Coding / Debugging / Deployed
   - Triple filter bar: Agent + Status + Language
   - All state survives page refresh via localStorage
   ============================================================ */
import { useEffect, useState, type ReactNode } from "react";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import {
  GitBranch,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Clock,
  Search,
  X,
  Download,
  ArrowUpDown,
  Star,
  CalendarClock,
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
  GitHubAPIError,
  type GitHubRepo,
} from "@/lib/github";
import {
  loadAssignments,
  saveAssignments,
  loadStatuses,
  saveStatuses,
  AGENTS,
  STATUSES,
  AGENT_BADGE_CLASS,
  STATUS_BADGE_CLASS,
  STATUS_ACCENT,
  type AgentName,
  type StatusName,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import LanguageBar from "@/components/analytics/LanguageBar";
import ChurnBadge from "@/components/analytics/ChurnBadge";

/* Agent accent colors for left-border treatment */
const AGENT_ACCENT: Record<AgentName, string> = {
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
  "None":      "oklch(1 0 0 / 6%)",
};



export default function SpokeTracker() {
  const [repos, setRepos]             = useState<GitHubRepo[]>([]);
  const [assignments, setAssignments] = useState<Record<string, AgentName>>({});
  const [statuses, setStatuses]       = useState<Record<string, StatusName>>({});
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [errorCode, setErrorCode]     = useState<"RATE_LIMIT" | "UNAUTHORIZED" | "UNKNOWN" | null>(null);
  const [search, setSearch]           = useState("");
  const [sortKey, setSortKey]          = useState<"pushed" | "stars" | "agent" | "status">("pushed");
  const [sortDir, setSortDir]          = useState<"asc" | "desc">("desc");
  const { agent: filterAgent, status: filterStatus, lang: filterLang, setAgent: setFilterAgent, setStatus: setFilterStatus, setLang: setFilterLang, clearAll: clearFilters, hasActive: hasActiveFilters } = useUrlFilters();

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  /* Load localStorage on mount */
  useEffect(() => {
    setAssignments(loadAssignments());
    setStatuses(loadStatuses());
  }, []);

  async function loadRepos() {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const data = await fetchRepos(GITHUB_USERNAME);
      setRepos(data);
    } catch (err) {
      if (err instanceof GitHubAPIError) {
        setErrorCode(err.code === "RATE_LIMIT" || err.code === "UNAUTHORIZED" ? err.code : "UNKNOWN");
        setError(err.message);
      } else {
        setErrorCode("UNKNOWN");
        setError(err instanceof Error ? err.message : "Failed to fetch repos");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRepos(); }, []);

  function handleAssign(repoName: string, agent: AgentName) {
    const updated = { ...assignments, [repoName]: agent };
    setAssignments(updated);
    saveAssignments(updated);
    if (agent !== "None") {
      toast.success(`→ ${repoName}`, { description: `agent: ${agent}`, duration: 1800 });
    }
  }

  function handleStatus(repoName: string, status: StatusName) {
    const updated = { ...statuses, [repoName]: status };
    setStatuses(updated);
    saveStatuses(updated);
    if (status !== "None") {
      toast.success(`→ ${repoName}`, { description: `status: ${status}`, duration: 1800 });
    }
  }

  /* Derive unique languages from fetched repos (sorted by count) */
  const availableLanguages: string[] = (() => {
    const counts: Record<string, number> = {};
    for (const r of repos) {
      if (r.language) counts[r.language] = (counts[r.language] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang);
  })();

  /* Filtering */
  const filtered = repos.filter((repo) => {
    const agent  = assignments[repo.name] ?? "None";
    const status = statuses[repo.name]    ?? "None";
    const matchSearch =
      search === "" ||
      repo.name.toLowerCase().includes(search.toLowerCase()) ||
      (repo.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchAgent  = filterAgent  === "All" || agent  === filterAgent;
    const matchStatus = filterStatus === "All" || status === filterStatus;
    const matchLang   = filterLang   === "All" || (repo.language ?? "None") === filterLang;
    return matchSearch && matchAgent && matchStatus && matchLang;
  });

  /* Summary counts */
  const assignedCount = repos.filter((r) => (assignments[r.name] ?? "None") !== "None").length;
  const deployedCount = repos.filter((r) => (statuses[r.name]    ?? "None") === "Deployed").length;

  const agentCounts = AGENTS.reduce<Record<string, number>>((acc, a) => {
    acc[a] = repos.filter((r) => (assignments[r.name] ?? "None") === a).length;
    return acc;
  }, {});

  const statusCounts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = repos.filter((r) => (statuses[r.name] ?? "None") === s).length;
    return acc;
  }, {});

  /* Sort filtered repos */
  const STATUS_ORDER: Record<string, number> = { Deployed: 0, Debugging: 1, "Vibe Coding": 2, Idea: 3, None: 4 };
  const AGENT_ORDER: Record<string, number> = AGENTS.reduce<Record<string, number>>((acc, a, i) => { acc[a] = i; return acc; }, { None: AGENTS.length });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "pushed") {
      cmp = new Date(a.pushed_at ?? 0).getTime() - new Date(b.pushed_at ?? 0).getTime();
    } else if (sortKey === "stars") {
      cmp = (a.stargazers_count ?? 0) - (b.stargazers_count ?? 0);
    } else if (sortKey === "agent") {
      cmp = (AGENT_ORDER[assignments[a.name] ?? "None"] ?? 99) - (AGENT_ORDER[assignments[b.name] ?? "None"] ?? 99);
    } else if (sortKey === "status") {
      cmp = (STATUS_ORDER[statuses[a.name] ?? "None"] ?? 99) - (STATUS_ORDER[statuses[b.name] ?? "None"] ?? 99);
    }
    return sortDir === "desc" ? -cmp : cmp;
  });

  /* CSV Export */
  function exportCSV() {
    const headers = ["repo", "description", "language", "agent", "status", "stars", "pushed_at", "url"];
    const rows = repos.map((r) => [
      r.name,
      (r.description ?? "").replace(/,/g, ";"),
      r.language ?? "",
      assignments[r.name] ?? "None",
      statuses[r.name]    ?? "None",
      String(r.stargazers_count ?? 0),
      r.pushed_at ? new Date(r.pushed_at).toISOString().split("T")[0] : "",
      r.html_url,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `hub-spoke-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("→ export complete", { description: `${repos.length} repos · CSV`, duration: 2000 });
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">

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
            → {assignedCount}/{repos.length} agents mapped · {deployedCount} deployed
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* CSV Export */}
          <button
            onClick={exportCSV}
            disabled={repos.length === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all"
            style={{
              background: "oklch(0.88 0.18 196 / 8%)",
              border: "1px solid oklch(0.88 0.18 196 / 20%)",
              color: repos.length > 0 ? "oklch(0.88 0.18 196)" : "oklch(0.38 0.01 264)",
              fontFamily: "'JetBrains Mono', monospace",
              cursor: repos.length > 0 ? "pointer" : "not-allowed",
            }}
            title="Export to CSV"
          >
            <Download size={13} />
            export
          </button>
          {/* Sync */}
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
      </div>

      {/* ── Dual Filter Bar ── */}
      <div
        className="rounded-xl p-4 space-y-4"
        style={{
          background: "oklch(0.148 0.012 264)",
          border: "1px solid oklch(1 0 0 / 6%)",
        }}
      >
        {/* Agent filter row */}
        <div>
          <div
            className="text-[10px] uppercase tracking-widest mb-2"
            style={{ color: "oklch(0.42 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            → filter by agent
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["All", ...AGENTS] as (AgentName | "All")[]).map((agent) => {
              const isActive = filterAgent === agent;
              const count = agent === "All" ? repos.length : (agentCounts[agent as AgentName] ?? 0);
              return (
                <button
                  key={agent}
                  onClick={() => setFilterAgent(agent)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition-all",
                    isActive && agent !== "All" ? AGENT_BADGE_CLASS[agent as AgentName] : ""
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
                    className="text-[10px] font-bold px-1 rounded"
                    style={{ background: "oklch(0 0 0 / 20%)" }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid oklch(1 0 0 / 6%)" }} />

        {/* Status filter row */}
        <div>
          <div
            className="text-[10px] uppercase tracking-widest mb-2"
            style={{ color: "oklch(0.42 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            → filter by status
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["All", ...STATUSES] as (StatusName | "All")[]).map((status) => {
              const isActive = filterStatus === status;
              const count = status === "All" ? repos.length : (statusCounts[status as StatusName] ?? 0);
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition-all",
                    isActive && status !== "All" ? STATUS_BADGE_CLASS[status as StatusName] : ""
                  )}
                  style={
                    isActive && status === "All"
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
                  {status === "All" ? "all" : status.toLowerCase()}
                  <span
                    className="text-[10px] font-bold px-1 rounded"
                    style={{ background: "oklch(0 0 0 / 20%)" }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language filter row */}
        <div style={{ borderTop: "1px solid oklch(1 0 0 / 6%)" }} className="pt-3">
          <div
            className="text-[10px] uppercase tracking-widest mb-2"
            style={{ color: "oklch(0.42 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            → filter by language
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["All", ...availableLanguages] as (string | "All")[]).map((lang) => {
              const isActive = filterLang === lang;
              const count = lang === "All"
                ? repos.length
                : repos.filter((r) => r.language === lang).length;
              const dotColor = lang === "All" ? "oklch(0.88 0.18 196)" : (getLanguageColor(lang as string));
              return (
                <button
                  key={lang}
                  onClick={() => setFilterLang(lang)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition-all"
                  style={
                    isActive
                      ? {
                          background: `${dotColor}18`,
                          color: dotColor,
                          border: `1px solid ${dotColor}55`,
                          fontFamily: "'JetBrains Mono', monospace",
                        }
                      : {
                          background: "oklch(1 0 0 / 4%)",
                          color: "oklch(0.52 0.01 264)",
                          border: "1px solid oklch(1 0 0 / 8%)",
                          fontFamily: "'JetBrains Mono', monospace",
                        }
                  }
                >
                  {lang !== "All" && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: getLanguageColor(lang as string) }}
                    />
                  )}
                  {lang === "All" ? "all" : lang.toLowerCase()}
                  <span
                    className="text-[10px] font-bold px-1 rounded"
                    style={{ background: "oklch(0 0 0 / 20%)" }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-[11px] transition-colors hover:text-[oklch(0.88_0.18_196)]"
            style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            <X size={11} /> clear all filters
          </button>
        )}
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
          onBlur={(e)  => (e.target.style.borderColor = "oklch(1 0 0 / 8%)")}
        />
      </div>

      {/* ── Sort Controls ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[10px] uppercase tracking-widest mr-1"
          style={{ color: "oklch(0.38 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
        >
          sort:
        </span>
        {([
          { key: "pushed", label: "last pushed", icon: <CalendarClock size={11} /> },
          { key: "stars",  label: "stars",       icon: <Star size={11} /> },
          { key: "agent",  label: "agent",       icon: <ArrowUpDown size={11} /> },
          { key: "status", label: "status",      icon: <ArrowUpDown size={11} /> },
        ] as { key: typeof sortKey; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => {
          const isActive = sortKey === key;
          return (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition-all"
              style={isActive ? {
                background: "oklch(0.88 0.18 196 / 12%)",
                color: "oklch(0.88 0.18 196)",
                border: "1px solid oklch(0.88 0.18 196 / 30%)",
                fontFamily: "'JetBrains Mono', monospace",
              } : {
                background: "oklch(1 0 0 / 4%)",
                color: "oklch(0.48 0.01 264)",
                border: "1px solid oklch(1 0 0 / 8%)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {icon}
              {label}
              {isActive && (
                <span style={{ opacity: 0.7 }}>{sortDir === "desc" ? "↓" : "↑"}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          className="rounded-xl p-4 space-y-2"
          style={{
            background: errorCode === "RATE_LIMIT" || errorCode === "UNAUTHORIZED"
              ? "oklch(0.72 0.18 55 / 8%)"
              : "oklch(0.62 0.22 25 / 8%)",
            border: errorCode === "RATE_LIMIT" || errorCode === "UNAUTHORIZED"
              ? "1px solid oklch(0.72 0.18 55 / 30%)"
              : "1px solid oklch(0.62 0.22 25 / 25%)",
          }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle
              size={14}
              style={{ color: errorCode === "RATE_LIMIT" || errorCode === "UNAUTHORIZED" ? "oklch(0.82 0.18 55)" : "oklch(0.75 0.22 25)" }}
            />
            <span
              className="text-xs font-semibold"
              style={{
                color: errorCode === "RATE_LIMIT" || errorCode === "UNAUTHORIZED" ? "oklch(0.88 0.14 55)" : "oklch(0.85 0.1 25)",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {errorCode === "RATE_LIMIT"
                ? "rate limit exceeded"
                : errorCode === "UNAUTHORIZED"
                ? "authentication failed"
                : "api error"}
            </span>
          </div>
          {(errorCode === "RATE_LIMIT" || errorCode === "UNAUTHORIZED") ? (
            <p
              className="text-xs leading-relaxed"
              style={{ color: "oklch(0.65 0.1 55)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              github api rate limit exceeded or token missing. open{" "}
              <button
                onClick={() => {
                  const el = document.querySelector('[title="GitHub PAT settings"]') as HTMLElement | null;
                  el?.click();
                }}
                className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                style={{ color: "oklch(0.88 0.18 196)" }}
              >
                settings
              </button>{" "}
              in the sidebar and paste your personal access token to load repositories.
            </p>
          ) : (
            <p
              className="text-xs"
              style={{ color: "oklch(0.65 0.1 25)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              {error}
            </p>
          )}
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
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 rounded w-1/3" style={{ background: "oklch(1 0 0 / 8%)" }} />
                  <div className="h-3 rounded w-2/3" style={{ background: "oklch(1 0 0 / 5%)" }} />
                </div>
                <div className="flex gap-2">
                  <div className="h-7 w-28 rounded-full" style={{ background: "oklch(1 0 0 / 8%)" }} />
                  <div className="h-7 w-28 rounded-full" style={{ background: "oklch(1 0 0 / 8%)" }} />
                </div>
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
            → no repos match current filters
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => { clearFilters(); setSearch(""); }}
              className="mt-2 text-xs transition-colors hover:text-[oklch(0.88_0.18_196)]"
              style={{ color: "oklch(0.42 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              clear filters →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((repo, i) => {
            const currentAgent  = assignments[repo.name] ?? "None";
            const currentStatus = statuses[repo.name]    ?? "None";
            const agentBadge    = AGENT_BADGE_CLASS[currentAgent];
            const statusBadge   = STATUS_BADGE_CLASS[currentStatus];
            const hasAgent      = currentAgent  !== "None";
            const hasStatus     = currentStatus !== "None";

            /* Left border: status takes priority over agent for color signal */
            const borderColor = hasStatus
              ? STATUS_ACCENT[currentStatus]
              : hasAgent
              ? AGENT_ACCENT[currentAgent]
              : "oklch(1 0 0 / 6%)";

            return (
              <div
                key={repo.id}
                className={cn(
                  "rounded-xl p-3.5 group transition-all duration-150 animate-fade-slide-up",
                  `stagger-${Math.min(i + 1, 6)}`
                )}
                style={{
                  background: (hasAgent || hasStatus) ? "oklch(0.158 0.012 264)" : "oklch(0.148 0.012 264)",
                  border: "1px solid oklch(1 0 0 / 6%)",
                  borderLeft: `3px solid ${borderColor}`,
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Repo info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <GitBranch
                        size={12}
                        style={{ color: hasAgent ? AGENT_ACCENT[currentAgent] : "oklch(0.38 0.01 264)" }}
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
                    <div className="flex items-center gap-3 pl-5 flex-wrap">
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
                      <div className="flex items-center gap-1" style={{ color: "oklch(0.38 0.01 264)" }}>
                        <Clock size={10} />
                        <span className="text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {timeAgo(repo.pushed_at)}
                        </span>
                      </div>
                      {/* Churn badge */}
                      <ChurnBadge repoName={repo.name} />
                    </div>
                    {/* Language bar */}
                    <div className="pl-5 mt-1">
                      <LanguageBar repoName={repo.name} />
                    </div>
                  </div>

                  {/* Dropdowns — stacked on mobile, side-by-side on sm+ */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                    {/* Agent selector */}
                    <Select
                      value={currentAgent}
                      onValueChange={(val) => handleAssign(repo.name, val as AgentName)}
                    >
                      <SelectTrigger
                        className={cn("w-28 h-7 text-[11px] border-0 rounded-full", agentBadge)}
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
                            style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.85 0.005 264)" }}
                          >
                            {agent}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Status selector */}
                    <Select
                      value={currentStatus}
                      onValueChange={(val) => handleStatus(repo.name, val as StatusName)}
                    >
                      <SelectTrigger
                        className={cn("w-32 h-7 text-[11px] border-0 rounded-full", statusBadge)}
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
                        {STATUSES.map((status) => (
                          <SelectItem
                            key={status}
                            value={status}
                            className="text-xs"
                            style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(0.85 0.005 264)" }}
                          >
                            {status}
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
        → {filtered.length}/{repos.length} repos · state persisted to localStorage
      </p>
    </div>
  );
}
