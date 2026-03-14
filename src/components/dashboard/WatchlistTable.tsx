"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ArrowUpDown, Search } from "lucide-react";
import { useAppStore } from "@/store";
import { signalToColor, signalToLabel } from "@/types";
import { formatPercent } from "@/lib/valuationEngine";
import { useHydration } from "@/hooks/useHydration";

type SortKey = "ticker" | "safetyMargin";

export function WatchlistTable() {
  const router = useRouter();
  const hydrated = useHydration();
  const watchlist = useAppStore((s) => s.watchlist);
  const removeFromWatchlist = useAppStore((s) => s.removeFromWatchlist);
  const [sortKey, setSortKey] = useState<SortKey>("safetyMargin");
  const [sortDesc, setSortDesc] = useState(true);

  if (!hydrated) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Chargement…
        </p>
      </div>
    );
  }

  const sorted = [...watchlist].sort((a, b) => {
    if (sortKey === "safetyMargin") {
      const va = a.safetyMargin ?? 0;
      const vb = b.safetyMargin ?? 0;
      return sortDesc ? vb - va : va - vb;
    }
    return sortDesc
      ? b.ticker.localeCompare(a.ticker)
      : a.ticker.localeCompare(b.ticker);
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc(!sortDesc);
    else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  if (watchlist.length === 0) {
    return (
      <div className="card p-10 text-center">
        <Search className="h-10 w-10 mx-auto mb-4" style={{ color: "var(--text-muted)", opacity: 0.5 }} />
        <p className="text-lg font-medium mb-2" style={{ color: "var(--text-primary)" }}>
          Votre watchlist est vide
        </p>
        <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
          Utilisez{" "}
          <kbd
            className="font-mono px-1.5 py-0.5 rounded text-xs"
            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}
          >
            Ctrl+K
          </kbd>{" "}
          pour rechercher une action par ticker (AAPL, MSFT, TSLA…) et l&apos;ajouter à votre watchlist.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>
              <button onClick={() => toggleSort("ticker")} className="flex items-center gap-1 cursor-pointer">
                Ticker <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>
              Nom
            </th>
            <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>
              Prix Actuel
            </th>
            <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>
              Juste Valeur
            </th>
            <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>
              <button onClick={() => toggleSort("safetyMargin")} className="flex items-center gap-1 ml-auto cursor-pointer">
                Marge de Sécurité <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th className="text-center px-4 py-3 font-medium" style={{ color: "var(--text-secondary)" }}>
              Signal
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => {
            const color = entry.signal ? signalToColor(entry.signal) : "var(--text-muted)";
            const label = entry.signal ? signalToLabel(entry.signal) : "—";

            return (
              <tr
                key={entry.ticker}
                className="transition-colors cursor-pointer"
                style={{ borderBottom: "1px solid var(--border)" }}
                onClick={() => router.push(`/stock/${entry.ticker}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td className="px-4 py-3">
                  <span
                    className="font-mono font-semibold"
                    style={{ color: "var(--accent)" }}
                  >
                    {entry.ticker}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>
                  {entry.name}
                </td>
                <td className="px-4 py-3 text-right font-mono" style={{ color: "var(--text-primary)" }}>
                  {entry.currentPrice > 0 ? `$${entry.currentPrice.toFixed(2)}` : "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono" style={{ color: "var(--text-primary)" }}>
                  {entry.finalFairValue != null ? `$${entry.finalFairValue.toFixed(2)}` : "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold" style={{ color }}>
                  {entry.safetyMargin != null ? formatPercent(entry.safetyMargin) : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      background: `${color}20`,
                      color,
                    }}
                  >
                    {label}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromWatchlist(entry.ticker); }}
                    className="rounded p-1 transition-colors cursor-pointer"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    title="Retirer de la watchlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
