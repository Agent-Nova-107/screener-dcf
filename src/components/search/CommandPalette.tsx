"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, ArrowRight, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAppStore } from "@/store";

interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
  source: "fmp" | "yahoo";
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const addToWatchlist = useAppStore((s) => s.addToWatchlist);
  const isInWatchlist = useAppStore((s) => s.isInWatchlist);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setResults(data.results ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setQuery("");
    setResults([]);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        handleOpen();
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onCustomOpen() {
      handleOpen();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("open-command-palette", onCustomOpen);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("open-command-palette", onCustomOpen);
    };
  }, [handleOpen]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)" }} />
      <div
        className="relative w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-light)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin" style={{ color: "var(--accent)" }} />
          ) : (
            <Search className="h-5 w-5 shrink-0" style={{ color: "var(--text-muted)" }} />
          )}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un ticker (ex: AAPL, MSFT, NVDA…)"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          <kbd
            className="rounded px-1.5 py-0.5 text-xs font-mono"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            Esc
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {!debouncedQuery.trim() && !loading && (
            <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Tape un ticker ou un nom d&apos;entreprise pour lancer la recherche.
            </p>
          )}

          {debouncedQuery.trim() && results.length === 0 && !loading && (
            <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Aucun résultat pour &ldquo;{debouncedQuery}&rdquo;
            </p>
          )}

          {results.map((c) => {
            const inWL = isInWatchlist(c.ticker);
            return (
              <div
                key={`${c.ticker}-${c.source}`}
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors"
                style={{ color: "var(--text-primary)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div
                  className="flex-1 min-w-0"
                  onClick={() => {
                    router.push(`/stock/${c.ticker}`);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-sm">{c.ticker}</span>
                    <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                      {c.name}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {c.exchange}
                  </span>
                </div>

                <div className="flex items-center gap-1 ml-2">
                  {!inWL && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToWatchlist(c.ticker);
                      }}
                      className="rounded p-1.5 transition-colors cursor-pointer"
                      style={{ color: "var(--text-muted)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--emerald)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                      title="Ajouter à la watchlist"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      router.push(`/stock/${c.ticker}`);
                      setOpen(false);
                    }}
                    className="rounded p-1.5 transition-colors cursor-pointer"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    title="Voir la fiche"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
