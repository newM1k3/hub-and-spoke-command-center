/* ============================================================
   lib/github.ts — GitHub API types and fetch utilities
   Uses VITE_GITHUB_TOKEN env var (optional, increases rate limit)
   Target user: newM1k3
   ============================================================ */

export const GITHUB_USERNAME = "newM1k3";
export const GITHUB_API_BASE = "https://api.github.com";

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

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  bio: string | null;
}

function getHeaders(): HeadersInit {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
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
    throw new Error(err.message || `GitHub API error: ${res.status}`);
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
  if (!res.ok) {
    // Silently fail for repos with no commits (empty repos)
    return [];
  }
  return res.json();
}

export async function fetchUser(username: string): Promise<GitHubUser> {
  const res = await fetch(`${GITHUB_API_BASE}/users/${username}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return res.json();
}

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
    TypeScript: "#3178C6",
    JavaScript: "#F7DF1E",
    Python: "#3572A5",
    HTML: "#E34C26",
    CSS: "#563D7C",
    Shell: "#89E051",
    Go: "#00ADD8",
    Rust: "#DEA584",
    Vue: "#41B883",
    Svelte: "#FF3E00",
    Ruby: "#701516",
    PHP: "#4F5D95",
    "C#": "#178600",
    Java: "#B07219",
    Kotlin: "#A97BFF",
  };
  return colors[lang ?? ""] ?? "#8B949E";
}
