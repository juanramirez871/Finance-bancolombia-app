import type { Account, Transaction } from "@/interfaces/income";
import { toDate } from "@/utils/income";

const MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const;

const SCALE_CANDIDATES = [
  50_000,
  100_000,
  200_000,
  500_000,
  1_000_000,
  2_000_000,
  5_000_000,
  10_000_000,
] as const;

const DEFAULT_CHART_SECTIONS = 4;

type ChartPoint = {
  label: string;
  value: number;
};

type SeriesResult = {
  chartYear: number;
  data: ChartPoint[];
  yearTotal: number;
};

type CategoriesResult = {
  data: ChartPoint[];
  topValue: number;
};

const parseAmount = (amount: string): number => {
  const clean = amount.replace(/[^0-9]/g, "");
  const numeric = parseInt(clean, 10);
  return Number.isNaN(numeric) ? 0 : numeric;
};

const getCategoryKey = (tx: Transaction): string =>
  tx.merchant?.trim() || tx.person?.trim() || tx.account_to?.trim() || tx.label;

export const getScaleStep = (stepRaw: number): number =>
  SCALE_CANDIDATES.find((candidate) => candidate >= stepRaw) ??
  Math.ceil(stepRaw / 10_000_000) * 10_000_000;

export const buildScale = (values: number[], noOfSections = DEFAULT_CHART_SECTIONS) => {
  const max = Math.max(...values, 1);
  const stepValue = getScaleStep(Math.ceil(max / noOfSections));

  return {
    maxValue: stepValue * noOfSections,
    noOfSections,
    stepValue,
  };
};

export const formatCOP = (value: number): string =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

export const formatCompactCOP = (value: number): string => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }

  if (abs >= 1_000) {
    return `$${Math.round(value / 1_000)}k`;
  }

  return `$${value}`;
};

export const buildAnnualSeriesFromTransactions = (transactions: Transaction[]): SeriesResult => {
  const monthlyTotals: Record<string, number> = {};
  let latestTs: number | null = null;

  transactions.forEach((tx) => {
    if (!tx.date) {
      return;
    }

    const numeric = parseAmount(tx.amount);
    if (numeric <= 0) {
      return;
    }

    const date = toDate(tx.date);
    const ts = date.getTime();
    if (Number.isNaN(ts)) {
      return;
    }

    if (latestTs === null || ts > latestTs) {
      latestTs = ts;
    }

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyTotals[monthKey] = (monthlyTotals[monthKey] ?? 0) + numeric;
  });

  const chartYear = latestTs !== null ? new Date(latestTs).getFullYear() : new Date().getFullYear();
  let yearTotal = 0;

  const data = MONTHS.map((label, index) => {
    const monthKey = `${chartYear}-${String(index + 1).padStart(2, "0")}`;
    const value = monthlyTotals[monthKey] ?? 0;
    yearTotal += value;

    return { label, value };
  });

  return { chartYear, data, yearTotal };
};

export const buildAnnualSeriesFromAccounts = (accounts: Account[]): SeriesResult =>
  buildAnnualSeriesFromTransactions(accounts.flatMap((account) => account.transactions));

export const buildTopCategoriesFromTransactions = (
  transactions: Transaction[],
  limit = 12,
): CategoriesResult => {
  const totals: Record<string, number> = {};

  transactions.forEach((tx) => {
    const numeric = parseAmount(tx.amount);
    if (numeric <= 0) {
      return;
    }

    const key = getCategoryKey(tx);
    totals[key] = (totals[key] ?? 0) + numeric;
  });

  const data = Object.entries(totals)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  return {
    data,
    topValue: data[0]?.value ?? 0,
  };
};

export const buildTopCategoriesFromAccounts = (accounts: Account[], limit = 12): CategoriesResult =>
  buildTopCategoriesFromTransactions(
    accounts.flatMap((account) => account.transactions),
    limit,
  );
