import type {
  CompanyAsset,
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  CurrentMetrics,
  SectorData,
  PricePoint,
  Currency,
  Sector,
} from "@/types";
import type {
  FMPProfile,
  FMPIncomeStatement,
  FMPBalanceSheet,
  FMPCashFlow,
  FMPHistoricalPrice,
} from "./fmp";
import type { YahooHistoricalRow } from "./yahoo";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SECTOR_MAP: Record<string, Sector> = {
  Technology: "Technology",
  Healthcare: "Healthcare",
  "Financial Services": "Financials",
  Financials: "Financials",
  Industrials: "Industrials",
  "Consumer Cyclical": "Consumer Discretionary",
  "Consumer Defensive": "Consumer Staples",
  Energy: "Energy",
  "Basic Materials": "Materials",
  Utilities: "Utilities",
  "Real Estate": "Real Estate",
  "Communication Services": "Communication Services",
};

function mapSector(fmpSector: string): Sector {
  return SECTOR_MAP[fmpSector] ?? "Technology";
}

function mapCurrency(fmpCurrency: string): Currency {
  const valid: Currency[] = ["USD", "EUR", "GBP", "CHF", "JPY"];
  return valid.includes(fmpCurrency as Currency) ? (fmpCurrency as Currency) : "USD";
}

const SECTOR_MULTIPLES: Record<string, SectorData> = {
  Technology: { sectorName: "Technology", averagePER: 30, averageEVtoEBITDA: 22, averagePriceToFCF: 28 },
  Healthcare: { sectorName: "Healthcare", averagePER: 22, averageEVtoEBITDA: 16, averagePriceToFCF: 20 },
  Financials: { sectorName: "Financials", averagePER: 14, averageEVtoEBITDA: 10, averagePriceToFCF: 12 },
  Industrials: { sectorName: "Industrials", averagePER: 18, averageEVtoEBITDA: 12, averagePriceToFCF: 16 },
  "Consumer Discretionary": { sectorName: "Consumer Discretionary", averagePER: 22, averageEVtoEBITDA: 14, averagePriceToFCF: 18 },
  "Consumer Staples": { sectorName: "Consumer Staples", averagePER: 20, averageEVtoEBITDA: 14, averagePriceToFCF: 18 },
  Energy: { sectorName: "Energy", averagePER: 12, averageEVtoEBITDA: 6, averagePriceToFCF: 10 },
  Materials: { sectorName: "Materials", averagePER: 16, averageEVtoEBITDA: 10, averagePriceToFCF: 14 },
  Utilities: { sectorName: "Utilities", averagePER: 18, averageEVtoEBITDA: 12, averagePriceToFCF: 16 },
  "Real Estate": { sectorName: "Real Estate", averagePER: 35, averageEVtoEBITDA: 20, averagePriceToFCF: 25 },
  "Communication Services": { sectorName: "Communication Services", averagePER: 18, averageEVtoEBITDA: 10, averagePriceToFCF: 15 },
};

// ─── Transformers ────────────────────────────────────────────────────────────

export function transformIncomeStatement(raw: FMPIncomeStatement): IncomeStatement {
  return {
    year: parseInt(raw.fiscalYear) || new Date(raw.date).getFullYear(),
    revenue: raw.revenue,
    costOfRevenue: raw.costOfRevenue,
    grossProfit: raw.grossProfit,
    grossMargin: raw.grossProfitRatio,
    operatingExpenses: raw.operatingExpenses,
    ebit: raw.operatingIncome,
    ebitMargin: raw.operatingIncomeRatio,
    ebitda: raw.ebitda,
    ebitdaMargin: raw.ebitdaratio,
    interestExpense: raw.interestExpense,
    incomeTax: raw.incomeTaxExpense,
    netIncome: raw.netIncome,
    netMargin: raw.netIncomeRatio,
    eps: raw.epsdiluted || raw.eps,
  };
}

export function transformBalanceSheet(raw: FMPBalanceSheet): BalanceSheet {
  const totalDebt = raw.shortTermDebt + raw.longTermDebt;
  const investedCapital = raw.totalStockholdersEquity + totalDebt - raw.cashAndCashEquivalents;

  return {
    year: parseInt(raw.fiscalYear) || new Date(raw.date).getFullYear(),
    cashAndEquivalents: raw.cashAndCashEquivalents,
    currentAssets: raw.totalCurrentAssets,
    totalAssets: raw.totalAssets,
    currentLiabilities: raw.totalCurrentLiabilities,
    shortTermDebt: raw.shortTermDebt,
    longTermDebt: raw.longTermDebt,
    totalLiabilities: raw.totalLiabilities,
    shareholdersEquity: raw.totalStockholdersEquity,
    investedCapital: Math.max(investedCapital, 1),
  };
}

export function transformCashFlow(raw: FMPCashFlow): CashFlowStatement {
  return {
    year: parseInt(raw.fiscalYear) || new Date(raw.date).getFullYear(),
    operatingCashFlow: raw.operatingCashFlow,
    capitalExpenditures: raw.capitalExpenditure,
    freeCashFlow: raw.freeCashFlow,
    dividendsPaid: raw.dividendsPaid,
    shareRepurchases: raw.commonStockRepurchased,
  };
}

export function transformFMPPrices(prices: FMPHistoricalPrice[]): PricePoint[] {
  return prices
    .slice()
    .reverse()
    .map((p) => ({
      time: p.date,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
    }));
}

export function transformYahooPrices(rows: YahooHistoricalRow[]): PricePoint[] {
  return rows.map((r) => ({
    time: r.date.toISOString().split("T")[0],
    open: parseFloat(r.open.toFixed(2)),
    high: parseFloat(r.high.toFixed(2)),
    low: parseFloat(r.low.toFixed(2)),
    close: parseFloat(r.close.toFixed(2)),
    volume: r.volume,
  }));
}

// ─── Assemblage CompanyAsset ─────────────────────────────────────────────────

export function assembleCompanyAsset(
  profile: FMPProfile,
  incomeStmts: FMPIncomeStatement[],
  balanceSheets: FMPBalanceSheet[],
  cashFlows: FMPCashFlow[],
  priceHistory: PricePoint[],
): CompanyAsset {
  const sortedIS = [...incomeStmts].reverse();
  const sortedBS = [...balanceSheets].reverse();
  const sortedCF = [...cashFlows].reverse();

  const sector = mapSector(profile.sector);

  const lastIS = sortedIS[sortedIS.length - 1];
  const sharesOut = lastIS?.weightedAverageShsOutDil || lastIS?.weightedAverageShsOut || 1;
  const effectiveTax =
    lastIS && lastIS.netIncome !== 0 && (lastIS.netIncome + lastIS.incomeTaxExpense) !== 0
      ? lastIS.incomeTaxExpense / (lastIS.netIncome + lastIS.incomeTaxExpense)
      : 0.21;

  const lastBS = sortedBS[sortedBS.length - 1];
  const totalDebt = lastBS ? lastBS.shortTermDebt + lastBS.longTermDebt : 0;
  const costOfDebt =
    lastIS && totalDebt > 0
      ? Math.min(Math.max(lastIS.interestExpense / totalDebt, 0.01), 0.15)
      : 0.05;

  const currentMetrics: CurrentMetrics = {
    sharesOutstanding: sharesOut,
    beta: profile.beta || 1,
    effectiveTaxRate: Math.max(Math.min(effectiveTax, 0.5), 0),
    costOfDebt,
    dividendYield: profile.lastDividend && profile.price > 0 ? profile.lastDividend / profile.price : 0,
    marketCap: profile.marketCap || profile.mktCap || profile.price * sharesOut,
  };

  return {
    profile: {
      ticker: profile.symbol,
      name: profile.companyName,
      sector,
      industry: profile.industry,
      description: profile.description?.slice(0, 500) || "Aucune description disponible.",
      currency: mapCurrency(profile.currency),
      currentPrice: profile.price,
      logoUrl: profile.image,
    },
    incomeStatements: sortedIS.map(transformIncomeStatement),
    balanceSheets: sortedBS.map(transformBalanceSheet),
    cashFlowStatements: sortedCF.map(transformCashFlow),
    currentMetrics,
    sectorData: SECTOR_MULTIPLES[sector] ?? SECTOR_MULTIPLES["Technology"],
    priceHistory,
  };
}
