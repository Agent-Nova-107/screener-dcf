import type { CompanyAsset, PricePoint } from "@/types";
import {
  getProfile,
  getIncomeStatements,
  getBalanceSheets,
  getCashFlowStatements,
  getHistoricalPrices,
  isFMPConfigured,
  searchCompanies as fmpSearch,
} from "./fmp";
import { getYahooQuote, getYahooHistorical, searchYahoo } from "./yahoo";
import {
  assembleCompanyAsset,
  transformFMPPrices,
  transformYahooPrices,
} from "./transform";
import { COMPANIES, COMPANY_LIST } from "@/lib/mockData";

// ─── Cache en mémoire (server-side, durée de vie = durée du process) ────────

const assetCache = new Map<string, { data: CompanyAsset; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

function getCached(ticker: string): CompanyAsset | null {
  const entry = assetCache.get(ticker.toUpperCase());
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    assetCache.delete(ticker.toUpperCase());
    return null;
  }
  return entry.data;
}

function setCache(ticker: string, data: CompanyAsset) {
  assetCache.set(ticker.toUpperCase(), { data, ts: Date.now() });
}

// ─── Fetcher principal ──────────────────────────────────────────────────────

export async function fetchCompanyAsset(
  ticker: string
): Promise<{ data: CompanyAsset; source: "fmp" | "yahoo-fmp" | "cache" | "mock" }> {
  const upper = ticker.toUpperCase();

  // 1. Cache mémoire
  const cached = getCached(upper);
  if (cached) return { data: cached, source: "cache" };

  // 2. FMP (source primaire)
  if (isFMPConfigured()) {
    try {
      const [profile, incomeStmts, balanceSheets, cashFlows] = await Promise.all([
        getProfile(upper),
        getIncomeStatements(upper, "annual", 5),
        getBalanceSheets(upper, "annual", 5),
        getCashFlowStatements(upper, "annual", 5),
      ]);

      if (profile && incomeStmts?.length && balanceSheets?.length && cashFlows?.length) {
        let priceHistory: PricePoint[] = [];

        // Prix via FMP d'abord, Yahoo en fallback
        const fmpPrices = await getHistoricalPrices(upper);
        if (fmpPrices && fmpPrices.length > 0) {
          priceHistory = transformFMPPrices(fmpPrices);
        } else {
          const yahooPrices = await getYahooHistorical(upper);
          if (yahooPrices && yahooPrices.length > 0) {
            priceHistory = transformYahooPrices(yahooPrices);
          }
        }

        // Mettre à jour le prix temps réel via Yahoo si possible
        const yahooQuote = await getYahooQuote(upper);
        if (yahooQuote?.regularMarketPrice) {
          profile.price = yahooQuote.regularMarketPrice;
          if (yahooQuote.marketCap) profile.mktCap = yahooQuote.marketCap;
        }

        const asset = assembleCompanyAsset(
          profile,
          incomeStmts,
          balanceSheets,
          cashFlows,
          priceHistory,
        );

        setCache(upper, asset);
        return { data: asset, source: "fmp" };
      }
    } catch (err) {
      console.warn(`[DataService] FMP failed for ${upper}:`, err);
    }
  }

  // 3. Yahoo seul (prix uniquement, pas de fondamentaux complets)
  // Pas assez pour construire un CompanyAsset complet → fallback mock

  // 4. Mock data
  const mock = COMPANIES[upper];
  if (mock) return { data: mock, source: "mock" };

  // 5. Rien → construire un asset minimal via Yahoo si possible
  const yahooQuote = await getYahooQuote(upper);
  const yahooPrices = await getYahooHistorical(upper);

  if (yahooQuote?.regularMarketPrice) {
    const minimalAsset: CompanyAsset = {
      profile: {
        ticker: upper,
        name: yahooQuote.longName || yahooQuote.shortName || upper,
        sector: "Technology",
        industry: "Unknown",
        description: "Données fondamentales indisponibles. Seul le prix de marché est affiché.",
        currency: (yahooQuote.currency as "USD") || "USD",
        currentPrice: yahooQuote.regularMarketPrice,
      },
      incomeStatements: [],
      balanceSheets: [],
      cashFlowStatements: [],
      currentMetrics: {
        sharesOutstanding: 1,
        beta: 1,
        effectiveTaxRate: 0.21,
        costOfDebt: 0.05,
        dividendYield: 0,
        marketCap: yahooQuote.marketCap || yahooQuote.regularMarketPrice,
      },
      sectorData: { sectorName: "N/A", averagePER: 20, averageEVtoEBITDA: 12, averagePriceToFCF: 16 },
      priceHistory: yahooPrices ? transformYahooPrices(yahooPrices) : [],
    };
    return { data: minimalAsset, source: "yahoo-fmp" };
  }

  throw new Error(`Aucune donnée disponible pour ${upper}`);
}

// ─── Recherche ──────────────────────────────────────────────────────────────

export interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
  source: "fmp" | "yahoo" | "mock";
}

export async function searchTickers(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const q = query.toLowerCase();

  // Mock data toujours inclus
  COMPANY_LIST.forEach((c) => {
    if (c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)) {
      results.push({
        ticker: c.ticker,
        name: c.name,
        exchange: "MOCK",
        type: "Equity",
        source: "mock",
      });
    }
  });

  // FMP search
  if (isFMPConfigured()) {
    const fmpResults = await fmpSearch(query, 8);
    if (fmpResults) {
      fmpResults.forEach((r) => {
        if (!results.some((x) => x.ticker === r.symbol)) {
          results.push({
            ticker: r.symbol,
            name: r.name,
            exchange: r.exchangeShortName,
            type: "Equity",
            source: "fmp",
          });
        }
      });
    }
  }

  // Yahoo fallback si FMP ne donne rien de plus
  if (results.length < 5) {
    const yahooResults = await searchYahoo(query, 8);
    yahooResults.forEach((r) => {
      if (!results.some((x) => x.ticker === r.symbol)) {
        results.push({
          ticker: r.symbol,
          name: r.name,
          exchange: r.exchange,
          type: r.type,
          source: "yahoo",
        });
      }
    });
  }

  return results.slice(0, 15);
}
