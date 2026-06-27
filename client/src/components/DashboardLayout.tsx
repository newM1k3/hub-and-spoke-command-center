/* ============================================================
   DashboardLayout.tsx — Persistent sidebar + top header
   Theme: Minimal Dark Forge
   Sidebar: 240px desktop, icon-only at md, bottom tabs on mobile
   ============================================================ */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  GitBranch,
  BookMarked,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",     path: "/",              icon: LayoutDashboard },
  { label: "Spoke Tracker", path: "/spoke-tracker", icon: GitBranch },
  { label: "Prompt Vault",  path: "/prompt-vault",  icon: BookMarked },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: "oklch(0.118 0.012 264)" }}>
      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex flex-col w-60 shrink-0 border-r"
        style={{
          background: "oklch(0.155 0.012 264)",
          borderColor: "oklch(1 0 0 / 8%)",
          minHeight: "100vh",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
          <img
            src="/manus-storage/logo-icon_07cddec8.png"
            alt="Hub-and-Spoke"
            className="w-8 h-8 shrink-0"
          />
          <div>
            <div
              className="text-sm font-semibold leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.92 0.005 264)" }}
            >
              hub.spoke
            </div>
            <div
              className="text-[10px] leading-tight"
              style={{ color: "oklch(0.58 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              command center
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 group",
                    isActive
                      ? "nav-item-active"
                      : "text-[oklch(0.58_0.01_264)] hover:text-[oklch(0.92_0.005_264)] hover:bg-[oklch(0.185_0.012_264)]"
                  )}
                  style={isActive ? { borderLeftColor: "oklch(0.88 0.18 196)" } : {}}
                >
                  <Icon
                    size={16}
                    className={cn(
                      "shrink-0 transition-colors",
                      isActive ? "text-[oklch(0.88_0.18_196)]" : "text-current"
                    )}
                  />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: isActive ? 500 : 400 }}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
          <a
            href={`https://github.com/newM1k3`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs transition-colors hover:text-[oklch(0.88_0.18_196)]"
            style={{ color: "oklch(0.58 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            <ExternalLink size={12} />
            github/newM1k3
          </a>
          <div
            className="mt-1 text-[10px]"
            style={{ color: "oklch(0.42 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            Phase 1 — v0.1.0
          </div>
        </div>
      </aside>

      {/* ── Mobile Overlay Sidebar ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0" style={{ background: "oklch(0 0 0 / 60%)" }} />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 flex flex-col"
            style={{ background: "oklch(0.155 0.012 264)", borderRight: "1px solid oklch(1 0 0 / 8%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-5 border-b" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
              <div className="flex items-center gap-3">
                <img src="/manus-storage/logo-icon_07cddec8.png" alt="Hub-and-Spoke" className="w-7 h-7" />
                <span className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>hub.spoke</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded" style={{ color: "oklch(0.58 0.01 264)" }}>
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const isActive = location === item.path;
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm",
                        isActive ? "nav-item-active" : "text-[oklch(0.58_0.01_264)]"
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon size={16} className={isActive ? "text-[oklch(0.88_0.18_196)]" : "text-current"} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header (mobile only) */}
        <header
          className="md:hidden flex items-center gap-3 px-4 py-3 border-b sticky top-0 z-40"
          style={{
            background: "oklch(0.155 0.012 264)",
            borderColor: "oklch(1 0 0 / 8%)",
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md"
            style={{ color: "oklch(0.58 0.01 264)" }}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <img src="/manus-storage/logo-icon_07cddec8.png" alt="" className="w-6 h-6" />
            <span className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              hub.spoke
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
