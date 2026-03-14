"use client";

import type { RelativeValuation } from "@/types";

interface Props {
  valuation: RelativeValuation;
  currentPrice: number;
}

export function RelativeValuationCard({ valuation, currentPrice }: Props) {
  const items = [
    { label: "Prix implicite (PER sectoriel)", value: valuation.impliedPricePER },
    { label: "Prix implicite (EV/EBITDA sectoriel)", value: valuation.impliedPriceEVtoEBITDA },
    { label: "Prix implicite (P/FCF sectoriel)", value: valuation.impliedPricePFCF },
    { label: "Moyenne pondérée relative", value: valuation.averageRelativeValue },
  ];

  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
        Valorisation Relative (Multiples Sectoriels)
      </h3>
      <div className="space-y-2">
        {items.map((item, i) => {
          const diff = ((item.value - currentPrice) / currentPrice) * 100;
          const clr = diff > 5 ? "var(--emerald)" : diff < -5 ? "var(--red)" : "var(--text-secondary)";
          return (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded"
              style={{
                background: i === items.length - 1 ? "var(--bg-tertiary)" : "transparent",
                borderBottom: i < items.length - 1 ? "1px solid var(--border)" : undefined,
              }}
            >
              <span
                className="text-sm"
                style={{
                  color: i === items.length - 1 ? "var(--text-primary)" : "var(--text-secondary)",
                  fontWeight: i === items.length - 1 ? 600 : 400,
                }}
              >
                {item.label}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  ${item.value.toFixed(2)}
                </span>
                <span className="font-mono text-xs" style={{ color: clr }}>
                  {diff >= 0 ? "+" : ""}{diff.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
