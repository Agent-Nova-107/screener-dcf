const BASE_URL = "https://financialmodelingprep.com/api/v3";

function apiKey(): string {
  return process.env.FMP_API_KEY ?? "";
}

function isConfigured(): boolean {
  return apiKey().length > 0;
}

async function fmpFetch<T>(path: string, revalidate = 86400): Promise<T | null> {
  if (!isConfigured()) return null;

  const url = `${BASE_URL}${path}${path.includes("?") ? "&" : "?"}apikey=${apiKey()}`;

  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) {
      console.warn(`[FMP] ${res.status} on ${path}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn("[FMP] Network error:", err);
    return null;
  }
}

// ─── Types brutes FMP ────────────────────────────────────────────────────────

export interface FMPProfile {
  symbol: string;
  companyName: string;
  currency: string;
  price: number;
  mktCap: number;
  beta: number;
  sector: string;
  industry: string;
  description: string;
  image: string;
  lastDiv: number;
}

export interface FMPIncomeStatement {
  date: string;
  calendarYear: string;
  period: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  operatingExpenses: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  ebitda: number;
  ebitdaratio: number;
  interestExpense: number;
  incomeTaxExpense: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
}

export interface FMPBalanceSheet {
  date: string;
  calendarYear: string;
  period: string;
  cashAndCashEquivalents: number;
  totalCurrentAssets: number;
  totalAssets: number;
  totalCurrentLiabilities: number;
  shortTermDebt: number;
  longTermDebt: number;
  totalLiabilities: number;
  totalStockholdersEquity: number;
  totalEquity: number;
  totalInvestments: number;
  capitalLeaseObligations: number;
}

export interface FMPCashFlow {
  date: string;
  calendarYear: string;
  period: string;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  dividendsPaid: number;
  commonStockRepurchased: number;
}

export interface FMPKeyMetrics {
  date: string;
  period: string;
  revenuePerShare: number;
  peRatio: number;
  enterpriseValueOverEBITDA: number;
  pfcfRatio: number;
  roic: number;
  roe: number;
  debtToEquity: number;
  currentRatio: number;
}

export interface FMPHistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FMPSearchResult {
  symbol: string;
  name: string;
  currency: string;
  stockExchange: string;
  exchangeShortName: string;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

export async function getProfile(symbol: string): Promise<FMPProfile | null> {
  const data = await fmpFetch<FMPProfile[]>(`/profile/${symbol}`);
  return data?.[0] ?? null;
}

export async function getIncomeStatements(
  symbol: string,
  period: "annual" | "quarter" = "annual",
  limit = 5
): Promise<FMPIncomeStatement[] | null> {
  return fmpFetch<FMPIncomeStatement[]>(
    `/income-statement/${symbol}?period=${period}&limit=${limit}`
  );
}

export async function getBalanceSheets(
  symbol: string,
  period: "annual" | "quarter" = "annual",
  limit = 5
): Promise<FMPBalanceSheet[] | null> {
  return fmpFetch<FMPBalanceSheet[]>(
    `/balance-sheet-statement/${symbol}?period=${period}&limit=${limit}`
  );
}

export async function getCashFlowStatements(
  symbol: string,
  period: "annual" | "quarter" = "annual",
  limit = 5
): Promise<FMPCashFlow[] | null> {
  return fmpFetch<FMPCashFlow[]>(
    `/cash-flow-statement/${symbol}?period=${period}&limit=${limit}`
  );
}

export async function getKeyMetrics(
  symbol: string,
  period: "annual" | "quarter" = "annual",
  limit = 5
): Promise<FMPKeyMetrics[] | null> {
  return fmpFetch<FMPKeyMetrics[]>(
    `/key-metrics/${symbol}?period=${period}&limit=${limit}`
  );
}

export async function getHistoricalPrices(
  symbol: string
): Promise<FMPHistoricalPrice[] | null> {
  const data = await fmpFetch<{ historical: FMPHistoricalPrice[] }>(
    `/historical-price-full/${symbol}?serietype=line`
  );
  return data?.historical ?? null;
}

export async function searchCompanies(
  query: string,
  limit = 10
): Promise<FMPSearchResult[] | null> {
  return fmpFetch<FMPSearchResult[]>(
    `/search?query=${encodeURIComponent(query)}&limit=${limit}`,
    3600
  );
}

export { isConfigured as isFMPConfigured };
