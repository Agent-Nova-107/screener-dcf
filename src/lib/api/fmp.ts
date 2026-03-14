const BASE_URL = "https://financialmodelingprep.com/stable";

function apiKey(): string {
  return process.env.FMP_API_KEY ?? "";
}

function isConfigured(): boolean {
  return apiKey().length > 0;
}

async function fmpFetch<T>(path: string, revalidate = 86400): Promise<T | null> {
  if (!isConfigured()) return null;

  const separator = path.includes("?") ? "&" : "?";
  const url = `${BASE_URL}${path}${separator}apikey=${apiKey()}`;

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

// ─── Types brutes FMP (stable API) ──────────────────────────────────────────

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
  lastDividend: number;
  marketCap: number;
}

export interface FMPIncomeStatement {
  date: string;
  fiscalYear: string;
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
  fiscalYear: string;
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
}

export interface FMPCashFlow {
  date: string;
  fiscalYear: string;
  period: string;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  dividendsPaid: number;
  commonStockRepurchased: number;
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
  exchange: string;
  exchangeFullName: string;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

export async function getProfile(symbol: string): Promise<FMPProfile | null> {
  const data = await fmpFetch<FMPProfile[]>(`/profile?symbol=${symbol}`);
  return data?.[0] ?? null;
}

export async function getIncomeStatements(
  symbol: string,
  period: "annual" | "quarter" = "annual",
  limit = 5
): Promise<FMPIncomeStatement[] | null> {
  return fmpFetch<FMPIncomeStatement[]>(
    `/income-statement?symbol=${symbol}&period=${period}&limit=${limit}`
  );
}

export async function getBalanceSheets(
  symbol: string,
  period: "annual" | "quarter" = "annual",
  limit = 5
): Promise<FMPBalanceSheet[] | null> {
  return fmpFetch<FMPBalanceSheet[]>(
    `/balance-sheet-statement?symbol=${symbol}&period=${period}&limit=${limit}`
  );
}

export async function getCashFlowStatements(
  symbol: string,
  period: "annual" | "quarter" = "annual",
  limit = 5
): Promise<FMPCashFlow[] | null> {
  return fmpFetch<FMPCashFlow[]>(
    `/cash-flow-statement?symbol=${symbol}&period=${period}&limit=${limit}`
  );
}

export async function getHistoricalPrices(
  symbol: string
): Promise<FMPHistoricalPrice[] | null> {
  return fmpFetch<FMPHistoricalPrice[]>(
    `/historical-price-eod/full?symbol=${symbol}`
  );
}

export async function searchCompanies(
  query: string,
  limit = 10
): Promise<FMPSearchResult[] | null> {
  return fmpFetch<FMPSearchResult[]>(
    `/search-symbol?query=${encodeURIComponent(query)}&limit=${limit}`,
    3600
  );
}

export { isConfigured as isFMPConfigured };
