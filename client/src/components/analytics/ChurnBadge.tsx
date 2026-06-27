/* ============================================================
   ChurnBadge.tsx — Compact lines-added / lines-deleted indicator
   Design: Minimal Dark Forge — green +N / red -N pill pair
   Fetches last 5 commit stats for the given repo.
   ============================================================ */
import { useEffect, useState } from "react";
import { fetchChurnStats, GITHUB_USERNAME, type ChurnStats } from "@/lib/github";
import { cn } from "@/lib/utils";

interface ChurnBadgeProps {
  repoName: string;
  /** If provided, skip the fetch */
  preloaded?: ChurnStats;
  className?: string;
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function ChurnBadge({ repoName, preloaded, className }: ChurnBadgeProps) {
  const [stats, setStats] = useState<ChurnStats | null>(preloaded ?? null);
  const [loading, setLoading] = useState(!preloaded);

  useEffect(() => {
    if (preloaded) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const data = await fetchChurnStats(GITHUB_USERNAME, repoName);
      if (!cancelled) {
        setStats(data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [repoName, preloaded]);

  if (loading) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <div
          className="h-4 w-10 rounded animate-pulse"
          style={{ background: "oklch(0.72 0.18 145 / 12%)" }}
        />
        <div
          className="h-4 w-10 rounded animate-pulse"
          style={{ background: "oklch(0.75 0.22 25 / 12%)" }}
        />
      </div>
    );
  }

  if (!stats || (stats.additions === 0 && stats.deletions === 0)) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {stats.additions > 0 && (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{
            background: "oklch(0.72 0.18 145 / 12%)",
            color: "oklch(0.72 0.18 145)",
            border: "1px solid oklch(0.72 0.18 145 / 20%)",
            fontFamily: "'JetBrains Mono', monospace",
          }}
          title={`+${stats.additions} lines added in last ${stats.commits} commits`}
        >
          +{formatNum(stats.additions)}
        </span>
      )}
      {stats.deletions > 0 && (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{
            background: "oklch(0.75 0.22 25 / 12%)",
            color: "oklch(0.75 0.22 25)",
            border: "1px solid oklch(0.75 0.22 25 / 20%)",
            fontFamily: "'JetBrains Mono', monospace",
          }}
          title={`-${stats.deletions} lines deleted in last ${stats.commits} commits`}
        >
          -{formatNum(stats.deletions)}
        </span>
      )}
    </div>
  );
}
