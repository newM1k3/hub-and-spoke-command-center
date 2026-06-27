/* ============================================================
   Dashboard.tsx — Phase 3
   - Activity Heatmap (4-week, top of page)
   - Stat cards: public repos, active agents, deployed count, top language
   - Repo list with LanguageBar + ChurnBadge per row
   - Agent + Status badges + dual filter bar
   - Recent commits feed
   ============================================================ */
import { useEffect, useState } from "react";
import {
  GitBranch,
  Star,
  GitCommit,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Clock,
  ExternalLink,
  Zap,
  ArrowRight,
  Rocket,
  X,
} from "lucide-react";
import { Link } from "wouter";
import {
  fetchRepos,
  fetchUser,
  fetchRecentCommits,
  fetchHeatmapData,
  timeAgo,
  shortSha,
  getLanguageColor,
  GITHUB_USERNAME,
  type GitHubRepo,
  type GitHubUser,
  type GitHubCommit,
  type HeatmapDay,
} from "@/lib/github";
import {
  loadAssignments,
  loadStatuses,
  AGENTS,
  STATUSES,
  AGENT_BADGE_CLASS,
  STATUS_BADGE_CLASS,
  type AgentName,
  type StatusName,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import ActivityHeatmap from "@/components/analytics/ActivityHeatmap";
import LanguageBar from "@/components/analytics/LanguageBar";
import ChurnBadge from "@/components/analytics/ChurnBadge";

interface RepoWithCommits {
  repo: GitHubRepo;
  commits: GitHubCommit[];
}

type FilterAgent  = AgentName  | "All";
type FilterStatus = StatusName | "All";

function CommitNode() {
  return (
    <div className="flex flex-col items-center shrink-0" style={{ width: "16px" }}>
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{
          background: "oklch(0.88 0.18 196 / 80%)",
          boxShadow: "0 0 6px oklch(0.88 0.18 196 / 40%)",
        }}
      />
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser]                       = useState<GitHubUser | null>(null);
  const [repos, setRepos]                     = useState<GitHubRepo[]>([]);
  const [recentActivity, setRecentActivity]   = useState<RepoWithCommits[]>([]);
  const [heatmapDays, setHeatmapDays]         = useState<HeatmapDay[]>([]);
  const [heatmapLoading, setHeatmapLoading]   = useState(true);
  const [assignments, setAssignments]         = useState<Record<string, AgentName>>({});
  const [statuses, setStatuses]               = useState<Record<string, StatusName>>({});
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);
  const [lastSynced, setLastSynced]           = useState<Date | null>(null);
  const [filterAgent, setFilterAgent]         = useState<FilterAgent>("All");
  const [filterStatus, setFilterStatus]       = useState<FilterStatus>("All");

  async function loadData() {
    setLoading(true);
    setHeatmapLoading(true);
    setError(null);
    try {
      const [userData, repoData] = await Promise.all([
        fetchUser(GITHUB_USERNAME),
        fetchRepos(GITHUB_USERNAME),
      ]);
      setUser(userData);
      setRepos(repoData);
      setAssignments(loadAssignments());
      setStatuses(loadStatuses());

      const topRepos = repoData.slice(0, 5);
      const withCommits = await Promise.all(
        topRepos.map(async (repo) => ({
          repo,
          commits: await fetchRecentCommits(GITHUB_USERNAME, repo.name),
        }))
      );
      setRecentActivity(withCommits.filter((r) => r.commits.length > 0));
      setLastSynced(new Date());

      // Heatmap is independent — fetch after main data
      const heatmap = await fetchHeatmapData(GITHUB_USERNAME, repoData);
      setHeatmapDays(heatmap);
      setHeatmapLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch GitHub data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    function onFocus() {
      setAssignments(loadAssignments());
      setStatuses(loadStatuses());
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const activeAgentCount = Object.values(assignments).filter((a) => a !== "None").length;
  const deployedCount    = Object.values(statuses).filter((s) => s === "Deployed").length;
  const languages = repos.reduce<Record<string, number>>((acc, r) => {
    if (r.language) acc[r.language] = (acc[r.language] || 0) + 1;
    return acc;
  }, {});
  const topLanguage = Object.entries(languages).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const filteredRepos = repos.filter((repo) => {
    const agent  = assignments[repo.name] ?? "None";
    const status = statuses[repo.name]    ?? "None";
    const matchAgent  = filterAgent  === "All" || agent  === filterAgent;
    const matchStatus = filterStatus === "All" || status === filterStatus;
    return matchAgent && matchStatus;
  });

  const hasActiveFilters = filterAgent !== "All" || filterStatus !== "All";

  const statCards = [
    {
      label: "public repos",
      value: loading ? "—" : user?.public_repos ?? "—",
      icon: BookOpen,
      accent: "oklch(0.88 0.18 196)",
      accentBg: "oklch(0.88 0.18 196 / 10%)",
    },
    {
      label: "active agents",
      value: loading ? "—" : activeAgentCount,
      icon: Zap,
      accent: "oklch(0.75 0.22 290)",
      accentBg: "oklch(0.75 0.22 290 / 10%)",
    },
    {
      label: "deployed",
      value: loading ? "—" : deployedCount,
      icon: Rocket,
      accent: "oklch(0.72 0.18 145)",
      accentBg: "oklch(0.72 0.18 145 / 10%)",
    },
    {
      label: "top language",
      value: loading ? "—" : topLanguage,
      icon: GitBranch,
      accent: getLanguageColor(topLanguage),
      accentBg: `${getLanguageColor(topLanguage)}18`,
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.92 0.005 264)" }}
          >
            // command center
          </h1>
          <p
            className="text-xs mt-1"
            style={{ color: "oklch(0.88 0.18 196 / 70%)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            {lastSynced
              ? `→ repos synced ${timeAgo(lastSynced.toISOString())}`
              : "→ fetching github.com/newM1k3..."}
          </p>
        </div>
        <button
          onClick={loadData}
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

      {/* ── Error State ── */}
      {error && (
        <div
          className="flex items-start gap-3 p-4 rounded-lg"
          style={{
            background: "oklch(0.62 0.22 25 / 8%)",
            border: "1px solid oklch(0.62 0.22 25 / 25%)",
          }}
        >
          <AlertCircle size={15} className="shrink-0 mt-0.5" style={{ color: "oklch(0.75 0.22 25)" }} />
          <div>
            <p className="text-xs font-medium" style={{ color: "oklch(0.85 0.1 25)", fontFamily: "'Space Grotesk', sans-serif" }}>
              api error
            </p>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.65 0.1 25)", fontFamily: "'JetBrains Mono', monospace" }}>
              {error} — check VITE_GITHUB_TOKEN
            </p>
          </div>
        </div>
      )}

      {/* ── Activity Heatmap ── */}
      <ActivityHeatmap days={heatmapDays} loading={heatmapLoading} />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat, i) => (
          <div
            key={stat.label}
            className={cn("rounded-xl p-4 animate-fade-slide-up", `stagger-${i + 1}`)}
            style={{
              background: "oklch(0.155 0.012 264)",
              border: "1px solid oklch(1 0 0 / 6%)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: stat.accentBg }}
              >
                <stat.icon size={15} style={{ color: stat.accent }} />
              </div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="opacity-30">
                <circle cx="10" cy="10" r="3" fill={stat.accent} />
                <line x1="10" y1="10" x2="2"  y2="4"  stroke={stat.accent} strokeWidth="1" strokeDasharray="1.5 1.5" />
                <line x1="10" y1="10" x2="18" y2="4"  stroke={stat.accent} strokeWidth="1" strokeDasharray="1.5 1.5" />
                <line x1="10" y1="10" x2="10" y2="1"  stroke={stat.accent} strokeWidth="1" strokeDasharray="1.5 1.5" />
                <circle cx="2"  cy="4" r="1.5" fill={stat.accent} />
                <circle cx="18" cy="4" r="1.5" fill={stat.accent} />
                <circle cx="10" cy="1" r="1.5" fill={stat.accent} />
              </svg>
            </div>
            <div
              className="text-2xl font-bold mb-0.5"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.92 0.005 264)" }}
            >
              {stat.value}
            </div>
            <div
              className="text-[11px]"
              style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* ── Repo List Column ── */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2
              className="text-[11px] font-medium uppercase tracking-widest"
              style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              ── recent repos
            </h2>
            <Link href="/spoke-tracker">
              <span
                className="flex items-center gap-1 text-[11px] transition-colors hover:text-[oklch(0.88_0.18_196)]"
                style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'JetBrains Mono', monospace", cursor: "pointer" }}
              >
                manage spokes <ArrowRight size={11} />
              </span>
            </Link>
          </div>

          {/* Filter pills */}
          <div
            className="rounded-xl px-3 py-2.5 space-y-2"
            style={{
              background: "oklch(0.148 0.012 264)",
              border: "1px solid oklch(1 0 0 / 6%)",
            }}
          >
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] uppercase tracking-wider mr-1" style={{ color: "oklch(0.38 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>
                agent:
              </span>
              {(["All", ...AGENTS] as FilterAgent[]).map((agent) => {
                const isActive = filterAgent === agent;
                return (
                  <button
                    key={agent}
                    onClick={() => setFilterAgent(agent)}
                    className={cn("px-2 py-0.5 rounded-full text-[10px] transition-all", isActive && agent !== "All" ? AGENT_BADGE_CLASS[agent as AgentName] : "")}
                    style={
                      isActive && agent === "All"
                        ? { background: "oklch(0.88 0.18 196 / 15%)", color: "oklch(0.88 0.18 196)", border: "1px solid oklch(0.88 0.18 196 / 35%)", fontFamily: "'JetBrains Mono', monospace" }
                        : !isActive
                        ? { background: "oklch(1 0 0 / 4%)", color: "oklch(0.45 0.01 264)", border: "1px solid oklch(1 0 0 / 8%)", fontFamily: "'JetBrains Mono', monospace" }
                        : { fontFamily: "'JetBrains Mono', monospace" }
                    }
                  >
                    {agent === "All" ? "all" : agent.toLowerCase()}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] uppercase tracking-wider mr-1" style={{ color: "oklch(0.38 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>
                status:
              </span>
              {(["All", ...STATUSES] as FilterStatus[]).map((status) => {
                const isActive = filterStatus === status;
                return (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={cn("px-2 py-0.5 rounded-full text-[10px] transition-all", isActive && status !== "All" ? STATUS_BADGE_CLASS[status as StatusName] : "")}
                    style={
                      isActive && status === "All"
                        ? { background: "oklch(0.88 0.18 196 / 15%)", color: "oklch(0.88 0.18 196)", border: "1px solid oklch(0.88 0.18 196 / 35%)", fontFamily: "'JetBrains Mono', monospace" }
                        : !isActive
                        ? { background: "oklch(1 0 0 / 4%)", color: "oklch(0.45 0.01 264)", border: "1px solid oklch(1 0 0 / 8%)", fontFamily: "'JetBrains Mono', monospace" }
                        : { fontFamily: "'JetBrains Mono', monospace" }
                    }
                  >
                    {status === "All" ? "all" : status.toLowerCase()}
                  </button>
                );
              })}
              {hasActiveFilters && (
                <button
                  onClick={() => { setFilterAgent("All"); setFilterStatus("All"); }}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] transition-colors hover:text-[oklch(0.88_0.18_196)]"
                  style={{ color: "oklch(0.42 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
                >
                  <X size={9} /> clear
                </button>
              )}
            </div>
          </div>

          {/* Repo rows */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "oklch(0.155 0.012 264)", border: "1px solid oklch(1 0 0 / 6%)" }}>
                  <div className="h-4 rounded w-2/5 mb-2" style={{ background: "oklch(1 0 0 / 8%)" }} />
                  <div className="h-3 rounded w-3/4 mb-3" style={{ background: "oklch(1 0 0 / 5%)" }} />
                  <div className="h-1.5 rounded-full w-full" style={{ background: "oklch(1 0 0 / 6%)" }} />
                </div>
              ))}
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="rounded-xl p-8 text-center" style={{ background: "oklch(0.148 0.012 264)", border: "1px solid oklch(1 0 0 / 5%)" }}>
              <p className="text-xs" style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>→ no repos match filters</p>
              <button onClick={() => { setFilterAgent("All"); setFilterStatus("All"); }} className="mt-1.5 text-xs transition-colors hover:text-[oklch(0.88_0.18_196)]" style={{ color: "oklch(0.42 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>
                clear filters →
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredRepos.slice(0, 8).map((repo, i) => {
                const agent  = assignments[repo.name] ?? "None";
                const status = statuses[repo.name]    ?? "None";
                const hasAgent  = agent  !== "None";
                const hasStatus = status !== "None";
                return (
                  <div
                    key={repo.id}
                    className={cn("rounded-xl p-3.5 group transition-all duration-150 animate-fade-slide-up", `stagger-${Math.min(i + 1, 6)}`)}
                    style={{
                      background: (hasAgent || hasStatus) ? "oklch(0.162 0.012 264)" : "oklch(0.148 0.012 264)",
                      border: (hasAgent || hasStatus) ? "1px solid oklch(1 0 0 / 10%)" : "1px solid oklch(1 0 0 / 5%)",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "oklch(0.168 0.012 264)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = (hasAgent || hasStatus) ? "oklch(0.162 0.012 264)" : "oklch(0.148 0.012 264)"; }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold truncate transition-colors hover:text-[oklch(0.88_0.18_196)]"
                            style={{ color: "oklch(0.85 0.005 264)", fontFamily: "'Space Grotesk', sans-serif" }}
                          >
                            {repo.name}
                          </a>
                          <ExternalLink size={11} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "oklch(0.42 0.01 264)" }} />
                        </div>
                        {repo.description && (
                          <p className="text-xs truncate mb-1.5" style={{ color: "oklch(0.52 0.01 264)", fontFamily: "'Inter', sans-serif" }}>
                            {repo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap">
                          {repo.language && (
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: getLanguageColor(repo.language) }} />
                              <span className="text-[11px]" style={{ color: "oklch(0.52 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>{repo.language}</span>
                            </div>
                          )}
                          {repo.stargazers_count > 0 && (
                            <div className="flex items-center gap-1" style={{ color: "oklch(0.48 0.01 264)" }}>
                              <Star size={10} />
                              <span className="text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{repo.stargazers_count}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1" style={{ color: "oklch(0.38 0.01 264)" }}>
                            <Clock size={10} />
                            <span className="text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{timeAgo(repo.pushed_at)}</span>
                          </div>
                          {/* Churn badge inline */}
                          <ChurnBadge repoName={repo.name} />
                        </div>
                        {/* Language bar */}
                        <LanguageBar repoName={repo.name} />
                      </div>

                      {/* Agent + Status badges */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={cn("text-[11px] px-2 py-0.5 rounded-full", AGENT_BADGE_CLASS[agent])} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {agent === "None" ? "no agent" : agent.toLowerCase()}
                        </span>
                        <span className={cn("text-[11px] px-2 py-0.5 rounded-full", STATUS_BADGE_CLASS[status])} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {status === "None" ? "no status" : status.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Recent Commits Column ── */}
        <div className="lg:col-span-2 space-y-3">
          <h2
            className="text-[11px] font-medium uppercase tracking-widest"
            style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            ── recent commits
          </h2>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl p-3.5 animate-pulse" style={{ background: "oklch(0.155 0.012 264)", border: "1px solid oklch(1 0 0 / 6%)" }}>
                  <div className="h-3 rounded w-1/3 mb-2" style={{ background: "oklch(1 0 0 / 8%)" }} />
                  <div className="h-3 rounded w-full" style={{ background: "oklch(1 0 0 / 5%)" }} />
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="rounded-xl p-6 text-center" style={{ background: "oklch(0.155 0.012 264)", border: "1px solid oklch(1 0 0 / 6%)" }}>
              <GitCommit size={22} className="mx-auto mb-2" style={{ color: "oklch(0.38 0.01 264)" }} />
              <p className="text-xs" style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>no recent commits</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentActivity.map(({ repo, commits }) =>
                commits.slice(0, 2).map((commit, i) => (
                  <div
                    key={commit.sha}
                    className={cn("rounded-xl p-3.5 animate-fade-slide-up", `stagger-${Math.min(i + 1, 4)}`)}
                    style={{ background: "oklch(0.148 0.012 264)", border: "1px solid oklch(1 0 0 / 5%)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CommitNode />
                      <a
                        href={`https://github.com/${GITHUB_USERNAME}/${repo.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold truncate transition-colors hover:text-[oklch(0.88_0.18_196)]"
                        style={{ color: "oklch(0.88 0.18 196 / 80%)", fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {repo.name}
                      </a>
                    </div>
                    <p className="text-xs leading-relaxed line-clamp-2 mb-2 pl-5" style={{ color: "oklch(0.65 0.01 264)", fontFamily: "'Inter', sans-serif" }}>
                      {commit.commit.message.split("\n")[0]}
                    </p>
                    <div className="flex items-center justify-between pl-5">
                      <a
                        href={commit.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] transition-colors hover:text-[oklch(0.88_0.18_196)]"
                        style={{ color: "oklch(0.38 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {shortSha(commit.sha)}
                      </a>
                      <span className="text-[11px]" style={{ color: "oklch(0.38 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {timeAgo(commit.commit.author.date)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
