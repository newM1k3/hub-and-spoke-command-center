/* ============================================================
   Dashboard.tsx — Main overview page
   Theme: Minimal Dark Forge
   Shows: GitHub user stats, recent repos, recent commits
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
} from "lucide-react";
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

      // Fetch commits for the 4 most recently pushed repos
      const topRepos = repoData.slice(0, 4);
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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.92 0.005 264)" }}
          >
            // command center
          </h1>
          <p className="text-sm mt-1" style={{ color: "oklch(0.58 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>
            {lastSynced
              ? `synced ${timeAgo(lastSynced.toISOString())}`
              : "fetching github data..."}
          </p>
        </div>
        <button
          onClick={loadData}
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

      {/* ── Error State ── */}
      {error && (
        <div
          className="flex items-start gap-3 p-4 rounded-lg"
          style={{ background: "oklch(0.62 0.22 25 / 10%)", border: "1px solid oklch(0.62 0.22 25 / 30%)" }}
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: "oklch(0.75 0.22 25)" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "oklch(0.85 0.1 25)" }}>
              GitHub API Error
            </p>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.72 0.1 25)" }}>
              {error}. Check your VITE_GITHUB_TOKEN or try again.
            </p>
          </div>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Public Repos",
            value: loading ? "—" : user?.public_repos ?? "—",
            icon: BookOpen,
            accent: "oklch(0.88 0.18 196)",
            delay: "stagger-1",
          },
          {
            label: "Active Agents",
            value: loading ? "—" : activeAgentCount,
            icon: Zap,
            accent: "oklch(0.75 0.22 290)",
            delay: "stagger-2",
          },
          {
            label: "Followers",
            value: loading ? "—" : user?.followers ?? "—",
            icon: Users,
            accent: "oklch(0.72 0.18 145)",
            delay: "stagger-3",
          },
          {
            label: "Top Language",
            value: loading ? "—" : topLanguage,
            icon: GitBranch,
            accent: getLanguageColor(topLanguage),
            delay: "stagger-4",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn("card-surface p-4 animate-fade-slide-up", stat.delay)}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: "oklch(0.58 0.01 264)", fontFamily: "'Inter', sans-serif" }}>
                {stat.label}
              </span>
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: `${stat.accent}18` }}
              >
                <stat.icon size={14} style={{ color: stat.accent }} />
              </div>
            </div>
            <div
              className="text-2xl font-semibold"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.92 0.005 264)" }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid: Repos + Activity ── */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent Repos */}
        <div className="lg:col-span-3 space-y-3">
          <h2
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "oklch(0.58 0.01 264)", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.08em" }}
          >
            Recent Repositories
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="card-surface p-4 animate-pulse">
                  <div className="h-4 rounded w-2/5 mb-2" style={{ background: "oklch(1 0 0 / 8%)" }} />
                  <div className="h-3 rounded w-3/4" style={{ background: "oklch(1 0 0 / 5%)" }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {repos.slice(0, 8).map((repo, i) => {
                const agent = assignments[repo.name];
                const badgeClass = agent ? AGENT_BADGE_CLASS[agent] : AGENT_BADGE_CLASS["None"];
                return (
                  <div
                    key={repo.id}
                    className={cn("card-surface p-4 group hover:border-[oklch(1_0_0_/_15%)] transition-all duration-150 animate-fade-slide-up", `stagger-${Math.min(i + 1, 6)}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
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
                            style={{ color: "oklch(0.58 0.01 264)" }}
                          />
                        </div>
                        {repo.description && (
                          <p
                            className="text-xs truncate"
                            style={{ color: "oklch(0.58 0.01 264)", fontFamily: "'Inter', sans-serif" }}
                          >
                            {repo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {repo.language && (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ background: getLanguageColor(repo.language) }}
                              />
                              <span className="text-xs" style={{ color: "oklch(0.58 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>
                                {repo.language}
                              </span>
                            </div>
                          )}
                          {repo.stargazers_count > 0 && (
                            <div className="flex items-center gap-1" style={{ color: "oklch(0.58 0.01 264)" }}>
                              <Star size={11} />
                              <span className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{repo.stargazers_count}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1" style={{ color: "oklch(0.42 0.01 264)" }}>
                            <Clock size={11} />
                            <span className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{timeAgo(repo.pushed_at)}</span>
                          </div>
                        </div>
                      </div>
                      {agent && agent !== "None" && (
                        <span className={cn("text-xs px-2 py-0.5 rounded-full shrink-0", badgeClass)}
                          style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px" }}>
                          {agent}
                        </span>
                      )}
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
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "oklch(0.58 0.01 264)", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.08em" }}
          >
            Recent Commits
          </h2>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-surface p-4 animate-pulse">
                  <div className="h-3 rounded w-1/3 mb-2" style={{ background: "oklch(1 0 0 / 8%)" }} />
                  <div className="h-3 rounded w-full" style={{ background: "oklch(1 0 0 / 5%)" }} />
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="card-surface p-6 text-center">
              <GitCommit size={24} className="mx-auto mb-2" style={{ color: "oklch(0.42 0.01 264)" }} />
              <p className="text-sm" style={{ color: "oklch(0.58 0.01 264)" }}>No recent commits</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map(({ repo, commits }) =>
                commits.slice(0, 2).map((commit, i) => (
                  <div
                    key={commit.sha}
                    className={cn("card-surface p-3 animate-fade-slide-up", `stagger-${Math.min(i + 1, 4)}`)}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <GitCommit size={12} style={{ color: "oklch(0.88 0.18 196)" }} className="shrink-0" />
                      <a
                        href={`https://github.com/${GITHUB_USERNAME}/${repo.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium hover:text-[oklch(0.88_0.18_196)] transition-colors"
                        style={{ color: "oklch(0.72 0.01 264)", fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {repo.name}
                      </a>
                    </div>
                    <p
                      className="text-xs leading-relaxed line-clamp-2 mb-1.5"
                      style={{ color: "oklch(0.72 0.01 264)", fontFamily: "'Inter', sans-serif" }}
                    >
                      {commit.commit.message.split("\n")[0]}
                    </p>
                    <div className="flex items-center justify-between">
                      <a
                        href={commit.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] hover:text-[oklch(0.88_0.18_196)] transition-colors"
                        style={{ color: "oklch(0.42 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {shortSha(commit.sha)}
                      </a>
                      <span
                        className="text-[11px]"
                        style={{ color: "oklch(0.42 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
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
