"use client";

import {
  Minus,
  ShieldAlert,
  BadgeCheck,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { FundamentalMomentumResult, CompositeMomentumScore } from "@/types";
import { formatPercent } from "@/lib/valuationEngine";

interface Props {
  momentum: FundamentalMomentumResult;
  composite: CompositeMomentumScore;
}

function badgeRow(label: string, ok: boolean | undefined) {
  if (!ok) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: "rgba(16,185,129,0.12)", color: "var(--emerald)" }}
    >
      <BadgeCheck className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function warningRow(label: string, on: boolean | undefined) {
  if (!on) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: "rgba(239,68,68,0.12)", color: "var(--red)" }}
    >
      <ShieldAlert className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export function MomentumPanel({ momentum, composite }: Props) {
  return (
    <div className="card p-5 space-y-5">
      <h3
        className="text-sm font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-secondary)" }}
      >
        Momentum Fondamental (MVP)
      </h3>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Score Composite
          </p>
          <p className="text-lg font-mono font-semibold" style={{ color: "var(--text-primary)" }}>
            {composite.score0to100 != null ? `${composite.score0to100}/100` : "—"}
          </p>
          {composite.partial && (
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Score partiel (sans prix/revisions/percentiles)
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {badgeRow("Operational Leverage Confirmed", momentum.badges.operationalLeverageConfirmed)}
          {badgeRow("High Earnings Quality", momentum.badges.highEarningsQuality)}
          {warningRow("Margin Erosion Warning", momentum.badges.marginErosionWarning)}
          {warningRow("Earnings Quality Warning", momentum.badges.earningsQualityWarning)}
          {warningRow("Balance Sheet Risk", momentum.badges.balanceSheetRisk)}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KV label="Revenue YoY" value={momentum.revenueGrowthYoY != null ? formatPercent(momentum.revenueGrowthYoY) : "—"} />
        <KV label="Gross Margin YoY (bps)" value={momentum.grossMarginBpsYoY != null ? `${momentum.grossMarginBpsYoY.toFixed(0)} bps` : "—"} />
        <KV label="EBITDA Margin YoY (bps)" value={momentum.ebitdaMarginBpsYoY != null ? `${momentum.ebitdaMarginBpsYoY.toFixed(0)} bps` : "—"} />
        <KV label="FCF Yield" value={momentum.fcfYield != null ? formatPercent(momentum.fcfYield) : "—"} />
        <KV label="EPS YoY" value={momentum.epsGrowthYoY != null ? formatPercent(momentum.epsGrowthYoY) : "—"} />
        <KV label="Accrual Ratio" value={momentum.accrualRatio != null ? formatPercent(momentum.accrualRatio, 1) : "—"} />
        <KV label="Cash Conversion" value={momentum.cashConversionRate != null ? formatPercent(momentum.cashConversionRate, 0) : "—"} />
        <KV label="NetDebt/EBITDA" value={momentum.netDebtToEbitda != null ? momentum.netDebtToEbitda.toFixed(1) + "x" : "—"} />
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded p-2" style={{ background: "var(--bg-tertiary)" }}>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-sm font-mono font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}
