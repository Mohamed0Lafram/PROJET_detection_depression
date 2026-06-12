import { Link, useRouter } from "@tanstack/react-router";
import { BookOpen, Calendar, BarChart3, Menu, Plus } from "lucide-react";

const items = [
  { to: "/", label: "Diary", icon: BookOpen },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/statistics", label: "Statistics", icon: BarChart3 },
  { to: "/more", label: "More", icon: Menu },
] as const;

export function BottomNav() {
  const router = useRouter();
  const path = router.state.location.pathname;
  const left = items.slice(0, 2);
  const right = items.slice(2);

  const Item = ({ to, label, Icon }: { to: string; label: string; Icon: typeof BookOpen }) => {
    const active = path === to;
    return (
      <Link
        to={to}
        className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 text-xs transition-all ${
          active
            ? "text-primary scale-110"
            : "text-muted-foreground hover:text-foreground hover:scale-105"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.8} />
        <span className="text-[10px]">{label}</span>
      </Link>
    );
  };

  return (
    <>
      <div className="h-24" />
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border shadow-lg-glow">
        <div className="mx-auto max-w-2xl relative flex items-end h-20 px-3">
          {left.map((i) => <Item key={i.to} to={i.to} label={i.label} Icon={i.icon} />)}
          <div className="flex-1" />
          {right.map((i) => <Item key={i.to} to={i.to} label={i.label} Icon={i.icon} />)}
          <Link
            to="/new"
            aria-label="New entry"
            className="absolute left-1/2 -translate-x-1/2 -top-8 h-16 w-16 rounded-full bg-gradient-to-br from-primary via-accent-2 to-accent-3 text-primary-foreground shadow-lg-glow flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
          >
            <Plus className="h-8 w-8" />
          </Link>
        </div>
      </nav>
    </>
  );
}
