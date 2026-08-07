import { useState } from "react";
import { ActionPlanItem } from "../types";
import { getOriginalDeadlineMonth } from "../lib/planMonth";

// Centraliza a regra de negócio de conclusão de um plano de ação 5W2H:
// - desmarcar um plano concluído nunca precisa de confirmação;
// - marcar como concluído exige perguntar se foi no prazo ou com atraso
//   (e, se atrasado, em qual mês), antes de persistir qualquer coisa.
// Usado tanto em ActionPlans.tsx quanto em PerformanceDashboard.tsx para
// evitar duplicar essa lógica nos dois lugares.
export function useActionPlanCompletionToggle(onUpdatePlan: (updated: ActionPlanItem) => void) {
  const [pendingPlan, setPendingPlan] = useState<ActionPlanItem | null>(null);

  const requestToggle = (plan: ActionPlanItem) => {
    if (plan.completed) {
      onUpdatePlan({
        ...plan,
        completed: false,
        completionType: null,
        actualCompletionMonth: null
      });
      return;
    }
    setPendingPlan(plan);
  };

  const cancel = () => setPendingPlan(null);

  const confirmOnTime = () => {
    if (!pendingPlan) return;
    const originalMonth = getOriginalDeadlineMonth(pendingPlan);
    onUpdatePlan({
      ...pendingPlan,
      completed: true,
      completionType: "no_prazo",
      actualCompletionMonth: originalMonth
    });
    setPendingPlan(null);
  };

  const confirmLate = (actualCompletionMonth: number) => {
    if (!pendingPlan) return;
    onUpdatePlan({
      ...pendingPlan,
      completed: true,
      completionType: "atrasado",
      actualCompletionMonth
    });
    setPendingPlan(null);
  };

  return { pendingPlan, requestToggle, cancel, confirmOnTime, confirmLate };
}
