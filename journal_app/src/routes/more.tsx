import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useTags, addTag, removeTag, useEntries } from "@/lib/journal-store";
import { Plus, X, Download } from "lucide-react";

export const Route = createFileRoute("/more")({
  head: () => ({ meta: [{ title: "More — Journal" }] }),
  component: MorePage,
});

function MorePage() {
  const tags = useTags();
  const entries = useEntries();
  const [newTag, setNewTag] = useState("");

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `journal-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-2xl min-h-screen px-4 py-8 space-y-5 pb-24">
      <div className="glass-card rounded-2xl border border-border/30 p-6 shadow-glow">
        <h1 className="font-serif text-3xl font-bold text-foreground">More</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage your tags and export journal data securely.</p>
      </div>

      <section className="glass-card border border-border/30 rounded-2xl p-6 shadow-glow">
        <h2 className="font-serif text-xl font-bold mb-4 text-foreground">Manage Tags</h2>
        <div className="flex gap-2 mb-4">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { addTag(newTag); setNewTag(""); } }}
            placeholder="New tag…"
            className="flex-1 px-4 py-2 rounded-xl border border-border bg-input text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
          />
          <button
            onClick={() => { addTag(newTag); setNewTag(""); }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition"
          ><Plus className="h-4 w-4" /></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              {t}
              <button onClick={() => removeTag(t)} className="rounded-full p-1 text-muted-foreground hover:text-primary transition">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </section>

      <section className="glass-card border border-border/30 rounded-2xl p-6 shadow-glow">
        <h2 className="font-serif text-xl font-bold mb-4 text-foreground">Data Export</h2>
        <button onClick={exportJson} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition">
          <Download className="h-4 w-4" /> Export as JSON
        </button>
        <p className="text-xs text-muted-foreground mt-4">
          ⓘ All entries are saved locally. Your data stays on your device.
        </p>
      </section>

      <BottomNav />
    </div>
  );
}
