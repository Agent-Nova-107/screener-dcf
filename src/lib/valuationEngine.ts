import type {
  CompanyAsset,
  DCFResult,
  DCFParameters,
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
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return Math.pow(endValue / startValue, 1 / years) - 1;
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

  const sensitivityMatrix = computeSensitivityMatrix(
    asset,
    params,
    waccBreakdown.wacc
  );

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
