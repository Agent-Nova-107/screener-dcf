"use client";

import { use, useState, useMemo, useCallback } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Check } from "lucide-react";
import { COMPANIES } from "@/lib/mockData";
import { computeFullValuation, computeFundamentalRatios } from "@/lib/valuationEngine";
import { useAppStore } from "@/store";
import type { DCFParameters, MoatScore } from "@/types";
import { ExecutiveSummary } from "@/components/stock/ExecutiveSummary";
import { DCFSettings } from "@/components/stock/DCFSettings";
import { DCFBreakdown } from "@/components/stock/DCFBreakdown";
import { RelativeValuationCard } from "@/components/stock/RelativeValuationCard";
import { SensitivityMatrix } from "@/components/stock/SensitivityMatrix";
import { MetricAnalyzerPanel } from "@/components/stock/MetricAnalyzer";
import { PriceChart } from "@/components/charts/PriceChart";
import { FinancialBars } from "@/components/charts/FinancialBars";
import { useHydration } from "@/hooks/useHydration";

export default function StockPage({
  params: paramsPromise,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = use(paramsPromise);
  const upperTicker = ticker.toUpperCase();
  const asset = COMPANIES[upperTicker];
  const hydrated = useHydration();

  if (!asset) {
    notFound();
  }

  const storeDCFParams = useAppStore((s) => s.dcfParams);
  const storeMoat = useAppStore((s) => s.getMoatScore(upperTicker));
  const setStoreMoat = useAppStore((s) => s.setMoatScore);
  const addToWatchlist = useAppStore((s) => s.addToWatchlist);
  const inWatchlist = hydrated ? useAppStore.getState().isInWatchlist(upperTicker) : false;

  const [dcfParams, setDcfParams] = useState<DCFParameters>(storeDCFParams);
  const [moat, setMoat] = useState<MoatScore>(storeMoat);

  const handleMoatChange = useCallback(
    (m: MoatScore) => {
      setMoat(m);
      setStoreMoat(upperTicker, m);
    },
    [upperTicker, setStoreMoat]
  );

  const valuation = useMemo(
    () => computeFullValuation(asset, dcfParams, moat),
    [asset, dcfParams, moat]
  );

  const ratios = useMemo(() => computeFundamentalRatios(asset), [asset]);
  const latestRatios = ratios[ratios.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <button
          onClick={() => addToWatchlist(upperTicker)}
          disabled={inWatchlist}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
          style={{
            background: inWatchlist ? "var(--bg-tertiary)" : "var(--accent)",
            color: inWatchlist ? "var(--text-muted)" : "#fff",
          }}
        >
          {inWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {inWatchlist ? "Dans la Watchlist" : "Ajouter à la Watchlist"}
        </button>
      </div>

      <ExecutiveSummary asset={asset} valuation={valuation} />

      <PriceChart
        priceHistory={asset.priceHistory}
        fairValueHistory={asset.fairValueHistory}
      />

      <DCFSettings
        params={dcfParams}
        moat={moat}
        onParamsChange={setDcfParams}
        onMoatChange={handleMoatChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DCFBreakdown dcf={valuation.dcf} wacc={valuation.waccBreakdown} />
        <div className="space-y-6">
          <RelativeValuationCard
            valuation={valuation.relativeValuation}
            currentPrice={asset.profile.currentPrice}
          />
          <MetricAnalyzerPanel
            ratios={latestRatios}
            incomeStatements={asset.incomeStatements}
          />
        </div>
      </div>

      <FinancialBars asset={asset} />

      <SensitivityMatrix
        matrix={valuation.sensitivityMatrix}
        currentPrice={asset.profile.currentPrice}
      />
    </div>
  );
}
