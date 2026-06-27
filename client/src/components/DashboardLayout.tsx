/* ============================================================
   DashboardLayout.tsx — Persistent sidebar + top header
   Phase 3.2: + PAT settings panel (gear icon → collapsible input)
   Theme: Minimal Dark Forge
   - Stronger surface elevation (no border-only cards)
   - CLI-native copy throughout
   - Hub-and-spoke node motif in sidebar nav items
   - Sidebar: 240px desktop, icon+label; bottom tabs on mobile
   ============================================================ */
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  GitBranch,
  BookMarked,
  Menu,
  X,
  ExternalLink,
  Settings,
  Eye,
  EyeOff,
  Check,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { loadPAT, savePAT, clearPAT } from "@/lib/store";

interface NavItem {
  label: string;
  sublabel: string;
  path: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: "dashboard",     sublabel: "overview",       path: "/",              icon: LayoutDashboard },
  { label: "spoke tracker", sublabel: "agent assign",   path: "/spoke-tracker", icon: GitBranch },
  { label: "prompt vault",  sublabel: "system prompts", path: "/prompt-vault",  icon: BookMarked },
];

/* Tiny hub-and-spoke SVG node motif for nav items */
function NodeDot({ active }: { active: boolean }) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="shrink-0">
      <circle
        cx="4" cy="4" r="3"
        fill={active ? "oklch(0.88 0.18 196)" : "oklch(1 0 0 / 20%)"}
        stroke={active ? "oklch(0.88 0.18 196 / 50%)" : "transparent"}
        strokeWidth="1"
      />
    </svg>
  );
}

/* ── PAT Settings Panel ── */
interface PATSettingsProps {
  onClose?: () => void;
}

function PATSettings({ onClose }: PATSettingsProps) {
  const [value, setValue]     = useState(() => loadPAT());
  const [show, setShow]       = useState(false);
  const [saved, setSaved]     = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSave() {
    savePAT(value);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose?.();
      // Reload so the new token is picked up by github.ts
      window.location.reload();
    }, 900);
  }

  function handleClear() {
    clearPAT();
    setValue("");
    setSaved(false);
  }

  const hasSavedToken = !!loadPAT();

  return (
    <div
      className="rounded-xl p-3 space-y-2.5"
      style={{
        background: "oklch(0.185 0.014 264)",
        border: "1px solid oklch(0.88 0.18 196 / 20%)",
        boxShadow: "0 8px 32px oklch(0 0 0 / 50%)",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "oklch(0.88 0.18 196)", fontFamily: "'JetBrains Mono', monospace" }}
        >
          ── github pat
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-0.5 rounded transition-colors"
            style={{ color: "oklch(0.45 0.01 264)" }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      <p
        className="text-[10px] leading-relaxed"
        style={{ color: "oklch(0.52 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
      >
        paste a personal access token to raise the api rate limit (5000 req/hr vs 60).
      </p>

      {/* Token input */}
      <div className="relative">
        <input
          ref={inputRef}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="ghp_xxxxxxxxxxxx"
          className="w-full rounded-md px-2.5 py-1.5 pr-8 text-[11px] outline-none transition-all"
          style={{
            background: "oklch(0.14 0.01 264)",
            border: "1px solid oklch(1 0 0 / 10%)",
            color: "oklch(0.85 0.005 264)",
            fontFamily: "'JetBrains Mono', monospace",
          }}
          onFocus={(e) => {
            (e.target as HTMLInputElement).style.borderColor = "oklch(0.88 0.18 196 / 40%)";
          }}
          onBlur={(e) => {
            (e.target as HTMLInputElement).style.borderColor = "oklch(1 0 0 / 10%)";
          }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2"
          style={{ color: "oklch(0.42 0.01 264)" }}
        >
          {show ? <EyeOff size={11} /> : <Eye size={11} />}
        </button>
      </div>

      {/* Status indicator */}
      {hasSavedToken && !value && (
        <div
          className="text-[10px] flex items-center gap-1"
          style={{ color: "oklch(0.72 0.18 145)", fontFamily: "'JetBrains Mono', monospace" }}
        >
          <Check size={10} /> token active
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={!value.trim()}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-medium transition-all"
          style={{
            background: value.trim()
              ? "oklch(0.88 0.18 196 / 15%)"
              : "oklch(1 0 0 / 4%)",
            color: value.trim()
              ? "oklch(0.88 0.18 196)"
              : "oklch(0.38 0.01 264)",
            border: value.trim()
              ? "1px solid oklch(0.88 0.18 196 / 30%)"
              : "1px solid oklch(1 0 0 / 6%)",
            fontFamily: "'JetBrains Mono', monospace",
            cursor: value.trim() ? "pointer" : "not-allowed",
          }}
        >
          {saved ? <><Check size={11} /> saved</> : "save + reload"}
        </button>

        {hasSavedToken && (
          <button
            onClick={handleClear}
            className="p-1.5 rounded-md transition-colors"
            style={{
              background: "oklch(0.75 0.22 25 / 10%)",
              color: "oklch(0.75 0.22 25 / 70%)",
              border: "1px solid oklch(0.75 0.22 25 / 20%)",
            }}
            title="clear token"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Layout ── */
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location]    = useLocation();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef   = useRef<HTMLDivElement>(null);

  // Close settings on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const hasPAT = !!loadPAT();

  return (
    <div className="min-h-screen flex" style={{ background: "oklch(0.118 0.012 264)" }}>

      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex flex-col w-60 shrink-0"
        style={{
          background: "oklch(0.148 0.012 264)",
          borderRight: "1px solid oklch(1 0 0 / 6%)",
          minHeight: "100vh",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5"
          style={{ borderBottom: "1px solid oklch(1 0 0 / 6%)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.88 0.18 196 / 12%)", border: "1px solid oklch(0.88 0.18 196 / 25%)" }}
          >
            <img
              src="/manus-storage/logo-icon_07cddec8.png"
              alt="hub.spoke"
              className="w-5 h-5"
            />
          </div>
          <div>
            <div
              className="text-sm font-bold leading-tight tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.92 0.005 264)" }}
            >
              hub.spoke
            </div>
            <div
              className="text-[10px] leading-tight tracking-widest uppercase"
              style={{ color: "oklch(0.88 0.18 196 / 70%)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              cmd center
            </div>
          </div>
        </div>

        {/* Spoke line indicator */}
        <div className="px-4 pt-4 pb-1">
          <div
            className="text-[9px] uppercase tracking-widest font-medium"
            style={{ color: "oklch(0.42 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            ── navigation
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-1 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150 group relative",
                    isActive
                      ? "bg-[oklch(0.185_0.012_264)]"
                      : "hover:bg-[oklch(0.165_0.012_264)]"
                  )}
                  style={
                    isActive
                      ? { borderLeft: "2px solid oklch(0.88 0.18 196)", paddingLeft: "10px" }
                      : { borderLeft: "2px solid transparent", paddingLeft: "10px" }
                  }
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{
                      background: isActive
                        ? "oklch(0.88 0.18 196 / 12%)"
                        : "oklch(1 0 0 / 4%)",
                    }}
                  >
                    <Icon
                      size={14}
                      style={{ color: isActive ? "oklch(0.88 0.18 196)" : "oklch(0.55 0.01 264)" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-xs leading-tight"
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "oklch(0.92 0.005 264)" : "oklch(0.65 0.01 264)",
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      className="text-[10px] leading-tight"
                      style={{
                        color: isActive ? "oklch(0.58 0.01 264)" : "oklch(0.42 0.01 264)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {item.sublabel}
                    </div>
                  </div>
                  <NodeDot active={isActive} />
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Spoke diagram hint */}
        <div className="px-4 py-3" style={{ borderTop: "1px solid oklch(1 0 0 / 6%)" }}>
          <svg width="100%" height="32" viewBox="0 0 180 32" fill="none" className="opacity-20">
            <circle cx="90" cy="16" r="5" fill="oklch(0.88 0.18 196)" />
            <line x1="90" y1="16" x2="20"  y2="8"  stroke="oklch(0.88 0.18 196)" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="90" y1="16" x2="20"  y2="24" stroke="oklch(0.88 0.18 196)" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="90" y1="16" x2="160" y2="8"  stroke="oklch(0.88 0.18 196)" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="90" y1="16" x2="160" y2="24" stroke="oklch(0.88 0.18 196)" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="90" y1="16" x2="90"  y2="2"  stroke="oklch(0.88 0.18 196)" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="20"  cy="8"  r="3" fill="oklch(0.55 0.01 264)" />
            <circle cx="20"  cy="24" r="3" fill="oklch(0.55 0.01 264)" />
            <circle cx="160" cy="8"  r="3" fill="oklch(0.55 0.01 264)" />
            <circle cx="160" cy="24" r="3" fill="oklch(0.55 0.01 264)" />
            <circle cx="90"  cy="2"  r="3" fill="oklch(0.55 0.01 264)" />
          </svg>
        </div>

        {/* Footer — PAT settings + github link */}
        <div className="px-4 py-3 space-y-2" style={{ borderTop: "1px solid oklch(1 0 0 / 6%)" }}>

          {/* Settings toggle */}
          <div ref={settingsRef} className="relative">
            <button
              onClick={() => setSettingsOpen((s) => !s)}
              className="flex items-center gap-2 w-full text-[11px] transition-colors rounded-md px-1 py-1 hover:bg-[oklch(0.165_0.012_264)]"
              style={{
                color: settingsOpen
                  ? "oklch(0.88 0.18 196)"
                  : hasPAT
                  ? "oklch(0.72 0.18 145)"
                  : "oklch(0.45 0.01 264)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
              title="GitHub PAT settings"
            >
              <Settings size={11} className={settingsOpen ? "animate-spin" : ""} style={{ animationDuration: "3s" }} />
              <span>{hasPAT ? "token: active" : "token: not set"}</span>
              {hasPAT && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: "oklch(0.72 0.18 145)" }}
                />
              )}
            </button>

            {/* Dropdown panel */}
            {settingsOpen && (
              <div
                className="absolute bottom-full left-0 right-0 mb-2 z-50"
              >
                <PATSettings onClose={() => setSettingsOpen(false)} />
              </div>
            )}
          </div>

          <a
            href="https://github.com/newM1k3"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[11px] transition-colors hover:text-[oklch(0.88_0.18_196)] px-1"
            style={{ color: "oklch(0.42 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            <ExternalLink size={11} />
            github/newM1k3
          </a>
          <div
            className="text-[10px] px-1"
            style={{ color: "oklch(0.32 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            phase-3 · v0.3.0
          </div>
        </div>
      </aside>

      {/* ── Mobile Overlay Sidebar ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0" style={{ background: "oklch(0 0 0 / 70%)" }} />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 flex flex-col"
            style={{
              background: "oklch(0.148 0.012 264)",
              borderRight: "1px solid oklch(1 0 0 / 6%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-4 py-4"
              style={{ borderBottom: "1px solid oklch(1 0 0 / 6%)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center"
                  style={{ background: "oklch(0.88 0.18 196 / 12%)", border: "1px solid oklch(0.88 0.18 196 / 25%)" }}
                >
                  <img src="/manus-storage/logo-icon_07cddec8.png" alt="" className="w-4 h-4" />
                </div>
                <span
                  className="text-sm font-bold"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.92 0.005 264)" }}
                >
                  hub.spoke
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-md"
                style={{ color: "oklch(0.55 0.01 264)" }}
              >
                <X size={16} />
              </button>
            </div>

            <nav className="flex-1 px-2 py-3 space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all",
                        isActive ? "bg-[oklch(0.185_0.012_264)]" : ""
                      )}
                      style={
                        isActive
                          ? { borderLeft: "2px solid oklch(0.88 0.18 196)", paddingLeft: "10px" }
                          : { borderLeft: "2px solid transparent", paddingLeft: "10px" }
                      }
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon
                        size={15}
                        style={{ color: isActive ? "oklch(0.88 0.18 196)" : "oklch(0.55 0.01 264)" }}
                      />
                      <span
                        className="text-sm"
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          color: isActive ? "oklch(0.92 0.005 264)" : "oklch(0.65 0.01 264)",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile PAT settings */}
            <div className="px-3 py-3" style={{ borderTop: "1px solid oklch(1 0 0 / 6%)" }}>
              <PATSettings />
            </div>
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top header */}
        <header
          className="md:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-40"
          style={{
            background: "oklch(0.148 0.012 264)",
            borderBottom: "1px solid oklch(1 0 0 / 6%)",
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md"
            style={{ color: "oklch(0.55 0.01 264)" }}
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <img src="/manus-storage/logo-icon_07cddec8.png" alt="" className="w-5 h-5" />
            <span
              className="text-sm font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.92 0.005 264)" }}
            >
              hub.spoke
            </span>
          </div>
          {/* Mobile settings gear */}
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md"
            style={{ color: hasPAT ? "oklch(0.72 0.18 145)" : "oklch(0.45 0.01 264)" }}
            title="GitHub PAT settings"
          >
            <Settings size={16} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
