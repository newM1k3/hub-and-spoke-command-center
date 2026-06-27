/* ============================================================
   PromptVault.tsx — CRUD for frequently used system prompts
   Theme: Minimal Dark Forge
   Style Review Applied:
   - CLI-native copy ("→ vault loaded", "save prompt →")
   - Stronger surface elevation (layered bg steps)
   - Better page composition (stats bar + tag cloud at top)
   - Expanded view with syntax-highlighted code block feel
   ============================================================ */
import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Copy,
  Pencil,
  Trash2,
  Check,
  Search,
  BookMarked,
  X,
  Tag,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  loadPrompts,
  savePrompts,
  generateId,
  type Prompt,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const EMPTY_FORM: Omit<Prompt, "id" | "createdAt" | "updatedAt"> = {
  title: "",
  content: "",
  tags: [],
};

export default function PromptVault() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tagInput, setTagInput] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    setPrompts(loadPrompts());
  }, []);

  function persist(updated: Prompt[]) {
    setPrompts(updated);
    savePrompts(updated);
  }

  function openCreate() {
    setEditingPrompt(null);
    setForm(EMPTY_FORM);
    setTagInput("");
    setDialogOpen(true);
  }

  function openEdit(prompt: Prompt) {
    setEditingPrompt(prompt);
    setForm({ title: prompt.title, content: prompt.content, tags: [...prompt.tags] });
    setTagInput("");
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("→ title and content required");
      return;
    }
    const now = new Date().toISOString();
    if (editingPrompt) {
      const updated = prompts.map((p) =>
        p.id === editingPrompt.id ? { ...p, ...form, updatedAt: now } : p
      );
      persist(updated);
      toast.success("→ prompt updated");
    } else {
      const newPrompt: Prompt = {
        id: generateId(),
        ...form,
        createdAt: now,
        updatedAt: now,
      };
      persist([newPrompt, ...prompts]);
      toast.success("→ prompt saved to vault");
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    persist(prompts.filter((p) => p.id !== id));
    setDeleteConfirmId(null);
    toast.success("→ prompt deleted");
  }

  async function handleCopy(prompt: Prompt) {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopiedId(prompt.id);
      toast.success("→ copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("clipboard access denied");
    }
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !form.tags.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  const importRef = useRef<HTMLInputElement>(null);

  function exportJSON() {
    const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `prompt-vault-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("→ vault exported", { description: `${prompts.length} prompts · JSON`, duration: 2000 });
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed: Prompt[] = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error("not an array");
        // Merge: keep existing prompts, add imported ones that don't share an id
        const existingIds = new Set(prompts.map((p) => p.id));
        const newOnes = parsed.filter((p) => !existingIds.has(p.id));
        const merged = [...prompts, ...newOnes];
        persist(merged);
        toast.success("→ vault imported", { description: `+${newOnes.length} new · ${parsed.length - newOnes.length} skipped (duplicate)`, duration: 3000 });
      } catch {
        toast.error("import failed", { description: "invalid JSON format", duration: 3000 });
      }
      // Reset input so the same file can be re-imported
      if (importRef.current) importRef.current.value = "";
    };
    reader.readAsText(file);
  }

  const allTags = Array.from(new Set(prompts.flatMap((p) => p.tags))).sort();

  const filtered = prompts.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.includes(search.toLowerCase()));
    const matchesTag = activeTag === null || p.tags.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.92 0.005 264)" }}
          >
            // prompt vault
          </h1>
          <p
            className="text-xs mt-1"
            style={{ color: "oklch(0.88 0.18 196 / 70%)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            → {prompts.length} prompt{prompts.length !== 1 ? "s" : ""} stored · {allTags.length} tag{allTags.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Hidden file input for import */}
          <input
            ref={importRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImport}
          />
          {/* Export */}
          <button
            onClick={exportJSON}
            disabled={prompts.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs transition-all disabled:opacity-40"
            style={{
              background: "oklch(0.165 0.012 264)",
              border: "1px solid oklch(1 0 0 / 8%)",
              color: "oklch(0.65 0.01 264)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
            title="export vault as JSON"
          >
            <Download size={13} />
            export
          </button>
          {/* Import */}
          <button
            onClick={() => importRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs transition-all"
            style={{
              background: "oklch(0.165 0.012 264)",
              border: "1px solid oklch(1 0 0 / 8%)",
              color: "oklch(0.65 0.01 264)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
            title="import prompts from JSON"
          >
            <Upload size={13} />
            import
          </button>
          {/* New prompt */}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: "oklch(0.88 0.18 196)",
              color: "oklch(0.118 0.012 264)",
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: "0 0 16px oklch(0.88 0.18 196 / 25%)",
            }}
          >
            <Plus size={14} />
            new prompt
          </button>
        </div>
      </div>

      {/* ── Stats + Tag Cloud ── */}
      <div
        className="rounded-xl p-4"
        style={{
          background: "oklch(0.148 0.012 264)",
          border: "1px solid oklch(1 0 0 / 6%)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "oklch(0.42 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            → tag index
          </div>
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="flex items-center gap-1 text-[11px] transition-colors hover:text-[oklch(0.88_0.18_196)]"
              style={{ color: "oklch(0.52 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              <X size={10} /> clear filter
            </button>
          )}
        </div>
        {allTags.length === 0 ? (
          <p
            className="text-[11px]"
            style={{ color: "oklch(0.38 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            no tags yet — add tags when creating prompts
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
              const isActive = activeTag === tag;
              const count = prompts.filter((p) => p.tags.includes(tag)).length;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(isActive ? null : tag)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-all"
                  style={
                    isActive
                      ? {
                          background: "oklch(0.88 0.18 196 / 15%)",
                          color: "oklch(0.88 0.18 196)",
                          border: "1px solid oklch(0.88 0.18 196 / 35%)",
                          fontFamily: "'JetBrains Mono', monospace",
                        }
                      : {
                          background: "oklch(1 0 0 / 5%)",
                          color: "oklch(0.52 0.01 264)",
                          border: "1px solid oklch(1 0 0 / 8%)",
                          fontFamily: "'JetBrains Mono', monospace",
                        }
                  }
                >
                  <Tag size={9} />
                  {tag}
                  <span
                    className="text-[10px] font-bold px-1 rounded"
                    style={{ background: "oklch(0 0 0 / 20%)" }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "oklch(0.38 0.01 264)" }}
        />
        <input
          type="text"
          placeholder="search prompts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-xs outline-none transition-all"
          style={{
            background: "oklch(0.148 0.012 264)",
            border: "1px solid oklch(1 0 0 / 8%)",
            color: "oklch(0.85 0.005 264)",
            fontFamily: "'JetBrains Mono', monospace",
          }}
          onFocus={(e) => (e.target.style.borderColor = "oklch(0.88 0.18 196 / 40%)")}
          onBlur={(e) => (e.target.style.borderColor = "oklch(1 0 0 / 8%)")}
        />
      </div>

      {/* ── Prompt Cards ── */}
      {filtered.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: "oklch(0.148 0.012 264)", border: "1px solid oklch(1 0 0 / 5%)" }}
        >
          <BookMarked size={28} className="mx-auto mb-3" style={{ color: "oklch(0.38 0.01 264)" }} />
          <p
            className="text-xs mb-2"
            style={{ color: "oklch(0.52 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            {prompts.length === 0 ? "→ vault is empty" : "→ no prompts match filter"}
          </p>
          {prompts.length === 0 && (
            <button
              onClick={openCreate}
              className="text-xs transition-colors hover:text-[oklch(0.88_0.18_196)]"
              style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              add first prompt →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((prompt, i) => {
            const isExpanded = expandedId === prompt.id;
            const isCopied = copiedId === prompt.id;
            return (
              <div
                key={prompt.id}
                className={cn(
                  "rounded-xl group transition-all duration-150 overflow-hidden animate-fade-slide-up",
                  `stagger-${Math.min(i + 1, 6)}`
                )}
                style={{
                  background: isExpanded ? "oklch(0.162 0.012 264)" : "oklch(0.148 0.012 264)",
                  border: isExpanded
                    ? "1px solid oklch(0.88 0.18 196 / 20%)"
                    : "1px solid oklch(1 0 0 / 6%)",
                  borderLeft: isExpanded
                    ? "3px solid oklch(0.88 0.18 196 / 60%)"
                    : "3px solid oklch(1 0 0 / 6%)",
                }}
              >
                {/* Header */}
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : prompt.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className="text-sm font-semibold"
                        style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          color: isExpanded ? "oklch(0.92 0.005 264)" : "oklch(0.82 0.005 264)",
                        }}
                      >
                        {prompt.title}
                      </h3>
                    </div>
                    {!isExpanded && (
                      <p
                        className="text-xs line-clamp-1 mb-1.5"
                        style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'Inter', sans-serif" }}
                      >
                        {prompt.content.slice(0, 100)}…
                      </p>
                    )}
                    {prompt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {prompt.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded text-[10px]"
                            style={{
                              background: "oklch(1 0 0 / 5%)",
                              color: "oklch(0.48 0.01 264)",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action icons */}
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(prompt)}
                        className="p-1.5 rounded-md transition-colors hover:bg-[oklch(1_0_0_/_6%)]"
                        style={{ color: isCopied ? "oklch(0.72 0.18 145)" : "oklch(0.52 0.01 264)" }}
                        title="copy to clipboard"
                      >
                        {isCopied ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                      <button
                        onClick={() => openEdit(prompt)}
                        className="p-1.5 rounded-md transition-colors hover:bg-[oklch(1_0_0_/_6%)] hover:text-[oklch(0.88_0.18_196)]"
                        style={{ color: "oklch(0.52 0.01 264)" }}
                        title="edit"
                      >
                        <Pencil size={13} />
                      </button>
                      {deleteConfirmId === prompt.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(prompt.id)}
                            className="px-2 py-1 rounded text-[11px] font-medium"
                            style={{
                              background: "oklch(0.62 0.22 25 / 15%)",
                              color: "oklch(0.75 0.22 25)",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-1.5 rounded-md"
                            style={{ color: "oklch(0.52 0.01 264)" }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(prompt.id)}
                          className="p-1.5 rounded-md transition-colors hover:bg-[oklch(1_0_0_/_6%)] hover:text-[oklch(0.75_0.22_25)]"
                          style={{ color: "oklch(0.52 0.01 264)" }}
                          title="delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <button
                      className="p-1.5 rounded-md ml-1"
                      style={{ color: "oklch(0.48 0.01 264)" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : prompt.id);
                      }}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    {/* Code block header */}
                    <div
                      className="flex items-center justify-between px-3 py-1.5 rounded-t-lg"
                      style={{ background: "oklch(0.185 0.012 264)", borderBottom: "1px solid oklch(1 0 0 / 8%)" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "oklch(0.62 0.22 25 / 60%)" }} />
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "oklch(0.72 0.18 55 / 60%)" }} />
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "oklch(0.72 0.18 145 / 60%)" }} />
                      </div>
                      <span
                        className="text-[10px]"
                        style={{ color: "oklch(0.42 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        system_prompt.txt
                      </span>
                    </div>
                    <pre
                      className="text-xs p-4 rounded-b-lg overflow-x-auto whitespace-pre-wrap leading-relaxed"
                      style={{
                        background: "oklch(0.118 0.012 264)",
                        color: "oklch(0.78 0.005 264)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "11.5px",
                        lineHeight: "1.7",
                      }}
                    >
                      {prompt.content}
                    </pre>
                    <div className="flex items-center justify-between mt-3">
                      <span
                        className="text-[11px]"
                        style={{ color: "oklch(0.38 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        updated {new Date(prompt.updatedAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleCopy(prompt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                        style={{
                          background: "oklch(0.88 0.18 196 / 12%)",
                          color: "oklch(0.88 0.18 196)",
                          border: "1px solid oklch(0.88 0.18 196 / 25%)",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {isCopied ? <Check size={12} /> : <Copy size={12} />}
                        {isCopied ? "copied!" : "copy →"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-2xl"
          style={{
            background: "oklch(0.178 0.012 264)",
            border: "1px solid oklch(1 0 0 / 12%)",
            color: "oklch(0.92 0.005 264)",
          }}
        >
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.92 0.005 264)" }}
            >
              {editingPrompt ? "// edit prompt" : "// new prompt"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div>
              <label
                className="block text-[11px] mb-1.5 uppercase tracking-wider"
                style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
              >
                title
              </label>
              <input
                type="text"
                placeholder="e.g. react-component-generator"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: "oklch(0.148 0.012 264)",
                  border: "1px solid oklch(1 0 0 / 10%)",
                  color: "oklch(0.92 0.005 264)",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
                onFocus={(e) => (e.target.style.borderColor = "oklch(0.88 0.18 196 / 50%)")}
                onBlur={(e) => (e.target.style.borderColor = "oklch(1 0 0 / 10%)")}
              />
            </div>

            {/* Content */}
            <div>
              <label
                className="block text-[11px] mb-1.5 uppercase tracking-wider"
                style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
              >
                prompt content
              </label>
              <textarea
                placeholder="Enter your system prompt here..."
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={10}
                className="w-full px-3 py-2.5 rounded-lg text-xs outline-none transition-all resize-y"
                style={{
                  background: "oklch(0.118 0.012 264)",
                  border: "1px solid oklch(1 0 0 / 10%)",
                  color: "oklch(0.82 0.005 264)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px",
                  lineHeight: "1.7",
                }}
                onFocus={(e) => (e.target.style.borderColor = "oklch(0.88 0.18 196 / 50%)")}
                onBlur={(e) => (e.target.style.borderColor = "oklch(1 0 0 / 10%)")}
              />
            </div>

            {/* Tags */}
            <div>
              <label
                className="block text-[11px] mb-1.5 uppercase tracking-wider"
                style={{ color: "oklch(0.48 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
              >
                tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="add tag (Enter or comma)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-lg text-xs outline-none transition-all"
                  style={{
                    background: "oklch(0.148 0.012 264)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    color: "oklch(0.85 0.005 264)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "oklch(0.88 0.18 196 / 50%)")}
                  onBlur={(e) => (e.target.style.borderColor = "oklch(1 0 0 / 10%)")}
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 rounded-lg text-xs transition-all"
                  style={{
                    background: "oklch(0.148 0.012 264)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    color: "oklch(0.65 0.01 264)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  add
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px]"
                      style={{
                        background: "oklch(0.88 0.18 196 / 12%)",
                        color: "oklch(0.88 0.18 196)",
                        border: "1px solid oklch(0.88 0.18 196 / 25%)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:opacity-70">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              style={{
                background: "transparent",
                border: "1px solid oklch(1 0 0 / 12%)",
                color: "oklch(0.65 0.01 264)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
              }}
            >
              cancel
            </Button>
            <Button
              onClick={handleSave}
              style={{
                background: "oklch(0.88 0.18 196)",
                color: "oklch(0.118 0.012 264)",
                fontWeight: 600,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {editingPrompt ? "save changes →" : "save prompt →"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
