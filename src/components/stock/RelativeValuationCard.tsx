"use client";

import type { RelativeMultiplesSummary } from "@/types";
import { formatMultiple } from "@/lib/valuationEngine";

interface Props {
  multiples: RelativeMultiplesSummary;
  currentPrice: number;
}

export function RelativeValuationCard({ multiples, currentPrice }: Props) {
  const items = multiples.multiples;

  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
        Multiples de Marché (Relative Valuation)
      </h3>
      <div className="space-y-2">
        {items.map((item, i) => {
          return (
            <div
              key={item.key}
              className="flex items-center justify-between py-2 px-3 rounded"
              style={{
                background: "transparent",
                borderBottom: i < items.length - 1 ? "1px solid var(--border)" : undefined,
              }}
            >
              <span
                className="text-sm"
                style={{
                  color: "var(--text-secondary)",
                  fontWeight: 400,
                }}
              >
                {item.label}
              </span>
              <div className="flex items-center gap-3">
                {item.value != null ? (
                  <span className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {formatMultiple(item.value)}
                  </span>
                ) : (
                  <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                    —
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Peers/percentiles sectoriels et médianes non configurés (MVP). Certains multiples peuvent être non pertinents si EPS/EBITDA/FCF ≤ 0.
      </p>
    </div>
  );
}
