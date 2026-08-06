import { OmiFinalMeasurement } from "./supabase";

export interface MonthlyIndicatorResult {
  month: number;
  result: number | null;
}

function calculateLast(results: MonthlyIndicatorResult[]) {
  const valid = results
    .filter(r => r.result !== null)
    .sort((a, b) => b.month - a.month);

  return valid.length ? valid[0].result : null;
}

function calculateAverage(results: MonthlyIndicatorResult[]) {
  const valid = results.filter(r => r.result !== null);

  if (valid.length === 0) return null;

  return (
    valid.reduce((sum, r) => sum + Number(r.result), 0) /
    valid.length
  );
}

function calculateSum(results: MonthlyIndicatorResult[]) {
  const valid = results.filter(r => r.result !== null);

  if (valid.length === 0) return null;

  return valid.reduce((sum, r) => sum + Number(r.result), 0);
}

function calculateYTD(results: MonthlyIndicatorResult[]) {
  return calculateSum(results);
}

const strategies = {
  last: calculateLast,
  average: calculateAverage,
  sum: calculateSum,
  ytd: calculateYTD
};

export function calculateIndicatorResult(
  measurement: OmiFinalMeasurement,
  results: MonthlyIndicatorResult[]
) {
  return strategies[measurement](results);
}