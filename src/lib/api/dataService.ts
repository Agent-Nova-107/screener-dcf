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
import {
  getYahooQuote,
  getYahooHistorical,
  getYahooFundamentals,
  searchYahoo,
} from "./yahoo";
import {
  assembleCompanyAsset,
  assembleFromYahoo,
  transformFMPPrices,
  transformYahooPrices,
} from "./transform";

// ─── Cache mémoire (server-side) ────────────────────────────────────────────

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
): Promise<{ data: CompanyAsset; source: string }> {
  const upper = ticker.toUpperCase();

  const cached = getCached(upper);
  if (cached) {
    return { data: cached, source: "cache" };
  }

  let profile = null;
  let incomeStmts = null;
  let balanceSheets = null;
  let cashFlows = null;
  let priceHistory: PricePoint[] = [];

  // ── Étape 1 : FMP (source prioritaire) ────────────────────────────────
  if (isFMPConfigured()) {
    [profile, incomeStmts, balanceSheets, cashFlows] = await Promise.all([
      getProfile(upper),
      getIncomeStatements(upper, "annual", 5),
      getBalanceSheets(upper, "annual", 5),
      getCashFlowStatements(upper, "annual", 5),
    ]);

    const fmpPrices = await getHistoricalPrices(upper);
    if (fmpPrices && fmpPrices.length > 0) {
      priceHistory = transformFMPPrices(fmpPrices);
    }
  }

  // ── Étape 2 : Yahoo quote + prix historiques fallback ─────────────────
  const yahooQuote = await getYahooQuote(upper);

  if (priceHistory.length === 0) {
    const yahooPrices = await getYahooHistorical(upper);
    if (yahooPrices && yahooPrices.length > 0) {
      priceHistory = transformYahooPrices(yahooPrices);
    }
  }

  const fmpHasFundamentals =
    !!incomeStmts?.length && !!balanceSheets?.length && !!cashFlows?.length;

  // ── CAS 1 : FMP complet (profil + fondamentaux) ───────────────────────
  if (profile && fmpHasFundamentals) {
    if (yahooQuote?.regularMarketPrice) {
      profile.price = yahooQuote.regularMarketPrice;
      if (yahooQuote.marketCap) profile.marketCap = yahooQuote.marketCap;
    }
    const asset = assembleCompanyAsset(
      profile, incomeStmts!, balanceSheets!, cashFlows!, priceHistory,
    );
    setCache(upper, asset);
    return { data: asset, source: "fmp" };
  }

  // ── CAS 2 : FMP partiel → fallback Yahoo fondamentaux ────────────────
  console.log(`[DataService] FMP incomplet pour ${upper}, tentative Yahoo fondamentaux…`);
  const yahooFundamentals = await getYahooFundamentals(upper);

  if (yahooFundamentals && yahooFundamentals.entries.length > 0) {

    const price = yahooQuote?.regularMarketPrice ?? profile?.price ?? 0;
    const mktCap = yahooQuote?.marketCap ?? profile?.marketCap ?? 0;
    const name = profile?.companyName ?? yahooQuote?.longName ?? yahooQuote?.shortName ?? upper;
    const currency = yahooQuote?.currency ?? profile?.currency ?? "USD";

    const asset = assembleFromYahoo(
      yahooFundamentals,
      upper,
      name,
      price,
      mktCap,
      currency,
      priceHistory,
      profile?.image,
    );
    setCache(upper, asset);
    return { data: asset, source: "yahoo" };
  }

  // ── CAS 3 : Profil FMP sans aucun fondamental ────────────────────────
  if (profile) {
    const price = yahooQuote?.regularMarketPrice ?? profile.price;
    const asset: CompanyAsset = {
      profile: {
        ticker: upper,
        name: profile.companyName,
        sector: "Technology",
        industry: profile.industry || "N/A",
        description: profile.description?.slice(0, 500) ||
          "Données fondamentales indisponibles pour ce ticker.",
        currency: "USD",
        currentPrice: price,
        logoUrl: profile.image,
      },
      incomeStatements: [],
      balanceSheets: [],
      cashFlowStatements: [],
      currentMetrics: {
        sharesOutstanding: profile.marketCap && price > 0 ? Math.round(profile.marketCap / price) : 1,
        beta: profile.beta || 1,
        effectiveTaxRate: 0.21,
        costOfDebt: 0.05,
        dividendYield: 0,
        marketCap: profile.marketCap || price,
      },
      sectorData: { sectorName: profile.sector || "N/A", averagePER: 20, averageEVtoEBITDA: 12, averagePriceToFCF: 16 },
      priceHistory,
    };
    setCache(upper, asset);
    return { data: asset, source: "fmp-partial" };
  }

  // ── CAS 4 : Pas de profil FMP, Yahoo quote seul ──────────────────────
  if (yahooQuote?.regularMarketPrice) {
    const asset: CompanyAsset = {
      profile: {
        ticker: upper,
        name: yahooQuote.longName || yahooQuote.shortName || upper,
        sector: "Technology",
        industry: "N/A",
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
      priceHistory,
    };
    return { data: asset, source: "yahoo-minimal" };
  }

  // ── CAS 5 : Rien ─────────────────────────────────────────────────────
  throw new Error(
    `Nous n'avons pas pu récupérer les données pour « ${upper} ». ` +
    `Vérifiez que le ticker est correct ou réessayez dans quelques instants. ` +
    `Nous nous excusons pour la gêne occasionnée.`
  );
}

// ─── Recherche ──────────────────────────────────────────────────────────────

export interface SearchResult {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
  source: "fmp" | "yahoo";
}

export async function searchTickers(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  if (isFMPConfigured()) {
    const fmpResults = await fmpSearch(query, 10);
    if (fmpResults) {
      fmpResults.forEach((r) => {
        results.push({
          ticker: r.symbol,
          name: r.name,
          exchange: r.exchange,
          type: "Equity",
          source: "fmp",
        });
      });
    }
  }

  if (results.length < 5) {
    const yahooResults = await searchYahoo(query, 10);
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
