import { useSyncExternalStore } from "react";

export const STATES = [
  { id: 0, label: "Normal", emoji: "🙂", color: "#7BB7E0" },
  { id: 1, label: "Depression_Suicidal", emoji: "⚠️", color: "#E88B7D" },
  { id: 2, label: "Anxiety_Stress", emoji: "😰", color: "#F2C94C" },
  { id: 3, label: "Bipolar_Personality", emoji: "🌀", color: "#C39BD3" },
] as const;

const LEGACY_STATE_MAP: Record<number, number> = {
  0: 0,
  1: 1,
  2: 1,
  3: 2,
  4: 3,
  5: 2,
  6: 3,
};

export type Entry = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  createdAt: number;
  title: string;
  content: string;
  state: number;
  tags: string[];
  mood?: number;
};

export function getEntryState(entry: Entry) {
  const state = typeof entry.state === "number" ? entry.state : entry.mood ?? 0;
  return LEGACY_STATE_MAP[state] ?? 0;
}

// Placeholder for state prediction - will be replaced by server call
// The actual prediction happens in predictStateFromContentAsync
export function predictStateFromContent(content: string): number {
  // This function signature is kept for backward compatibility
  // Real predictions should use predictStateFromContentAsync
  return 0;
}

// Server-side ML model prediction (async, call from client components)
export async function predictStateFromContentAsync(content: string): Promise<number> {
  try {
    // Dynamic import to avoid SSR issues
    const { predictState } = await import("./api/predict-state.server");
    const result = await predictState({ data: { text: content } });
    return result.state;
  } catch (error) {
    console.warn("State prediction failed, using default:", error);
    return 0;
  }
}

const KEY = "journal.entries.v1";
const TAGS_KEY = "journal.tags.v1";
const DEFAULT_TAGS = ["Travel", "Study", "Work"];

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

let lastEntriesRaw: string | null = null;
let entriesCache: Entry[] = [];
let lastTagsRaw: string | null = null;
let tagsCache: string[] = DEFAULT_TAGS;

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(k: string, v: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
  lastEntriesRaw = null;
  lastTagsRaw = null;
  emit();
}

export function getEntries(): Entry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (raw === lastEntriesRaw) return entriesCache;
  lastEntriesRaw = raw;
  const parsed = raw ? (JSON.parse(raw) as Entry[]) : [];
  entriesCache = parsed.slice().sort((a, b) => b.createdAt - a.createdAt);
  return entriesCache;
}
export function getTags(): string[] {
  if (typeof window === "undefined") return DEFAULT_TAGS;
  const raw = localStorage.getItem(TAGS_KEY);
  if (raw === lastTagsRaw) return tagsCache;
  lastTagsRaw = raw;
  const parsed = raw ? (JSON.parse(raw) as string[]) : DEFAULT_TAGS;
  tagsCache = parsed.length ? parsed : DEFAULT_TAGS;
  return tagsCache;
}
export function addTag(tag: string) {
  const t = tag.trim();
  if (!t) return;
  const tags = getTags();
  if (!tags.includes(t)) write(TAGS_KEY, [...tags, t]);
}
export function removeTag(tag: string) {
  write(TAGS_KEY, getTags().filter((t) => t !== tag));
}

export function saveEntry(e: Omit<Entry, "id" | "createdAt"> & { id?: string }) {
  const all = read<Entry[]>(KEY, []);
  if (e.id) {
    const idx = all.findIndex((x) => x.id === e.id);
    if (idx >= 0) all[idx] = { ...all[idx], ...e } as Entry;
  } else {
    all.push({
      ...e,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    });
  }
  write(KEY, all);
}
export function deleteEntry(id: string) {
  write(KEY, read<Entry[]>(KEY, []).filter((e) => e.id !== id));
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  listeners.add(cb);
  const onStorage = () => cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const serverEntriesSnapshot: Entry[] = [];

export function useEntries() {
  return useSyncExternalStore(subscribe, getEntries, () => serverEntriesSnapshot);
}
export function useTags() {
  return useSyncExternalStore(subscribe, getTags, () => DEFAULT_TAGS);
}

// Stats helpers
export function computeStreak(entries: Entry[]): { current: number; longest: number } {
  if (!entries.length) return { current: 0, longest: 0 };
  const days = new Set(entries.map((e) => e.date));
  const sorted = Array.from(days).sort();
  let longest = 1, run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const cur = new Date(sorted[i]);
    const diff = (cur.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) { run++; longest = Math.max(longest, run); }
    else run = 1;
  }
  // current streak from today backwards
  let current = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (;;) {
    const iso = today.toISOString().slice(0, 10);
    if (days.has(iso)) { current++; today.setDate(today.getDate() - 1); }
    else break;
  }
  return { current, longest };
}
