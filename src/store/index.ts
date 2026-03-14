import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WatchlistEntry, MoatScore, DCFParameters, CompanyAsset } from "@/types";
import { computeFullValuation } from "@/lib/valuationEngine";

interface SyncConfig {
  supabase: any;
  watchlistId: string;
}

interface AppState {
  watchlist: WatchlistEntry[];
  dcfParams: DCFParameters;
  moatScores: Record<string, MoatScore>;
  cachedAssets: Record<string, CompanyAsset>;
  _syncConfig: SyncConfig | null;

  setSyncConfig: (config: SyncConfig | null) => void;
  setWatchlist: (entries: WatchlistEntry[]) => void;
  addToWatchlist: (ticker: string) => void;
  addToWatchlistWithAsset: (asset: CompanyAsset) => void;
  removeFromWatchlist: (ticker: string) => void;
  isInWatchlist: (ticker: string) => boolean;
  setDCFParams: (params: Partial<DCFParameters>) => void;
  setMoatScore: (ticker: string, moat: MoatScore) => void;
  getMoatScore: (ticker: string) => MoatScore;
  cacheAsset: (ticker: string, asset: CompanyAsset) => void;
  getCachedAsset: (ticker: string) => CompanyAsset | undefined;
  refreshWatchlistValuations: () => void;
}

const DEFAULT_DCF_PARAMS: DCFParameters = {
  riskFreeRate: 0.04,
  equityRiskPremium: 0.06,
  projectionYears: 5,
  terminalGrowthRate: 0.025,
  fcfGrowthRate: 0.05,
};

const DEFAULT_MOAT: MoatScore = {
  pricingPower: 3,
  barriers: 3,
  management: 3,
};

function syncAdd(config: SyncConfig, entry: WatchlistEntry) {
  config.supabase
    .from("watchlist_items")
    .insert({
      watchlist_id: config.watchlistId,
      ticker: entry.ticker,
      name: entry.name,
      current_price: entry.currentPrice || null,
      fair_value: entry.finalFairValue ?? null,
      safety_margin: entry.safetyMargin ?? null,
      signal: entry.signal ?? null,
    })
    .then(() => {});
}

function syncRemove(config: SyncConfig, ticker: string) {
  config.supabase
    .from("watchlist_items")
    .delete()
    .eq("watchlist_id", config.watchlistId)
    .eq("ticker", ticker)
    .then(() => {});
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      watchlist: [],
      dcfParams: DEFAULT_DCF_PARAMS,
      moatScores: {},
      cachedAssets: {},
      _syncConfig: null,

      setSyncConfig: (config) => set({ _syncConfig: config }),

      setWatchlist: (entries) => set({ watchlist: entries }),

      addToWatchlist: (ticker: string) => {
        const state = get();
        if (state.watchlist.some((w) => w.ticker === ticker)) return;

        const company = state.cachedAssets[ticker];

        let entry: WatchlistEntry;
        if (!company) {
          entry = {
            ticker,
            name: ticker,
            addedAt: new Date().toISOString(),
            currentPrice: 0,
          };
        } else {
          const hasFundamentals =
            company.incomeStatements.length > 0 &&
            company.balanceSheets.length > 0 &&
            company.cashFlowStatements.length > 0;

          const moat = state.moatScores[ticker] ?? DEFAULT_MOAT;

          if (hasFundamentals) {
            const result = computeFullValuation(company, state.dcfParams, moat);
            entry = {
              ticker: company.profile.ticker,
              name: company.profile.name,
              addedAt: new Date().toISOString(),
              currentPrice: company.profile.currentPrice,
              finalFairValue: result.finalFairValue,
              safetyMargin: result.safetyMargin,
              signal: result.signal,
            };
          } else {
            entry = {
              ticker: company.profile.ticker,
              name: company.profile.name,
              addedAt: new Date().toISOString(),
              currentPrice: company.profile.currentPrice,
            };
          }
        }

        set({ watchlist: [...state.watchlist, entry] });

        if (state._syncConfig) syncAdd(state._syncConfig, entry);
      },

      addToWatchlistWithAsset: (asset: CompanyAsset) => {
        const state = get();
        const ticker = asset.profile.ticker;
        set({ cachedAssets: { ...state.cachedAssets, [ticker]: asset } });
        get().addToWatchlist(ticker);
      },

      removeFromWatchlist: (ticker: string) => {
        const state = get();
        set({ watchlist: state.watchlist.filter((w) => w.ticker !== ticker) });

        if (state._syncConfig) syncRemove(state._syncConfig, ticker);
      },

      isInWatchlist: (ticker: string) => {
        return get().watchlist.some((w) => w.ticker === ticker);
      },

      setDCFParams: (params: Partial<DCFParameters>) => {
        set({ dcfParams: { ...get().dcfParams, ...params } });
      },

      setMoatScore: (ticker: string, moat: MoatScore) => {
        set({ moatScores: { ...get().moatScores, [ticker]: moat } });
      },

      getMoatScore: (ticker: string) => {
        return get().moatScores[ticker] ?? DEFAULT_MOAT;
      },

      cacheAsset: (ticker: string, asset: CompanyAsset) => {
        set({ cachedAssets: { ...get().cachedAssets, [ticker]: asset } });
      },

      getCachedAsset: (ticker: string) => {
        return get().cachedAssets[ticker];
      },

      refreshWatchlistValuations: () => {
        const state = get();
        const updated = state.watchlist.map((entry) => {
          const company = state.cachedAssets[entry.ticker];
          if (!company) return entry;

          const hasFundamentals =
            company.incomeStatements.length > 0 &&
            company.balanceSheets.length > 0 &&
            company.cashFlowStatements.length > 0;
          if (!hasFundamentals) return entry;

          const moat = state.moatScores[entry.ticker] ?? DEFAULT_MOAT;
          const result = computeFullValuation(company, state.dcfParams, moat);
          return {
            ...entry,
            currentPrice: company.profile.currentPrice,
            finalFairValue: result.finalFairValue,
            safetyMargin: result.safetyMargin,
            signal: result.signal,
          };
        });
        set({ watchlist: updated });
      },
    }),
    {
      name: "screener-dcf-store",
      partialize: (state) => ({
        dcfParams: state.dcfParams,
        moatScores: state.moatScores,
      }),
    }
  )
);
