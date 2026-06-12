import { useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { ChevronLeft, Trash2, Check } from "lucide-react";
import {
  STATES,
  useEntries,
  useTags,
  saveEntry,
  deleteEntry,
  addTag,
  predictStateFromContentAsync,
} from "@/lib/journal-store";

export default function EntryEditor({ entryId }: { entryId?: string }) {
  const navigate = useNavigate();
  const entries = useEntries();
  const tags = useTags();
  const existing = useMemo(() => entries.find((e) => e.id === entryId), [entries, entryId]);

  const [date, setDate] = useState(existing?.date ?? format(new Date(), "yyyy-MM-dd"));
  const [title, setTitle] = useState(existing?.title ?? "");
  const [content, setContent] = useState(existing?.content ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(existing?.tags ?? []);
  const [newTag, setNewTag] = useState("");
  const [predictedState, setPredictedState] = useState<number>(existing?.state ?? existing?.mood ?? 0);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);

  // Predict state from content
  useEffect(() => {
    const predict = async () => {
      if (!content.trim()) {
        setPredictedState(existing?.state ?? existing?.mood ?? 0);
        return;
      }

      setIsLoadingPrediction(true);
      try {
        const state = await predictStateFromContentAsync(content);
        setPredictedState(state);
      } catch (error) {
        console.error("Failed to predict state:", error);
        setPredictedState(0);
      } finally {
        setIsLoadingPrediction(false);
      }
    };

    const timer = setTimeout(predict, 500); // Debounce predictions
    return () => clearTimeout(timer);
  }, [content, existing?.state, existing?.mood]);

  const onSave = () => {
    saveEntry({
      id: existing?.id,
      date,
      title: title.trim(),
      content: content.trim(),
      state: predictedState,
      tags: selectedTags,
    });
    navigate({ to: "/" });
  };

  const onDelete = () => {
    if (!existing) return;
    if (confirm("Delete this entry?")) {
      deleteEntry(existing.id);
      navigate({ to: "/" });
    }
  };

  const toggleTag = (t: string) =>
    setSelectedTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  return (
    <div className="mx-auto max-w-2xl min-h-screen pb-12">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-border px-4 py-4 shadow-glow">
        <div className="flex items-center justify-between">
          <Link to="/" className="p-2 -ml-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-serif text-xl text-foreground">{existing ? "Edit Entry" : "New Entry"}</h1>
          <div className="flex items-center gap-2">
            {existing && (
              <button onClick={onDelete} className="rounded-2xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-destructive transition hover:bg-destructive/15">
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button onClick={onSave} className="rounded-2xl bg-gradient-to-r from-primary to-[#ff6e9e] px-3 py-2 text-primary-foreground shadow-sm hover:scale-[1.02] transition-transform">
              <Check className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white/85 border border-border glass-card rounded-[2rem] px-6 py-7 mx-4 mt-6 space-y-6 shadow-glow">
        <div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-2xl border border-border bg-secondary/80 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-3">
            {isLoadingPrediction ? "Analyzing your entry..." : "Your mental state is predicted from the journal text."}
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-3 rounded-3xl border border-border bg-primary/10 px-5 py-3 text-sm font-medium text-foreground">
              <span className="text-2xl">{STATES[predictedState].emoji}</span>
              <span>{STATES[predictedState].label}</span>
              {isLoadingPrediction && <span className="text-xs text-muted-foreground">...</span>}
            </span>
          </div>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-[1.75rem] border border-border bg-white/90 px-5 py-4 text-3xl font-serif font-bold text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write about your day…"
          rows={12}
          className="w-full rounded-[1.75rem] border border-border bg-white/90 px-5 py-4 text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        <div>
          <p className="text-sm text-muted-foreground mb-3">Tags</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className={`rounded-full px-4 py-2 text-sm font-medium border transition ${
                  selectedTags.includes(t)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-white/80 text-foreground hover:bg-primary/10"
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag…"
              className="flex-1 rounded-2xl border border-border bg-secondary/80 px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTag.trim()) {
                  addTag(newTag);
                  setSelectedTags((s) => [...s, newTag.trim()]);
                  setNewTag("");
                }
              }}
            />
            <button
              onClick={() => {
                if (!newTag.trim()) return;
                addTag(newTag);
                setSelectedTags((s) => [...s, newTag.trim()]);
                setNewTag("");
              }}
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
