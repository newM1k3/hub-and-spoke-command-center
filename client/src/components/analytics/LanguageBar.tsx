/* ============================================================
   LanguageBar.tsx — Multi-color horizontal language breakdown bar
   Design: Minimal Dark Forge — flush segments, dot legends below
   ============================================================ */
import { useEffect, useState } from "react";
import {
  fetchLanguages,
  processLanguages,
  GITHUB_USERNAME,
  type LanguageSlice,
} from "@/lib/github";

interface LanguageBarProps {
  repoName: string;
  /** If provided, skip the fetch and render directly */
  preloaded?: LanguageSlice[];
}

export default function LanguageBar({ repoName, preloaded }: LanguageBarProps) {
  const [slices, setSlices] = useState<LanguageSlice[]>(preloaded ?? []);
  const [loading, setLoading] = useState(!preloaded);

  useEffect(() => {
    if (preloaded) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const raw = await fetchLanguages(GITHUB_USERNAME, repoName);
      if (!cancelled) {
        setSlices(processLanguages(raw));
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [repoName, preloaded]);

  if (loading) {
    return (
      <div className="space-y-1.5 mt-2">
        {/* Skeleton bar */}
        <div
          className="h-1.5 w-full rounded-full animate-pulse"
          style={{ background: "oklch(1 0 0 / 8%)" }}
        />
        {/* Skeleton legend dots */}
        <div className="flex gap-3">
          {[60, 40, 30].map((w) => (
            <div
              key={w}
              className="h-2.5 rounded animate-pulse"
              style={{ width: `${w}px`, background: "oklch(1 0 0 / 6%)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (slices.length === 0) return null;

  return (
    <div className="space-y-1.5 mt-2">
      {/* Segmented bar */}
      <div className="flex w-full h-1.5 rounded-full overflow-hidden gap-px">
        {slices.map((s) => (
          <div
            key={s.name}
            title={`${s.name} ${s.percent.toFixed(1)}%`}
            style={{
              width: `${s.percent}%`,
              background: s.color,
              minWidth: "2px",
            }}
          />
        ))}
      </div>

      {/* Legend dots */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {slices.map((s) => (
          <div key={s.name} className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: s.color }}
            />
            <span
              className="text-[10px]"
              style={{
                color: "oklch(0.52 0.01 264)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {s.name} {s.percent.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
