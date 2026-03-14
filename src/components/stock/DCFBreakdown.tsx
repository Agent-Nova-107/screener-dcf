"use client";

import type { DCFResult, WACCBreakdown } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/valuationEngine";

interface Props {
  dcf: DCFResult;
  wacc: WACCBreakdown;
}

export function DCFBreakdown({ dcf, wacc }: Props) {
  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
        Détail du Modèle DCF
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KV label="Ke (CAPM)" value={formatPercent(wacc.costOfEquity)} />
        <KV label="Kd" value={formatPercent(wacc.costOfDebt)} />
        <KV label="Poids Equity" value={formatPercent(wacc.equityWeight)} />
        <KV label="WACC" value={formatPercent(wacc.wacc)} accent />
      </div>

      <div style={{ borderTop: "1px solid var(--border)" }} className="pt-4">
        <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
          FCF Projetés et Actualisés
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left" style={{ color: "var(--text-muted)" }}>Année</th>
                <th className="px-2 py-1 text-right" style={{ color: "var(--text-muted)" }}>FCF Projeté</th>
                <th className="px-2 py-1 text-right" style={{ color: "var(--text-muted)" }}>FCF Actualisé</th>
              </tr>
            </thead>
            <tbody>
              {dcf.projectedFCFs.map((p) => (
                <tr key={p.year} style={{ borderTop: "1px solid var(--border)" }}>
                  <td className="px-2 py-1.5" style={{ color: "var(--text-secondary)" }}>{p.year}</td>
                  <td className="px-2 py-1.5 text-right" style={{ color: "var(--text-primary)" }}>
                    {formatCurrency(p.fcf)}
                  </td>
                  <td className="px-2 py-1.5 text-right" style={{ color: "var(--accent)" }}>
                    {formatCurrency(p.discountedFCF)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div
        className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <KV label="Valeur Terminale" value={formatCurrency(dcf.terminalValue)} />
        <KV label="TV Actualisée" value={formatCurrency(dcf.discountedTerminalValue)} />
        <KV label="Enterprise Value" value={formatCurrency(dcf.enterpriseValue)} accent />
        <KV label="Dette Nette" value={formatCurrency(dcf.netDebt)} />
        <KV label="Equity Value" value={formatCurrency(dcf.equityValue)} />
        <KV label="Valeur Intrinsèque / Action" value={`$${dcf.intrinsicValuePerShare.toFixed(2)}`} accent />
      </div>
    </div>
  );
}

function KV({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded p-2" style={{ background: "var(--bg-tertiary)" }}>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p
        className="text-sm font-mono font-semibold mt-0.5"
        style={{ color: accent ? "var(--accent)" : "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}
