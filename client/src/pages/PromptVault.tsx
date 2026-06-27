/* ============================================================
   PromptVault.tsx — CRUD for frequently used system prompts
   Theme: Minimal Dark Forge
   Features: Create, Read, Edit, Delete, Copy, Tag, Search
   ============================================================ */
import { useState, useEffect } from "react";
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
      toast.error("Title and content are required.");
      return;
    }
    const now = new Date().toISOString();
    if (editingPrompt) {
      const updated = prompts.map((p) =>
        p.id === editingPrompt.id
          ? { ...p, ...form, updatedAt: now }
          : p
      );
      persist(updated);
      toast.success("Prompt updated.");
    } else {
      const newPrompt: Prompt = {
        id: generateId(),
        ...form,
        createdAt: now,
        updatedAt: now,
      };
      persist([newPrompt, ...prompts]);
      toast.success("Prompt saved to vault.");
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    persist(prompts.filter((p) => p.id !== id));
    setDeleteConfirmId(null);
    toast.success("Prompt deleted.");
  }

  async function handleCopy(prompt: Prompt) {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopiedId(prompt.id);
      toast.success("Copied to clipboard.");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Clipboard access denied.");
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

  const filtered = prompts.filter(
    (p) =>
      search === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.includes(search.toLowerCase()))
  );

  const allTags = Array.from(new Set(prompts.flatMap((p) => p.tags))).sort();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.92 0.005 264)" }}
          >
            // prompt vault
          </h1>
          <p className="text-sm mt-1" style={{ color: "oklch(0.58 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}>
            {prompts.length} prompt{prompts.length !== 1 ? "s" : ""} stored locally
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cyan-glow"
          style={{
            background: "oklch(0.88 0.18 196)",
            color: "oklch(0.118 0.012 264)",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <Plus size={15} />
          New Prompt
        </button>
      </div>

      {/* ── Search + Tag Filter ── */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "oklch(0.42 0.01 264)" }} />
          <input
            type="text"
            placeholder="search prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
            style={{
              background: "oklch(0.155 0.012 264)",
              border: "1px solid oklch(1 0 0 / 10%)",
              color: "oklch(0.92 0.005 264)",
              fontFamily: "'Inter', sans-serif",
            }}
            onFocus={(e) => (e.target.style.borderColor = "oklch(0.88 0.18 196 / 50%)")}
            onBlur={(e) => (e.target.style.borderColor = "oklch(1 0 0 / 10%)")}
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearch(search === tag ? "" : tag)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all",
                  search === tag
                    ? "bg-[oklch(0.88_0.18_196_/_20%)] text-[oklch(0.88_0.18_196)] border border-[oklch(0.88_0.18_196_/_40%)]"
                    : "bg-[oklch(1_0_0_/_5%)] text-[oklch(0.58_0.01_264)] border border-[oklch(1_0_0_/_8%)] hover:border-[oklch(1_0_0_/_20%)]"
                )}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <Tag size={10} />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Prompt Cards ── */}
      {filtered.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <BookMarked size={32} className="mx-auto mb-3" style={{ color: "oklch(0.42 0.01 264)" }} />
          <p className="text-sm mb-1" style={{ color: "oklch(0.72 0.01 264)" }}>
            {prompts.length === 0 ? "Your vault is empty." : "No prompts match your search."}
          </p>
          {prompts.length === 0 && (
            <button
              onClick={openCreate}
              className="text-sm mt-2 hover:text-[oklch(0.88_0.18_196)] transition-colors"
              style={{ color: "oklch(0.58 0.01 264)", fontFamily: "'Inter', sans-serif" }}
            >
              Add your first prompt →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((prompt, i) => {
            const isExpanded = expandedId === prompt.id;
            const isCopied = copiedId === prompt.id;
            return (
              <div
                key={prompt.id}
                className={cn(
                  "card-surface group hover:border-[oklch(1_0_0_/_15%)] transition-all duration-150 animate-fade-slide-up overflow-hidden",
                  `stagger-${Math.min(i + 1, 6)}`
                )}
              >
                {/* Header */}
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : prompt.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className="text-sm font-semibold truncate"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.92 0.005 264)" }}
                      >
                        {prompt.title}
                      </h3>
                    </div>
                    {!isExpanded && (
                      <p
                        className="text-xs line-clamp-1"
                        style={{ color: "oklch(0.58 0.01 264)", fontFamily: "'Inter', sans-serif" }}
                      >
                        {prompt.content.slice(0, 120)}...
                      </p>
                    )}
                    {prompt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {prompt.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded text-[10px]"
                            style={{
                              background: "oklch(1 0 0 / 6%)",
                              color: "oklch(0.58 0.01 264)",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleCopy(prompt)}
                      className="p-1.5 rounded-md transition-colors"
                      style={{ color: isCopied ? "oklch(0.72 0.18 145)" : "oklch(0.58 0.01 264)" }}
                      title="Copy to clipboard"
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => openEdit(prompt)}
                      className="p-1.5 rounded-md transition-colors hover:text-[oklch(0.88_0.18_196)]"
                      style={{ color: "oklch(0.58 0.01 264)" }}
                      title="Edit prompt"
                    >
                      <Pencil size={14} />
                    </button>
                    {deleteConfirmId === prompt.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(prompt.id)}
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ background: "oklch(0.62 0.22 25 / 20%)", color: "oklch(0.75 0.22 25)" }}
                        >
                          confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-1.5 rounded-md"
                          style={{ color: "oklch(0.58 0.01 264)" }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(prompt.id)}
                        className="p-1.5 rounded-md transition-colors hover:text-[oklch(0.75_0.22_25)]"
                        style={{ color: "oklch(0.58 0.01 264)" }}
                        title="Delete prompt"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <pre
                      className="text-xs p-4 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed"
                      style={{
                        background: "oklch(0.118 0.012 264)",
                        color: "oklch(0.78 0.005 264)",
                        fontFamily: "'JetBrains Mono', monospace",
                        border: "1px solid oklch(1 0 0 / 8%)",
                      }}
                    >
                      {prompt.content}
                    </pre>
                    <div className="flex items-center justify-between mt-3">
                      <span
                        className="text-[11px]"
                        style={{ color: "oklch(0.42 0.01 264)", fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        updated {new Date(prompt.updatedAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleCopy(prompt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all"
                        style={{
                          background: "oklch(0.88 0.18 196 / 15%)",
                          color: "oklch(0.88 0.18 196)",
                          border: "1px solid oklch(0.88 0.18 196 / 30%)",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {isCopied ? <Check size={12} /> : <Copy size={12} />}
                        {isCopied ? "Copied!" : "Copy prompt"}
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
            background: "oklch(0.185 0.012 264)",
            border: "1px solid oklch(1 0 0 / 12%)",
            color: "oklch(0.92 0.005 264)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {editingPrompt ? "Edit Prompt" : "New Prompt"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "oklch(0.58 0.01 264)", fontFamily: "'Inter', sans-serif" }}
              >
                Title
              </label>
              <input
                type="text"
                placeholder="e.g. React Component Generator"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: "oklch(0.155 0.012 264)",
                  border: "1px solid oklch(1 0 0 / 10%)",
                  color: "oklch(0.92 0.005 264)",
                  fontFamily: "'Inter', sans-serif",
                }}
                onFocus={(e) => (e.target.style.borderColor = "oklch(0.88 0.18 196 / 50%)")}
                onBlur={(e) => (e.target.style.borderColor = "oklch(1 0 0 / 10%)")}
              />
            </div>

            {/* Content */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "oklch(0.58 0.01 264)", fontFamily: "'Inter', sans-serif" }}
              >
                Prompt Content
              </label>
              <textarea
                placeholder="Enter your system prompt here..."
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={10}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all resize-y"
                style={{
                  background: "oklch(0.118 0.012 264)",
                  border: "1px solid oklch(1 0 0 / 10%)",
                  color: "oklch(0.85 0.005 264)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px",
                  lineHeight: "1.6",
                }}
                onFocus={(e) => (e.target.style.borderColor = "oklch(0.88 0.18 196 / 50%)")}
                onBlur={(e) => (e.target.style.borderColor = "oklch(1 0 0 / 10%)")}
              />
            </div>

            {/* Tags */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "oklch(0.58 0.01 264)", fontFamily: "'Inter', sans-serif" }}
              >
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="add tag..."
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
                    background: "oklch(0.155 0.012 264)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    color: "oklch(0.92 0.005 264)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "oklch(0.88 0.18 196 / 50%)")}
                  onBlur={(e) => (e.target.style.borderColor = "oklch(1 0 0 / 10%)")}
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 rounded-lg text-xs transition-all"
                  style={{
                    background: "oklch(0.155 0.012 264)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    color: "oklch(0.72 0.01 264)",
                  }}
                >
                  Add
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                      style={{
                        background: "oklch(0.88 0.18 196 / 15%)",
                        color: "oklch(0.88 0.18 196)",
                        border: "1px solid oklch(0.88 0.18 196 / 30%)",
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
                color: "oklch(0.72 0.01 264)",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              style={{
                background: "oklch(0.88 0.18 196)",
                color: "oklch(0.118 0.012 264)",
                fontWeight: 500,
              }}
            >
              {editingPrompt ? "Save Changes" : "Save Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
