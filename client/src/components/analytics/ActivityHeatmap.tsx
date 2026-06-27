/* ============================================================
   ActivityHeatmap.tsx — 4-week (28-day) commit activity grid
   Phase 3.1: + hover popover with per-repo commit breakdown
   Design: Minimal Dark Forge — pure CSS grid, no chart library
   ============================================================ */
import { useState, useRef, useEffect } from "react";
import { type HeatmapDay } from "@/lib/github";

interface ActivityHeatmapProps {
  days: HeatmapDay[];
  loading?: boolean;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_COUNT = 4;

function getCellStyle(count: number, maxCount: number): React.CSSProperties {
  if (count === 0) {
    return {
      background: "oklch(1 0 0 / 5%)",
      border: "1px solid oklch(1 0 0 / 6%)",
    };
  }
  const ratio = maxCount > 0 ? count / maxCount : 0;
  const opacity = 0.2 + ratio * 0.8;
  return {
    background: `oklch(0.88 0.18 196 / ${(opacity * 100).toFixed(0)}%)`,
    border: "1px solid oklch(0.88 0.18 196 / 15%)",
    boxShadow: ratio > 0.6 ? `0 0 4px oklch(0.88 0.18 196 / 30%)` : "none",
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

interface TooltipData {
  day: HeatmapDay;
  x: number;
  y: number;
}

export default function ActivityHeatmap({ days, loading }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef   = useRef<HTMLDivElement>(null);

  // Close tooltip on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setTooltip(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (loading) {
    return (
      <div
        className="rounded-xl p-4"
        style={{
          background: "oklch(0.155 0.012 264)",
          border: "1px solid oklch(1 0 0 / 6%)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 w-32 rounded animate-pulse" style={{ background: "oklch(1 0 0 / 8%)" }} />
          <div className="h-3 w-20 rounded animate-pulse" style={{ background: "oklch(1 0 0 / 5%)" }} />
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${WEEK_COUNT}, 1fr)` }}>
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm animate-pulse"
              style={{ height: "18px", background: "oklch(1 0 0 / 6%)", animationDelay: `${i * 20}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!days.length) return null;

  const maxCount    = Math.max(...days.map((d) => d.count), 1);
  const totalCommits = days.reduce((a, d) => a + d.count, 0);
  const activeDays  = days.filter((d) => d.count > 0).length;

  const firstDate = new Date(days[0].date + "T00:00:00");
  const startDow  = firstDate.getDay();

  const totalCells = WEEK_COUNT * 7;
  const paddedDays: (HeatmapDay | null)[] = [
    ...Array(startDow).fill(null),
    ...days,
  ];
  while (paddedDays.length < totalCells) paddedDays.push(null);
  const trimmed = paddedDays.slice(0, totalCells);

  // 7 rows × 4 cols
  const rows: (HeatmapDay | null)[][] = [];
  for (let row = 0; row < 7; row++) {
    const r: (HeatmapDay | null)[] = [];
    for (let col = 0; col < WEEK_COUNT; col++) {
      r.push(trimmed[col * 7 + row] ?? null);
    }
    rows.push(r);
  }

  function handleCellEnter(e: React.MouseEvent, cell: HeatmapDay) {
    if (cell.count === 0) { setTooltip(null); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    setTooltip({
      day: cell,
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top  - containerRect.top  - 8,
    });
  }

  // Sort repos by commit count descending for the tooltip
  function getSortedRepos(repos: Record<string, number>) {
    return Object.entries(repos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8); // cap at 8 to keep tooltip compact
  }

  return (
    <div
      ref={containerRef}
      className="rounded-xl p-4 relative"
      style={{
        background: "oklch(0.155 0.012 264)",
        border: "1px solid oklch(1 0 0 / 6%)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span
            className="text-[11px] font-medium uppercase tracking-widest"
            style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            ── vibe activity
          </span>
          <span
            className="ml-2 text-[11px]"
            style={{ color: "oklch(0.38 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            last 4 weeks
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-[11px]"
            style={{ color: "oklch(0.88 0.18 196 / 80%)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            {totalCommits} commits
          </span>
          <span
            className="text-[11px]"
            style={{ color: "oklch(0.45 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            {activeDays}/28 days
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex gap-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1 shrink-0" style={{ width: "24px" }}>
          {DAY_LABELS.map((label, i) => (
            <div key={label} className="flex items-center justify-end" style={{ height: "18px" }}>
              {(i === 1 || i === 3 || i === 5) && (
                <span
                  className="text-[9px]"
                  style={{ color: "oklch(0.38 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {label}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Heat cells */}
        <div className="flex-1">
          {/* Week headers */}
          <div
            className="grid mb-1"
            style={{ gridTemplateColumns: `repeat(${WEEK_COUNT}, 1fr)`, gap: "3px" }}
          >
            {Array.from({ length: WEEK_COUNT }).map((_, wi) => {
              const weekStart = new Date(firstDate);
              weekStart.setDate(weekStart.getDate() + wi * 7 - startDow + 1);
              return (
                <div
                  key={wi}
                  className="text-center"
                  style={{
                    fontSize: "9px",
                    color: "oklch(0.35 0.01 264)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              );
            })}
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-1">
            {rows.map((row, ri) => (
              <div
                key={ri}
                className="grid"
                style={{ gridTemplateColumns: `repeat(${WEEK_COUNT}, 1fr)`, gap: "3px" }}
              >
                {row.map((cell, ci) => (
                  <div
                    key={ci}
                    className="rounded-sm transition-all duration-150"
                    style={{
                      height: "18px",
                      cursor: cell && cell.count > 0 ? "pointer" : "default",
                      ...(cell
                        ? getCellStyle(cell.count, maxCount)
                        : { background: "transparent", border: "1px solid transparent" }),
                    }}
                    onMouseEnter={(e) => cell && handleCellEnter(e, cell)}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span
          className="text-[9px]"
          style={{ color: "oklch(0.35 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
        >
          less
        </span>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <div
            key={ratio}
            className="rounded-sm"
            style={{
              width: "12px",
              height: "12px",
              background: ratio === 0
                ? "oklch(1 0 0 / 5%)"
                : `oklch(0.88 0.18 196 / ${((0.2 + ratio * 0.8) * 100).toFixed(0)}%)`,
              border: "1px solid oklch(1 0 0 / 8%)",
            }}
          />
        ))}
        <span
          className="text-[9px]"
          style={{ color: "oklch(0.35 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
        >
          more
        </span>
      </div>

      {/* ── Drill-down Tooltip ── */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className="absolute z-50 pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div
            className="rounded-xl p-3 min-w-[180px] max-w-[240px] shadow-2xl"
            style={{
              background: "oklch(0.185 0.014 264)",
              border: "1px solid oklch(0.88 0.18 196 / 25%)",
              boxShadow: "0 8px 32px oklch(0 0 0 / 60%), 0 0 0 1px oklch(0.88 0.18 196 / 10%)",
            }}
          >
            {/* Date header */}
            <div
              className="text-[11px] font-semibold mb-2 pb-1.5"
              style={{
                color: "oklch(0.88 0.18 196)",
                fontFamily: "'Space Grotesk', sans-serif",
                borderBottom: "1px solid oklch(1 0 0 / 8%)",
              }}
            >
              {formatDate(tooltip.day.date)}
            </div>

            {/* Total */}
            <div
              className="text-[11px] mb-2"
              style={{ color: "oklch(0.65 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              {tooltip.day.count} commit{tooltip.day.count !== 1 ? "s" : ""} total
            </div>

            {/* Per-repo breakdown */}
            <div className="space-y-1">
              {getSortedRepos(tooltip.day.repos).map(([repoName, count]) => (
                <div key={repoName} className="flex items-center justify-between gap-3">
                  <span
                    className="text-[10px] truncate"
                    style={{ color: "oklch(0.72 0.01 264)", fontFamily: "'JetBrains Mono', monospace", maxWidth: "150px" }}
                  >
                    {repoName}
                  </span>
                  <span
                    className="text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded"
                    style={{
                      background: "oklch(0.88 0.18 196 / 12%)",
                      color: "oklch(0.88 0.18 196)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {count}
                  </span>
                </div>
              ))}
              {Object.keys(tooltip.day.repos).length > 8 && (
                <div
                  className="text-[10px] pt-0.5"
                  style={{ color: "oklch(0.42 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
                >
                  +{Object.keys(tooltip.day.repos).length - 8} more repos
                </div>
              )}
            </div>

            {/* Arrow pointer */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: "-6px",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid oklch(0.185 0.014 264)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
