import { createFileRoute, Link } from "@tanstack/react-router";
import { useEntries, STATES, getEntryState } from "@/lib/journal-store";
import { BottomNav } from "@/components/BottomNav";
import { format, parseISO } from "date-fns";
import { useMemo } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Diary — Journal" },
      { name: "description", content: "Your personal journal entries." },
    ],
  }),
  component: DiaryPage,
});

const QUOTES = [
  ["The best preparation for tomorrow is doing your best today.", "H. Jackson Brown Jr."],
  ["What you do today can improve all your tomorrows.", "Ralph Marston"],
  ["Write it on your heart that every day is the best day in the year.", "Emerson"],
  ["The journey of a thousand miles begins with one step.", "Lao Tzu"],
];

function DiaryPage() {
  const entries = useEntries();
  const quote = useMemo(() => QUOTES[new Date().getDate() % QUOTES.length], []);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof entries>();
    for (const e of entries) {
      const y = e.date.slice(0, 4);
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries]);

  return (
    <div className="mx-auto max-w-2xl min-h-screen pb-8">
      <header className="relative h-72 overflow-hidden rounded-b-[2rem] shadow-lg-glow">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #7c6ff7 0%, #5b8dee 35%, #5eead4 70%, #fb923c 100%)",
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="font-serif text-2xl md:text-3xl text-white drop-shadow-lg leading-tight">
            "{quote[0]}"
          </p>
          <p className="mt-4 font-serif italic text-white/80 drop-shadow">— {quote[1]}</p>
        </div>
      </header>

      <main className="px-4 pt-8 pb-6 space-y-6">
        {entries.length === 0 ? (
          <div className="glass-card rounded-[2rem] p-8 text-center shadow-glow">
            <p className="font-serif text-2xl text-foreground mb-3">No entries yet</p>
            <p className="text-sm text-muted-foreground">Tap the + button to write your first entry.</p>
          </div>
        ) : (
          grouped.map(([year, items]) => (
            <section key={year} className="space-y-3">
              <div className="flex items-center justify-between gap-3 px-2">
                <h2 className="text-xs uppercase tracking-[0.1em] text-muted-foreground font-semibold">{year}</h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/15 text-xs font-semibold text-primary border border-primary/20">
                  {items.length} entries
                </span>
              </div>
              {items.map((e) => {
                const state = STATES[getEntryState(e)];
                const d = parseISO(e.date);
                return (
                  <Link
                    key={e.id}
                    to="/entry/$id"
                    params={{ id: e.id }}
                    className="group block glass-card border border-border/50 rounded-2xl px-6 py-5 shadow-glow transition hover:-translate-y-1 hover:shadow-lg-glow hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-baseline gap-3">
                        <span className="font-serif text-3xl font-bold text-primary">{format(d, "dd")}</span>
                        <span className="text-sm tracking-wide text-muted-foreground">
                          {format(d, "MMM EEE")}
                        </span>
                      </div>
                      <span className="text-3xl opacity-80 group-hover:opacity-100 transition" title={state.label}>
                        {state.emoji}
                      </span>
                    </div>
                    <h3 className="mt-3 font-serif text-lg font-semibold text-foreground leading-snug group-hover:text-primary transition">
                      {e.title || "Untitled"}
                    </h3>
                    {e.content && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {e.content}
                      </p>
                    )}
                    {e.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {e.tags.map((t) => (
                          <span
                            key={t}
                            className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                );
              })}
            </section>
          ))
        )}
      </main>
      <BottomNav />
    </div>
  );
}
