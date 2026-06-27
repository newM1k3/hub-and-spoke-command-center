/* ============================================================
   Dashboard.tsx — Main overview page
   Theme: Minimal Dark Forge
   Style Review Applied:
   - Stronger surface elevation (layered bg steps, not just borders)
   - CLI-native copy ("// repos synced", "→ push", etc.)
   - Node motifs on stat cards and commit items
   - Agent badges visible even on unassigned repos (show taxonomy)
   ============================================================ */
import { useEffect, useState } from "react";
import {
  GitBranch,
  Star,
  GitCommit,
  RefreshCw,
  AlertCircle,
  Users,
  BookOpen,
  Clock,
  ExternalLink,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import {
  fetchRepos,
  fetchUser,
  fetchRecentCommits,
  timeAgo,
  shortSha,
  getLanguageColor,
  GITHUB_USERNAME,
  type GitHubRepo,
  type GitHubUser,
  type GitHubCommit,
} from "@/lib/github";
import { loadAssignments, AGENT_BADGE_CLASS, type AgentName } from "@/lib/store";
import { cn } from "@/lib/utils";

interface RepoWithCommits {
  repo: GitHubRepo;
  commits: GitHubCommit[];
}

/* Tiny node connector for commit items */
function CommitNode() {
  return (
    <div className="flex flex-col items-center shrink-0" style={{ width: "16px" }}>
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{ background: "oklch(0.88 0.18 196 / 80%)", boxShadow: "0 0 6px oklch(0.88 0.18 196 / 40%)" }}
      />
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [recentActivity, setRecentActivity] = useState<RepoWithCommits[]>([]);
  const [assignments, setAssignments] = useState<Record<string, AgentName>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [userData, repoData] = await Promise.all([
        fetchUser(GITHUB_USERNAME),
        fetchRepos(GITHUB_USERNAME),
      ]);
      setUser(userData);
      setRepos(repoData);
      setAssignments(loadAssignments());

      const topRepos = repoData.slice(0, 5);
      const withCommits = await Promise.all(
        topRepos.map(async (repo) => ({
          repo,
          commits: await fetchRecentCommits(GITHUB_USERNAME, repo.name),
        }))
      );
      setRecentActivity(withCommits.filter((r) => r.commits.length > 0));
      setLastSynced(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch GitHub data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeAgentCount = Object.values(assignments).filter((a) => a !== "None").length;
  const languages = repos.reduce<Record<string, number>>((acc, r) => {
    if (r.language) acc[r.language] = (acc[r.language] || 0) + 1;
    return acc;
  }, {});
  const topLanguage = Object.entries(languages).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const statCards = [
    {
      label: "public repos",
      value: loading ? "—" : user?.public_repos ?? "—",
      icon: BookOpen,
      accent: "oklch(0.88 0.18 196)",
      accentBg: "oklch(0.88 0.18 196 / 10%)",
      delay: "stagger-1",
    },
    {
      label: "active agents",
      value: loading ? "—" : activeAgentCount,
      icon: Zap,
      accent: "oklch(0.75 0.22 290)",
      accentBg: "oklch(0.75 0.22 290 / 10%)",
      delay: "stagger-2",
    },
    {
      label: "followers",
      value: loading ? "—" : user?.followers ?? "—",
      icon: Users,
      accent: "oklch(0.72 0.18 145)",
      accentBg: "oklch(0.72 0.18 145 / 10%)",
      delay: "stagger-3",
    },
    {
      label: "top language",
      value: loading ? "—" : topLanguage,
      icon: GitBranch,
      accent: getLanguageColor(topLanguage),
      accentBg: `${getLanguageColor(topLanguage)}18`,
      delay: "stagger-4",
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
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
            <p
              className="text-xs font-medium"
              style={{ color: "oklch(0.85 0.1 25)", fontFamily: "'Space Grotesk', sans-serif" }}
            >
              api error
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "oklch(0.65 0.1 25)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              {error} — check VITE_GITHUB_TOKEN
            </p>
          </div>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={cn("rounded-xl p-4 animate-fade-slide-up", stat.delay)}
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
              {/* Node motif */}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="opacity-30">
                <circle cx="10" cy="10" r="3" fill={stat.accent} />
                <line x1="10" y1="10" x2="2" y2="4"  stroke={stat.accent} strokeWidth="1" strokeDasharray="1.5 1.5" />
                <line x1="10" y1="10" x2="18" y2="4" stroke={stat.accent} strokeWidth="1" strokeDasharray="1.5 1.5" />
                <line x1="10" y1="10" x2="10" y2="1" stroke={stat.accent} strokeWidth="1" strokeDasharray="1.5 1.5" />
                <circle cx="2"  cy="4"  r="1.5" fill={stat.accent} />
                <circle cx="18" cy="4"  r="1.5" fill={stat.accent} />
                <circle cx="10" cy="1"  r="1.5" fill={stat.accent} />
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
        {/* Recent Repos */}
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
                assign agents <ArrowRight size={11} />
              </span>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 animate-pulse"
                  style={{ background: "oklch(0.155 0.012 264)", border: "1px solid oklch(1 0 0 / 6%)" }}
                >
                  <div className="h-4 rounded w-2/5 mb-2" style={{ background: "oklch(1 0 0 / 8%)" }} />
                  <div className="h-3 rounded w-3/4" style={{ background: "oklch(1 0 0 / 5%)" }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {repos.slice(0, 8).map((repo, i) => {
                const agent = assignments[repo.name];
                const badgeClass = agent ? AGENT_BADGE_CLASS[agent] : AGENT_BADGE_CLASS["None"];
                const hasAgent = agent && agent !== "None";
                return (
                  <div
                    key={repo.id}
                    className={cn(
                      "rounded-xl p-3.5 group transition-all duration-150 animate-fade-slide-up",
                      `stagger-${Math.min(i + 1, 6)}`
                    )}
                    style={{
                      background: hasAgent ? "oklch(0.162 0.012 264)" : "oklch(0.148 0.012 264)",
                      border: hasAgent
                        ? "1px solid oklch(1 0 0 / 10%)"
                        : "1px solid oklch(1 0 0 / 5%)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = "oklch(0.168 0.012 264)";
                      (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(1 0 0 / 12%)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = hasAgent ? "oklch(0.162 0.012 264)" : "oklch(0.148 0.012 264)";
                      (e.currentTarget as HTMLDivElement).style.borderColor = hasAgent ? "oklch(1 0 0 / 10%)" : "oklch(1 0 0 / 5%)";
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
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
                            size={11}
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "oklch(0.42 0.01 264)" }}
                          />
                        </div>
                        {repo.description && (
                          <p
                            className="text-xs truncate mb-1.5"
                            style={{ color: "oklch(0.52 0.01 264)", fontFamily: "'Inter', sans-serif" }}
                          >
                            {repo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3">
                          {repo.language && (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ background: getLanguageColor(repo.language) }}
                              />
                              <span
                                className="text-[11px]"
                                style={{ color: "oklch(0.52 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
                              >
                                {repo.language}
                              </span>
                            </div>
                          )}
                          {repo.stargazers_count > 0 && (
                            <div
                              className="flex items-center gap-1"
                              style={{ color: "oklch(0.48 0.01 264)" }}
                            >
                              <Star size={10} />
                              <span
                                className="text-[11px]"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                              >
                                {repo.stargazers_count}
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
                      <span
                        className={cn("text-[11px] px-2 py-0.5 rounded-full shrink-0", badgeClass)}
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {agent ?? "none"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Commit Activity */}
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
                <div
                  key={i}
                  className="rounded-xl p-3.5 animate-pulse"
                  style={{ background: "oklch(0.155 0.012 264)", border: "1px solid oklch(1 0 0 / 6%)" }}
                >
                  <div className="h-3 rounded w-1/3 mb-2" style={{ background: "oklch(1 0 0 / 8%)" }} />
                  <div className="h-3 rounded w-full" style={{ background: "oklch(1 0 0 / 5%)" }} />
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div
              className="rounded-xl p-6 text-center"
              style={{ background: "oklch(0.155 0.012 264)", border: "1px solid oklch(1 0 0 / 6%)" }}
            >
              <GitCommit size={22} className="mx-auto mb-2" style={{ color: "oklch(0.38 0.01 264)" }} />
              <p
                className="text-xs"
                style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
              >
                no recent commits
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentActivity.map(({ repo, commits }) =>
                commits.slice(0, 2).map((commit, i) => (
                  <div
                    key={commit.sha}
                    className={cn(
                      "rounded-xl p-3.5 animate-fade-slide-up",
                      `stagger-${Math.min(i + 1, 4)}`
                    )}
                    style={{
                      background: "oklch(0.148 0.012 264)",
                      border: "1px solid oklch(1 0 0 / 5%)",
                    }}
                  >
                    {/* Repo name with node motif */}
                    <div className="flex items-center gap-2 mb-2">
                      <CommitNode />
                      <a
                        href={`https://github.com/${GITHUB_USERNAME}/${repo.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold truncate transition-colors hover:text-[oklch(0.88_0.18_196)]"
                        style={{
                          color: "oklch(0.88 0.18 196 / 80%)",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        {repo.name}
                      </a>
                    </div>
                    {/* Commit message */}
                    <p
                      className="text-xs leading-relaxed line-clamp-2 mb-2 pl-5"
                      style={{ color: "oklch(0.65 0.01 264)", fontFamily: "'Inter', sans-serif" }}
                    >
                      {commit.commit.message.split("\n")[0]}
                    </p>
                    {/* SHA + timestamp */}
                    <div className="flex items-center justify-between pl-5">
                      <a
                        href={commit.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] transition-colors hover:text-[oklch(0.88_0.18_196)]"
                        style={{
                          color: "oklch(0.38 0.01 264)",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {shortSha(commit.sha)}
                      </a>
                      <span
                        className="text-[11px]"
                        style={{
                          color: "oklch(0.38 0.01 264)",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
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
