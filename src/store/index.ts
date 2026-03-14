import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WatchlistEntry, MoatScore, DCFParameters, CompanyAsset } from "@/types";
import { computeFullValuation } from "@/lib/valuationEngine";

interface AppState {
  watchlist: WatchlistEntry[];
  dcfParams: DCFParameters;
  moatScores: Record<string, MoatScore>;
  cachedAssets: Record<string, CompanyAsset>;

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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      watchlist: [],
      dcfParams: DEFAULT_DCF_PARAMS,
      moatScores: {},
      cachedAssets: {},

      addToWatchlist: (ticker: string) => {
        const state = get();
        if (state.watchlist.some((w) => w.ticker === ticker)) return;

        const company = state.cachedAssets[ticker];

        if (!company) {
          const entry: WatchlistEntry = {
            ticker,
            name: ticker,
            addedAt: new Date().toISOString(),
            currentPrice: 0,
          };
          set({ watchlist: [...state.watchlist, entry] });
          return;
        }

        const hasFundamentals =
          company.incomeStatements.length > 0 &&
          company.balanceSheets.length > 0 &&
          company.cashFlowStatements.length > 0;

        const moat = state.moatScores[ticker] ?? DEFAULT_MOAT;

        let entry: WatchlistEntry;
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

        set({ watchlist: [...state.watchlist, entry] });
      },

      addToWatchlistWithAsset: (asset: CompanyAsset) => {
        const state = get();
        const ticker = asset.profile.ticker;
        set({ cachedAssets: { ...state.cachedAssets, [ticker]: asset } });
        get().addToWatchlist(ticker);
      },

      removeFromWatchlist: (ticker: string) => {
        set({
          watchlist: get().watchlist.filter((w) => w.ticker !== ticker),
        });
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
        watchlist: state.watchlist,
        dcfParams: state.dcfParams,
        moatScores: state.moatScores,
      }),
    }
  )
);
