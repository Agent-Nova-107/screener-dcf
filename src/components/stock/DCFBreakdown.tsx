"use client";

import type { DcfScenarios, DcfScenarioId } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/valuationEngine";

interface Props {
  dcf: DcfScenarios;
  currentPrice: number;
}

const scenarioLabel: Record<DcfScenarioId, string> = {
  bear: "Bear",
  base: "Base",
  bull: "Bull",
};

export function DCFBreakdown({ dcf, currentPrice }: Props) {
  if (!dcf.applicable) {
    return (
      <div className="card p-5 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Modèle DCF
        </h3>
        <p className="text-sm" style={{ color: "var(--amber)" }}>
          DCF désactivé: {dcf.reasonIfNotApplicable ?? "conditions non remplies"}.
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Fallback: utiliser EV/Sales ou P/S via la section Multiples.
        </p>
      </div>
    );
  }

  const base = dcf.scenarios.base;
  const discount = dcf.discountToFairValueBase ?? (base.fairValuePerShare > 0 ? (base.fairValuePerShare - currentPrice) / base.fairValuePerShare : 0);

  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
        Modèle DCF — Scénarios
      </h3>

      <div className="grid grid-cols-3 gap-3">
        {(["bear", "base", "bull"] as const).map((s) => {
          const sc = dcf.scenarios[s];
          return (
            <div key={s} className="rounded p-3" style={{ background: "var(--bg-tertiary)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{scenarioLabel[s]}</p>
              <p className="text-lg font-mono font-semibold mt-0.5" style={{ color: s === "base" ? "var(--accent)" : "var(--text-primary)" }}>
                ${sc.fairValuePerShare.toFixed(2)}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                WACC {formatPercent(sc.wacc)} · g {formatPercent(sc.params.terminalGrowthRate)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
        <span>Discount to Fair Value (base)</span>
        <span className="font-mono" style={{ color: discount > 0.2 ? "var(--emerald)" : discount < -0.3 ? "var(--red)" : "var(--text-secondary)" }}>
          {formatPercent(discount)}
        </span>
      </div>

      <div style={{ borderTop: "1px solid var(--border)" }} className="pt-4">
        <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
          FCF Projetés et Actualisés (scénario base)
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
              {base.projectedFCFs.map((p) => (
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
        <KV label="Valeur Terminale" value={formatCurrency(base.terminalValue)} />
        <KV label="Enterprise Value" value={formatCurrency(base.enterpriseValue)} accent />
        <KV label="Dette Nette" value={formatCurrency(base.netDebt)} />
        <KV label="Equity Value" value={formatCurrency(base.equityValue)} />
        <KV label="Valeur Intrinsèque / Action" value={`$${base.fairValuePerShare.toFixed(2)}`} accent />
        <KV label="WACC" value={formatPercent(base.wacc)} />
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
