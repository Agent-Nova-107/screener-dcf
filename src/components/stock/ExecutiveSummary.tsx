"use client";

import type { CompanyAsset, FullValuationResult } from "@/types";
import { signalToColor, signalToLabel } from "@/types";
import { formatPercent, formatCurrency } from "@/lib/valuationEngine";

interface Props {
  asset: CompanyAsset;
  valuation: FullValuationResult;
}

export function ExecutiveSummary({ asset, valuation }: Props) {
  const { profile } = asset;
  const { finalFairValue, safetyMargin, signal } = valuation;
  const color = signalToColor(signal);
  const label = signalToLabel(signal);

  const gaugePercent = Math.max(Math.min(safetyMargin * 100, 60), -40);
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
              Juste Valeur Finale
            </p>
            <p className="text-2xl font-bold font-mono" style={{ color }}>
              ${finalFairValue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            Marge de Sécurité
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg" style={{ color }}>
              {formatPercent(safetyMargin)}
            </span>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ background: `${color}20`, color }}
            >
              {label}
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
        <MiniStat label="WACC" value={formatPercent(valuation.waccBreakdown.wacc)} />
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
