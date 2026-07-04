import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MapPin, Search, ChevronDown, Check } from "lucide-react";
import { CITIES, type City } from "@/lib/cities";

export function CitySelector({ city }: { city: City }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.state.toLowerCase().includes(q.toLowerCase()),
  );

  function pick(next: City) {
    setOpen(false);
    setQ("");
    navigate({ to: "/", search: { city: next.slug } });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 pl-3 pr-2 py-1 border-l border-border hover:bg-muted rounded-r-md transition"
      >
        <MapPin className="w-4 h-4 text-primary" />
        <div className="leading-tight text-left">
          <div className="text-sm font-semibold flex items-center gap-1">
            {city.name}
            <ChevronDown className={`w-3.5 h-3.5 transition ${open ? "rotate-180" : ""}`} />
          </div>
          <div className="text-xs text-muted-foreground">{city.state}</div>
        </div>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-[320px] bg-card border border-border rounded-2xl shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 bg-muted rounded-full px-3 h-9">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search your city"
                className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="max-h-[320px] overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                No cities found
              </div>
            )}
            {filtered.map((c) => {
              const active = c.slug === city.slug;
              return (
                <button
                  key={c.slug}
                  onClick={() => pick(c)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-muted transition ${
                    active ? "bg-accent/50" : ""
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.state}</div>
                  </div>
                  {active && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
