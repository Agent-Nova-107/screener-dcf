import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export const CurrencySchema = z.enum(["USD", "EUR", "GBP", "CHF", "JPY"]);
export type Currency = z.infer<typeof CurrencySchema>;

export const SectorSchema = z.enum([
  "Technology",
  "Healthcare",
  "Financials",
  "Industrials",
  "Consumer Discretionary",
  "Consumer Staples",
  "Energy",
  "Materials",
  "Utilities",
  "Real Estate",
  "Communication Services",
]);
export type Sector = z.infer<typeof SectorSchema>;

export const ValuationSignal = z.enum([
  "STRONG_BUY",
  "UNDERVALUED",
  "FAIR_VALUE",
  "OVERVALUED",
]);
export type ValuationSignal = z.infer<typeof ValuationSignal>;

// ─────────────────────────────────────────────────────────────────────────────
// PROFIL D'ENTREPRISE
// ─────────────────────────────────────────────────────────────────────────────

export const CompanyProfileSchema = z.object({
  ticker: z.string().min(1).max(10),
  name: z.string().min(1),
  sector: SectorSchema,
  industry: z.string().min(1),
  description: z.string().min(10),
  currency: CurrencySchema,
  currentPrice: z.number().positive(),
  logoUrl: z.string().optional(),
});
export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// COMPTE DE RÉSULTAT (annuel)
// ─────────────────────────────────────────────────────────────────────────────

export const IncomeStatementSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  revenue: z.number(),
  costOfRevenue: z.number(),
  grossProfit: z.number(),
  grossMargin: z.number(),
  operatingExpenses: z.number(),
  ebit: z.number(),
  ebitMargin: z.number(),
  ebitda: z.number(),
  ebitdaMargin: z.number(),
  interestExpense: z.number(),
  incomeTax: z.number(),
  netIncome: z.number(),
  netMargin: z.number(),
  eps: z.number(),
});
export type IncomeStatement = z.infer<typeof IncomeStatementSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// BILAN COMPTABLE (annuel)
// ─────────────────────────────────────────────────────────────────────────────

export const BalanceSheetSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  cashAndEquivalents: z.number().min(0),
  currentAssets: z.number().min(0),
  totalAssets: z.number().min(0),
  currentLiabilities: z.number().min(0),
  shortTermDebt: z.number().min(0),
  longTermDebt: z.number().min(0),
  totalLiabilities: z.number().min(0),
  shareholdersEquity: z.number(),
  investedCapital: z.number(),
});
export type BalanceSheet = z.infer<typeof BalanceSheetSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// FLUX DE TRÉSORERIE (annuel)
// ─────────────────────────────────────────────────────────────────────────────

export const CashFlowStatementSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  operatingCashFlow: z.number(),
  capitalExpenditures: z.number(),
  freeCashFlow: z.number(),
  dividendsPaid: z.number(),
  shareRepurchases: z.number(),
});
export type CashFlowStatement = z.infer<typeof CashFlowStatementSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// MÉTRIQUES ACTUELLES
// ─────────────────────────────────────────────────────────────────────────────

export const CurrentMetricsSchema = z.object({
  sharesOutstanding: z.number().positive(),
  beta: z.number(),
  effectiveTaxRate: z.number().min(0).max(1),
  costOfDebt: z.number().min(0).max(1),
  dividendYield: z.number().min(0),
  marketCap: z.number().positive(),
});
export type CurrentMetrics = z.infer<typeof CurrentMetricsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES SECTORIELLES (pour valorisation relative)
// ─────────────────────────────────────────────────────────────────────────────

export const SectorDataSchema = z.object({
  sectorName: z.string(),
  averagePER: z.number().positive(),
  averageEVtoEBITDA: z.number().positive(),
  averagePriceToFCF: z.number().positive(),
});
export type SectorData = z.infer<typeof SectorDataSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES HISTORIQUES DE PRIX (pour graphiques)
// ─────────────────────────────────────────────────────────────────────────────

export const PricePointSchema = z.object({
  time: z.string(),
  open: z.number().positive(),
  high: z.number().positive(),
  low: z.number().positive(),
  close: z.number().positive(),
  volume: z.number().min(0).optional(),
});
export type PricePoint = z.infer<typeof PricePointSchema>;

export const FairValuePointSchema = z.object({
  time: z.string(),
  value: z.number(),
});
export type FairValuePoint = z.infer<typeof FairValuePointSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// MODÈLE PRINCIPAL : ACTIF D'ENTREPRISE
// ─────────────────────────────────────────────────────────────────────────────

export const CompanyAssetSchema = z.object({
  profile: CompanyProfileSchema,
  incomeStatements: z.array(IncomeStatementSchema).min(3),
  balanceSheets: z.array(BalanceSheetSchema).min(3),
  cashFlowStatements: z.array(CashFlowStatementSchema).min(3),
  currentMetrics: CurrentMetricsSchema,
  sectorData: SectorDataSchema,
  priceHistory: z.array(PricePointSchema),
  fairValueHistory: z.array(FairValuePointSchema).optional(),
});
export type CompanyAsset = z.infer<typeof CompanyAssetSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// PARAMÈTRES DU MODÈLE DCF
// ─────────────────────────────────────────────────────────────────────────────

export const DCFParametersSchema = z.object({
  riskFreeRate: z.number().min(0).max(0.15).default(0.04),
  equityRiskPremium: z.number().min(0).max(0.15).default(0.06),
  projectionYears: z.number().int().min(3).max(15).default(5),
  terminalGrowthRate: z.number().min(-0.02).max(0.05).default(0.025),
  fcfGrowthRate: z.number().min(-0.10).max(0.40).default(0.05),
  manualWACC: z.number().min(0.01).max(0.30).optional(),
});
export type DCFParameters = z.infer<typeof DCFParametersSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// SCORE QUALITATIF (MOAT)
// ─────────────────────────────────────────────────────────────────────────────

const moatScore = z.number().int().min(1).max(5);

export const MoatScoreSchema = z.object({
  pricingPower: moatScore.default(3),
  barriers: moatScore.default(3),
  management: moatScore.default(3),
});
export type MoatScore = z.infer<typeof MoatScoreSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// RÉSULTATS DE VALORISATION (sortie du moteur)
// ─────────────────────────────────────────────────────────────────────────────

export const WACCBreakdownSchema = z.object({
  costOfEquity: z.number(),
  costOfDebt: z.number(),
  equityWeight: z.number(),
  debtWeight: z.number(),
  wacc: z.number(),
});
export type WACCBreakdown = z.infer<typeof WACCBreakdownSchema>;

export const DCFResultSchema = z.object({
  projectedFCFs: z.array(z.object({
    year: z.number(),
    fcf: z.number(),
    discountedFCF: z.number(),
  })),
  terminalValue: z.number(),
  discountedTerminalValue: z.number(),
  enterpriseValue: z.number(),
  netDebt: z.number(),
  equityValue: z.number(),
  intrinsicValuePerShare: z.number(),
});
export type DCFResult = z.infer<typeof DCFResultSchema>;

export const RelativeValuationSchema = z.object({
  impliedPricePER: z.number(),
  impliedPriceEVtoEBITDA: z.number(),
  impliedPricePFCF: z.number(),
  averageRelativeValue: z.number(),
});
export type RelativeValuation = z.infer<typeof RelativeValuationSchema>;

export const SensitivityCellSchema = z.object({
  wacc: z.number(),
  terminalGrowth: z.number(),
  fairValue: z.number(),
});
export type SensitivityCell = z.infer<typeof SensitivityCellSchema>;

export const FullValuationResultSchema = z.object({
  waccBreakdown: WACCBreakdownSchema,
  dcf: DCFResultSchema,
  relativeValuation: RelativeValuationSchema,
  moatMultiplier: z.number(),
  finalFairValue: z.number(),
  safetyMargin: z.number(),
  signal: ValuationSignal,
  sensitivityMatrix: z.array(z.array(SensitivityCellSchema)),
});
export type FullValuationResult = z.infer<typeof FullValuationResultSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// NOUVEAU MOTEUR (v2) — CONTRATS DE SORTIE (MVP spec)
// ─────────────────────────────────────────────────────────────────────────────

export type DcfScenarioId = "bear" | "base" | "bull";

export interface DcfScenarioResult {
  scenario: DcfScenarioId;
  params: DCFParameters;
  wacc: number;
  fairValuePerShare: number;
  enterpriseValue: number;
  equityValue: number;
  netDebt: number;
  projectedFCFs: { year: number; fcf: number; discountedFCF: number }[];
  terminalValue: number;
}

export interface DcfScenarios {
  applicable: boolean;
  reasonIfNotApplicable?: string;
  scenarios: Record<DcfScenarioId, DcfScenarioResult>;
  discountToFairValueBase?: number; // (FV - Price) / FV
}

export interface DcfSensitivityCell3x3 {
  wacc: number;
  terminalGrowth: number;
  fairValuePerShare: number;
}

export interface DcfSensitivityMatrix3x3 {
  applicable: boolean;
  reasonIfNotApplicable?: string;
  // rows: wacc, cols: g
  waccValues: number[];
  terminalGrowthValues: number[];
  matrix: DcfSensitivityCell3x3[][];
}

export type RelativeMultipleKey =
  | "pe"
  | "forwardPe"
  | "peg"
  | "evEbitda"
  | "evEbit"
  | "ps"
  | "pFcf"
  | "pb"
  | "evSales";

export interface RelativeMultipleResult {
  key: RelativeMultipleKey;
  label: string;
  value: number | null;
  // MVP: peers/percentiles non disponibles sans provider
  sectorMedian: number | null;
  premiumVsSectorMedianPct: number | null;
  notes?: string;
}

export interface RelativeMultiplesSummary {
  applicable: boolean;
  multiples: RelativeMultipleResult[];
  multiMethodUndervalued: boolean;
  reasonIfNotApplicable?: string;
}

export type ValuationMethodId =
  | "DCF"
  | "MULTIPLES"
  | "NAV"
  | "DDM"
  | "RIM";

export interface ValuationMethodResult {
  method: ValuationMethodId;
  applicable: boolean;
  fairValuePerShare: number | null;
  low?: number | null;
  high?: number | null;
  notes?: string;
}

export type ConvergenceConviction = "HIGH" | "MEDIUM" | "LOW";

export interface ValuationTriangulation {
  methodsUsed: ValuationMethodResult[];
  rangeMin: number | null;
  rangeMax: number | null;
  medianFairValue: number | null;
  upsideDownsidePct: number | null; // (medianFV - price) / price
  convergenceGapPct: number | null; // (max-min)/median
  conviction: ConvergenceConviction;
}

export interface FeatureAvailability {
  estimatesAndRevisions: boolean;
  peersAndSectorPercentiles: boolean;
}

export interface FundamentalMomentumBadges {
  operationalLeverageConfirmed?: boolean;
  marginErosionWarning?: boolean;
  highEarningsQuality?: boolean;
  earningsQualityWarning?: boolean;
  balanceSheetRisk?: boolean;
}

export interface FundamentalMomentumResult {
  revenueGrowthYoY: number | null;
  grossMarginBpsYoY: number | null;
  ebitdaMarginBpsYoY: number | null;
  ebitMarginBpsYoY: number | null;
  netMarginBpsYoY: number | null;
  fcfMarginBpsYoY: number | null;

  accrualRatio: number | null;
  cashConversionRate: number | null;

  epsGrowthYoY: number | null;
  fcfYield: number | null;
  fcfGrowthYoY: number | null;

  roic: number | null;
  wacc: number | null;
  roicMinusWacc: number | null;

  netDebtToEbitda: number | null;
  currentRatio: number | null;
  interestCoverage: number | null;

  badges: FundamentalMomentumBadges;
}

export interface CompositeMomentumScore {
  score0to100: number | null;
  partial: boolean;
  notes?: string;
}

export interface StockEvaluationV2 {
  features: FeatureAvailability;
  currentPrice: number;
  dcf: DcfScenarios;
  dcfSensitivity: DcfSensitivityMatrix3x3;
  multiples: RelativeMultiplesSummary;
  triangulation: ValuationTriangulation;
  momentum: FundamentalMomentumResult;
  compositeMomentum: CompositeMomentumScore;
}

// ─────────────────────────────────────────────────────────────────────────────
// RATIOS FONDAMENTAUX CALCULÉS
// ─────────────────────────────────────────────────────────────────────────────

export const FundamentalRatiosSchema = z.object({
  year: z.number(),
  roic: z.number(),
  roe: z.number(),
  netDebt: z.number(),
  leverageRatio: z.number(),
  currentRatio: z.number(),
  fcfYield: z.number(),
  revenueCAGR: z.number().optional(),
  fcfCAGR: z.number().optional(),
  epsCAGR: z.number().optional(),
});
export type FundamentalRatios = z.infer<typeof FundamentalRatiosSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// WATCHLIST (état global Zustand)
// ─────────────────────────────────────────────────────────────────────────────

export const WatchlistEntrySchema = z.object({
  ticker: z.string(),
  name: z.string(),
  addedAt: z.string(),
  currentPrice: z.number(),
  finalFairValue: z.number().optional(),
  safetyMargin: z.number().optional(),
  signal: ValuationSignal.optional(),
});
export type WatchlistEntry = z.infer<typeof WatchlistEntrySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// SEUILS POUR LE MOTEUR PÉDAGOGIQUE
// ─────────────────────────────────────────────────────────────────────────────

export interface MetricThresholds {
  excellent: { max: number; label: string; color: "emerald" };
  good: { max: number; label: string; color: "green" };
  neutral: { max: number; label: string; color: "gray" };
  warning: { max: number; label: string; color: "amber" };
  danger: { max: number; label: string; color: "red" };
}

export interface MetricAnalysis {
  value: number;
  label: string;
  color: "emerald" | "green" | "gray" | "amber" | "red";
  commentary: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// FONCTIONS UTILITAIRES DE SIGNAL
// ─────────────────────────────────────────────────────────────────────────────

export function safetyMarginToSignal(margin: number): z.infer<typeof ValuationSignal> {
  if (margin > 0.20) return "STRONG_BUY";
  if (margin >= 0) return "UNDERVALUED";
  if (margin >= -0.10) return "FAIR_VALUE";
  return "OVERVALUED";
}

export function signalToColor(signal: z.infer<typeof ValuationSignal>): string {
  switch (signal) {
    case "STRONG_BUY": return "#10b981";
    case "UNDERVALUED": return "#4ade80";
    case "FAIR_VALUE": return "#6b7280";
    case "OVERVALUED": return "#ef4444";
  }
}

export function signalToLabel(signal: z.infer<typeof ValuationSignal>): string {
  switch (signal) {
    case "STRONG_BUY": return "Fortement sous-évalué";
    case "UNDERVALUED": return "Sous-évalué";
    case "FAIR_VALUE": return "Juste prix";
    case "OVERVALUED": return "Surévalué";
  }
}
