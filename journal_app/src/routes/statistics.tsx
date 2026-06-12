import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { format, parseISO, subDays } from "date-fns";
import { ChevronRight } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell,
} from "recharts";
import { useEntries, useTags, STATES, getEntryState, computeStreak } from "@/lib/journal-store";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/statistics")({
  head: () => ({ meta: [{ title: "Statistics — Journal" }] }),
  component: StatsPage,
});

function StatsPage() {
  const entries = useEntries();
  const tags = useTags();

  const streak = useMemo(() => computeStreak(entries), [entries]);
  const totalDays = new Set(entries.map((e) => e.date)).size;

  const last7 = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(today, 6 - i);
      const iso = format(d, "yyyy-MM-dd");
      return { date: d, iso, has: entries.some((e) => e.date === iso) };
    });
  }, [entries]);

  const stateChart = useMemo(() => {
    return [...entries]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({ date: format(parseISO(e.date), "dd.MMM"), state: getEntryState(e) }));
  }, [entries]);

  const stateCounts = useMemo(() =>
    STATES.map((s) => ({
      name: s.label,
      color: s.color,
      count: entries.filter((e) => getEntryState(e) === s.id).length,
    })), [entries]);

  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tags) map.set(t, 0);
    for (const e of entries) for (const t of e.tags) map.set(t, (map.get(t) ?? 0) + 1);
    return Array.from(map.entries());
  }, [entries, tags]);

  return (
    <div className="mx-auto max-w-2xl min-h-screen px-4 py-8 space-y-5 pb-24">
      <div className="glass-card rounded-2xl border border-border/30 p-6 shadow-glow">
        <h1 className="font-serif text-3xl font-bold text-foreground">Statistics</h1>
        <p className="mt-2 text-sm text-muted-foreground">Visualize your emotional patterns and mental health trends.</p>
      </div>

      <Card>
        <h2 className="font-serif text-xl font-bold mb-4 text-foreground">Current Streak</h2>
        <div className="flex items-center gap-3">
          {last7.map((d) => (
            <div key={d.iso} className="flex-1 flex flex-col items-center gap-2">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg ${
                d.has ? "border-4 border-primary bg-primary text-primary-foreground" : "border border-muted-foreground/40 text-muted-foreground"
              }`}>
                {d.has ? "✓" : "+"}
              </div>
              <span className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{format(d.date, "EEE")}</span>
            </div>
          ))}
          <div className="ml-2 flex min-w-[3.5rem] items-center justify-center rounded-full border border-border bg-secondary/70 px-4 py-2 font-serif text-lg font-semibold text-secondary-foreground">
            {streak.current}
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <StatCard label="Longest streak" value={`${streak.longest} days`} />
          <StatCard label="Total days" value={`${totalDays}`} />
          <StatCard label="Total entries" value={`${entries.length}`} />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-foreground">Tags</h2>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{tagCounts.length} categories</span>
        </div>
        <ul className="divide-y divide-border">
          {tagCounts.map(([t, n]) => (
            <li key={t}>
              <Link to="/" className="flex items-center justify-between py-4 text-base text-foreground transition hover:text-primary">
                <span>#{t}</span>
                <span className="flex items-center gap-1 text-muted-foreground">({n} {n === 1 ? "entry" : "entries"}) <ChevronRight className="h-4 w-4" /></span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="font-serif text-xl font-bold mb-4 text-foreground">State Timeline</h2>
        <div className="h-56 rounded-xl bg-card border border-border/30 p-3">
          {stateChart.length > 0 ? (
            <ResponsiveContainer>
              <LineChart data={stateChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#2e3148" />
                <XAxis dataKey="date" fontSize={11} tick={{ fill: '#7b7f9e' }} />
                <YAxis
                  domain={[0, STATES.length - 1]}
                  ticks={STATES.map((_, index) => index)}
                  tickFormatter={(value) => STATES[value]?.label ?? value}
                  fontSize={11}
                  tick={{ fill: '#7b7f9e' }}
                />
                <Tooltip contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2e3148', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="state" stroke="#7c6ff7" strokeWidth={3} dot={{ r: 4, fill: '#5eead4' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No state data yet</div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="font-serif text-xl font-bold mb-4 text-foreground">State Count</h2>
        <div className="h-56 rounded-xl bg-card border border-border/30 p-3">
          <ResponsiveContainer>
            <BarChart data={stateCounts}>
              <CartesianGrid vertical={false} stroke="#2e3148" />
              <XAxis dataKey="name" fontSize={10} interval={0} tick={{ fill: '#7b7f9e' }} />
              <YAxis allowDecimals={false} fontSize={11} tick={{ fill: '#7b7f9e' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2e3148', borderRadius: '8px' }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {stateCounts.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <BottomNav />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="glass-card border border-border/30 rounded-2xl p-6 shadow-glow">{children}</section>;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-center">
      <p className="text-xs uppercase tracking-[0.08em] font-semibold text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}
