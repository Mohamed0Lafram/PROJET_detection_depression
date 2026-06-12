import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameDay, isSameMonth, parseISO, startOfMonth, startOfWeek, subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEntries, STATES, getEntryState } from "@/lib/journal-store";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendar — Journal" }] }),
  component: CalendarPage,
});

function CalendarPage() {
  const entries = useEntries();
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());

  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });
  const dayHas = new Map<string, (typeof entries)[number]>();
  for (const e of entries) dayHas.set(e.date, e);

  const selIso = format(selected, "yyyy-MM-dd");
  const todays = entries.filter((e) => e.date === selIso);

  return (
    <div className="mx-auto max-w-2xl min-h-screen pb-8">
      <header className="flex items-center justify-between px-6 py-5 rounded-b-[2rem] bg-white/90 border-b border-border shadow-glow backdrop-blur">
        <div className="flex items-center gap-3">
          <button onClick={() => setMonth(subMonths(month, 1))} className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-serif text-2xl text-foreground">{format(month, "MMMM yyyy")}</h1>
            <p className="text-sm text-muted-foreground">Navigate your journal history with gentle color cues.</p>
          </div>
          <button onClick={() => setMonth(addMonths(month, 1))} className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <button
          onClick={() => { setMonth(new Date()); setSelected(new Date()); }}
          className="rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/95 transition"
        >
          Today
        </button>
      </header>

      <div className="px-4 pt-6">
        <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-3">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-2">
          {days.map((d) => {
            const iso = format(d, "yyyy-MM-dd");
            const inMonth = isSameMonth(d, month);
            const isSel = isSameDay(d, selected);
            const e = dayHas.get(iso);
            return (
              <button
                key={iso}
                onClick={() => setSelected(d)}
                className={`relative aspect-square flex items-center justify-center text-base font-medium transition ${
                  inMonth ? "text-foreground" : "text-muted-foreground/40"
                } hover:text-foreground`}
              >
                <span className={`flex items-center justify-center h-11 w-11 rounded-full transition ${
                  isSel ? "bg-gradient-to-br from-primary to-[#ff6e9e] text-primary-foreground shadow-lg" : "hover:bg-secondary"
                }`}>
                  {format(d, "d")}
                </span>
                {e && <span className="absolute bottom-2 h-2 w-2 rounded-full" style={{ background: STATES[getEntryState(e)].color }} />}
              </button>
            );
          })}
        </div>
      </div>

      <section className="mt-6 px-6 py-5 rounded-[2rem] bg-white/90 border border-border shadow-glow">
        <h2 className="font-serif text-xl text-foreground">{format(selected, "EEEE, dd MMMM, yyyy")}</h2>
      </section>

      <div className="px-4 py-6 space-y-4">
        {todays.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No diaries on this day</p>
        ) : (
          todays.map((e) => {
            const state = STATES[getEntryState(e)];
            return (
              <Link key={e.id} to="/entry/$id" params={{ id: e.id }} className="block bg-white/85 border border-border rounded-[1.75rem] px-5 py-5 shadow-glow transition hover:-translate-y-0.5 hover:shadow-xl">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-lg font-semibold text-foreground">{e.title || "Untitled"}</h3>
                  <span className="text-2xl" title={state.label}>{state.emoji}</span>
                </div>
                {e.content && <p className="mt-3 text-sm text-foreground/75 line-clamp-2">{e.content}</p>}
              </Link>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}

// Re-export to silence unused
void parseISO;
