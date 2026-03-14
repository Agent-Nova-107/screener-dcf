import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WatchlistEntry, MoatScore, DCFParameters } from "@/types";
import { COMPANIES } from "@/lib/mockData";
import { computeFullValuation } from "@/lib/valuationEngine";

interface AppState {
  watchlist: WatchlistEntry[];
  dcfParams: DCFParameters;
  moatScores: Record<string, MoatScore>;

  addToWatchlist: (ticker: string) => void;
  removeFromWatchlist: (ticker: string) => void;
  isInWatchlist: (ticker: string) => boolean;
  setDCFParams: (params: Partial<DCFParameters>) => void;
  setMoatScore: (ticker: string, moat: MoatScore) => void;
  getMoatScore: (ticker: string) => MoatScore;
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

      addToWatchlist: (ticker: string) => {
        const state = get();
        if (state.watchlist.some((w) => w.ticker === ticker)) return;

        const company = COMPANIES[ticker];
        if (!company) return;

        const moat = state.moatScores[ticker] ?? DEFAULT_MOAT;
        const result = computeFullValuation(company, state.dcfParams, moat);

        const entry: WatchlistEntry = {
          ticker: company.profile.ticker,
          name: company.profile.name,
          addedAt: new Date().toISOString(),
          currentPrice: company.profile.currentPrice,
          finalFairValue: result.finalFairValue,
          safetyMargin: result.safetyMargin,
          signal: result.signal,
        };

        set({ watchlist: [...state.watchlist, entry] });
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

      refreshWatchlistValuations: () => {
        const state = get();
        const updated = state.watchlist.map((entry) => {
          const company = COMPANIES[entry.ticker];
          if (!company) return entry;
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
    }
  )
);
