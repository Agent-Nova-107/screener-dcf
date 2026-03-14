"use client";

import { AlertTriangle, CheckCircle, Info, ShieldAlert } from "lucide-react";
import type { FundamentalRatios, IncomeStatement } from "@/types";

interface AnalysisItem {
  label: string;
  value: string;
  commentary: string;
  severity: "success" | "info" | "warning" | "danger";
}

function analyze(
  ratios: FundamentalRatios,
  incomeStatements: IncomeStatement[]
): AnalysisItem[] {
  const items: AnalysisItem[] = [];
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

  if (ratios.leverageRatio !== Infinity) {
    if (ratios.leverageRatio < 0) {
      items.push({
        label: "Endettement Net",
        value: `${ratios.leverageRatio.toFixed(1)}x EBITDA`,
        commentary:
          "Trésorerie nette positive : l'entreprise dispose de plus de cash que de dette. Bilan forteresse.",
        severity: "success",
      });
    } else if (ratios.leverageRatio < 1) {
      items.push({
        label: "Endettement Net",
        value: `${ratios.leverageRatio.toFixed(1)}x EBITDA`,
        commentary:
          "Bilan sain. L'entreprise peut rembourser sa dette en moins d'un an d'EBITDA.",
        severity: "success",
      });
    } else if (ratios.leverageRatio < 3) {
      items.push({
        label: "Endettement Net",
        value: `${ratios.leverageRatio.toFixed(1)}x EBITDA`,
        commentary:
          "Levier modéré, dans les normes sectorielles. Surveiller l'évolution si les taux remontent.",
        severity: "info",
      });
    } else {
      items.push({
        label: "Endettement Net",
        value: `${ratios.leverageRatio.toFixed(1)}x EBITDA`,
        commentary:
          "L'endettement net représente plus de 3 années d'EBITDA, ce qui constitue un risque majeur pour la solvabilité à long terme.",
        severity: "danger",
      });
    }
  }

  if (ratios.roic > 0.15) {
    items.push({
      label: "ROIC",
      value: pct(ratios.roic),
      commentary:
        "Retour sur capitaux investis élevé (>15%). Signe d'un avantage concurrentiel durable (moat).",
      severity: "success",
    });
  } else if (ratios.roic > 0.08) {
    items.push({
      label: "ROIC",
      value: pct(ratios.roic),
      commentary:
        "ROIC correct, supérieur au coût du capital pour la plupart des entreprises.",
      severity: "info",
    });
  } else {
    items.push({
      label: "ROIC",
      value: pct(ratios.roic),
      commentary:
        "ROIC faible (<8%). L'entreprise ne crée potentiellement pas de valeur pour ses actionnaires.",
      severity: "warning",
    });
  }

  const last3 = incomeStatements.slice(-3);
  if (last3.length === 3) {
    const marginsExpanding =
      last3[1].netMargin > last3[0].netMargin &&
      last3[2].netMargin > last3[1].netMargin;
    if (marginsExpanding) {
      items.push({
        label: "Tendance des Marges",
        value: `${pct(last3[0].netMargin)} → ${pct(last3[2].netMargin)}`,
        commentary:
          "Marges nettes en expansion sur 3 ans consécutifs. Signal positif de Pricing Power et d'efficacité opérationnelle.",
        severity: "success",
      });
    } else if (last3[2].netMargin < last3[0].netMargin) {
      items.push({
        label: "Tendance des Marges",
        value: `${pct(last3[0].netMargin)} → ${pct(last3[2].netMargin)}`,
        commentary:
          "Marges nettes en contraction. Pression concurrentielle ou hausse des coûts à surveiller.",
        severity: "warning",
      });
    }
  }

  if (ratios.currentRatio !== Infinity) {
    if (ratios.currentRatio > 2) {
      items.push({
        label: "Ratio de Liquidité",
        value: `${ratios.currentRatio.toFixed(2)}x`,
        commentary:
          "Excellente liquidité à court terme. L'actif circulant couvre largement le passif courant.",
        severity: "success",
      });
    } else if (ratios.currentRatio < 1) {
      items.push({
        label: "Ratio de Liquidité",
        value: `${ratios.currentRatio.toFixed(2)}x`,
        commentary:
          "Ratio <1 : le passif courant excède l'actif circulant. Risque de tension de trésorerie.",
        severity: "danger",
      });
    }
  }

  if (ratios.revenueCAGR != null) {
    const g = ratios.revenueCAGR;
    items.push({
      label: "Croissance CA (CAGR)",
      value: pct(g),
      commentary:
        g > 0.15
          ? "Croissance soutenue (>15% annualisé). Profil de croissance élevée."
          : g > 0.05
            ? "Croissance modérée et régulière. Profil mature."
            : g > 0
              ? "Croissance faible. L'entreprise a atteint un plateau."
              : "Décroissance du chiffre d'affaires. Signal d'alerte majeur.",
      severity: g > 0.1 ? "success" : g > 0 ? "info" : "danger",
    });
  }

  return items;
}

const severityIcon = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  danger: ShieldAlert,
};

const severityColor = {
  success: "var(--emerald)",
  info: "var(--accent)",
  warning: "var(--amber)",
  danger: "var(--red)",
};

interface Props {
  ratios: FundamentalRatios;
  incomeStatements: IncomeStatement[];
}

export function MetricAnalyzerPanel({ ratios, incomeStatements }: Props) {
  const items = analyze(ratios, incomeStatements);

  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
        Analyse Fondamentale — Santé Financière
      </h3>
      <div className="space-y-3">
        {items.map((item, i) => {
          const Icon = severityIcon[item.severity];
          const clr = severityColor[item.severity];
          return (
            <div
              key={i}
              className="flex gap-3 rounded-lg p-3"
              style={{ background: "var(--bg-tertiary)" }}
            >
              <Icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: clr }} />
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {item.label}
                  </span>
                  <span className="font-mono text-sm font-semibold shrink-0" style={{ color: clr }}>
                    {item.value}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {item.commentary}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
