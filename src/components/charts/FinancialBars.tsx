"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { CompanyAsset } from "@/types";

interface Props {
  asset: CompanyAsset;
}

export function FinancialBars({ asset }: Props) {
  const data = asset.incomeStatements.map((is, idx) => {
    const cf = asset.cashFlowStatements[idx];
    return {
      year: is.year.toString(),
      revenue: is.revenue / 1e9,
      ebitda: is.ebitda / 1e9,
      netIncome: is.netIncome / 1e9,
      fcf: cf ? cf.freeCashFlow / 1e9 : 0,
    };
  });

  return (
    <div className="card p-5 space-y-4">
      <h3
        className="text-sm font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-secondary)" }}
      >
        Historique Financier (Mds $)
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1c2030" />
            <XAxis dataKey="year" tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <YAxis
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickFormatter={(v: number) => `${v.toFixed(1)}`}
            />
            <Tooltip
              contentStyle={{
                background: "#131722",
                border: "1px solid #2a2e3e",
                borderRadius: "0.5rem",
                color: "#e8eaed",
                fontSize: "12px",
              }}
              formatter={(value) =>
                value != null ? `${Number(value).toFixed(2)} Mds $` : "—"
              }
            />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }}
            />
            <Bar dataKey="revenue" name="Chiffre d'affaires" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="ebitda" name="EBITDA" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="netIncome" name="Résultat Net" fill="#10b981" radius={[2, 2, 0, 0]} />
            <Bar dataKey="fcf" name="Free Cash Flow" fill="#f59e0b" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
