"use client";

import type { SensitivityCell } from "@/types";
import { formatPercent } from "@/lib/valuationEngine";

interface Props {
  matrix: SensitivityCell[][];
  currentPrice: number;
}

export function SensitivityMatrix({ matrix, currentPrice }: Props) {
  if (matrix.length === 0) return null;

  const growthSteps = matrix[0].map((c) => c.terminalGrowth);

  function cellColor(fairValue: number): string {
    const margin = (fairValue - currentPrice) / fairValue;
    if (margin > 0.2) return "var(--emerald)";
    if (margin >= 0) return "var(--emerald-light)";
    if (margin >= -0.1) return "var(--text-muted)";
    return "var(--red)";
  }

  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
        Matrice de Sensibilité — Fair Value ($)
      </h3>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        WACC (lignes) × Croissance Perpétuelle g (colonnes). Prix actuel : ${currentPrice.toFixed(2)}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr>
              <th
                className="px-3 py-2 text-left"
                style={{ color: "var(--text-muted)" }}
              >
                WACC \ g
              </th>
              {growthSteps.map((g, i) => (
                <th
                  key={i}
                  className="px-3 py-2 text-center"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {formatPercent(g)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, ri) => (
              <tr key={ri} style={{ borderTop: "1px solid var(--border)" }}>
                <td
                  className="px-3 py-2 font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {formatPercent(row[0].wacc)}
                </td>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-3 py-2 text-center font-semibold"
                    style={{ color: cellColor(cell.fairValue) }}
                  >
                    {cell.fairValue.toFixed(1)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
