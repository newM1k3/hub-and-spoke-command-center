/* ============================================================
   WebhookConfig.tsx
   Collapsible Netlify build hook configuration panel.
   Theme: Minimal Dark Forge
   - Link icon toggle reveals input + save + manual deploy
   - Persists URL to localStorage via parent callbacks
   - Fires triggerNetlifyBuild with sonner feedback
   ============================================================ */
import { useState } from "react";
import { Link2, Link2Off, Rocket, Save, X } from "lucide-react";
import { triggerNetlifyBuild } from "@/lib/store";
import { toast } from "sonner";

interface WebhookConfigProps {
  repoName: string;
  hookUrl: string;                          // current saved URL (empty string = none)
  onSave: (url: string) => void;            // parent persists to localStorage
}

export default function WebhookConfig({ repoName, hookUrl, onSave }: WebhookConfigProps) {
  const [open, setOpen]       = useState(false);
  const [draft, setDraft]     = useState(hookUrl);
  const [firing, setFiring]   = useState(false);

  // Keep draft in sync if parent changes hookUrl externally
  function handleOpen() {
    setDraft(hookUrl);
    setOpen(true);
  }

  function handleSave() {
    const trimmed = draft.trim();
    onSave(trimmed);
    setOpen(false);
    toast.success("→ build hook saved", {
      description: trimmed ? `${repoName} · hook configured` : `${repoName} · hook cleared`,
      duration: 2000,
    });
  }

  function handleClear() {
    setDraft("");
  }

  async function handleDeploy() {
    const url = hookUrl.trim();
    if (!url) {
      toast.warning("no build hook configured", {
        description: `add a Netlify hook URL for ${repoName} first`,
        duration: 3000,
      });
      return;
    }
    setFiring(true);
    toast.info("dispatching Netlify build hook…", { duration: 2000 });
    const ok = await triggerNetlifyBuild(url);
    setFiring(false);
    if (ok) {
      toast.success("Netlify build sequence initialized successfully.", {
        description: repoName,
        duration: 4000,
      });
    } else {
      toast.error("build hook communication failed. check configuration.", {
        description: repoName,
        duration: 5000,
      });
    }
  }

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        title={hookUrl ? `build hook configured — ${repoName}` : `add build hook — ${repoName}`}
        className="flex items-center justify-center w-6 h-6 rounded transition-all"
        style={{
          color: hookUrl
            ? "oklch(0.72 0.18 145)"      // green = configured
            : "oklch(0.45 0.01 264)",      // dim = not set
          background: open ? "oklch(0.88 0.18 196 / 8%)" : "transparent",
        }}
      >
        {hookUrl ? <Link2 size={13} /> : <Link2Off size={13} />}
      </button>

      {/* Collapsible panel */}
      {open && (
        <div
          className="absolute right-0 top-8 z-50 rounded-xl p-3 space-y-2 w-72 shadow-2xl"
          style={{
            background: "oklch(0.148 0.012 264)",
            border: "1px solid oklch(1 0 0 / 10%)",
            boxShadow: "0 8px 32px oklch(0 0 0 / 50%)",
          }}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-[10px] font-medium uppercase tracking-widest"
              style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              netlify hook · {repoName}
            </span>
            <button
              onClick={() => setOpen(false)}
              className="opacity-40 hover:opacity-80 transition-opacity"
              style={{ color: "oklch(0.65 0.01 264)" }}
            >
              <X size={12} />
            </button>
          </div>

          {/* URL input */}
          <input
            type="url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://api.netlify.com/build_hooks/..."
            className="w-full rounded-md px-3 py-2 text-[11px] outline-none transition-all"
            style={{
              background: "oklch(0.118 0.012 264)",
              border: `1px solid ${draft ? "oklch(0.88 0.18 196 / 30%)" : "oklch(1 0 0 / 8%)"}`,
              color: "oklch(0.82 0.005 264)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
          />

          {/* Action row */}
          <div className="flex items-center gap-2 pt-1">
            {/* Clear */}
            {draft && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1 px-2 py-1.5 rounded text-[10px] transition-all"
                style={{
                  background: "oklch(0.62 0.22 25 / 10%)",
                  border: "1px solid oklch(0.62 0.22 25 / 20%)",
                  color: "oklch(0.72 0.18 25)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <X size={10} /> clear
              </button>
            )}
            {/* Save */}
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-1.5 rounded text-[10px] transition-all"
              style={{
                background: "oklch(0.88 0.18 196 / 10%)",
                border: "1px solid oklch(0.88 0.18 196 / 25%)",
                color: "oklch(0.88 0.18 196)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <Save size={10} /> save
            </button>
            {/* Manual deploy */}
            <button
              onClick={handleDeploy}
              disabled={firing || !hookUrl}
              className="ml-auto flex items-center gap-1 px-2 py-1.5 rounded text-[10px] transition-all disabled:opacity-40"
              style={{
                background: hookUrl ? "oklch(0.72 0.18 145 / 12%)" : "oklch(0.165 0.012 264)",
                border: hookUrl
                  ? "1px solid oklch(0.72 0.18 145 / 30%)"
                  : "1px solid oklch(1 0 0 / 8%)",
                color: hookUrl ? "oklch(0.72 0.18 145)" : "oklch(0.45 0.01 264)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
              title="manually trigger build hook"
            >
              <Rocket size={10} className={firing ? "animate-pulse" : ""} />
              {firing ? "firing…" : "deploy"}
            </button>
          </div>

          {/* Status hint */}
          <p
            className="text-[9px] pt-0.5"
            style={{ color: "oklch(0.38 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            {hookUrl
              ? "→ hook active · auto-fires on status → deployed"
              : "→ paste your Netlify build hook URL above"}
          </p>
        </div>
      )}
    </div>
  );
}
