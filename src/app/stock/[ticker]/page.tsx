"use client";

import { use, useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Check, Loader2, AlertTriangle } from "lucide-react";
import { computeStockEvaluationV2 } from "@/lib/valuationEngine";
import type { FairValuePoint } from "@/types";
import { useAppStore } from "@/store";
import type { CompanyAsset, DCFParameters, MoatScore } from "@/types";
import { ExecutiveSummary } from "@/components/stock/ExecutiveSummary";
import { DCFSettings } from "@/components/stock/DCFSettings";
import { DCFBreakdown } from "@/components/stock/DCFBreakdown";
import { RelativeValuationCard } from "@/components/stock/RelativeValuationCard";
import { SensitivityMatrix } from "@/components/stock/SensitivityMatrix";
import { PriceChart } from "@/components/charts/PriceChart";
import { FinancialBars } from "@/components/charts/FinancialBars";
import { MomentumPanel } from "@/components/stock/MomentumPanel";
import { EstimatesRevisionsPanel } from "@/components/stock/EstimatesRevisionsPanel";
import { useHydration } from "@/hooks/useHydration";

export default function StockPage({
  params: paramsPromise,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = use(paramsPromise);
  const upperTicker = ticker.toUpperCase();
  const hydrated = useHydration();

  const [asset, setAsset] = useState<CompanyAsset | null>(null);
  const [dataSource, setDataSource] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/stock/${upperTicker}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Ticker introuvable : ${upperTicker}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setAsset(json.data);
          setDataSource(json.source);
          useAppStore.getState().cacheAsset(upperTicker, json.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [upperTicker]);

  const storeDCFParams = useAppStore((s) => s.dcfParams);
  const storeMoat = useAppStore((s) => s.getMoatScore(upperTicker));
  const setStoreMoat = useAppStore((s) => s.setMoatScore);
  const addToWatchlist = useAppStore((s) => s.addToWatchlist);
  const watchlist = useAppStore((s) => s.watchlist);
  const inWatchlist =
    hydrated && watchlist.some((w) => w.ticker === upperTicker);

  const [dcfParams, setDcfParams] = useState<DCFParameters>(storeDCFParams);
  const [moat, setMoat] = useState<MoatScore>(storeMoat);

  const handleMoatChange = useCallback(
    (m: MoatScore) => {
      setMoat(m);
      setStoreMoat(upperTicker, m);
    },
    [upperTicker, setStoreMoat]
  );

  const hasFundamentals = asset
    ? asset.incomeStatements.length > 0 && asset.balanceSheets.length > 0 && asset.cashFlowStatements.length > 0
    : false;

  const evaluation = useMemo(() => {
    if (!asset || !hasFundamentals) return null;
    return computeStockEvaluationV2(asset, dcfParams, moat);
  }, [asset, dcfParams, moat, hasFundamentals]);

  const fairValueHistory = useMemo((): FairValuePoint[] => {
    if (!evaluation || !asset || asset.priceHistory.length === 0) return [];
    const fv = evaluation.triangulation.medianFairValue ?? evaluation.dcf.scenarios.base.fairValuePerShare;
    if (fv <= 0) return [];
    const prices = asset.priceHistory;
    const first = prices[0].time;
    const last = prices[prices.length - 1].time;
    return [
      { time: first, value: fv },
      { time: last, value: fv },
    ];
  }, [evaluation, asset]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent)" }} />
        <span className="ml-3 text-sm" style={{ color: "var(--text-muted)" }}>
          Chargement des données pour {upperTicker}…
        </span>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="card p-8 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 mx-auto" style={{ color: "var(--amber)" }} />
        <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
          {error || `Aucune donnée pour ${upperTicker}`}
        </p>
        <Link href="/" className="text-sm underline" style={{ color: "var(--accent)" }}>
          Retour au Dashboard
        </Link>
      </div>
    );
  }

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

        <div className="flex items-center gap-3">
          {dataSource && (
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                background: "var(--bg-tertiary)",
                color: dataSource === "fmp" ? "var(--emerald)"
                  : dataSource === "yahoo" ? "#8b5cf6"
                  : dataSource === "cache" ? "var(--accent)"
                  : "var(--amber)",
              }}
            >
              Source : {dataSource.toUpperCase()}
            </span>
          )}
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
      </div>

      {evaluation ? (
        <ExecutiveSummary asset={asset} evaluation={evaluation} />
      ) : (
        <div className="card p-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {asset.profile.name}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {asset.profile.sector} — Prix : ${asset.profile.currentPrice.toFixed(2)}
          </p>
          {!hasFundamentals && (
            <div
              className="mt-4 flex items-center gap-2 rounded-lg p-3"
              style={{ background: "var(--bg-tertiary)", color: "var(--amber)" }}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm">
                Les données fondamentales (compte de résultat, bilan, cash-flow) ne sont pas disponibles
                pour ce ticker sur le plan FMP gratuit. Le modèle DCF et la valorisation relative ne peuvent
                pas être calculés. Seuls le prix de marché et le graphique de prix sont affichés.
              </span>
            </div>
          )}
          {asset.profile.description && (
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {asset.profile.description}
            </p>
          )}
        </div>
      )}

      {asset.priceHistory.length > 0 && (
        <PriceChart
          priceHistory={asset.priceHistory}
          fairValueHistory={fairValueHistory.length > 0 ? fairValueHistory : asset.fairValueHistory}
        />
      )}

      {hasFundamentals && evaluation && (
        <>
          <DCFSettings
            params={dcfParams}
            moat={moat}
            onParamsChange={setDcfParams}
            onMoatChange={handleMoatChange}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DCFBreakdown dcf={evaluation.dcf} currentPrice={asset.profile.currentPrice} />
            <div className="space-y-6">
              <RelativeValuationCard multiples={evaluation.multiples} currentPrice={asset.profile.currentPrice} />
            </div>
          </div>

          <MomentumPanel momentum={evaluation.momentum} composite={evaluation.compositeMomentum} />

          <FinancialBars asset={asset} />

          <EstimatesRevisionsPanel features={evaluation.features} />

          <SensitivityMatrix
            matrix={evaluation.dcfSensitivity}
            currentPrice={asset.profile.currentPrice}
          />
        </>
      )}
    </div>
  );
}
