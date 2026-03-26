import type {
  CompanyAsset,
  DCFResult,
  DCFParameters,
  DcfScenarios,
  DcfScenarioId,
  DcfScenarioResult,
  DcfSensitivityMatrix3x3,
  DcfSensitivityCell3x3,
  FeatureAvailability,
  FundamentalMomentumResult,
  RelativeMultiplesSummary,
  RelativeMultipleResult,
  RelativeMultipleKey,
  StockEvaluationV2,
  ValuationMethodResult,
  ValuationTriangulation,
  FullValuationResult,
  FundamentalRatios,
  MoatScore,
  RelativeValuation,
  SensitivityCell,
  WACCBreakdown,
} from "@/types";
import { safetyMarginToSignal } from "@/types";

// ═════════════════════════════════════════════════════════════════════════════
// A. ANALYSE FONDAMENTALE — RATIOS HISTORIQUES
// ═════════════════════════════════════════════════════════════════════════════

export function cagr(
  startValue: number,
  endValue: number,
  years: number
): number {
  if (years <= 0) return 0;
  if (startValue <= 0 && endValue <= 0) return 0;
  if (startValue <= 0 || endValue <= 0) return 0;
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

export function yoyGrowth(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 1 : current < 0 ? -1 : 0;
  return (current - previous) / Math.abs(previous);
}

export function roic(
  ebit: number,
  taxRate: number,
  investedCapital: number
): number {
  if (investedCapital === 0) return 0;
  return (ebit * (1 - taxRate)) / investedCapital;
}

export function roe(netIncome: number, shareholdersEquity: number): number {
  if (shareholdersEquity === 0) return 0;
  return netIncome / shareholdersEquity;
}

export function netDebt(
  shortTermDebt: number,
  longTermDebt: number,
  cashAndEquivalents: number
): number {
  return shortTermDebt + longTermDebt - cashAndEquivalents;
}

export function leverageRatio(netDebtValue: number, ebitda: number): number {
  if (ebitda <= 0) return netDebtValue > 0 ? Infinity : 0;
  return netDebtValue / ebitda;
}

export function currentRatio(
  currentAssets: number,
  currentLiabilities: number
): number {
  if (currentLiabilities === 0) return Infinity;
  return currentAssets / currentLiabilities;
}

export function computeFundamentalRatios(
  asset: CompanyAsset
): FundamentalRatios[] {
  const { incomeStatements, balanceSheets, cashFlowStatements, currentMetrics } =
    asset;

  return incomeStatements.map((is, idx) => {
    const bs = balanceSheets[idx];
    const cf = cashFlowStatements[idx];
    if (!bs || !cf) {
      return {
        year: is.year,
        roic: 0,
        roe: 0,
        netDebt: 0,
        leverageRatio: 0,
        currentRatio: 0,
        fcfYield: 0,
      };
    }

    const nd = netDebt(bs.shortTermDebt, bs.longTermDebt, bs.cashAndEquivalents);
    const mcap = asset.currentMetrics.marketCap;

    const ratios: FundamentalRatios = {
      year: is.year,
      roic: roic(is.ebit, currentMetrics.effectiveTaxRate, bs.investedCapital),
      roe: roe(is.netIncome, bs.shareholdersEquity),
      netDebt: nd,
      leverageRatio: leverageRatio(nd, is.ebitda),
      currentRatio: currentRatio(bs.currentAssets, bs.currentLiabilities),
      fcfYield: mcap > 0 ? cf.freeCashFlow / mcap : 0,
    };

    if (idx >= 2) {
      const startIS = incomeStatements[0];
      const years = is.year - startIS.year;
      if (years > 0) {
        ratios.revenueCAGR = cagr(startIS.revenue, is.revenue, years);
        ratios.epsCAGR = cagr(
          Math.abs(startIS.eps),
          Math.abs(is.eps),
          years
        );
        const startCF = cashFlowStatements[0];
        if (startCF && startCF.freeCashFlow > 0 && cf.freeCashFlow > 0) {
          ratios.fcfCAGR = cagr(startCF.freeCashFlow, cf.freeCashFlow, years);
        }
      }
    }

    return ratios;
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// A-bis. MOMENTUM — TENDANCES ET SIGNAUX
// ═════════════════════════════════════════════════════════════════════════════

export interface MomentumEntry {
  year: number;
  revenueGrowth: number;
  opexGrowth: number;
  grossMargin: number;
  netMargin: number;
  fcfGrowth: number;
  earningsMomentum: number; // revenue growth - opex growth (positive = expanding leverage)
}

export interface MomentumSignal {
  label: string;
  description: string;
  strength: "strong_positive" | "positive" | "neutral" | "negative" | "strong_negative";
}

export interface MomentumAnalysis {
  entries: MomentumEntry[];
  signals: MomentumSignal[];
  overallScore: number; // -100 to +100
}

export function computeMomentum(asset: CompanyAsset): MomentumAnalysis | null {
  const { incomeStatements: iss, cashFlowStatements: cfs } = asset;
  if (iss.length < 2) return null;

  const entries: MomentumEntry[] = [];
  for (let i = 1; i < iss.length; i++) {
    const prev = iss[i - 1];
    const curr = iss[i];
    const prevCf = cfs[i - 1];
    const currCf = cfs[i];

    const revG = yoyGrowth(prev.revenue, curr.revenue);
    const opexG = yoyGrowth(prev.operatingExpenses, curr.operatingExpenses);
    const fcfG = prevCf && currCf ? yoyGrowth(prevCf.freeCashFlow, currCf.freeCashFlow) : 0;

    entries.push({
      year: curr.year,
      revenueGrowth: revG,
      opexGrowth: opexG,
      grossMargin: curr.grossMargin,
      netMargin: curr.netMargin,
      fcfGrowth: fcfG,
      earningsMomentum: revG - opexG,
    });
  }

  const signals: MomentumSignal[] = [];
  let score = 0;

  // Signal 1: Revenue acceleration
  if (entries.length >= 2) {
    const recent = entries.slice(-2);
    const accelerating = recent[1].revenueGrowth > recent[0].revenueGrowth && recent[1].revenueGrowth > 0;
    const decelerating = recent[1].revenueGrowth < recent[0].revenueGrowth && recent[1].revenueGrowth > 0;
    const declining = recent[1].revenueGrowth < 0;

    if (accelerating) {
      signals.push({
        label: "Accélération du CA",
        description: `La croissance du chiffre d'affaires accélère : ${(recent[0].revenueGrowth * 100).toFixed(1)}% → ${(recent[1].revenueGrowth * 100).toFixed(1)}%.`,
        strength: "strong_positive",
      });
      score += 25;
    } else if (decelerating) {
      signals.push({
        label: "Décélération du CA",
        description: `Le CA croît mais ralentit : ${(recent[0].revenueGrowth * 100).toFixed(1)}% → ${(recent[1].revenueGrowth * 100).toFixed(1)}%.`,
        strength: "neutral",
      });
    } else if (declining) {
      signals.push({
        label: "Décroissance du CA",
        description: `Le chiffre d'affaires recule de ${(Math.abs(recent[1].revenueGrowth) * 100).toFixed(1)}% sur le dernier exercice.`,
        strength: "strong_negative",
      });
      score -= 25;
    }
  }

  // Signal 2: Earnings expansion — revenue up, expenses down/stable
  const lastEntry = entries[entries.length - 1];
  if (lastEntry.earningsMomentum > 0.05) {
    signals.push({
      label: "Levier Opérationnel Positif",
      description: `Le CA croît plus vite (+${(lastEntry.revenueGrowth * 100).toFixed(1)}%) que les dépenses (+${(lastEntry.opexGrowth * 100).toFixed(1)}%). Signal d'explosion potentielle de la profitabilité.`,
      strength: lastEntry.earningsMomentum > 0.10 ? "strong_positive" : "positive",
    });
    score += lastEntry.earningsMomentum > 0.10 ? 30 : 15;
  } else if (lastEntry.earningsMomentum < -0.05) {
    signals.push({
      label: "Levier Opérationnel Négatif",
      description: `Les dépenses croissent (+${(lastEntry.opexGrowth * 100).toFixed(1)}%) plus vite que le CA (+${(lastEntry.revenueGrowth * 100).toFixed(1)}%). Compression des marges en cours.`,
      strength: lastEntry.earningsMomentum < -0.10 ? "strong_negative" : "negative",
    });
    score += lastEntry.earningsMomentum < -0.10 ? -30 : -15;
  }

  // Signal 3: Margin expansion over 3+ years
  if (entries.length >= 3) {
    const last3 = entries.slice(-3);
    const marginExpanding = last3.every((e, i) => i === 0 || e.grossMargin > last3[i - 1].grossMargin);
    const marginContracting = last3.every((e, i) => i === 0 || e.grossMargin < last3[i - 1].grossMargin);

    if (marginExpanding) {
      signals.push({
        label: "Marges Brutes en Expansion",
        description: `Marge brute en hausse sur 3 exercices consécutifs : ${(last3[0].grossMargin * 100).toFixed(1)}% → ${(last3[2].grossMargin * 100).toFixed(1)}%. Pricing power confirmé.`,
        strength: "strong_positive",
      });
      score += 20;
    } else if (marginContracting) {
      signals.push({
        label: "Marges Brutes en Contraction",
        description: `Marge brute en baisse sur 3 exercices : ${(last3[0].grossMargin * 100).toFixed(1)}% → ${(last3[2].grossMargin * 100).toFixed(1)}%. Pression sur les coûts ou les prix.`,
        strength: "negative",
      });
      score -= 20;
    }
  }

  // Signal 4: FCF momentum
  if (entries.length >= 2) {
    const last2 = entries.slice(-2);
    if (last2[1].fcfGrowth > 0.20) {
      signals.push({
        label: "Cash-Flow Libre en Forte Hausse",
        description: `Le FCF progresse de +${(last2[1].fcfGrowth * 100).toFixed(0)}% sur le dernier exercice. Capacité d'autofinancement renforcée.`,
        strength: "strong_positive",
      });
      score += 20;
    } else if (last2[1].fcfGrowth < -0.20) {
      signals.push({
        label: "Cash-Flow Libre en Forte Baisse",
        description: `Le FCF recule de ${(Math.abs(last2[1].fcfGrowth) * 100).toFixed(0)}%. Consommation de cash accrue.`,
        strength: "negative",
      });
      score -= 20;
    }
  }

  // Signal 5: Net margin trend
  if (entries.length >= 2) {
    const last2 = entries.slice(-2);
    const netMarginDelta = last2[1].netMargin - last2[0].netMargin;
    if (netMarginDelta > 0.03) {
      signals.push({
        label: "Marge Nette en Amélioration",
        description: `Marge nette en hausse de +${(netMarginDelta * 100).toFixed(1)} pts : ${(last2[0].netMargin * 100).toFixed(1)}% → ${(last2[1].netMargin * 100).toFixed(1)}%.`,
        strength: "positive",
      });
      score += 10;
    } else if (netMarginDelta < -0.03) {
      signals.push({
        label: "Marge Nette en Détérioration",
        description: `Marge nette en recul de ${(Math.abs(netMarginDelta) * 100).toFixed(1)} pts.`,
        strength: "negative",
      });
      score -= 10;
    }
  }

  return {
    entries,
    signals,
    overallScore: Math.max(-100, Math.min(100, score)),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// B. MODÈLE DCF (Discounted Cash Flows)
// ═════════════════════════════════════════════════════════════════════════════

export function computeCostOfEquity(
  riskFreeRate: number,
  beta: number,
  equityRiskPremium: number
): number {
  return riskFreeRate + beta * equityRiskPremium;
}

export function computeWACC(asset: CompanyAsset, params: DCFParameters): WACCBreakdown {
  const { currentMetrics } = asset;
  const lastBS = asset.balanceSheets[asset.balanceSheets.length - 1];

  const ke = computeCostOfEquity(
    params.riskFreeRate,
    currentMetrics.beta,
    params.equityRiskPremium
  );

  const kd = currentMetrics.costOfDebt;
  const totalDebt = lastBS.shortTermDebt + lastBS.longTermDebt;
  const equityValue = currentMetrics.marketCap;
  const totalValue = equityValue + totalDebt;

  const equityWeight = totalValue > 0 ? equityValue / totalValue : 1;
  const debtWeight = totalValue > 0 ? totalDebt / totalValue : 0;

  const wacc =
    equityWeight * ke + debtWeight * kd * (1 - currentMetrics.effectiveTaxRate);

  return {
    costOfEquity: ke,
    costOfDebt: kd,
    equityWeight,
    debtWeight,
    wacc: params.manualWACC ?? wacc,
  };
}

export function computeTerminalValue(
  lastFCF: number,
  wacc: number,
  terminalGrowth: number
): number {
  const safeG = Math.min(terminalGrowth, wacc - 0.005);
  if (wacc <= safeG) return 0;
  return (lastFCF * (1 + safeG)) / (wacc - safeG);
}

export function computeDCF(
  asset: CompanyAsset,
  params: DCFParameters,
  waccBreakdown: WACCBreakdown
): DCFResult {
  const lastCF =
    asset.cashFlowStatements[asset.cashFlowStatements.length - 1];
  const lastBS = asset.balanceSheets[asset.balanceSheets.length - 1];
  const baseFCF = lastCF.freeCashFlow;
  const wacc = waccBreakdown.wacc;

  const projectedFCFs: { year: number; fcf: number; discountedFCF: number }[] =
    [];

  for (let t = 1; t <= params.projectionYears; t++) {
    const fcf = baseFCF * Math.pow(1 + params.fcfGrowthRate, t);
    const discounted = fcf / Math.pow(1 + wacc, t);
    projectedFCFs.push({
      year: lastCF.year + t,
      fcf,
      discountedFCF: discounted,
    });
  }

  const lastProjectedFCF = projectedFCFs[projectedFCFs.length - 1].fcf;
  const terminalValue = computeTerminalValue(
    lastProjectedFCF,
    wacc,
    params.terminalGrowthRate
  );
  const discountedTV =
    terminalValue / Math.pow(1 + wacc, params.projectionYears);

  const sumDiscountedFCFs = projectedFCFs.reduce(
    (sum, p) => sum + p.discountedFCF,
    0
  );
  const enterpriseValue = sumDiscountedFCFs + discountedTV;

  const nd = netDebt(
    lastBS.shortTermDebt,
    lastBS.longTermDebt,
    lastBS.cashAndEquivalents
  );
  const equityValue = enterpriseValue - nd;
  const intrinsicValuePerShare =
    equityValue / asset.currentMetrics.sharesOutstanding;

  return {
    projectedFCFs,
    terminalValue,
    discountedTerminalValue: discountedTV,
    enterpriseValue,
    netDebt: nd,
    equityValue,
    intrinsicValuePerShare: Math.max(intrinsicValuePerShare, 0),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// C. VALORISATION RELATIVE (Multiples)
// ═════════════════════════════════════════════════════════════════════════════

export function computeRelativeValuation(
  asset: CompanyAsset
): RelativeValuation {
  const lastIS = asset.incomeStatements[asset.incomeStatements.length - 1];
  const lastBS = asset.balanceSheets[asset.balanceSheets.length - 1];
  const lastCF = asset.cashFlowStatements[asset.cashFlowStatements.length - 1];
  const { sectorData, currentMetrics } = asset;

  const impliedPricePER = sectorData.averagePER * lastIS.eps;

  const nd = netDebt(
    lastBS.shortTermDebt,
    lastBS.longTermDebt,
    lastBS.cashAndEquivalents
  );
  const impliedEV = sectorData.averageEVtoEBITDA * lastIS.ebitda;
  const impliedPriceEVtoEBITDA =
    (impliedEV - nd) / currentMetrics.sharesOutstanding;

  const fcfPerShare = lastCF.freeCashFlow / currentMetrics.sharesOutstanding;
  const impliedPricePFCF = sectorData.averagePriceToFCF * fcfPerShare;

  const averageRelativeValue =
    (Math.max(impliedPricePER, 0) +
      Math.max(impliedPriceEVtoEBITDA, 0) +
      Math.max(impliedPricePFCF, 0)) /
    3;

  return {
    impliedPricePER: Math.max(impliedPricePER, 0),
    impliedPriceEVtoEBITDA: Math.max(impliedPriceEVtoEBITDA, 0),
    impliedPricePFCF: Math.max(impliedPricePFCF, 0),
    averageRelativeValue,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// D. SCORE QUALITATIF (MOAT) & SYNTHÈSE FINALE
// ═════════════════════════════════════════════════════════════════════════════

export function computeMoatMultiplier(moat: MoatScore): number {
  const total = moat.pricingPower + moat.barriers + moat.management;
  return 1 + ((total - 7.5) / 7.5) * 0.1;
}

export function computeFinalFairValue(
  intrinsicValue: number,
  relativeValue: number,
  moatMultiplier: number
): number {
  return (intrinsicValue * 0.7 + relativeValue * 0.3) * moatMultiplier;
}

export function computeSafetyMargin(
  fairValue: number,
  currentPrice: number
): number {
  if (fairValue === 0) return 0;
  return (fairValue - currentPrice) / fairValue;
}

// ═════════════════════════════════════════════════════════════════════════════
// E. MATRICE DE SENSIBILITÉ
// ═════════════════════════════════════════════════════════════════════════════

export function computeSensitivityMatrix(
  asset: CompanyAsset,
  params: DCFParameters,
  baseWACC: number,
  waccSteps: number[] = [-0.02, -0.01, 0, 0.01, 0.02],
  growthSteps: number[] = [-0.01, -0.005, 0, 0.005, 0.01]
): SensitivityCell[][] {
  const matrix: SensitivityCell[][] = [];

  for (const wDelta of waccSteps) {
    const row: SensitivityCell[] = [];
    for (const gDelta of growthSteps) {
      const adjWACC = Math.max(baseWACC + wDelta, 0.02);
      const adjG = params.terminalGrowthRate + gDelta;

      const safeG = Math.min(adjG, adjWACC - 0.005);
      const adjParams: DCFParameters = {
        ...params,
        terminalGrowthRate: safeG,
        manualWACC: adjWACC,
      };
      const waccBD: WACCBreakdown = {
        costOfEquity: 0,
        costOfDebt: 0,
        equityWeight: 0,
        debtWeight: 0,
        wacc: adjWACC,
      };
      const dcf = computeDCF(asset, adjParams, waccBD);
      const relVal = computeRelativeValuation(asset);
      const fv = computeFinalFairValue(
        dcf.intrinsicValuePerShare,
        relVal.averageRelativeValue,
        1
      );

      row.push({
        wacc: adjWACC,
        terminalGrowth: params.terminalGrowthRate + gDelta,
        fairValue: fv,
      });
    }
    matrix.push(row);
  }

  return matrix;
}

// ═════════════════════════════════════════════════════════════════════════════
// F. ORCHESTRATEUR — CALCUL COMPLET
// ═════════════════════════════════════════════════════════════════════════════

export function computeFullValuation(
  asset: CompanyAsset,
  params: DCFParameters,
  moat: MoatScore
): FullValuationResult {
  const waccBreakdown = computeWACC(asset, params);
  const dcf = computeDCF(asset, params, waccBreakdown);
  const relativeValuation = computeRelativeValuation(asset);
  const moatMultiplier = computeMoatMultiplier(moat);

  const finalFairValue = computeFinalFairValue(
    dcf.intrinsicValuePerShare,
    relativeValuation.averageRelativeValue,
    moatMultiplier
  );

  const safetyMargin = computeSafetyMargin(
    finalFairValue,
    asset.profile.currentPrice
  );

  const signal = safetyMarginToSignal(safetyMargin);

  const sensitivityMatrix = computeSensitivityMatrix(asset, params, waccBreakdown.wacc);

  return {
    waccBreakdown,
    dcf,
    relativeValuation,
    moatMultiplier,
    finalFairValue,
    safetyMargin,
    signal,
    sensitivityMatrix,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// G. HELPERS DE FORMATAGE
// ═════════════════════════════════════════════════════════════════════════════

export function formatCurrency(value: number, currency = "USD"): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T ${currency}`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B ${currency}`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M ${currency}`;
  return `${value.toFixed(2)} ${currency}`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatMultiple(value: number): string {
  return `${value.toFixed(1)}x`;
}

// ═════════════════════════════════════════════════════════════════════════════
// V2 — NOUVEAU MOTEUR (spec TrueStockScreener)
// ═════════════════════════════════════════════════════════════════════════════

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function median(values: number[]): number | null {
  const nums = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 === 1 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

export function isDcfApplicable(asset: CompanyAsset): { ok: boolean; reason?: string } {
  const cfs = asset.cashFlowStatements;
  if (!cfs || cfs.length < 2) return { ok: false, reason: "Historique FCF insuffisant" };
  const last = cfs[cfs.length - 1]?.freeCashFlow ?? 0;
  const prev = cfs[cfs.length - 2]?.freeCashFlow ?? 0;
  if (last < 0 && prev < 0) return { ok: false, reason: "FCF négatif sur les 2 derniers exercices" };
  return { ok: true };
}

function computeDcfScenario(
  asset: CompanyAsset,
  params: DCFParameters,
  scenario: DcfScenarioId
): DcfScenarioResult {
  const waccBreakdown = computeWACC(asset, params);
  const dcf = computeDCF(asset, params, waccBreakdown);
  return {
    scenario,
    params,
    wacc: waccBreakdown.wacc,
    fairValuePerShare: dcf.intrinsicValuePerShare,
    enterpriseValue: dcf.enterpriseValue,
    equityValue: dcf.equityValue,
    netDebt: dcf.netDebt,
    projectedFCFs: dcf.projectedFCFs,
    terminalValue: dcf.terminalValue,
  };
}

export function computeDCFScenarios(
  asset: CompanyAsset,
  baseParams: DCFParameters,
): DcfScenarios {
  const applicability = isDcfApplicable(asset);
  if (!applicability.ok) {
    return {
      applicable: false,
      reasonIfNotApplicable: applicability.reason,
      scenarios: {
        bear: computeDcfScenario(asset, baseParams, "bear"),
        base: computeDcfScenario(asset, baseParams, "base"),
        bull: computeDcfScenario(asset, baseParams, "bull"),
      },
    };
  }

  // Δ defaults (MVP) — ajustables plus tard via settings UI
  const DELTA_WACC = 0.01; // ±1%
  const DELTA_G = 0.005; // ±0.5%
  const DELTA_FCF_GROWTH = 0.03; // ±3%

  const baseWacc = computeWACC(asset, baseParams).wacc;

  const bearParams: DCFParameters = {
    ...baseParams,
    fcfGrowthRate: baseParams.fcfGrowthRate - DELTA_FCF_GROWTH,
    terminalGrowthRate: baseParams.terminalGrowthRate - DELTA_G,
    manualWACC: Math.max(baseWacc + DELTA_WACC, 0.02),
  };
  const bullParams: DCFParameters = {
    ...baseParams,
    fcfGrowthRate: baseParams.fcfGrowthRate + DELTA_FCF_GROWTH,
    terminalGrowthRate: baseParams.terminalGrowthRate + DELTA_G,
    manualWACC: Math.max(baseWacc - DELTA_WACC, 0.02),
  };

  const baseScenario = computeDcfScenario(asset, baseParams, "base");
  const discountToFairValueBase =
    baseScenario.fairValuePerShare > 0
      ? (baseScenario.fairValuePerShare - asset.profile.currentPrice) / baseScenario.fairValuePerShare
      : null;

  return {
    applicable: true,
    scenarios: {
      bear: computeDcfScenario(asset, bearParams, "bear"),
      base: baseScenario,
      bull: computeDcfScenario(asset, bullParams, "bull"),
    },
    discountToFairValueBase: discountToFairValueBase ?? undefined,
  };
}

export function computeDcfSensitivity3x3(
  asset: CompanyAsset,
  baseParams: DCFParameters
): DcfSensitivityMatrix3x3 {
  const applicability = isDcfApplicable(asset);
  if (!applicability.ok) {
    return {
      applicable: false,
      reasonIfNotApplicable: applicability.reason,
      waccValues: [],
      terminalGrowthValues: [],
      matrix: [],
    };
  }

  const baseWacc = computeWACC(asset, baseParams).wacc;
  const waccValues = [baseWacc - 0.01, baseWacc, baseWacc + 0.01].map((w) => Math.max(w, 0.02));
  const gValues = [baseParams.terminalGrowthRate - 0.01, baseParams.terminalGrowthRate, baseParams.terminalGrowthRate + 0.01];

  const matrix: DcfSensitivityCell3x3[][] = waccValues.map((w) => {
    return gValues.map((g) => {
      const safeG = Math.min(g, w - 0.005);
      const params: DCFParameters = { ...baseParams, manualWACC: w, terminalGrowthRate: safeG };
      const waccBD: WACCBreakdown = { costOfEquity: 0, costOfDebt: 0, equityWeight: 0, debtWeight: 0, wacc: w };
      const dcf = computeDCF(asset, params, waccBD);
      return {
        wacc: w,
        terminalGrowth: g,
        fairValuePerShare: dcf.intrinsicValuePerShare,
      };
    });
  });

  return {
    applicable: true,
    waccValues,
    terminalGrowthValues: gValues,
    matrix,
  };
}

function mkMultiple(
  key: RelativeMultipleKey,
  label: string,
  value: number | null,
  notes?: string
): RelativeMultipleResult {
  return {
    key,
    label,
    value: value != null && Number.isFinite(value) ? value : null,
    sectorMedian: null,
    premiumVsSectorMedianPct: null,
    notes,
  };
}

export function computeRelativeMultiples(asset: CompanyAsset): RelativeMultiplesSummary {
  const cm = asset.currentMetrics;
  const lastIS = asset.incomeStatements[asset.incomeStatements.length - 1];
  const lastBS = asset.balanceSheets[asset.balanceSheets.length - 1];
  const lastCF = asset.cashFlowStatements[asset.cashFlowStatements.length - 1];

  const price = asset.profile.currentPrice;
  const shares = cm.sharesOutstanding;
  const mcap = cm.marketCap;

  const nd = netDebt(lastBS.shortTermDebt, lastBS.longTermDebt, lastBS.cashAndEquivalents);
  const ev = mcap + nd;

  const eps = lastIS?.eps ?? null;
  const revenue = lastIS?.revenue ?? null;
  const ebitda = lastIS?.ebitda ?? null;
  const ebit = lastIS?.ebit ?? null;
  const fcf = lastCF?.freeCashFlow ?? null;
  const equity = lastBS?.shareholdersEquity ?? null;

  const bookPerShare = equity != null && shares > 0 ? equity / shares : null;

  const pe = eps && eps !== 0 ? price / eps : null;
  const ps = revenue && revenue !== 0 ? mcap / revenue : null;
  const evSales = revenue && revenue !== 0 ? ev / revenue : null;
  const evEbitda = ebitda && ebitda !== 0 ? ev / ebitda : null;
  const evEbit = ebit && ebit !== 0 ? ev / ebit : null;
  const pFcf = fcf && fcf !== 0 ? mcap / fcf : null;
  const pb = bookPerShare && bookPerShare !== 0 ? price / bookPerShare : null;

  const multiples: RelativeMultipleResult[] = [
    mkMultiple("pe", "P/E", pe, eps == null ? "EPS indisponible" : eps <= 0 ? "EPS ≤ 0 (non pertinent)" : undefined),
    mkMultiple("forwardPe", "Forward P/E", null, "Non disponible (consensus non configuré)"),
    mkMultiple("peg", "PEG", null, "Non disponible (consensus/croissance EPS non configurés)"),
    mkMultiple("evEbitda", "EV/EBITDA", evEbitda, ebitda == null ? "EBITDA indisponible" : ebitda <= 0 ? "EBITDA ≤ 0 (non pertinent)" : undefined),
    mkMultiple("evEbit", "EV/EBIT", evEbit, ebit == null ? "EBIT indisponible" : ebit <= 0 ? "EBIT ≤ 0 (non pertinent)" : undefined),
    mkMultiple("ps", "P/S", ps, revenue == null ? "Revenue indisponible" : revenue <= 0 ? "Revenue ≤ 0 (non pertinent)" : undefined),
    mkMultiple("pFcf", "P/FCF", pFcf, fcf == null ? "FCF indisponible" : fcf <= 0 ? "FCF ≤ 0 (non pertinent)" : undefined),
    mkMultiple("pb", "P/B", pb, bookPerShare == null ? "Book value indisponible" : bookPerShare <= 0 ? "Book value ≤ 0 (non pertinent)" : undefined),
    mkMultiple("evSales", "EV/Sales", evSales, revenue == null ? "Revenue indisponible" : revenue <= 0 ? "Revenue ≤ 0 (non pertinent)" : undefined),
  ];

  // Sans provider peers/sector median, on ne peut pas déterminer undervaluation relative proprement.
  // MVP: multiMethodUndervalued désactivé.
  return {
    applicable: true,
    multiples,
    multiMethodUndervalued: false,
  };
}

export function computeNavPerShare(asset: CompanyAsset): number | null {
  const lastBS = asset.balanceSheets[asset.balanceSheets.length - 1];
  const shares = asset.currentMetrics.sharesOutstanding;
  if (!lastBS || shares <= 0) return null;
  const nav = (lastBS.totalAssets - lastBS.totalLiabilities) / shares;
  return Number.isFinite(nav) ? nav : null;
}

export function computeTriangulationV2(
  asset: CompanyAsset,
  dcf: DcfScenarios,
  multiples: RelativeMultiplesSummary,
): ValuationTriangulation {
  const methods: ValuationMethodResult[] = [];

  const dcfBase = dcf.scenarios?.base?.fairValuePerShare ?? null;
  methods.push({
    method: "DCF",
    applicable: dcf.applicable && dcfBase != null,
    fairValuePerShare: dcf.applicable ? dcfBase : null,
    notes: dcf.applicable ? undefined : dcf.reasonIfNotApplicable,
  });

  // Multiples: utiliser une estimation simple via la valorisation relative existante si fondamentaux présents
  let multiplesFV: number | null = null;
  try {
    const rel = computeRelativeValuation(asset);
    multiplesFV = rel.averageRelativeValue;
  } catch {
    multiplesFV = null;
  }
  methods.push({
    method: "MULTIPLES",
    applicable: multiplesFV != null && Number.isFinite(multiplesFV),
    fairValuePerShare: multiplesFV,
    notes: "Peers/percentiles non configurés (MVP)",
  });

  const nav = computeNavPerShare(asset);
  methods.push({
    method: "NAV",
    applicable: nav != null,
    fairValuePerShare: nav,
  });

  // Placeholders (MVP)
  methods.push({ method: "DDM", applicable: false, fairValuePerShare: null, notes: "Non implémenté (MVP)" });
  methods.push({ method: "RIM", applicable: false, fairValuePerShare: null, notes: "Non implémenté (MVP)" });

  const used = methods.filter((m) => m.applicable && m.fairValuePerShare != null).slice(0, 3);
  const fvs = used.map((m) => m.fairValuePerShare!).filter((x) => Number.isFinite(x));

  const rangeMin = fvs.length ? Math.min(...fvs) : null;
  const rangeMax = fvs.length ? Math.max(...fvs) : null;
  const medianFV = median(fvs);

  const price = asset.profile.currentPrice;
  const upside = medianFV != null && price > 0 ? (medianFV - price) / price : null;
  const gap = (rangeMin != null && rangeMax != null && medianFV != null && medianFV !== 0)
    ? (rangeMax - rangeMin) / Math.abs(medianFV)
    : null;

  let conviction: ValuationTriangulation["conviction"] = "LOW";
  if (gap == null) conviction = "LOW";
  else if (gap < 0.15) conviction = "HIGH";
  else if (gap <= 0.30) conviction = "MEDIUM";
  else conviction = "LOW";

  return {
    methodsUsed: used,
    rangeMin,
    rangeMax,
    medianFairValue: medianFV,
    upsideDownsidePct: upside,
    convergenceGapPct: gap,
    conviction,
  };
}

export function computeFundamentalMomentumV2(asset: CompanyAsset, wacc: number | null): FundamentalMomentumResult {
  const iss = asset.incomeStatements;
  const bss = asset.balanceSheets;
  const cfs = asset.cashFlowStatements;

  const lastIS = iss[iss.length - 1];
  const prevIS = iss.length >= 2 ? iss[iss.length - 2] : null;
  const lastBS = bss[bss.length - 1];
  const prevBS = bss.length >= 2 ? bss[bss.length - 2] : null;
  const lastCF = cfs[cfs.length - 1];
  const prevCF = cfs.length >= 2 ? cfs[cfs.length - 2] : null;

  const revenueGrowthYoY =
    prevIS && prevIS.revenue !== 0 ? (lastIS.revenue - prevIS.revenue) / Math.abs(prevIS.revenue) : null;

  const bps = (curr: number, prev: number) => (curr - prev) * 10000;

  const grossMarginBpsYoY = prevIS ? bps(lastIS.grossMargin, prevIS.grossMargin) : null;
  const ebitdaMarginBpsYoY = prevIS ? bps(lastIS.ebitdaMargin, prevIS.ebitdaMargin) : null;
  const ebitMarginBpsYoY = prevIS ? bps(lastIS.ebitMargin, prevIS.ebitMargin) : null;
  const netMarginBpsYoY = prevIS ? bps(lastIS.netMargin, prevIS.netMargin) : null;

  const fcfMargin = lastIS.revenue !== 0 ? lastCF.freeCashFlow / lastIS.revenue : null;
  const prevFcfMargin = prevIS && prevCF && prevIS.revenue !== 0 ? prevCF.freeCashFlow / prevIS.revenue : null;
  const fcfMarginBpsYoY = prevFcfMargin != null && fcfMargin != null ? bps(fcfMargin, prevFcfMargin) : null;

  const accrualRatio = lastBS.totalAssets !== 0
    ? (lastIS.netIncome - lastCF.freeCashFlow) / lastBS.totalAssets
    : null;

  const cashConversionRate = lastIS.netIncome !== 0 ? lastCF.freeCashFlow / lastIS.netIncome : null;

  const epsGrowthYoY = prevIS && prevIS.eps !== 0
    ? (lastIS.eps - prevIS.eps) / Math.abs(prevIS.eps)
    : null;

  const fcfYield = asset.currentMetrics.marketCap > 0 ? lastCF.freeCashFlow / asset.currentMetrics.marketCap : null;
  const fcfGrowthYoY = prevCF && prevCF.freeCashFlow !== 0
    ? (lastCF.freeCashFlow - prevCF.freeCashFlow) / Math.abs(prevCF.freeCashFlow)
    : null;

  const roicValue = lastBS.investedCapital !== 0
    ? roic(lastIS.ebit, asset.currentMetrics.effectiveTaxRate, lastBS.investedCapital)
    : null;
  const roicMinusWacc = roicValue != null && wacc != null ? roicValue - wacc : null;

  const nd = netDebt(lastBS.shortTermDebt, lastBS.longTermDebt, lastBS.cashAndEquivalents);
  const netDebtToEbitda = lastIS.ebitda > 0 ? nd / lastIS.ebitda : null;
  const currentRatioValue = currentRatio(lastBS.currentAssets, lastBS.currentLiabilities);
  const interestCoverage = lastIS.interestExpense !== 0 ? lastIS.ebit / Math.abs(lastIS.interestExpense) : null;

  const badges = {
    operationalLeverageConfirmed:
      (revenueGrowthYoY ?? 0) > 0 &&
      (grossMarginBpsYoY ?? 0) > 0 &&
      (ebitdaMarginBpsYoY ?? 0) > 0,
    marginErosionWarning:
      (revenueGrowthYoY ?? 0) > 0 &&
      (grossMarginBpsYoY ?? 0) < -200,
    highEarningsQuality:
      (cashConversionRate ?? 0) > 0.8 &&
      (accrualRatio ?? 1) < 0.03,
    earningsQualityWarning:
      (epsGrowthYoY ?? 0) > 0 &&
      (fcfGrowthYoY ?? 0) < 0,
    balanceSheetRisk:
      ((netDebtToEbitda ?? 0) > 4 && lastCF.freeCashFlow < 0) ||
      ((interestCoverage ?? Infinity) < 2),
  };

  return {
    revenueGrowthYoY,
    grossMarginBpsYoY,
    ebitdaMarginBpsYoY,
    ebitMarginBpsYoY,
    netMarginBpsYoY,
    fcfMarginBpsYoY,
    accrualRatio,
    cashConversionRate,
    epsGrowthYoY,
    fcfYield,
    fcfGrowthYoY,
    roic: roicValue,
    wacc,
    roicMinusWacc,
    netDebtToEbitda,
    currentRatio: Number.isFinite(currentRatioValue) ? currentRatioValue : null,
    interestCoverage,
    badges,
  };
}

export function computeCompositeMomentumScoreV2(momentum: FundamentalMomentumResult): { score0to100: number | null; partial: boolean; notes?: string } {
  // MVP: pas de revisions analystes, pas de percentile sectoriel, pas de momentum prix robuste → score partiel.
  const parts: { w: number; s: number | null }[] = [];

  // EPS momentum proxy
  if (momentum.epsGrowthYoY != null) {
    const s = clamp01((momentum.epsGrowthYoY + 0.10) / 0.40) * 100; // -10%..+30% → 0..100
    parts.push({ w: 0.35, s });
  } else {
    parts.push({ w: 0.35, s: null });
  }

  // Earnings quality proxy
  if (momentum.cashConversionRate != null && momentum.accrualRatio != null) {
    const cash = clamp01(momentum.cashConversionRate / 1.0);
    const accr = clamp01(1 - (momentum.accrualRatio / 0.08)); // 8%+ mauvais
    parts.push({ w: 0.35, s: (cash * 0.6 + accr * 0.4) * 100 });
  } else {
    parts.push({ w: 0.35, s: null });
  }

  // Balance sheet proxy
  if (momentum.netDebtToEbitda != null) {
    const nd = clamp01(1 - (momentum.netDebtToEbitda / 6)); // 0..6x
    parts.push({ w: 0.30, s: nd * 100 });
  } else {
    parts.push({ w: 0.30, s: null });
  }

  const available = parts.filter((p) => p.s != null) as { w: number; s: number }[];
  if (available.length === 0) return { score0to100: null, partial: true, notes: "Données insuffisantes" };

  const wSum = available.reduce((sum, p) => sum + p.w, 0);
  const score = available.reduce((sum, p) => sum + (p.w / wSum) * p.s, 0);
  return { score0to100: Math.round(score), partial: true, notes: "Score partiel (sans prix/revisions/percentiles)" };
}

export function computeStockEvaluationV2(
  asset: CompanyAsset,
  params: DCFParameters,
  moat: MoatScore
): StockEvaluationV2 {
  const features: FeatureAvailability = {
    estimatesAndRevisions: false,
    peersAndSectorPercentiles: false,
  };

  const dcf = computeDCFScenarios(asset, params);
  const dcfSensitivity = computeDcfSensitivity3x3(asset, params);
  const multiples = computeRelativeMultiples(asset);

  const wacc = computeWACC(asset, params).wacc;
  const momentum = computeFundamentalMomentumV2(asset, wacc);
  const compositeMomentum = computeCompositeMomentumScoreV2(momentum);

  const triangulation = computeTriangulationV2(asset, dcf, multiples);

  return {
    features,
    currentPrice: asset.profile.currentPrice,
    dcf,
    dcfSensitivity,
    multiples,
    triangulation,
    momentum,
    compositeMomentum,
  };
}
