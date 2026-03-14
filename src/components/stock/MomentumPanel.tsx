"use client";

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { MomentumAnalysis } from "@/lib/valuationEngine";

const strengthConfig = {
  strong_positive: { color: "var(--emerald)", icon: Zap, bg: "rgba(16,185,129,0.1)" },
  positive: { color: "#4ade80", icon: TrendingUp, bg: "rgba(74,222,128,0.08)" },
  neutral: { color: "var(--text-muted)", icon: Minus, bg: "var(--bg-tertiary)" },
  negative: { color: "var(--amber)", icon: TrendingDown, bg: "rgba(245,158,11,0.08)" },
  strong_negative: { color: "var(--red)", icon: ArrowDownRight, bg: "rgba(239,68,68,0.1)" },
};

function ScoreGauge({ score }: { score: number }) {
  const normalized = (score + 100) / 200;
  const width = Math.max(normalized * 100, 2);
  const color =
    score >= 40 ? "var(--emerald)"
    : score >= 10 ? "#4ade80"
    : score >= -10 ? "var(--text-muted)"
    : score >= -40 ? "var(--amber)"
    : "var(--red)";
  const label =
    score >= 40 ? "Momentum Fort"
    : score >= 10 ? "Momentum Positif"
    : score >= -10 ? "Neutre"
    : score >= -40 ? "Momentum Négatif"
    : "Momentum Très Négatif";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Score Momentum Global
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-lg" style={{ color }}>
            {score > 0 ? "+" : ""}{score}
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
        className="relative h-2.5 rounded-full overflow-hidden"
        style={{ background: "var(--bg-tertiary)" }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, var(--red), var(--amber), var(--emerald))`,
          }}
        />
        <div
          className="absolute top-0 h-full w-0.5"
          style={{ left: "50%", background: "var(--text-muted)", opacity: 0.5 }}
        />
      </div>
      <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
        <span>−100</span>
        <span>0</span>
        <span>+100</span>
      </div>
    </div>
  );
}

function YoYTable({ entries }: { entries: MomentumAnalysis["entries"] }) {
  const pct = (v: number) => {
    const s = (v * 100).toFixed(1);
    return v >= 0 ? `+${s}%` : `${s}%`;
  };
  const color = (v: number) =>
    v > 0.02 ? "var(--emerald)" : v < -0.02 ? "var(--red)" : "var(--text-muted)";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr style={{ color: "var(--text-muted)" }}>
            <th className="text-left py-2 pr-3 font-medium">Année</th>
            <th className="text-right py-2 px-2 font-medium">CA YoY</th>
            <th className="text-right py-2 px-2 font-medium">OpEx YoY</th>
            <th className="text-right py-2 px-2 font-medium">Marge Brute</th>
            <th className="text-right py-2 px-2 font-medium">Marge Nette</th>
            <th className="text-right py-2 px-2 font-medium">FCF YoY</th>
            <th className="text-right py-2 pl-2 font-medium">Momentum</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.year} style={{ borderTop: "1px solid var(--border)" }}>
              <td className="py-2 pr-3" style={{ color: "var(--text-primary)" }}>{e.year}</td>
              <td className="py-2 px-2 text-right" style={{ color: color(e.revenueGrowth) }}>
                {pct(e.revenueGrowth)}
              </td>
              <td className="py-2 px-2 text-right" style={{ color: color(-e.opexGrowth) }}>
                {pct(e.opexGrowth)}
              </td>
              <td className="py-2 px-2 text-right" style={{ color: "var(--text-secondary)" }}>
                {(e.grossMargin * 100).toFixed(1)}%
              </td>
              <td className="py-2 px-2 text-right" style={{ color: color(e.netMargin) }}>
                {(e.netMargin * 100).toFixed(1)}%
              </td>
              <td className="py-2 px-2 text-right" style={{ color: color(e.fcfGrowth) }}>
                {pct(e.fcfGrowth)}
              </td>
              <td className="py-2 pl-2 text-right">
                <span className="inline-flex items-center gap-0.5" style={{ color: color(e.earningsMomentum) }}>
                  {e.earningsMomentum > 0.02 ? <ArrowUpRight className="h-3 w-3" /> :
                   e.earningsMomentum < -0.02 ? <ArrowDownRight className="h-3 w-3" /> : null}
                  {pct(e.earningsMomentum)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface Props {
  momentum: MomentumAnalysis;
}

export function MomentumPanel({ momentum }: Props) {
  return (
    <div className="card p-5 space-y-5">
      <h3
        className="text-sm font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-secondary)" }}
      >
        Indicateurs de Momentum
      </h3>

      <ScoreGauge score={momentum.overallScore} />

      {momentum.signals.length > 0 && (
        <div className="space-y-2">
          {momentum.signals.map((sig, i) => {
            const cfg = strengthConfig[sig.strength];
            const Icon = cfg.icon;
            return (
              <div
                key={i}
                className="flex gap-3 rounded-lg p-3"
                style={{ background: cfg.bg }}
              >
                <Icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: cfg.color }} />
                <div className="space-y-0.5 min-w-0">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {sig.label}
                  </span>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {sig.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <YoYTable entries={momentum.entries} />
    </div>
  );
}
