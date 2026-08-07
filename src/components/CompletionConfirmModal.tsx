import React, { useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { ActionPlanItem } from "../types";
import { MONTHS_FULL, getOriginalDeadlineMonth } from "../lib/planMonth";

interface CompletionConfirmModalProps {
  plan: ActionPlanItem | null;
  onCancel: () => void;
  onConfirmOnTime: () => void;
  onConfirmLate: (actualCompletionMonth: number) => void;
}

export default function CompletionConfirmModal({
  plan,
  onCancel,
  onConfirmOnTime,
  onConfirmLate
}: CompletionConfirmModalProps) {
  const [choice, setChoice] = useState<"no_prazo" | "atrasado" | null>(null);
  const [lateMonth, setLateMonth] = useState<string>("");

  if (!plan) return null;

  const originalMonthIdx = getOriginalDeadlineMonth(plan);
  const originalMonthLabel = originalMonthIdx !== null ? MONTHS_FULL[originalMonthIdx] : "não definido";

  const handleClose = () => {
    setChoice(null);
    setLateMonth("");
    onCancel();
  };

  const handleConfirm = () => {
    if (choice === "no_prazo") {
      onConfirmOnTime();
      setChoice(null);
      setLateMonth("");
    } else if (choice === "atrasado" && lateMonth !== "") {
      onConfirmLate(parseInt(lateMonth, 10));
      setChoice(null);
      setLateMonth("");
    }
  };

  const canConfirm = choice === "no_prazo" || (choice === "atrasado" && lateMonth !== "");

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-100 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 animate-out fade-out zoom-out-95">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-slate-900">
              A ação foi concluída dentro do prazo previsto?
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Prazo originalmente previsto: <strong>{originalMonthLabel}</strong>. Essa resposta define
              como o plano <strong>"{plan.what}"</strong> aparecerá no Painel de Desempenho.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setChoice("no_prazo")}
            className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              choice === "no_prazo"
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-white border-slate-200 text-slate-700 hover:border-emerald-200"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Sim, concluída no prazo
          </button>

          <button
            type="button"
            onClick={() => setChoice("atrasado")}
            className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              choice === "atrasado"
                ? "bg-amber-50 border-amber-300 text-amber-700"
                : "bg-white border-slate-200 text-slate-700 hover:border-amber-200"
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            Não, concluída com atraso
          </button>

          {choice === "atrasado" && (
            <div className="pl-1 pt-1 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                Mês em que a ação foi concluída *
              </label>
              <select
                value={lateMonth}
                onChange={(e) => setLateMonth(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white font-semibold text-slate-700 outline-hidden focus:border-amber-400"
              >
                <option value="">Selecione o mês...</option>
                {MONTHS_FULL.map((name, idx) => (
                  <option key={name} value={idx}>{name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-slate-200 text-slate-655 bg-white font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Confirmar Conclusão
          </button>
        </div>
      </div>
    </div>
  );
}
