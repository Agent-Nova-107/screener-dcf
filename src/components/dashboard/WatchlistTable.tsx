"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, ArrowUpDown, Plus } from "lucide-react";
import { useAppStore } from "@/store";
import { signalToColor, signalToLabel } from "@/types";
import { formatPercent } from "@/lib/valuationEngine";
import { COMPANY_LIST } from "@/lib/mockData";
import { useHydration } from "@/hooks/useHydration";

type SortKey = "ticker" | "safetyMargin";

export function WatchlistTable() {
  const hydrated = useHydration();
  const watchlist = useAppStore((s) => s.watchlist);
  const removeFromWatchlist = useAppStore((s) => s.removeFromWatchlist);
  const addToWatchlist = useAppStore((s) => s.addToWatchlist);
  const isInWatchlist = useAppStore((s) => s.isInWatchlist);
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
      <div className="card p-8 text-center">
        <p className="text-lg font-medium mb-2" style={{ color: "var(--text-primary)" }}>
          Watchlist vide
        </p>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Ajoute des actions via <kbd className="font-mono px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}>Ctrl+K</kbd> ou les boutons ci-dessous.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {COMPANY_LIST.map((c) => (
            <button
              key={c.ticker}
              onClick={() => addToWatchlist(c.ticker)}
              disabled={isInWatchlist(c.ticker)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <Plus className="h-4 w-4" />
              {c.ticker} — {c.name}
            </button>
          ))}
        </div>
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
                className="transition-colors"
                style={{ borderBottom: "1px solid var(--border)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/stock/${entry.ticker}`}
                    className="font-mono font-semibold hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    {entry.ticker}
                  </Link>
                </td>
                <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>
                  {entry.name}
                </td>
                <td className="px-4 py-3 text-right font-mono" style={{ color: "var(--text-primary)" }}>
                  ${entry.currentPrice.toFixed(2)}
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
                    onClick={() => removeFromWatchlist(entry.ticker)}
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
