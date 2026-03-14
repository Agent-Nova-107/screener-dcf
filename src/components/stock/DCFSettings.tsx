"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import type { DCFParameters, MoatScore } from "@/types";

interface Props {
  params: DCFParameters;
  moat: MoatScore;
  onParamsChange: (p: DCFParameters) => void;
  onMoatChange: (m: MoatScore) => void;
}

export function DCFSettings({ params, moat, onParamsChange, onMoatChange }: Props) {
  const [open, setOpen] = useState(false);

  const updateParam = <K extends keyof DCFParameters>(key: K, value: DCFParameters[K]) => {
    onParamsChange({ ...params, [key]: value });
  };

  const updateMoat = <K extends keyof MoatScore>(key: K, value: MoatScore[K]) => {
    onMoatChange({ ...moat, [key]: value });
  };

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 cursor-pointer"
        style={{ color: "var(--text-primary)" }}
      >
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4" style={{ color: "var(--accent)" }} />
          <span className="text-sm font-semibold">Paramètres du Modèle DCF</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SliderField
              label="Taux sans risque (Rf)"
              value={params.riskFreeRate}
              min={0.01}
              max={0.10}
              step={0.005}
              format={(v) => `${(v * 100).toFixed(1)}%`}
              onChange={(v) => updateParam("riskFreeRate", v)}
            />
            <SliderField
              label="Prime de risque marché"
              value={params.equityRiskPremium}
              min={0.03}
              max={0.12}
              step={0.005}
              format={(v) => `${(v * 100).toFixed(1)}%`}
              onChange={(v) => updateParam("equityRiskPremium", v)}
            />
            <SliderField
              label="Croissance FCF projetée"
              value={params.fcfGrowthRate}
              min={-0.05}
              max={0.30}
              step={0.01}
              format={(v) => `${(v * 100).toFixed(0)}%`}
              onChange={(v) => updateParam("fcfGrowthRate", v)}
            />
            <SliderField
              label="Croissance perpétuelle (g)"
              value={params.terminalGrowthRate}
              min={0.0}
              max={0.04}
              step={0.005}
              format={(v) => `${(v * 100).toFixed(1)}%`}
              onChange={(v) => updateParam("terminalGrowthRate", v)}
            />
            <SliderField
              label="Horizon de projection (ans)"
              value={params.projectionYears}
              min={3}
              max={15}
              step={1}
              format={(v) => `${v}`}
              onChange={(v) => updateParam("projectionYears", v)}
            />
          </div>

          <div style={{ borderTop: "1px solid var(--border)" }} className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-secondary)" }}>
              Score Qualitatif (Moat)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MoatField
                label="Pricing Power"
                value={moat.pricingPower}
                onChange={(v) => updateMoat("pricingPower", v)}
              />
              <MoatField
                label="Barrières à l'entrée"
                value={moat.barriers}
                onChange={(v) => updateMoat("barriers", v)}
              />
              <MoatField
                label="Qualité du Management"
                value={moat.management}
                onChange={(v) => updateMoat("management", v)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs" style={{ color: "var(--text-muted)" }}>
          {label}
        </label>
        <span className="text-xs font-mono font-semibold" style={{ color: "var(--accent)" }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${((value - min) / (max - min)) * 100}%, var(--bg-tertiary) ${((value - min) / (max - min)) * 100}%, var(--bg-tertiary) 100%)`,
        }}
      />
    </div>
  );
}

function MoatField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className="flex-1 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer"
            style={{
              background: n <= value ? "var(--accent)" : "var(--bg-tertiary)",
              color: n <= value ? "#fff" : "var(--text-muted)",
              border: `1px solid ${n <= value ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
