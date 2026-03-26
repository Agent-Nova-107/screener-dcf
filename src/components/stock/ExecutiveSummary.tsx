"use client";

import type { CompanyAsset, StockEvaluationV2 } from "@/types";
import { formatPercent, formatCurrency } from "@/lib/valuationEngine";

interface Props {
  asset: CompanyAsset;
  evaluation: StockEvaluationV2;
}

function bandFromDiscount(discountToFairValue: number) {
  // Discount = (FV - P) / FV
  if (discountToFairValue > 0.20) return { label: "Potentiellement sous-coté", color: "var(--emerald)" };
  if (discountToFairValue >= 0) return { label: "Légèrement sous-coté", color: "#4ade80" };
  if (discountToFairValue >= -0.30) return { label: "Surcoté", color: "var(--amber)" };
  return { label: "Très surcoté", color: "var(--red)" };
}

export function ExecutiveSummary({ asset, evaluation }: Props) {
  const { profile } = asset;
  const fairValue = evaluation.triangulation.medianFairValue ?? evaluation.dcf.scenarios.base.fairValuePerShare;
  const discountToFairValue =
    fairValue > 0 ? (fairValue - profile.currentPrice) / fairValue : 0;
  const band = bandFromDiscount(discountToFairValue);

  const gaugePercent = Math.max(Math.min(discountToFairValue * 100, 60), -40);
  const gaugeWidth = ((gaugePercent + 40) / 100) * 100;

  return (
    <div className="card p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {profile.name}
            </h1>
            <span
              className="font-mono text-sm px-2 py-0.5 rounded"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
            >
              {profile.ticker}
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {profile.sector} — {profile.industry}
          </p>
          <p className="text-sm mt-2 max-w-2xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {profile.description}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Prix Actuel
            </p>
            <p className="text-3xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>
              ${profile.currentPrice.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Juste Valeur (médiane)
            </p>
            <p className="text-2xl font-bold font-mono" style={{ color: band.color }}>
              ${fairValue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Discount / Premium vs Fair Value
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg" style={{ color: band.color }}>
              {formatPercent(discountToFairValue)}
            </span>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ background: `${band.color}20`, color: band.color }}
            >
              {band.label}
            </span>
          </div>
        </div>

        <div
          className="relative h-3 rounded-full overflow-hidden"
          style={{ background: "var(--bg-tertiary)" }}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(gaugeWidth, 2)}%`,
              background: `linear-gradient(90deg, var(--red), var(--amber), var(--emerald))`,
            }}
          />
          <div
            className="absolute top-0 h-full w-0.5"
            style={{ left: "40%", background: "var(--text-muted)" }}
            title="Prix = Juste Valeur (Marge = 0%)"
          />
        </div>
        <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
          <span>−40% (surévalué)</span>
          <span>0%</span>
          <span>+60% (sous-évalué)</span>
        </div>
      </div>

      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <MiniStat label="Market Cap" value={formatCurrency(asset.currentMetrics.marketCap)} />
        <MiniStat label="Beta" value={asset.currentMetrics.beta.toFixed(2)} />
        <MiniStat label="WACC (base)" value={formatPercent(evaluation.dcf.scenarios.base.wacc)} />
        <MiniStat label="Div. Yield" value={formatPercent(asset.currentMetrics.dividendYield)} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-sm font-mono font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}
