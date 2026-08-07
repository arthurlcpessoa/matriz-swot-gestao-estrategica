import { ActionPlanItem } from "../types";

export const MONTHS_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const MONTHS_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export type CompletionType = "no_prazo" | "atrasado";

// Detecta qual mês um texto livre de prazo (campo "when") se refere.
// Usada tanto para exibir o prazo atual quanto, uma única vez, para
// congelar o prazo original de um plano recém-criado.
export function parseMonthFromWhen(whenStr: string | null | undefined): number | null {
  if (!whenStr) return null;
  const clean = whenStr.toLowerCase().trim();

  const ptMonths = [
    ["janeiro", "jan"],
    ["fevereiro", "fev"],
    ["março", "mar"],
    ["abril", "abr"],
    ["maio", "mai"],
    ["junho", "jun"],
    ["julho", "jul"],
    ["agosto", "ago"],
    ["setembro", "set"],
    ["outubro", "out"],
    ["novembro", "nov"],
    ["dezembro", "dez"]
  ];

  for (let i = 0; i < ptMonths.length; i++) {
    for (const token of ptMonths[i]) {
      if (clean.includes(token)) {
        return i;
      }
    }
  }

  // Tentar extrair por número (ex: 01/2026 ou apenas /02/ ou -03-)
  const numRegex = /(?:0[1-9]|1[0-2])\b/;
  const match = clean.match(numRegex);
  if (match) {
    const num = parseInt(match[0], 10);
    if (num >= 1 && num <= 12) {
      return num - 1;
    }
  }

  return null;
}

// Mês previsto original do plano (baseline imutável do Painel de Desempenho).
// Faz fallback para o parser de "when" apenas enquanto o plano ainda não foi
// persistido/congelado (originalDeadlineMonth ausente).
export function getOriginalDeadlineMonth(plan: Pick<ActionPlanItem, "originalDeadlineMonth" | "when">): number | null {
  if (plan.originalDeadlineMonth !== undefined && plan.originalDeadlineMonth !== null) {
    return plan.originalDeadlineMonth;
  }
  return parseMonthFromWhen(plan.when);
}
