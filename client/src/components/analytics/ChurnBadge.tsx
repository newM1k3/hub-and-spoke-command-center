/* ============================================================
   ChurnBadge.tsx — lines added/deleted for last 5 commits
   Phase 3.1: + trend arrow (↑/↓/→) comparing this vs last week
   Design: Minimal Dark Forge — inline pill badges
   ============================================================ */
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  fetchChurnStats,
  fetchChurnTrend,
  GITHUB_USERNAME,
  type ChurnStats,
  type ChurnTrend,
} from "@/lib/github";

interface ChurnBadgeProps {
  repoName: string;
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function ChurnBadge({ repoName }: ChurnBadgeProps) {
  const [stats, setStats]   = useState<ChurnStats | null>(null);
  const [trend, setTrend]   = useState<ChurnTrend | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      // Fetch churn stats and trend in parallel
      const [s, t] = await Promise.all([
        fetchChurnStats(GITHUB_USERNAME, repoName),
        fetchChurnTrend(GITHUB_USERNAME, repoName),
      ]);
      if (!cancelled) {
        setStats(s);
        setTrend(t);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [repoName]);

  if (loading) {
    return (
      <div className="flex items-center gap-1">
        <div
          className="h-4 w-10 rounded-full animate-pulse"
          style={{ background: "oklch(0.72 0.18 145 / 15%)" }}
        />
        <div
          className="h-4 w-10 rounded-full animate-pulse"
          style={{ background: "oklch(0.75 0.22 25 / 15%)", animationDelay: "100ms" }}
        />
      </div>
    );
  }

  if (!stats || (stats.additions === 0 && stats.deletions === 0)) return null;

  const TrendIcon =
    trend?.direction === "up"   ? TrendingUp   :
    trend?.direction === "down" ? TrendingDown :
    Minus;

  const trendColor =
    trend?.direction === "up"   ? "oklch(0.72 0.18 145)" :
    trend?.direction === "down" ? "oklch(0.75 0.22 25)"  :
    "oklch(0.52 0.01 264)";

  const trendTitle =
    trend
      ? trend.direction === "flat"
        ? "activity flat vs last week"
        : `${trend.direction === "up" ? "↑" : "↓"} ${Math.abs(trend.delta).toLocaleString()} lines vs last week`
      : "";

  return (
    <div className="flex items-center gap-1">
      {/* Additions */}
      <span
        className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
        style={{
          background: "oklch(0.72 0.18 145 / 12%)",
          color: "oklch(0.72 0.18 145)",
          border: "1px solid oklch(0.72 0.18 145 / 20%)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
        title={`+${stats.additions.toLocaleString()} lines added (last 5 commits)`}
      >
        +{formatNum(stats.additions)}
      </span>

      {/* Deletions */}
      <span
        className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
        style={{
          background: "oklch(0.75 0.22 25 / 12%)",
          color: "oklch(0.75 0.22 25)",
          border: "1px solid oklch(0.75 0.22 25 / 20%)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
        title={`-${stats.deletions.toLocaleString()} lines deleted (last 5 commits)`}
      >
        -{formatNum(stats.deletions)}
      </span>

      {/* Trend arrow */}
      {trend && (
        <span
          className="flex items-center"
          title={trendTitle}
          style={{ color: trendColor }}
        >
          <TrendIcon size={11} strokeWidth={2.5} />
        </span>
      )}
    </div>
  );
}
