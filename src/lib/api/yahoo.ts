/* eslint-disable @typescript-eslint/no-explicit-any */
import YahooFinance from "yahoo-finance2";

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
