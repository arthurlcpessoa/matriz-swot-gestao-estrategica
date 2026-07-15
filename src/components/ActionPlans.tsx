import React, { useState } from "react";
import { ClipboardList, Search, User, Calendar, DollarSign, ArrowUpRight, CheckCircle2, Circle, Eye, Edit, Trash2, Plus, X, AlertTriangle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { ActionPlanItem, RiskItem, OpportunityItem } from "../types";

// Helper para detectar qual mês o texto se refere
function parseMonthFromWhen(whenStr: string): number | null {
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

interface ActionPlansProps {
  plans: ActionPlanItem[];
  risks?: RiskItem[];
  opportunities?: OpportunityItem[];
  onUpdatePlan: (updated: ActionPlanItem) => void;
  onDeletePlan: (id: string) => void;
  onAddPlan: (newPlan: ActionPlanItem) => void;
  onRebuildPlans?: () => void;
  isEditingLocked?: boolean;
}

export default function ActionPlans({ 
  plans, 
  risks = [], 
  opportunities = [], 
  onUpdatePlan, 
  onDeletePlan, 
  onAddPlan,
  onRebuildPlans,
  isEditingLocked = false
}: ActionPlansProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState<"all" | "what" | "who" | "where" | "how" | "why" | "related">("all");
  const [typeFilter, setTypeFilter] = useState<"Todos" | "Risco" | "Oportunidade">("Todos");
  const [editingPlan, setEditingPlan] = useState<ActionPlanItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Estado para modal de confirmação personalizado
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [newPlanState, setNewPlanState] = useState<Omit<ActionPlanItem, "id">>({
    type: "Risco",
    relatedId: "",
    relatedDescription: "",
    what: "",
    why: "",
    where: "",
    when: "",
    who: "",
    how: "",
    howMuch: "",
    priority: "Média",
    suggestedKrs: []
  });

  const togglePlanCompletion = (id: string) => {
    const p = plans.find((item) => item.id === id);
    if (p) {
      onUpdatePlan({
        ...p,
        completed: !p.completed
      });
    }
  };

  const [expandedPlanIds, setExpandedPlanIds] = useState<Record<string, boolean>>({});

  const togglePlanExpanded = (id: string) => {
    setExpandedPlanIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case "Crítica":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Alta":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Média":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-500 border-slate-200";
    }
  };

  // Filter plans
  const formatCostDisplay = (val: string) => {
    if (!val) return "Não planejado / Opcional";
    const clean = val.trim();
    if (/^\d+$/.test(clean)) {
      const formatted = new Intl.NumberFormat("pt-BR").format(parseInt(clean, 10));
      return `R$ ${formatted}`;
    }
    return clean;
  };

  const filteredPlans = plans.filter((p) => {
    if (!searchTerm.trim()) return typeFilter === "Todos" || p.type === typeFilter;

    const term = searchTerm.toLowerCase();
    let matchesSearch = false;

    if (searchField === "all") {
      matchesSearch =
        p.what.toLowerCase().includes(term) ||
        p.who.toLowerCase().includes(term) ||
        p.where.toLowerCase().includes(term) ||
        (p.how && p.how.toLowerCase().includes(term)) ||
        (p.why && p.why.toLowerCase().includes(term)) ||
        p.relatedDescription.toLowerCase().includes(term);
    } else if (searchField === "what") {
      matchesSearch = p.what.toLowerCase().includes(term);
    } else if (searchField === "who") {
      matchesSearch = p.who.toLowerCase().includes(term);
    } else if (searchField === "where") {
      matchesSearch = p.where.toLowerCase().includes(term);
    } else if (searchField === "how") {
      matchesSearch = !!(p.how && p.how.toLowerCase().includes(term));
    } else if (searchField === "why") {
      matchesSearch = !!(p.why && p.why.toLowerCase().includes(term));
    } else if (searchField === "related") {
      matchesSearch = p.relatedDescription.toLowerCase().includes(term);
    }

    const matchesType = typeFilter === "Todos" || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalActions = plans.length;
  const completedActionsCount = plans.filter((p) => p.completed).length;
  const completionPercentage = totalActions > 0 ? Math.round((completedActionsCount / totalActions) * 100) : 0;

  // Group filtered plans by relatedId (or relatedDescription if empty)
  const groupedPlansMap = new Map<string, {
    relatedId: string;
    relatedDescription: string;
    type: "Risco" | "Oportunidade";
    plans: ActionPlanItem[];
  }>();

  filteredPlans.forEach((plan) => {
    const key = plan.relatedId || `unlinked-${plan.id}`;
    if (!groupedPlansMap.has(key)) {
      groupedPlansMap.set(key, {
        relatedId: plan.relatedId,
        relatedDescription: plan.relatedDescription,
        type: plan.type,
        plans: []
      });
    }
    groupedPlansMap.get(key)!.plans.push(plan);
  });

  const groupedPlansList = Array.from(groupedPlansMap.values());

  return (
    <div id="action-plans-explorer" className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="plans-search-input"
              type="text"
              placeholder={
                searchField === "all" ? "Pesquisar por ação, responsável, local..." :
                searchField === "what" ? "Digite o nome da ação do plano (What)..." :
                searchField === "who" ? "Nome do responsável (Who)..." :
                searchField === "where" ? "Local (Where)..." :
                searchField === "how" ? "Estrutura do procedimento (How)..." :
                searchField === "why" ? "Justificativa (Why)..." :
                "Fator estratégico associado..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <select
            id="plans-search-field-select"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value as any)}
            className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 outline-hidden focus:border-indigo-500 shrink-0 cursor-pointer font-medium"
          >
            <option value="all">🔍 Qualquer campo</option>
            <option value="what">📋 Nome da Ação (What)</option>
            <option value="who">👤 Responsável (Who)</option>
            <option value="where">📍 Local (Where)</option>
            <option value="how">⚙️ Como (How)</option>
            <option value="why">💡 Por Quê (Why)</option>
            <option value="related">🔗 Fator SWOT</option>
          </select>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          {(["Todos", "Risco", "Oportunidade"] as const).map((type) => (
            <button
              id={`plans-type-btn-${type.toLowerCase()}`}
              key={type}
              onClick={() => setTypeFilter(type)}
              type="button"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                typeFilter === type
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {type === "Todos" ? "Todos os Planos" : type === "Risco" ? "Focados em Riscos" : "Capturar Oportunidades"}
            </button>
          ))}
          
          <button
            onClick={() => {
              const defaultRelatedId = risks.length > 0 ? risks[0].id : "";
              const defaultRelatedDesc = risks.length > 0 ? risks[0].description : "";
              setNewPlanState({
                type: "Risco",
                relatedId: defaultRelatedId,
                relatedDescription: defaultRelatedDesc,
                what: "",
                why: "",
                where: "",
                when: "",
                who: "",
                how: "",
                howMuch: "",
                priority: "Média"
              });
              if (!isEditingLocked) {
                setIsCreating(true);
              }
            }}
            disabled={isEditingLocked}
            type="button"
            className={`px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 transition-colors ${
              isEditingLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
            title={isEditingLocked ? "Edição desabilitada" : "Criar novo plano"}
          >
            <Plus className="w-3.5 h-3.5" /> Novo Plano 5W2H
          </button>
        </div>
      </div>

      {/* Checklist Progress Status Card */}
      {totalActions > 0 && (
        <div className="border border-slate-100 rounded-2xl bg-white p-5 shadow-3xs flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-bold text-sm text-slate-800 flex items-center justify-center md:justify-start gap-1.5">
              <ClipboardList className="w-4.5 h-4.5 text-indigo-500" /> Progresso da Implementação 5W2H
            </h4>
            <p className="text-xs text-slate-500 font-normal">
              Acompanhe a implantação marcando as caixas de seleção correspondentes.
            </p>
          </div>

          <div className="w-full md:w-72 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-semibold text-slate-605 mb-1.5">
                <span>Iniciados / Concluídos:</span>
                <span>{completedActionsCount} / {totalActions} ({completionPercentage}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de Cobertura Parcial / 1-para-1 Mismatch */}
      {onRebuildPlans && (risks.length > 0 || opportunities.length > 0) && (plans.length < (risks.length + opportunities.length)) && (
        <div className="border border-amber-200 rounded-2xl bg-amber-50/45 p-4.5 shadow-3xs flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="font-extrabold text-xs text-amber-900">
                Alinhamento Tático Parcial Detectado
              </h5>
              <p className="text-[11px] text-amber-700 leading-relaxed font-normal">
                Você possui <strong>{risks.length} riscos</strong> e <strong>{opportunities.length} oportunidades</strong> mapeados, mas apenas <strong>{plans.length} planos de ação 5W2H</strong>. Recomenda-se possuir pelo menos 1 plano específico de atendimento tático para cada fator crítico.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isEditingLocked) return;
              setConfirmModal({
                title: "Gerar Cobertura Completa 1-para-1",
                message: "Isso criará automaticamente planos de ação 5W2H profissionais para cada risco e cada oportunidade estratégica que ainda não estão mapeados, restabelecendo a relação 1-para-1 ideal. Deseja realizar este alinhamento estratégico corporativo?",
                onConfirm: () => {
                  onRebuildPlans();
                  setConfirmModal(null);
                }
              });
            }}
            disabled={isEditingLocked}
            type="button"
            className={`w-full md:w-auto px-4 py-2 text-xs font-black text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-205 rounded-xl transition-colors shrink-0 text-center ${
              isEditingLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
            title={isEditingLocked ? "Edição desabilitada" : "Ajustar cobertura"}
          >
            Ajustar Cobertura (1-para-1)
          </button>
        </div>
      )}

      {/* Grid of Action Plans */}
      <div id="plans-grid-body" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groupedPlansList.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 italic bg-white border border-slate-100 rounded-2xl">
            Nenhum plano de ação de interesse foi gerado ou corresponde à sua pesquisa.
          </div>
        ) : (
          groupedPlansList.map((group, groupIdx) => {
            const isRisco = group.type === "Risco";
            const totalInGroup = group.plans.length;
            const completedInGroup = group.plans.filter((p) => p.completed).length;
            const groupCompleted = completedInGroup === totalInGroup;

            return (
              <div
                id={`grouped-card-${group.relatedId || groupIdx}`}
                key={group.relatedId || groupIdx}
                className={`border rounded-2xl transition-all duration-300 relative flex flex-col overflow-hidden bg-white shadow-3xs hover:shadow-xs border-slate-150 hover:border-slate-300`}
              >
                {/* Header of the Group: The Risk or Opportunity addressed */}
                <div className={`p-4 border-b flex flex-col gap-2 ${
                  isRisco 
                    ? "bg-slate-50 border-slate-100" 
                    : "bg-blue-50/20 border-blue-105/30"
                }`}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isRisco ? (
                      <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1 leading-none">
                        <AlertTriangle className="w-3 h-3" /> Mitigar Risco
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase bg-blue-50 border border-blue-200 text-blue-700 flex items-center gap-1 leading-none">
                        <Sparkles className="w-3 h-3" /> Alavancar Oportunidade
                      </span>
                    )}
                    
                    <span className="text-[10px] font-medium text-slate-400 uppercase leading-none">
                      {totalInGroup === 1 ? "1 Plano Associado" : `${totalInGroup} Planos Associados`}
                    </span>

                    {totalInGroup > 0 && (
                      <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase border leading-none ${
                        groupCompleted 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                          : "bg-amber-50 border-amber-200 text-amber-700"
                      }`}>
                        {completedInGroup} / {totalInGroup} Concluídos
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-xs font-black text-slate-800 leading-snug mt-1">
                    {group.relatedDescription || "Sem descrição vinculada"}
                  </h4>
                </div>

                {/* Group's individual 5W2H plans */}
                <div className="p-4 divide-y divide-slate-100/80 space-y-4">
                  {group.plans.map((plan, planIdx) => {
                    const isCompleted = !!plan.completed;
                    const isExpanded = !!expandedPlanIds[plan.id];
                    return (
                      <div 
                        key={plan.id} 
                        className={`pt-4 first:pt-0 ${isCompleted ? "opacity-75" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <button
                              id={`checkbox-toggle-${plan.id}`}
                              onClick={() => togglePlanCompletion(plan.id)}
                              type="button"
                              className="mt-0.5 focus:outline-hidden cursor-pointer shrink-0"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 transition-transform hover:scale-105" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-350 hover:text-indigo-550 transition-colors" />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">
                                  Plano {planIdx + 1}
                                </span>
                                <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded-md uppercase border leading-none ${getPriorityColor(plan.priority)}`}>
                                  {plan.priority}
                                </span>
                                {plan.who && (
                                  <span className="bg-slate-50 text-slate-500 text-[9px] px-1.5 py-0.5 rounded-md font-medium border border-slate-100 flex items-center gap-0.5 leading-none">
                                    <User className="w-2.5 h-2.5" /> {plan.who}
                                  </span>
                                )}
                                {plan.when && (
                                  <span className="bg-slate-50 text-slate-500 text-[9px] px-1.5 py-0.5 rounded-md font-medium border border-slate-100 flex items-center gap-0.5 leading-none">
                                    <Calendar className="w-2.5 h-2.5" /> {plan.when}
                                  </span>
                                )}
                              </div>

                              <p 
                                onClick={() => togglePlanExpanded(plan.id)}
                                className={`text-xs font-semibold leading-relaxed cursor-pointer select-none hover:text-indigo-600 transition-colors ${
                                  isCompleted ? "text-slate-450 line-through" : "text-slate-800"
                                }`}
                              >
                                {plan.what}
                              </p>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              onClick={() => !isEditingLocked && setEditingPlan(plan)}
                              disabled={isEditingLocked}
                              type="button"
                              className={`p-1 px-1.5 text-slate-400 hover:text-indigo-650 hover:bg-slate-100 rounded-md transition-all cursor-pointer ${
                                isEditingLocked ? "opacity-30 cursor-not-allowed" : ""
                              }`}
                              title={isEditingLocked ? "Edição bloqueada" : "Editar"}
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            
                            <button
                              onClick={() => {
                                if (isEditingLocked) return;
                                setConfirmModal({
                                  title: "Excluir Plano de Ação",
                                  message: "Deseja realmente excluir este plano de ação 5W2H?",
                                  onConfirm: () => onDeletePlan(plan.id)
                                });
                              }}
                              disabled={isEditingLocked}
                              type="button"
                              className={`p-1 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer ${
                                isEditingLocked ? "opacity-30 cursor-not-allowed" : ""
                              }`}
                              title={isEditingLocked ? "Edição bloqueada" : "Excluir"}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => togglePlanExpanded(plan.id)}
                              type="button"
                              className="p-1 px-1.5 text-slate-450 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                              title={isExpanded ? "Ocultar Detalhes" : "Mostrar Detalhes 5W2H"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* 5W2H Details (Collapsible area) */}
                        {isExpanded && (
                          <div className="mt-3 ml-7 p-3 bg-slate-50/65 border border-slate-100 rounded-xl space-y-3 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-35">
                              {/* WHY */}
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Why? Por quê?</span>
                                <p className="text-xs text-slate-650 font-medium leading-relaxed pl-0.5">
                                  {plan.why || <span className="text-slate-400 italic">Não informado</span>}
                                </p>
                              </div>

                              {/* WHERE */}
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Where? Onde?</span>
                                <p className="text-xs text-slate-650 font-semibold leading-relaxed pl-0.5">
                                  {plan.where || <span className="text-slate-400 italic">Não informado</span>}
                                </p>
                              </div>

                              {/* HOW */}
                              <div className="space-y-0.5 col-span-full border-t border-slate-100 pt-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">How? Como fazer</span>
                                <p className="text-xs text-slate-650 font-normal leading-relaxed pl-0.5 mt-0.5">
                                  {plan.how || <span className="text-slate-400 italic">Não informado</span>}
                                </p>
                              </div>

                              {/* HOW MUCH */}
                              <div className="col-span-full border-t border-slate-100 pt-2 flex items-center justify-between text-[11px]">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 leading-none">
                                  <DollarSign className="w-3 h-3 text-slate-405" /> How Much? Custos
                                </span>
                                <span className={`text-[11px] font-medium rounded-md ${plan.howMuch ? 'text-indigo-650 bg-indigo-50/40 px-2.5 py-0.5 border border-indigo-100/50' : 'text-slate-400 italic text-[10px]'}`}>
                                  {formatCostDisplay(plan.howMuch)}
                                </span>
                              </div>

                              {/* SUGGESTED KRs */}
                              {plan.suggestedKrs && plan.suggestedKrs.length > 0 && (
                                <div className="col-span-full border-t border-slate-100 pt-2 space-y-1 bg-white p-2 text-[11px] rounded-lg border border-slate-100">
                                  <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-indigo-505" /> Key Results Recomendados
                                  </span>
                                  <div className="space-y-1">
                                    {plan.suggestedKrs.map((kr, kIdx) => (
                                      <div key={kIdx} className="flex gap-2 items-start text-[10px] text-slate-600 font-normal">
                                        <span className="text-indigo-500 font-bold font-mono">KR {kIdx + 1}:</span>
                                        <span className="font-medium">{kr}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: EDITAR PLANO DE AÇÃO (5W2H) */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-100 flex flex-col overflow-hidden my-8 max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-4.5 h-4.5 text-indigo-505" />
                  Editar Plano de Ação 5W2H
                </h4>
                <p className="text-[11px] text-slate-500">Modifique os parâmetros do plano de ação de governança corporativa.</p>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-1 px-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Type and Related Factor Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Foco de Atuação</label>
                  <select
                    value={editingPlan.type}
                    onChange={(e) => {
                      const newType = e.target.value as 'Risco' | 'Oportunidade';
                      const list = newType === "Risco" ? risks : opportunities;
                      const defaultId = list.length > 0 ? list[0].id : "";
                      const defaultDesc = list.length > 0 ? list[0].description : "";
                      setEditingPlan({
                        ...editingPlan,
                        type: newType,
                        relatedId: defaultId,
                        relatedDescription: defaultDesc
                      });
                    }}
                    className="w-full text-xs p-2.5 border border-slate-250 bg-white rounded-xl focus:outline-hidden"
                  >
                    <option value="Risco">Mitigar Risco Crítico</option>
                    <option value="Oportunidade">Alavancar Oportunidade</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Fator Vinculado</label>
                  {editingPlan.type === "Risco" ? (
                    risks.length === 0 ? (
                      <div className="text-xs text-slate-400 py-2">Nenhum risco mapeado.</div>
                    ) : (
                      <select
                        value={editingPlan.relatedId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const found = risks.find((r) => r.id === id);
                          setEditingPlan({
                            ...editingPlan,
                            relatedId: id,
                            relatedDescription: found ? found.description : ""
                          });
                        }}
                        className="w-full text-xs p-2.5 border border-slate-250 bg-white rounded-xl focus:outline-hidden"
                      >
                        {risks.map((r, i) => (
                          <option key={r.id} value={r.id}>R{i+1}: {r.description.slice(0, 50)}...</option>
                        ))}
                      </select>
                    )
                  ) : (
                    opportunities.length === 0 ? (
                      <div className="text-xs text-slate-400 py-2">Nenhuma oportunidade mapeada.</div>
                    ) : (
                      <select
                        value={editingPlan.relatedId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const found = opportunities.find((o) => o.id === id);
                          setEditingPlan({
                            ...editingPlan,
                            relatedId: id,
                            relatedDescription: found ? found.description : ""
                          });
                        }}
                        className="w-full text-xs p-2.5 border border-slate-250 bg-white rounded-xl focus:outline-hidden"
                      >
                        {opportunities.map((o, i) => (
                          <option key={o.id} value={o.id}>O{i+1}: {o.description.slice(0, 50)}...</option>
                        ))}
                      </select>
                    )
                  )}
                </div>
              </div>

              {/* WHAT AND WHY */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-650 uppercase tracking-wider block">What? (O que será feito • Ação Prática)</label>
                  <textarea
                    value={editingPlan.what}
                    onChange={(e) => setEditingPlan({ ...editingPlan, what: e.target.value })}
                    rows={2}
                    className="w-full text-xs p-3 border border-indigo-200 rounded-xl bg-indigo-50/10 focus:outline-hidden focus:border-indigo-500 focus:bg-white resize-none"
                    placeholder="e.g. Implementar auditorias de conformidade nos canteiros."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Why? (Por que fazer • Justificativa)</label>
                  <input
                    type="text"
                    value={editingPlan.why}
                    onChange={(e) => setEditingPlan({ ...editingPlan, why: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-250 rounded-xl bg-slate-50/50 focus:outline-hidden"
                    placeholder="e.g. Minimizar autuações e manter margem operacional."
                  />
                </div>
              </div>

              {/* WHERE, WHO, WHEN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Where? (Onde)</label>
                  <input
                    type="text"
                    value={editingPlan.where}
                    onChange={(e) => setEditingPlan({ ...editingPlan, where: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-255 rounded-xl bg-slate-50/50 focus:outline-hidden"
                    placeholder="e.g. Canteiros / Obras"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Who? (Quem / Responsável)</label>
                  <input
                    type="text"
                    value={editingPlan.who}
                    onChange={(e) => setEditingPlan({ ...editingPlan, who: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-255 rounded-xl bg-slate-50/50 focus:outline-hidden"
                    placeholder="e.g. Diretor de Engenharia"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">When? (Mês Alvo & Prazo)</label>
                  <div className="flex gap-1.5">
                    <select
                      value={(() => {
                        const idx = parseMonthFromWhen(editingPlan.when);
                        return idx !== null ? idx.toString() : "";
                      })()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== "") {
                          const months = [
                            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                          ];
                          const mName = months[parseInt(val, 10)];
                          setEditingPlan({ ...editingPlan, when: `${mName} de 2026` });
                        } else {
                          setEditingPlan({ ...editingPlan, when: "" });
                        }
                      }}
                      className="text-xs p-2.5 border border-slate-255 rounded-xl bg-slate-55 focus:outline-hidden font-bold text-indigo-700 shrink-0 w-[110px]"
                    >
                      <option value="">Outros/S.D.</option>
                      {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((m, i) => (
                        <option key={m} value={i}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={editingPlan.when}
                      onChange={(e) => setEditingPlan({ ...editingPlan, when: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-255 rounded-xl bg-slate-50/50 focus:outline-hidden"
                      placeholder="e.g. Maio de 2026"
                    />
                  </div>
                  <span className="text-[9px] text-slate-450 block leading-tight">Escolha um mês na listagem abreviada para preenchimento rápido.</span>
                </div>
              </div>

              {/* HOW, HOW MUCH, PRIORITY Row */}
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">How? (Como fazer • Procedimento básico)</label>
                  <textarea
                    value={editingPlan.how}
                    onChange={(e) => setEditingPlan({ ...editingPlan, how: e.target.value })}
                    rows={2}
                    className="w-full text-xs p-3 border border-slate-255 rounded-xl bg-slate-50/50 focus:outline-hidden resize-none"
                    placeholder="e.g. Elaborar checklist automatizado no tablet e treinar inspetores."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">How Much? Custos (Opcional)</label>
                    <div className="relative flex rounded-xl border border-slate-255 bg-slate-50/50 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 overflow-hidden">
                      <span className="inline-flex items-center px-3 border-r border-slate-200 bg-slate-100 text-slate-500 text-xs font-semibold select-none">
                        R$
                      </span>
                      <input
                        type="text"
                        value={editingPlan.howMuch ? editingPlan.howMuch.replace(/\D/g, "") : ""}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          setEditingPlan({ ...editingPlan, howMuch: digits });
                        }}
                        className="w-full text-xs p-2.5 bg-transparent focus:outline-hidden"
                        placeholder="Apenas números (ex: 5000)"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Classe de Prioridade do Plano</label>
                    <select
                      value={editingPlan.priority}
                      onChange={(e) => setEditingPlan({ ...editingPlan, priority: e.target.value as 'Baixa' | 'Média' | 'Alta' | 'Crítica' })}
                      className="w-full text-xs p-2.5 border border-slate-255 bg-white rounded-xl focus:outline-hidden"
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                      <option value="Crítica">Crítica</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1 pt-3 border-t border-slate-100">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">
                    Sugestões de Key Results (KRs) - Um por linha (Apenas recomendações, opcional)
                  </label>
                  <textarea
                    value={editingPlan.suggestedKrs ? editingPlan.suggestedKrs.join("\n") : ""}
                    onChange={(e) => {
                      const lines = e.target.value.split("\n");
                      setEditingPlan({ ...editingPlan, suggestedKrs: lines });
                    }}
                    rows={3}
                    className="w-full text-xs p-3 border border-slate-255 rounded-xl bg-slate-50/50 focus:outline-hidden focus:bg-white resize-none"
                    placeholder="e.g. Treinar 100% da equipe em 15 dias&#10;Reduzir em 20% os problemas identificados"
                  />
                  <p className="text-[10px] text-slate-400 italic">Preencha um Key Result por linha. Essas são apenas sugestões para direcionar o monitoramento.</p>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-5 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 border border-slate-200 text-slate-655 bg-white font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingPlan.what.trim() === "") return;
                  onUpdatePlan(editingPlan);
                  setEditingPlan(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Salvar Plano de Ação
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL: CRIAR PLANO DE AÇÃO */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-100 flex flex-col overflow-hidden my-8 max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-4.5 h-4.5 text-emerald-600" />
                  Cadastrar Novo Plano de Ação 5W2H
                </h4>
                <p className="text-[11px] text-slate-500">Desenvolva uma nova diretriz 5W2H vinculada a um fator de risco ou oportunidade SWOT.</p>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1 px-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Type and Related Factor Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Foco de Atuação</label>
                  <select
                    value={newPlanState.type}
                    onChange={(e) => {
                      const newType = e.target.value as 'Risco' | 'Oportunidade';
                      const list = newType === "Risco" ? risks : opportunities;
                      const defaultId = list.length > 0 ? list[0].id : "";
                      const defaultDesc = list.length > 0 ? list[0].description : "";
                      setNewPlanState({
                        ...newPlanState,
                        type: newType,
                        relatedId: defaultId,
                        relatedDescription: defaultDesc
                      });
                    }}
                    className="w-full text-xs p-2.5 border border-slate-250 bg-white rounded-xl focus:outline-hidden"
                  >
                    <option value="Risco">Mitigar Risco Crítico</option>
                    <option value="Oportunidade">Alavancar Oportunidade</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Fator Vinculado</label>
                  {newPlanState.type === "Risco" ? (
                    risks.length === 0 ? (
                      <div className="text-xs text-slate-400 py-2">Nenhum risco mapeado. Adicione antes.</div>
                    ) : (
                      <select
                        value={newPlanState.relatedId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const found = risks.find((r) => r.id === id);
                          setNewPlanState({
                            ...newPlanState,
                            relatedId: id,
                            relatedDescription: found ? found.description : ""
                          });
                        }}
                        className="w-full text-xs p-2.5 border border-slate-250 bg-white rounded-xl focus:outline-hidden"
                      >
                        {risks.map((r, i) => (
                          <option key={r.id} value={r.id}>R{i+1}: {r.description.slice(0, 50)}...</option>
                        ))}
                      </select>
                    )
                  ) : (
                    opportunities.length === 0 ? (
                      <div className="text-xs text-slate-400 py-2">Nenhuma oportunidade mapeada.</div>
                    ) : (
                      <select
                        value={newPlanState.relatedId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const found = opportunities.find((o) => o.id === id);
                          setNewPlanState({
                            ...newPlanState,
                            relatedId: id,
                            relatedDescription: found ? found.description : ""
                          });
                        }}
                        className="w-full text-xs p-2.5 border border-slate-250 bg-white rounded-xl focus:outline-hidden"
                      >
                        {opportunities.map((o, i) => (
                          <option key={o.id} value={o.id}>O{i+1}: {o.description.slice(0, 50)}...</option>
                        ))}
                      </select>
                    )
                  )}
                </div>
              </div>

              {/* WHAT AND WHY */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-indigo-650 uppercase tracking-wider block">What? (O que será feito • Ação Prática)</label>
                  <textarea
                    value={newPlanState.what}
                    onChange={(e) => setNewPlanState({ ...newPlanState, what: e.target.value })}
                    rows={2}
                    className="w-full text-xs p-3 border border-indigo-200 rounded-xl bg-indigo-50/10 focus:outline-hidden focus:border-indigo-500 focus:bg-white resize-none"
                    placeholder="Descrição da ação preventiva ou corretiva..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Why? (Por que fazer • Justificativa)</label>
                  <input
                    type="text"
                    value={newPlanState.why}
                    onChange={(e) => setNewPlanState({ ...newPlanState, why: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-250 rounded-xl bg-slate-50/50 focus:outline-hidden"
                    placeholder="e.g. Para eliminar desperdícios e garantir conformidade."
                  />
                </div>
              </div>

              {/* WHERE, WHO, WHEN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Where? (Onde)</label>
                  <input
                    type="text"
                    value={newPlanState.where}
                    onChange={(e) => setNewPlanState({ ...newPlanState, where: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-250 rounded-xl bg-slate-50/50 focus:outline-hidden"
                    placeholder="e.g. Escritório Central / Fábrica"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Who? (Quem / Responsável)</label>
                  <input
                    type="text"
                    value={newPlanState.who}
                    onChange={(e) => setNewPlanState({ ...newPlanState, who: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-250 rounded-xl bg-slate-50/50 focus:outline-hidden"
                    placeholder="e.g. Gerente Financeiro"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">When? (Mês Alvo & Prazo)</label>
                  <div className="flex gap-1.5">
                    <select
                      value={(() => {
                        const idx = parseMonthFromWhen(newPlanState.when);
                        return idx !== null ? idx.toString() : "";
                      })()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== "") {
                          const months = [
                            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                          ];
                          const mName = months[parseInt(val, 10)];
                          setNewPlanState({ ...newPlanState, when: `${mName} de 2026` });
                        } else {
                          setNewPlanState({ ...newPlanState, when: "" });
                        }
                      }}
                      className="text-xs p-2.5 border border-slate-250 rounded-xl bg-slate-55 focus:outline-hidden font-bold text-indigo-700 shrink-0 w-[110px]"
                    >
                      <option value="">Outros/S.D.</option>
                      {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((m, i) => (
                        <option key={m} value={i}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newPlanState.when}
                      onChange={(e) => setNewPlanState({ ...newPlanState, when: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-250 rounded-xl bg-slate-50/50 focus:outline-hidden"
                      placeholder="e.g. Maio de 2026"
                    />
                  </div>
                  <span className="text-[9px] text-slate-450 block leading-tight">Escolha um mês na listagem abreviada para preenchimento rápido.</span>
                </div>
              </div>

              {/* HOW, HOW MUCH, PRIORITY Row */}
              <div className="space-y-3 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">How? (Como fazer • Procedimento básico)</label>
                  <textarea
                    value={newPlanState.how}
                    onChange={(e) => setNewPlanState({ ...newPlanState, how: e.target.value })}
                    rows={2}
                    className="w-full text-xs p-3 border border-slate-250 rounded-xl bg-slate-50/50 focus:outline-hidden resize-none"
                    placeholder="e.g. Revisar fluxo atual, elaborar manual e treinar a equipe operacional."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">How Much? Custos (Opcional)</label>
                    <div className="relative flex rounded-xl border border-slate-250 bg-slate-50/50 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 overflow-hidden">
                      <span className="inline-flex items-center px-3 border-r border-slate-200 bg-slate-100 text-slate-500 text-xs font-semibold select-none">
                        R$
                      </span>
                      <input
                        type="text"
                        value={newPlanState.howMuch ? newPlanState.howMuch.replace(/\D/g, "") : ""}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          setNewPlanState({ ...newPlanState, howMuch: digits });
                        }}
                        className="w-full text-xs p-2.5 bg-transparent focus:outline-hidden"
                        placeholder="Apenas números (ex: 2500)"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Classe de Prioridade</label>
                    <select
                      value={newPlanState.priority}
                      onChange={(e) => setNewPlanState({ ...newPlanState, priority: e.target.value as 'Baixa' | 'Média' | 'Alta' | 'Crítica' })}
                      className="w-full text-xs p-2.5 border border-slate-250 bg-white rounded-xl focus:outline-hidden"
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                      <option value="Crítica">Crítica</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1 pt-3 border-t border-slate-100">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">
                    Sugestões de Key Results (KRs) - Um por linha (Apenas recomendações, opcional)
                  </label>
                  <textarea
                    value={newPlanState.suggestedKrs ? newPlanState.suggestedKrs.join("\n") : ""}
                    onChange={(e) => {
                      const lines = e.target.value.split("\n");
                      setNewPlanState({ ...newPlanState, suggestedKrs: lines });
                    }}
                    rows={3}
                    className="w-full text-xs p-3 border border-slate-250 rounded-xl bg-slate-50/50 focus:outline-hidden focus:bg-white resize-none"
                    placeholder="e.g. Treinar 100% da equipe em 15 dias&#10;Reduzir em 20% os problemas identificados"
                  />
                  <p className="text-[10px] text-slate-400 italic">Preencha um Key Result por linha. Essas são apenas sugestões para guiar o monitoramento do plano.</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-slate-200 text-slate-650 bg-white font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newPlanState.what.trim() === "") return;
                  const newId = `plan-${Date.now()}`;
                  onAddPlan({
                    ...newPlanState,
                    id: newId
                  });
                  setIsCreating(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Adicionar Plano
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação Personalizado */}
      {confirmModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-100 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 animate-out fade-out zoom-out-95">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900">{confirmModal.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">{confirmModal.message}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border border-slate-200 text-slate-655 bg-white font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
