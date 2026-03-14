import type {
  CompanyAsset,
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  PricePoint,
  FairValuePoint,
} from "@/types";

// ═════════════════════════════════════════════════════════════════════════════
// ENTREPRISE 1 : NovaTech Solutions (NVTS)
// ─────────────────────────────────────────────────────────────────────────────
// Profil : SaaS B2B à forte croissance, marges en expansion,
//          dette faible, CAPEX léger — archétype "growth quality".
// ═════════════════════════════════════════════════════════════════════════════

const nvtsIncomeStatements: IncomeStatement[] = [
  {
    year: 2021,
    revenue: 3_200_000_000,
    costOfRevenue: 1_120_000_000,
    grossProfit: 2_080_000_000,
    grossMargin: 0.65,
    operatingExpenses: 1_600_000_000,
    ebit: 480_000_000,
    ebitMargin: 0.15,
    ebitda: 640_000_000,
    ebitdaMargin: 0.20,
    interestExpense: 45_000_000,
    incomeTax: 91_000_000,
    netIncome: 344_000_000,
    netMargin: 0.1075,
    eps: 1.72,
  },
  {
    year: 2022,
    revenue: 3_840_000_000,
    costOfRevenue: 1_305_600_000,
    grossProfit: 2_534_400_000,
    grossMargin: 0.66,
    operatingExpenses: 1_843_200_000,
    ebit: 691_200_000,
    ebitMargin: 0.18,
    ebitda: 883_200_000,
    ebitdaMargin: 0.23,
    interestExpense: 42_000_000,
    incomeTax: 136_000_000,
    netIncome: 513_200_000,
    netMargin: 0.1336,
    eps: 2.57,
  },
  {
    year: 2023,
    revenue: 4_608_000_000,
    costOfRevenue: 1_520_640_000,
    grossProfit: 3_087_360_000,
    grossMargin: 0.67,
    operatingExpenses: 2_073_600_000,
    ebit: 1_013_760_000,
    ebitMargin: 0.22,
    ebitda: 1_244_160_000,
    ebitdaMargin: 0.27,
    interestExpense: 38_000_000,
    incomeTax: 204_000_000,
    netIncome: 771_760_000,
    netMargin: 0.1675,
    eps: 3.86,
  },
  {
    year: 2024,
    revenue: 5_529_600_000,
    costOfRevenue: 1_768_000_000,
    grossProfit: 3_761_600_000,
    grossMargin: 0.68,
    operatingExpenses: 2_377_700_000,
    ebit: 1_383_900_000,
    ebitMargin: 0.2503,
    ebitda: 1_658_880_000,
    ebitdaMargin: 0.30,
    interestExpense: 35_000_000,
    incomeTax: 283_000_000,
    netIncome: 1_065_900_000,
    netMargin: 0.1928,
    eps: 5.33,
  },
  {
    year: 2025,
    revenue: 6_524_900_000,
    costOfRevenue: 2_022_700_000,
    grossProfit: 4_502_200_000,
    grossMargin: 0.69,
    operatingExpenses: 2_739_700_000,
    ebit: 1_762_500_000,
    ebitMargin: 0.2702,
    ebitda: 2_087_200_000,
    ebitdaMargin: 0.32,
    interestExpense: 30_000_000,
    incomeTax: 363_000_000,
    netIncome: 1_369_500_000,
    netMargin: 0.2099,
    eps: 6.85,
  },
];

const nvtsBalanceSheets: BalanceSheet[] = [
  {
    year: 2021,
    cashAndEquivalents: 1_200_000_000,
    currentAssets: 2_100_000_000,
    totalAssets: 8_500_000_000,
    currentLiabilities: 1_400_000_000,
    shortTermDebt: 200_000_000,
    longTermDebt: 1_800_000_000,
    totalLiabilities: 3_800_000_000,
    shareholdersEquity: 4_700_000_000,
    investedCapital: 5_300_000_000,
  },
  {
    year: 2022,
    cashAndEquivalents: 1_550_000_000,
    currentAssets: 2_500_000_000,
    totalAssets: 9_800_000_000,
    currentLiabilities: 1_550_000_000,
    shortTermDebt: 150_000_000,
    longTermDebt: 1_600_000_000,
    totalLiabilities: 3_900_000_000,
    shareholdersEquity: 5_900_000_000,
    investedCapital: 5_950_000_000,
  },
  {
    year: 2023,
    cashAndEquivalents: 2_100_000_000,
    currentAssets: 3_200_000_000,
    totalAssets: 11_500_000_000,
    currentLiabilities: 1_700_000_000,
    shortTermDebt: 100_000_000,
    longTermDebt: 1_400_000_000,
    totalLiabilities: 3_800_000_000,
    shareholdersEquity: 7_700_000_000,
    investedCapital: 7_000_000_000,
  },
  {
    year: 2024,
    cashAndEquivalents: 2_800_000_000,
    currentAssets: 4_000_000_000,
    totalAssets: 13_800_000_000,
    currentLiabilities: 1_900_000_000,
    shortTermDebt: 80_000_000,
    longTermDebt: 1_200_000_000,
    totalLiabilities: 3_900_000_000,
    shareholdersEquity: 9_900_000_000,
    investedCapital: 8_280_000_000,
  },
  {
    year: 2025,
    cashAndEquivalents: 3_500_000_000,
    currentAssets: 4_900_000_000,
    totalAssets: 16_200_000_000,
    currentLiabilities: 2_100_000_000,
    shortTermDebt: 50_000_000,
    longTermDebt: 1_000_000_000,
    totalLiabilities: 3_900_000_000,
    shareholdersEquity: 12_300_000_000,
    investedCapital: 9_850_000_000,
  },
];

const nvtsCashFlows: CashFlowStatement[] = [
  {
    year: 2021,
    operatingCashFlow: 580_000_000,
    capitalExpenditures: -180_000_000,
    freeCashFlow: 400_000_000,
    dividendsPaid: 0,
    shareRepurchases: -100_000_000,
  },
  {
    year: 2022,
    operatingCashFlow: 820_000_000,
    capitalExpenditures: -200_000_000,
    freeCashFlow: 620_000_000,
    dividendsPaid: 0,
    shareRepurchases: -150_000_000,
  },
  {
    year: 2023,
    operatingCashFlow: 1_150_000_000,
    capitalExpenditures: -230_000_000,
    freeCashFlow: 920_000_000,
    dividendsPaid: 0,
    shareRepurchases: -200_000_000,
  },
  {
    year: 2024,
    operatingCashFlow: 1_520_000_000,
    capitalExpenditures: -270_000_000,
    freeCashFlow: 1_250_000_000,
    dividendsPaid: 0,
    shareRepurchases: -300_000_000,
  },
  {
    year: 2025,
    operatingCashFlow: 1_900_000_000,
    capitalExpenditures: -310_000_000,
    freeCashFlow: 1_590_000_000,
    dividendsPaid: -100_000_000,
    shareRepurchases: -400_000_000,
  },
];

function generateNVTSPriceHistory(): PricePoint[] {
  const points: PricePoint[] = [];
  let price = 42;
  const startDate = new Date("2021-01-04");

  for (let i = 0; i < 1100; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const trend = 0.0004;
    const volatility = 0.025;
    const change = 1 + trend + (Math.random() - 0.48) * volatility;
    price = Math.max(price * change, 10);

    const dayRange = price * (0.01 + Math.random() * 0.03);
    const open = price + (Math.random() - 0.5) * dayRange * 0.5;
    const high = Math.max(open, price) + Math.random() * dayRange * 0.3;
    const low = Math.min(open, price) - Math.random() * dayRange * 0.3;

    points.push({
      time: date.toISOString().split("T")[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(Math.max(low, 1).toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume: Math.floor(2_000_000 + Math.random() * 8_000_000),
    });
  }
  return points;
}

function generateNVTSFairValueHistory(): FairValuePoint[] {
  const estimates = [
    { year: 2021, value: 55 },
    { year: 2022, value: 72 },
    { year: 2023, value: 95 },
    { year: 2024, value: 120 },
    { year: 2025, value: 148 },
  ];
  const points: FairValuePoint[] = [];
  for (const est of estimates) {
    for (let m = 0; m < 12; m++) {
      const month = String(m + 1).padStart(2, "0");
      points.push({
        time: `${est.year}-${month}-15`,
        value: est.value + (Math.random() - 0.5) * 3,
      });
    }
  }
  return points;
}

export const NOVATECH: CompanyAsset = {
  profile: {
    ticker: "NVTS",
    name: "NovaTech Solutions",
    sector: "Technology",
    industry: "Enterprise SaaS / Cloud Infrastructure",
    description:
      "NovaTech Solutions est un éditeur de logiciels B2B spécialisé dans les plateformes d'observabilité et d'infrastructure cloud. La société affiche une croissance organique supérieure à 18% par an depuis 5 ans, portée par la transition des entreprises vers le multi-cloud. Son modèle d'abonnement récurrent génère des marges brutes élevées (>65%) et un Free Cash Flow en forte expansion.",
    currency: "USD",
    currentPrice: 112.5,
  },
  incomeStatements: nvtsIncomeStatements,
  balanceSheets: nvtsBalanceSheets,
  cashFlowStatements: nvtsCashFlows,
  currentMetrics: {
    sharesOutstanding: 200_000_000,
    beta: 1.25,
    effectiveTaxRate: 0.21,
    costOfDebt: 0.045,
    dividendYield: 0.004,
    marketCap: 22_500_000_000,
  },
  sectorData: {
    sectorName: "Technology — Enterprise SaaS",
    averagePER: 32,
    averageEVtoEBITDA: 22,
    averagePriceToFCF: 28,
  },
  priceHistory: generateNVTSPriceHistory(),
  fairValueHistory: generateNVTSFairValueHistory(),
};

// ═════════════════════════════════════════════════════════════════════════════
// ENTREPRISE 2 : Meridian Industries (MRID)
// ─────────────────────────────────────────────────────────────────────────────
// Profil : Conglomérat industriel mature, croissance modérée,
//          dette significative mais maîtrisée, dividende régulier,
//          marges stables — archétype "value cyclique".
// ═════════════════════════════════════════════════════════════════════════════

const mridIncomeStatements: IncomeStatement[] = [
  {
    year: 2021,
    revenue: 18_200_000_000,
    costOfRevenue: 12_740_000_000,
    grossProfit: 5_460_000_000,
    grossMargin: 0.30,
    operatingExpenses: 3_458_000_000,
    ebit: 2_002_000_000,
    ebitMargin: 0.11,
    ebitda: 2_912_000_000,
    ebitdaMargin: 0.16,
    interestExpense: 380_000_000,
    incomeTax: 340_000_000,
    netIncome: 1_282_000_000,
    netMargin: 0.0704,
    eps: 4.27,
  },
  {
    year: 2022,
    revenue: 19_110_000_000,
    costOfRevenue: 13_377_000_000,
    grossProfit: 5_733_000_000,
    grossMargin: 0.30,
    operatingExpenses: 3_630_900_000,
    ebit: 2_102_100_000,
    ebitMargin: 0.11,
    ebitda: 3_057_600_000,
    ebitdaMargin: 0.16,
    interestExpense: 395_000_000,
    incomeTax: 358_000_000,
    netIncome: 1_349_100_000,
    netMargin: 0.0706,
    eps: 4.50,
  },
  {
    year: 2023,
    revenue: 18_535_000_000,
    costOfRevenue: 13_160_000_000,
    grossProfit: 5_375_000_000,
    grossMargin: 0.29,
    operatingExpenses: 3_522_000_000,
    ebit: 1_853_000_000,
    ebitMargin: 0.10,
    ebitda: 2_780_000_000,
    ebitdaMargin: 0.15,
    interestExpense: 410_000_000,
    incomeTax: 303_000_000,
    netIncome: 1_140_000_000,
    netMargin: 0.0615,
    eps: 3.80,
  },
  {
    year: 2024,
    revenue: 20_200_000_000,
    costOfRevenue: 14_140_000_000,
    grossProfit: 6_060_000_000,
    grossMargin: 0.30,
    operatingExpenses: 3_838_000_000,
    ebit: 2_222_000_000,
    ebitMargin: 0.11,
    ebitda: 3_232_000_000,
    ebitdaMargin: 0.16,
    interestExpense: 370_000_000,
    incomeTax: 389_000_000,
    netIncome: 1_463_000_000,
    netMargin: 0.0724,
    eps: 4.88,
  },
  {
    year: 2025,
    revenue: 20_806_000_000,
    costOfRevenue: 14_564_000_000,
    grossProfit: 6_242_000_000,
    grossMargin: 0.30,
    operatingExpenses: 3_953_100_000,
    ebit: 2_288_900_000,
    ebitMargin: 0.11,
    ebitda: 3_329_000_000,
    ebitdaMargin: 0.16,
    interestExpense: 350_000_000,
    incomeTax: 407_000_000,
    netIncome: 1_531_900_000,
    netMargin: 0.0736,
    eps: 5.11,
  },
];

const mridBalanceSheets: BalanceSheet[] = [
  {
    year: 2021,
    cashAndEquivalents: 2_500_000_000,
    currentAssets: 6_800_000_000,
    totalAssets: 38_000_000_000,
    currentLiabilities: 5_200_000_000,
    shortTermDebt: 1_500_000_000,
    longTermDebt: 8_200_000_000,
    totalLiabilities: 20_000_000_000,
    shareholdersEquity: 18_000_000_000,
    investedCapital: 25_700_000_000,
  },
  {
    year: 2022,
    cashAndEquivalents: 2_200_000_000,
    currentAssets: 6_500_000_000,
    totalAssets: 39_500_000_000,
    currentLiabilities: 5_500_000_000,
    shortTermDebt: 1_800_000_000,
    longTermDebt: 8_500_000_000,
    totalLiabilities: 21_500_000_000,
    shareholdersEquity: 18_000_000_000,
    investedCapital: 26_300_000_000,
  },
  {
    year: 2023,
    cashAndEquivalents: 1_800_000_000,
    currentAssets: 6_200_000_000,
    totalAssets: 38_000_000_000,
    currentLiabilities: 5_400_000_000,
    shortTermDebt: 2_000_000_000,
    longTermDebt: 8_800_000_000,
    totalLiabilities: 22_000_000_000,
    shareholdersEquity: 16_000_000_000,
    investedCapital: 24_800_000_000,
  },
  {
    year: 2024,
    cashAndEquivalents: 2_600_000_000,
    currentAssets: 7_100_000_000,
    totalAssets: 40_500_000_000,
    currentLiabilities: 5_600_000_000,
    shortTermDebt: 1_400_000_000,
    longTermDebt: 8_000_000_000,
    totalLiabilities: 20_500_000_000,
    shareholdersEquity: 20_000_000_000,
    investedCapital: 27_400_000_000,
  },
  {
    year: 2025,
    cashAndEquivalents: 3_000_000_000,
    currentAssets: 7_500_000_000,
    totalAssets: 42_000_000_000,
    currentLiabilities: 5_800_000_000,
    shortTermDebt: 1_200_000_000,
    longTermDebt: 7_500_000_000,
    totalLiabilities: 20_000_000_000,
    shareholdersEquity: 22_000_000_000,
    investedCapital: 28_500_000_000,
  },
];

const mridCashFlows: CashFlowStatement[] = [
  {
    year: 2021,
    operatingCashFlow: 2_600_000_000,
    capitalExpenditures: -1_200_000_000,
    freeCashFlow: 1_400_000_000,
    dividendsPaid: -750_000_000,
    shareRepurchases: -300_000_000,
  },
  {
    year: 2022,
    operatingCashFlow: 2_750_000_000,
    capitalExpenditures: -1_300_000_000,
    freeCashFlow: 1_450_000_000,
    dividendsPaid: -800_000_000,
    shareRepurchases: -350_000_000,
  },
  {
    year: 2023,
    operatingCashFlow: 2_400_000_000,
    capitalExpenditures: -1_250_000_000,
    freeCashFlow: 1_150_000_000,
    dividendsPaid: -800_000_000,
    shareRepurchases: -200_000_000,
  },
  {
    year: 2024,
    operatingCashFlow: 2_900_000_000,
    capitalExpenditures: -1_350_000_000,
    freeCashFlow: 1_550_000_000,
    dividendsPaid: -850_000_000,
    shareRepurchases: -400_000_000,
  },
  {
    year: 2025,
    operatingCashFlow: 3_050_000_000,
    capitalExpenditures: -1_400_000_000,
    freeCashFlow: 1_650_000_000,
    dividendsPaid: -900_000_000,
    shareRepurchases: -450_000_000,
  },
];

function generateMRIDPriceHistory(): PricePoint[] {
  const points: PricePoint[] = [];
  let price = 95;
  const startDate = new Date("2021-01-04");

  for (let i = 0; i < 1100; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const cyclical = Math.sin(i / 180) * 0.001;
    const trend = 0.00015;
    const volatility = 0.018;
    const change = 1 + trend + cyclical + (Math.random() - 0.48) * volatility;
    price = Math.max(price * change, 40);

    const dayRange = price * (0.008 + Math.random() * 0.02);
    const open = price + (Math.random() - 0.5) * dayRange * 0.5;
    const high = Math.max(open, price) + Math.random() * dayRange * 0.3;
    const low = Math.min(open, price) - Math.random() * dayRange * 0.3;

    points.push({
      time: date.toISOString().split("T")[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(Math.max(low, 1).toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume: Math.floor(4_000_000 + Math.random() * 12_000_000),
    });
  }
  return points;
}

function generateMRIDFairValueHistory(): FairValuePoint[] {
  const estimates = [
    { year: 2021, value: 110 },
    { year: 2022, value: 115 },
    { year: 2023, value: 105 },
    { year: 2024, value: 125 },
    { year: 2025, value: 132 },
  ];
  const points: FairValuePoint[] = [];
  for (const est of estimates) {
    for (let m = 0; m < 12; m++) {
      const month = String(m + 1).padStart(2, "0");
      points.push({
        time: `${est.year}-${month}-15`,
        value: est.value + (Math.random() - 0.5) * 4,
      });
    }
  }
  return points;
}

export const MERIDIAN: CompanyAsset = {
  profile: {
    ticker: "MRID",
    name: "Meridian Industries",
    sector: "Industrials",
    industry: "Diversified Industrial Manufacturing",
    description:
      "Meridian Industries est un conglomérat industriel diversifié opérant dans l'aérospatiale, l'automatisation industrielle et les technologies de bâtiment connecté. La société affiche une croissance organique modeste (~3-5% par an) mais compense par des marges EBITDA stables (~16%), un dividende régulier en hausse depuis 12 ans, et un programme de rachats d'actions. Son profil de dette est plus élevé (levier ~2.5x EBITDA) mais reste dans les normes du secteur.",
    currency: "USD",
    currentPrice: 108.3,
  },
  incomeStatements: mridIncomeStatements,
  balanceSheets: mridBalanceSheets,
  cashFlowStatements: mridCashFlows,
  currentMetrics: {
    sharesOutstanding: 300_000_000,
    beta: 0.95,
    effectiveTaxRate: 0.21,
    costOfDebt: 0.055,
    dividendYield: 0.028,
    marketCap: 32_490_000_000,
  },
  sectorData: {
    sectorName: "Industrials — Diversified Manufacturing",
    averagePER: 18,
    averageEVtoEBITDA: 12,
    averagePriceToFCF: 16,
  },
  priceHistory: generateMRIDPriceHistory(),
  fairValueHistory: generateMRIDFairValueHistory(),
};

// ═════════════════════════════════════════════════════════════════════════════
// REGISTRE — accès rapide par ticker
// ═════════════════════════════════════════════════════════════════════════════

export const COMPANIES: Record<string, CompanyAsset> = {
  NVTS: NOVATECH,
  MRID: MERIDIAN,
};

export const COMPANY_LIST = Object.values(COMPANIES).map((c) => ({
  ticker: c.profile.ticker,
  name: c.profile.name,
  sector: c.profile.sector,
  industry: c.profile.industry,
}));
