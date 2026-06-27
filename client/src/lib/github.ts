/* ============================================================
   lib/github.ts — GitHub API types and fetch utilities
   Phase 3.1: + per-repo heatmap breakdown, week-over-week churn
   Uses VITE_GITHUB_TOKEN env var (optional, increases rate limit)
   Target user: newM1k3
   ============================================================ */

export const GITHUB_USERNAME = "newM1k3";
export const GITHUB_API_BASE = "https://api.github.com";

/** Error codes the UI can distinguish for user-facing messages */
export type GitHubErrorCode = "RATE_LIMIT" | "UNAUTHORIZED" | "NOT_FOUND" | "UNKNOWN";

export class GitHubAPIError extends Error {
  code: GitHubErrorCode;
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.code =
      status === 403 ? "RATE_LIMIT" :
      status === 401 ? "UNAUTHORIZED" :
      status === 404 ? "NOT_FOUND" :
      "UNKNOWN";
  }
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  pushed_at: string;
  topics: string[];
  visibility: "public" | "private";
  default_branch: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

/** Detailed commit with stats — returned by /repos/:owner/:repo/commits/:sha */
export interface GitHubCommitDetail {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  bio: string | null;
}

/** Language bytes map returned by /repos/:owner/:repo/languages */
export type LanguageMap = Record<string, number>;

/** Processed language slice for the bar */
export interface LanguageSlice {
  name: string;
  percent: number;
  color: string;
}

/** Churn summary for a repo (last N commits) */
export interface ChurnStats {
  additions: number;
  deletions: number;
  commits: number;
}

/** Week-over-week churn comparison */
export interface ChurnTrend {
  thisWeek: ChurnStats;
  lastWeek: ChurnStats;
  /** positive = more additions this week, negative = fewer */
  delta: number;
  direction: "up" | "down" | "flat";
}

/** One day cell for the heatmap */
export interface HeatmapDay {
  date: string;   // ISO date string YYYY-MM-DD
  count: number;  // total commits that day across all repos
  /** Map of repo name → commit count for that day (for drill-down tooltip) */
  repos: Record<string, number>;
}

function getHeaders(): HeadersInit {
  // Priority: localStorage PAT → VITE_GITHUB_TOKEN env var → unauthenticated
  let token: string | null = null;
  try {
    token = localStorage.getItem("hs_github_pat") || null;
  } catch {
    // localStorage unavailable (SSR / privacy mode)
  }
  if (!token) {
    token = import.meta.env.VITE_GITHUB_TOKEN || null;
  }
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchRepos(username: string): Promise<GitHubRepo[]> {
  const res = await fetch(
    `${GITHUB_API_BASE}/users/${username}/repos?sort=pushed&per_page=30&type=public`,
    { headers: getHeaders() }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new GitHubAPIError(err.message || `GitHub API error: ${res.status}`, res.status);
  }
  return res.json();
}

export async function fetchRecentCommits(
  username: string,
  repo: string
): Promise<GitHubCommit[]> {
  const res = await fetch(
    `${GITHUB_API_BASE}/repos/${username}/${repo}/commits?per_page=5`,
    { headers: getHeaders() }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function fetchUser(username: string): Promise<GitHubUser> {
  const res = await fetch(`${GITHUB_API_BASE}/users/${username}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new GitHubAPIError(`GitHub API error: ${res.status}`, res.status);
  return res.json();
}

// ── Language Breakdown ────────────────────────────────────────

export async function fetchLanguages(
  username: string,
  repo: string
): Promise<LanguageMap> {
  const res = await fetch(
    `${GITHUB_API_BASE}/repos/${username}/${repo}/languages`,
    { headers: getHeaders() }
  );
  if (!res.ok) return {};
  return res.json();
}

export function processLanguages(raw: LanguageMap): LanguageSlice[] {
  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  const slices: LanguageSlice[] = Object.entries(raw)
    .sort((a, b) => b[1] - a[1])
    .map(([name, bytes]) => ({
      name,
      percent: (bytes / total) * 100,
      color: getLanguageColor(name),
    }));

  const main = slices.filter((s) => s.percent >= 3);
  const other = slices.filter((s) => s.percent < 3);
  if (other.length > 0) {
    const otherPct = other.reduce((a, s) => a + s.percent, 0);
    main.push({ name: "Other", percent: otherPct, color: "#6E7681" });
  }
  return main;
}

// ── Commit Churn ──────────────────────────────────────────────

async function fetchChurnForWindow(
  username: string,
  repo: string,
  since: Date,
  until: Date
): Promise<ChurnStats> {
  try {
    const listRes = await fetch(
      `${GITHUB_API_BASE}/repos/${username}/${repo}/commits?since=${since.toISOString()}&until=${until.toISOString()}&per_page=20`,
      { headers: getHeaders() }
    );
    if (!listRes.ok) return { additions: 0, deletions: 0, commits: 0 };
    const list: GitHubCommit[] = await listRes.json();
    if (!list.length) return { additions: 0, deletions: 0, commits: 0 };

    const details = await Promise.all(
      list.map(async (c) => {
        const r = await fetch(
          `${GITHUB_API_BASE}/repos/${username}/${repo}/commits/${c.sha}`,
          { headers: getHeaders() }
        );
        if (!r.ok) return null;
        return r.json() as Promise<GitHubCommitDetail>;
      })
    );

    return details.reduce(
      (acc, d) => {
        if (!d?.stats) return acc;
        return {
          additions: acc.additions + d.stats.additions,
          deletions: acc.deletions + d.stats.deletions,
          commits: acc.commits + 1,
        };
      },
      { additions: 0, deletions: 0, commits: 0 }
    );
  } catch {
    return { additions: 0, deletions: 0, commits: 0 };
  }
}

/**
 * Fetch churn stats for last N commits (used for the badge display).
 */
export async function fetchChurnStats(
  username: string,
  repo: string,
  limit = 5
): Promise<ChurnStats> {
  try {
    const listRes = await fetch(
      `${GITHUB_API_BASE}/repos/${username}/${repo}/commits?per_page=${limit}`,
      { headers: getHeaders() }
    );
    if (!listRes.ok) return { additions: 0, deletions: 0, commits: 0 };
    const list: GitHubCommit[] = await listRes.json();
    if (!list.length) return { additions: 0, deletions: 0, commits: 0 };

    const details = await Promise.all(
      list.map(async (c) => {
        const r = await fetch(
          `${GITHUB_API_BASE}/repos/${username}/${repo}/commits/${c.sha}`,
          { headers: getHeaders() }
        );
        if (!r.ok) return null;
        return r.json() as Promise<GitHubCommitDetail>;
      })
    );

    return details.reduce(
      (acc, d) => {
        if (!d?.stats) return acc;
        return {
          additions: acc.additions + d.stats.additions,
          deletions: acc.deletions + d.stats.deletions,
          commits: acc.commits + 1,
        };
      },
      { additions: 0, deletions: 0, commits: 0 }
    );
  } catch {
    return { additions: 0, deletions: 0, commits: 0 };
  }
}

/**
 * Fetch week-over-week churn trend for a repo.
 * thisWeek = last 7 days, lastWeek = 7–14 days ago.
 */
export async function fetchChurnTrend(
  username: string,
  repo: string
): Promise<ChurnTrend> {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const [thisWeek, lastWeek] = await Promise.all([
    fetchChurnForWindow(username, repo, weekAgo, now),
    fetchChurnForWindow(username, repo, twoWeeksAgo, weekAgo),
  ]);

  const delta = thisWeek.additions - lastWeek.additions;
  const direction: "up" | "down" | "flat" =
    Math.abs(delta) < 10 ? "flat" : delta > 0 ? "up" : "down";

  return { thisWeek, lastWeek, delta, direction };
}

// ── Activity Heatmap ──────────────────────────────────────────

/**
 * Build a 28-day (4-week) heatmap with per-repo breakdown per day.
 */
export async function fetchHeatmapData(
  username: string,
  repos: GitHubRepo[]
): Promise<HeatmapDay[]> {
  const now = new Date();
  const since = new Date(now);
  since.setDate(since.getDate() - 27);

  // Initialize all 28 days
  const dayMap: Record<string, { count: number; repos: Record<string, number> }> = {};
  for (let i = 0; i < 28; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    dayMap[toDateStr(d)] = { count: 0, repos: {} };
  }

  const targetRepos = repos.slice(0, 15);
  await Promise.all(
    targetRepos.map(async (repo) => {
      try {
        const res = await fetch(
          `${GITHUB_API_BASE}/repos/${username}/${repo.name}/commits?since=${since.toISOString()}&until=${now.toISOString()}&per_page=100`,
          { headers: getHeaders() }
        );
        if (!res.ok) return;
        const commits: GitHubCommit[] = await res.json();
        for (const c of commits) {
          const day = toDateStr(new Date(c.commit.author.date));
          if (day in dayMap) {
            dayMap[day].count++;
            dayMap[day].repos[repo.name] = (dayMap[day].repos[repo.name] ?? 0) + 1;
          }
        }
      } catch {
        // silently skip
      }
    })
  );

  return Object.entries(dayMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, val]) => ({ date, count: val.count, repos: val.repos }));
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Utilities ──────────────────────────────────────────────────

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return "just now";
}

export function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

export function getLanguageColor(lang: string | null): string {
  const colors: Record<string, string> = {
    TypeScript:  "#3178C6",
    JavaScript:  "#F7DF1E",
    Python:      "#3572A5",
    HTML:        "#E34C26",
    CSS:         "#563D7C",
    SCSS:        "#C6538C",
    Shell:       "#89E051",
    Go:          "#00ADD8",
    Rust:        "#DEA584",
    Vue:         "#41B883",
    Svelte:      "#FF3E00",
    Ruby:        "#701516",
    PHP:         "#4F5D95",
    "C#":        "#178600",
    Java:        "#B07219",
    Kotlin:      "#A97BFF",
    Swift:       "#FA7343",
    Dart:        "#00B4AB",
    MDX:         "#FCB32C",
    Markdown:    "#083FA1",
    JSON:        "#8BC34A",
    YAML:        "#CB171E",
    Dockerfile:  "#384D54",
  };
  return colors[lang ?? ""] ?? "#8B949E";
}
