/* ============================================================
   ActivityHeatmap.tsx — 4-week (28-day) commit activity grid
   Design: Minimal Dark Forge — GitHub-style squares, cyan accent
   Pure CSS grid, no chart library.
   ============================================================ */
import { type HeatmapDay } from "@/lib/github";

interface ActivityHeatmapProps {
  days: HeatmapDay[];
  loading?: boolean;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_COUNT = 4;

/** Map a commit count to an OKLCH opacity level */
function getCellStyle(count: number, maxCount: number): React.CSSProperties {
  if (count === 0) {
    return {
      background: "oklch(1 0 0 / 5%)",
      border: "1px solid oklch(1 0 0 / 6%)",
    };
  }
  // Scale from 20% to 100% opacity relative to max
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

export default function ActivityHeatmap({ days, loading }: ActivityHeatmapProps) {
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
          <div
            className="h-3 w-32 rounded animate-pulse"
            style={{ background: "oklch(1 0 0 / 8%)" }}
          />
          <div
            className="h-3 w-20 rounded animate-pulse"
            style={{ background: "oklch(1 0 0 / 5%)" }}
          />
        </div>
        {/* Skeleton grid */}
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${WEEK_COUNT}, 1fr)` }}>
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm animate-pulse"
              style={{
                height: "18px",
                background: "oklch(1 0 0 / 6%)",
                animationDelay: `${i * 20}ms`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!days.length) return null;

  const maxCount = Math.max(...days.map((d) => d.count), 1);
  const totalCommits = days.reduce((a, d) => a + d.count, 0);
  const activeDays   = days.filter((d) => d.count > 0).length;

  // Arrange days into 4 columns (weeks), 7 rows (days of week)
  // days[0] is the oldest (28 days ago), days[27] is today
  // We need to figure out what day-of-week day[0] falls on
  const firstDate    = new Date(days[0].date + "T00:00:00");
  const startDow     = firstDate.getDay(); // 0=Sun, 6=Sat

  // Build a 7×4 grid (row=day-of-week, col=week)
  // Pad the beginning so the first cell is at the right row
  const totalCells   = WEEK_COUNT * 7;
  const paddedDays: (HeatmapDay | null)[] = [
    ...Array(startDow).fill(null),
    ...days,
  ];
  // Trim or pad to exactly totalCells
  while (paddedDays.length < totalCells) paddedDays.push(null);
  const trimmed = paddedDays.slice(0, totalCells);

  // Reshape into rows (7 rows × 4 cols)
  const rows: (HeatmapDay | null)[][] = [];
  for (let row = 0; row < 7; row++) {
    const r: (HeatmapDay | null)[] = [];
    for (let col = 0; col < WEEK_COUNT; col++) {
      r.push(trimmed[col * 7 + row] ?? null);
    }
    rows.push(r);
  }

  return (
    <div
      className="rounded-xl p-4"
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

      {/* Grid with day-of-week labels */}
      <div className="flex gap-2">
        {/* Day labels column */}
        <div className="flex flex-col gap-1 shrink-0" style={{ width: "24px" }}>
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              className="flex items-center justify-end"
              style={{ height: "18px" }}
            >
              {/* Only show Mon, Wed, Fri to avoid clutter */}
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
          {/* Week column headers */}
          <div
            className="grid mb-1"
            style={{ gridTemplateColumns: `repeat(${WEEK_COUNT}, 1fr)`, gap: "3px" }}
          >
            {Array.from({ length: WEEK_COUNT }).map((_, wi) => {
              // Find the Monday of this week column
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
                      ...(cell
                        ? getCellStyle(cell.count, maxCount)
                        : { background: "transparent", border: "1px solid transparent" }),
                    }}
                    title={cell ? `${formatDate(cell.date)}: ${cell.count} commit${cell.count !== 1 ? "s" : ""}` : ""}
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
    </div>
  );
}
