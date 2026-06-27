# Hub-and-Spoke Command Center — Design Ideas

## Three Stylistic Approaches

### 1. Terminal Noir (p: 0.07)
A hacker-terminal aesthetic with monospace fonts, green-on-black phosphor glow, and scanline textures. Feels like a 1980s mainframe crossed with a modern IDE.

### 2. Obsidian Control Room (p: 0.06)
Military-grade command center UI. Deep charcoal backgrounds, sharp geometric borders, amber/cyan accent hierarchy, and tight data-dense layouts. Think NASA mission control meets Figma.

### 3. Minimal Dark Forge (p: 0.08)
Ultra-clean developer tool aesthetic. Near-black backgrounds with subtle surface elevation, electric cyan as the single signature accent, Inter-like precision typography, and generous whitespace. Inspired by Linear, Vercel, and Raycast.

---

## Chosen Approach: Minimal Dark Forge

**Design Movement:** Developer-tool minimalism — Linear / Vercel / Raycast school of thought

**Core Principles:**
1. Signal over noise — every element earns its place
2. Surface elevation via subtle background steps (not borders)
3. One signature accent color (electric cyan) used sparingly for maximum impact
4. Data density without clutter — compact but breathable

**Color Philosophy:**
- Background layers: `#0D1117` (base) → `#161B22` (surface) → `#21262D` (elevated)
- Signature accent: `#00E5FF` (electric cyan) — used only for active states, CTAs, and key data
- Secondary accent: `#7C3AED` (violet) — for agent badges and tags
- Text hierarchy: `#E6EDF3` (primary) → `#8B949E` (secondary) → `#484F58` (muted)
- Destructive: `#F85149`
- Success: `#3FB950`

**Layout Paradigm:**
- Persistent left sidebar (240px) with icon + label navigation
- Main content area with a sticky top header bar
- Card-based content panels with subtle elevation
- Mobile: sidebar collapses to bottom tab bar

**Signature Elements:**
1. Thin 1px cyan left-border on active sidebar items
2. Agent badges as colored pills (Bolt=amber, Manus=violet, Replit=green, Cursor=blue)
3. Monospace font for commit hashes, timestamps, and code snippets

**Interaction Philosophy:**
- Instant feedback on all interactions (no loading spinners unless network-bound)
- Hover states reveal secondary actions (copy, edit, delete)
- Keyboard-first: all primary actions accessible without mouse

**Animation:**
- Page transitions: 150ms fade
- Card entrances: 180ms ease-out stagger (30ms per item)
- Sidebar: instant (no animation — keyboard-initiated)
- Modals/dialogs: 200ms scale from 0.97 + fade
- Button press: scale(0.97) 120ms ease-out

**Typography System:**
- Display/headings: `Space Grotesk` (600–700 weight) — geometric, technical
- Body/UI: `Inter` (400–500 weight) — readable, neutral
- Code/mono: `JetBrains Mono` (400 weight) — commit hashes, timestamps

**Brand Essence:**
The developer's mission control — for builders who ship with AI, not just talk about it. Precise. Focused. Yours.
Personality: Focused, Precise, Empowering

**Brand Voice:**
Headlines sound like CLI output — direct, lowercase-friendly, no fluff.
Example: `// repos synced. 3 agents active.`
Example CTA: `assign agent →`
Banned phrases: "Welcome to our dashboard", "Get started today"

**Wordmark & Logo:**
Hub-and-spoke hexagonal node mark (cyan on dark). Text: `hub.spoke` in Space Grotesk 600.

**Signature Brand Color:** Electric Cyan `#00E5FF`

---

## Style Decisions
- Agent badge colors: Bolt.new = amber (#F59E0B), Manus = violet (#7C3AED), Replit = emerald (#10B981), Cursor = blue (#3B82F6)
- Sidebar width: 240px desktop, collapses to icon-only at 768px, bottom tabs on mobile
- Card border: 1px solid rgba(255,255,255,0.08) with bg-[#161B22]
- Active nav item: left 2px cyan border + bg-[#21262D]
- Monospace elements use JetBrains Mono at 12-13px
