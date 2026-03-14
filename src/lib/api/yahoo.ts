/* eslint-disable @typescript-eslint/no-explicit-any */
import YahooFinanceModule from "yahoo-finance2";

const YahooFinance = new (YahooFinanceModule as any)({ suppressNotices: ["yahooSurvey"] });

// ─── Types ──────────────────────────────────────────────────────────────────

export interface YahooQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  marketCap?: number;
  currency?: string;
}

export interface YahooHistoricalRow {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface YahooFundamentalEntry {
  date: string;
  totalRevenue: number;
  costOfRevenue: number;
  grossProfit: number;
  operatingExpense: number;
  operatingIncome: number;
  ebitda: number;
  interestExpense: number;
  taxProvision: number;
  netIncome: number;
  dilutedAverageShares: number;
  cashAndCashEquivalents: number;
  currentAssets: number;
  totalAssets: number;
  currentLiabilities: number;
  shortTermDebt: number;
  longTermDebt: number;
  totalLiabilities: number;
  stockholdersEquity: number;
  operatingCashFlow: number;
  freeCashFlow: number;
  capitalExpenditure: number;
  dividendsPaid: number;
  shareRepurchases: number;
}

export interface YahooFundamentals {
  entries: YahooFundamentalEntry[];
  sharesOutstanding: number;
  beta: number;
  sector: string;
  industry: string;
  description: string;
}

// ─── Quote ──────────────────────────────────────────────────────────────────

export async function getYahooQuote(symbol: string): Promise<YahooQuote | null> {
  try {
    const result: any = await YahooFinance.quote(symbol);
    return {
      symbol: result.symbol,
      shortName: result.shortName,
      longName: result.longName,
      regularMarketPrice: result.regularMarketPrice,
      marketCap: result.marketCap,
      currency: result.currency,
    };
  } catch (err) {
    console.warn("[Yahoo] quote error:", err);
    return null;
  }
}

// ─── Historique prix ────────────────────────────────────────────────────────

export async function getYahooHistorical(
  symbol: string,
  yearsBack = 5
): Promise<YahooHistoricalRow[] | null> {
  try {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - yearsBack);

    const result: any = await YahooFinance.chart(symbol, {
      period1: start,
      period2: end,
      interval: "1d" as any,
    });

    if (!result.quotes) return null;

    return result.quotes
      .filter((q: any) => q.open != null && q.close != null)
      .map((q: any) => ({
        date: q.date,
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume ?? 0,
      }));
  } catch (err) {
    console.warn("[Yahoo] historical error:", err);
    return null;
  }
}

// ─── Fondamentaux (fundamentalsTimeSeries + quoteSummary pour méta) ─────────

export async function getYahooFundamentals(
  symbol: string
): Promise<YahooFundamentals | null> {
  try {
    const [timeSeries, summary] = await Promise.all([
      YahooFinance.fundamentalsTimeSeries(symbol, {
        period1: "2018-01-01",
        period2: new Date().toISOString().split("T")[0],
        type: "annual",
        module: "all",
      }).catch(() => null),
      YahooFinance.quoteSummary(symbol, {
        modules: ["defaultKeyStatistics", "assetProfile"] as any,
      }).catch(() => null),
    ]);

    if (!timeSeries?.length) {
      console.warn("[Yahoo] fundamentalsTimeSeries: no data for", symbol);
      return null;
    }

    const entries: YahooFundamentalEntry[] = timeSeries
      .filter((r: any) => r.totalRevenue != null && r.totalAssets != null)
      .map((r: any) => {
        const opCF = r.operatingCashFlow ?? 0;
        const fcf = r.freeCashFlow ?? 0;
        const capex = r.capitalExpenditure != null
          ? Math.abs(r.capitalExpenditure)
          : Math.max(opCF - fcf, 0);

        return {
          date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : String(r.date),
          totalRevenue: r.totalRevenue ?? 0,
          costOfRevenue: r.costOfRevenue ?? 0,
          grossProfit: r.grossProfit ?? (r.totalRevenue - (r.costOfRevenue ?? 0)),
          operatingExpense: r.operatingExpense ?? r.totalExpenses ?? 0,
          operatingIncome: r.operatingIncome ?? r.EBIT ?? 0,
          ebitda: r.EBITDA ?? r.normalizedEBITDA ?? ((r.operatingIncome ?? 0) + (r.depreciationAndAmortization ?? 0)),
          interestExpense: Math.abs(r.interestExpense ?? r.interestExpenseNonOperating ?? 0),
          taxProvision: r.taxProvision ?? 0,
          netIncome: r.netIncome ?? r.netIncomeCommonStockholders ?? 0,
          dilutedAverageShares: r.dilutedAverageShares ?? r.basicAverageShares ?? 0,
          cashAndCashEquivalents: r.cashAndCashEquivalents ?? r.cashCashEquivalentsAndShortTermInvestments ?? 0,
          currentAssets: r.currentAssets ?? 0,
          totalAssets: r.totalAssets ?? 0,
          currentLiabilities: r.currentLiabilities ?? 0,
          shortTermDebt: r.currentDebtAndCapitalLeaseObligation ?? 0,
          longTermDebt: r.longTermDebt ?? r.longTermDebtAndCapitalLeaseObligation ?? 0,
          totalLiabilities: r.totalLiabilitiesNetMinorityInterest ?? 0,
          stockholdersEquity: r.stockholdersEquity ?? r.commonStockEquity ?? 0,
          operatingCashFlow: opCF,
          freeCashFlow: fcf,
          capitalExpenditure: capex,
          dividendsPaid: Math.abs(r.commonDividendsPaid ?? 0),
          shareRepurchases: Math.abs(r.repurchaseOfCapitalStock ?? r.commonStockIssuance ?? 0),
        };
      });

    if (entries.length === 0) {
      console.warn("[Yahoo] fundamentalsTimeSeries: no valid entries for", symbol);
      return null;
    }

    const keyStats = summary?.defaultKeyStatistics ?? {};
    const assetProfile = summary?.assetProfile ?? {};

    return {
      entries,
      sharesOutstanding: (keyStats as any).sharesOutstanding ?? 0,
      beta: (keyStats as any).beta ?? 1,
      sector: (assetProfile as any).sector ?? "",
      industry: (assetProfile as any).industry ?? "",
      description: (assetProfile as any).longBusinessSummary?.slice(0, 500) ?? "",
    };
  } catch (err) {
    console.warn("[Yahoo] fundamentals error:", err);
    return null;
  }
}

// ─── Recherche ──────────────────────────────────────────────────────────────

export async function searchYahoo(
  query: string,
  limit = 10
): Promise<{ symbol: string; name: string; exchange: string; type: string }[]> {
  try {
    const result: any = await YahooFinance.search(query, { newsCount: 0 } as any);
    return (result.quotes ?? [])
      .filter((q: any) => q.symbol)
      .slice(0, limit)
      .map((q: any) => ({
        symbol: q.symbol ?? "",
        name: q.longname ?? q.shortname ?? "",
        exchange: q.exchange ?? "",
        type: q.quoteType ?? "",
      }));
  } catch (err) {
    console.warn("[Yahoo] search error:", err);
    return [];
  }
}
