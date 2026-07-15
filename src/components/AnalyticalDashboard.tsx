import React, { useState, useEffect } from "react";
import { AlertCircle, TrendingUp, Sparkles, AlertTriangle, ShieldCheck, HelpCircle, Edit, Trash2, X, Plus, Calendar, User, DollarSign, CheckCircle2, ClipboardList, ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { RiskItem, OpportunityItem, ActionPlanItem } from "../types";

interface AnalyticalDashboardProps {
  risks: RiskItem[];
  opportunities: OpportunityItem[];
  plans?: ActionPlanItem[];
  onUpdateRisk: (updated: RiskItem) => void;
  onDeleteRisk: (id: string) => void;
  onUpdateOpportunity: (updated: OpportunityItem) => void;
  onDeleteOpportunity: (id: string) => void;
  onAddPlan?: (newPlan: ActionPlanItem) => void;
  onDeletePlan?: (id: string) => void;
  onUpdatePlan?: (updated: ActionPlanItem) => void;
  onAddRisk?: (newRisk: RiskItem) => void;
  isAnalysisStale?: boolean;
  onRunAnalysis?: () => void;
  loading?: boolean;
  isEditingLocked?: boolean;
}

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

const getPriorityColor = (prio: string) => {
  switch (prio) {
    case "Crítica":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Alta":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "Média":
      return "bg-amber-50 text-amber-700 border-amber-250";
    default:
      return "bg-slate-100 text-slate-500 border-slate-200";
  }
};

export default function AnalyticalDashboard({ 
  risks, 
  opportunities,
  plans = [],
  onUpdateRisk,
  onDeleteRisk,
  onUpdateOpportunity,
  onDeleteOpportunity,
  onAddPlan,
  onDeletePlan,
  onUpdatePlan,
  onAddRisk,
  isAnalysisStale = false,
  onRunAnalysis,
  loading = false,
  isEditingLocked = false
}: AnalyticalDashboardProps) {
  const [editingRisk, setEditingRisk] = useState<RiskItem | null>(null);
  const [editingOpp, setEditingOpp] = useState<OpportunityItem | null>(null);
  const [editingPlan, setEditingPlan] = useState<ActionPlanItem | null>(null);

  // Estados para controlar visualização expandida/recolhida dos cards de riscos e oportunidades
  const [expandedRisks, setExpandedRisks] = useState<Record<string, boolean>>({});
  const [expandedOpps, setExpandedOpps] = useState<Record<string, boolean>>({});

  const toggleRisk = (id: string) => {
    setExpandedRisks(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleOpp = (id: string) => {
    setExpandedOpps(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAllRisks = () => {
    const next: Record<string, boolean> = {};
    risks.forEach(r => {
      next[r.id] = true;
    });
    setExpandedRisks(next);
  };

  const collapseAllRisks = () => {
    setExpandedRisks({});
  };

  const expandAllOpps = () => {
    const next: Record<string, boolean> = {};
    opportunities.forEach(o => {
      next[o.id] = true;
    });
    setExpandedOpps(next);
  };

  const collapseAllOpps = () => {
    setExpandedOpps({});
  };

  // Estados para criação de riscos customizados
  const [showAddRiskForm, setShowAddRiskForm] = useState(false);
  const [newRiskDesc, setNewRiskDesc] = useState("");
  const [newRiskCause, setNewRiskCause] = useState("");
  const [newRiskProb, setNewRiskProb] = useState<number>(3);
  const [newRiskImpact, setNewRiskImpact] = useState<number>(3);
  const [addRiskError, setAddRiskError] = useState<string | null>(null);

  const onSubmitNewRisk = () => {
    if (!newRiskDesc.trim()) {
      setAddRiskError("Por favor, preencha o título/descrição do risco estratégico.");
      return;
    }
    const score = newRiskProb * newRiskImpact;
    const cls: 'Baixo' | 'Médio' | 'Alto' | 'Crítico' = 
      score >= 16 ? 'Crítico' : score >= 12 ? 'Alto' : score >= 6 ? 'Médio' : 'Baixo';
    
    const newRiskObj: RiskItem = {
      id: `risk_manual_${Date.now()}`,
      description: newRiskDesc.trim(),
      probableCause: newRiskCause.trim() || 'Cadastrado manualmente pelo usuário.',
      impact: newRiskImpact,
      probability: newRiskProb,
      criticality: score,
      criticalityClass: cls,
      crossedFactors: ["Inserido manualmente (Sem SWOT)"],
      justification: "Fator preventivo corporativo incluído individualmente.",
      suggestedAction: "Avaliar controles operacionais e formalizar plano tático correspondente."
    };

    if (onAddRisk) {
      onAddRisk(newRiskObj);
      setSuccessToast("Risco customizado adicionado com sucesso! Plano de ação tático gerado no Passo 3.");
    } else {
      console.warn("onAddRisk prop não disponível.");
    }

    // Resetar formulário
    setNewRiskDesc("");
    setNewRiskCause("");
    setNewRiskProb(3);
    setNewRiskImpact(3);
    setAddRiskError(null);
    setShowAddRiskForm(false);
  };

  // Estado para modal de confirmação personalizado (evita window.confirm no iFrame)
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Notificação flutuante de sucesso
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (!successToast) return;
    const timer = setTimeout(() => {
      setSuccessToast(null);
    }, 5500);
    return () => clearTimeout(timer);
  }, [successToast]);

  // State for creating a new action plan inline
  const [addingPlanToId, setAddingPlanToId] = useState<string | null>(null);
  const [addingPlanType, setAddingPlanType] = useState<'Risco' | 'Oportunidade' | null>(null);
  const [addingPlanDesc, setAddingPlanDesc] = useState<string>("");
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

// Considerar todos os riscos gerados (que são médios & críticos, sem filtros artificiais)
const prioritizedRisks = risks;

// Counters baseados de fato no array dinâmico
const totalRisks = risks.length;

console.log(`[STAGE 4 LOG] [REAL LOG] AnalyticalDashboard renderizado.`);
console.log(`[REAL LOG] Propriedade "risks" recebida em AnalyticalDashboard: length = ${risks.length}`);
console.log(`[STAGE 5 LOG] [REAL LOG] Card "Riscos Mapeados" do executivo vai renderizar exatamente o valor totalRisks: ${totalRisks}`);
console.log(`[REAL LOG] Propriedade "opportunities" recebida em AnalyticalDashboard: length = ${opportunities.length}`);

const criticalRisksCount = risks.filter(
  (r) => r.criticalityClass === "Crítico" || r.criticality >= 16
).length;

const prioritizedOpps = opportunities.filter(
  (o) => o.priority === "Alta"
);

  // Ações de mitigação e captação do plano de ação 5W2H
  const mitigationActionsCount = plans.filter((p) => p.type === "Risco").length;
  const captureActionsCount = plans.filter((p) => p.type === "Oportunidade").length;

const avgRiskScore =
  risks.length > 0
    ? (
        risks.reduce(
          (acc, r) => acc + r.criticality,
          0
        ) / risks.length
      ).toFixed(1)
    : "0.0";

const totalOpportunities = opportunities.length;

  // Recharts: Criticality Distribution
  const riskClasses = ["Baixo", "Médio", "Crítico"];
  const riskChartData = riskClasses.map((cls) => ({
    name: cls,
    value: risks.filter((r) => r.criticalityClass === cls).length,
  }));

  // Recharts: Opportunity Priorities
  const priorityClasses = ["Baixa", "Média", "Alta"];
  const oppChartData = priorityClasses.map((prio) => ({
    name: prio,
    value: opportunities.filter((o) => o.priority === prio).length,
  }));

  const COLORS_PRIORITY = ["#cbd5e1", "#f59e0b", "#ef4444"]; // low (slate), medium (amber), high/critical (red)
  const COLORS_RISK = ["#94a3b8", "#f59e0b", "#ef4444"]; // low (slate), medium (amber), critical (red)

  // 5x5 Risk Heatmap Matrix Calculations
  // X: Impacto (1 a 5), Y: Probabilidade (1 a 5)
  const getCellData = (prob: number, imp: number) => {
    const list = risks.filter((r) => r.probability === prob && r.impact === imp);
    const score = prob * imp;
    let cellBg = "";
    let textColor = "";

    if (score >= 16) {
      // 16 a 25: Prioridade Alta / Crítico
      cellBg = "bg-rose-100 hover:bg-rose-200 border-rose-300";
      textColor = "text-rose-800 font-bold";
    } else if (score >= 9) {
      // 9 a 15: Prioridade Média
      cellBg = "bg-amber-100 hover:bg-amber-150 border-amber-300";
      textColor = "text-amber-800 font-bold";
    } else {
      // 1 a 8: Descartar / Baixa prioridade
      cellBg = "bg-slate-50 hover:bg-slate-100 border-slate-200";
      textColor = "text-slate-400";
    }

    return { list, cellBg, textColor, score };
  };

  return (
    <div id="analytical-dashboard-component" className="space-y-8">
      {/* Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Riscos Mapeados */}
        <div id="metric-risks-mapped" className="p-5 border border-slate-100 rounded-2xl bg-white shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Riscos Mapeados</span>
            <h3 className="text-2xl font-extrabold text-slate-800">
              {(() => {
                console.log(`[REAL LOG] [EVIDENCIA IMEDIATA CARD] Valor renderizado no card de "Riscos Mapeados" = ${totalRisks}`);
                return totalRisks;
              })()}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">Correlações SWOT identificadas</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 text-slate-500 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Ações de Mitigação */}
        <div id="metric-mitigation-actions" className="p-5 border border-rose-100 rounded-2xl bg-rose-50/20 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-rose-600/85 font-medium tracking-wide uppercase">Ações de Mitigação</span>
            <h3 className="text-2xl font-extrabold text-rose-700">{mitigationActionsCount}</h3>
            <p className="text-[10px] text-rose-600/70 font-medium">Mitigação & Controles (5W2H)</p>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Oportunidades Mapeadas */}
        <div id="metric-opps-mapped" className="p-5 border border-indigo-100 rounded-2xl bg-indigo-50/10 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-indigo-600/85 font-medium tracking-wide uppercase">Oportunidades Mapeadas</span>
            <h3 className="text-2xl font-extrabold text-indigo-700">{totalOpportunities}</h3>
            <p className="text-[10px] text-indigo-600/70 font-medium">Alavancagens & Ganhos potenciais</p>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Ações de Captação */}
        <div id="metric-capture-actions" className="p-5 border border-emerald-100 rounded-2xl bg-emerald-50/20 shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-emerald-600/85 font-medium tracking-wide uppercase">Ações de Captação</span>
            <h3 className="text-2xl font-extrabold text-emerald-700">{captureActionsCount}</h3>
            <p className="text-[10px] text-emerald-600/70 font-medium">Iniciativas de captura (5W2H)</p>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: 5x5 Heatmap Matrix + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Let/Heatmap: 5x5 Risk Heatmap (Column Span 7) */}
        <div className="lg:col-span-7 border border-slate-100 rounded-2xl bg-white shadow-3xs p-6 space-y-4">
          <div className="space-y-1">
            <h4 className="font-bold text-base text-slate-800 flex items-center gap-1.5">
              Matriz de Risco 5x5 (Probabilidade vs Impacto)
            </h4>
            <p className="text-xs text-slate-500">
              Distribuição visual de criticidade estratégica baseada na clássica matriz de análise de riscos corporativos.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6 mt-4 items-stretch">
            {/* Heatmap Area */}
            <div className="flex-1 space-y-2">
              {/* Top Y-Axis Indicator header */}
              <div className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider mb-1">
                Eixo Vertical (Probabilidade) vs Horizontal (Impacto)
              </div>

              <div className="grid grid-cols-6 gap-2">
                {/* Header corner cell */}
                <div className="flex items-center justify-center text-[10px] font-bold text-slate-400">
                  P \ I
                </div>
                {/* Impact headers */}
                {[1, 2, 3, 4, 5].map((imp) => (
                  <div key={imp} className="text-center text-[11px] font-bold text-slate-550 py-1 bg-slate-50 border border-transparent rounded-lg">
                    Imp {imp}
                  </div>
                ))}

                {/* Grid Rows (Probability 5 down to 1) */}
                {[5, 4, 3, 2, 1].map((prob) => (
                  <React.Fragment key={prob}>
                    {/* Prob label */}
                    <div className="flex items-center justify-center text-[11px] font-bold text-slate-550 bg-slate-50 border border-transparent rounded-lg py-3">
                      Prob {prob}
                    </div>

                    {/* Cell grids */}
                    {[1, 2, 3, 4, 5].map((imp) => {
                      const { list, cellBg, textColor, score } = getCellData(prob, imp);
                      return (
                        <div
                          id={`heatmap-cell-p${prob}-i${imp}`}
                          key={`${prob}-${imp}`}
                          title={`Score: ${score} | ${list.length} risco(s)`}
                          className={`relative flex flex-col items-center justify-center py-2.5 rounded-xl border border-slate-100 transition-all cursor-pointer shadow-3xs group ${cellBg}`}
                        >
                          <span className={`text-base font-extrabold ${textColor}`}>
                            {list.length}
                          </span>
                          <span className="text-[8px] font-semibold text-slate-450 mt-0.5 uppercase tracking-tighter">
                            Esc: {score}
                          </span>

                          {/* Hover tooltip with names of products */}
                          {list.length > 0 && (
                            <div className="hidden group-hover:block absolute z-20 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-950 text-white rounded-lg p-2.5 shadow-lg w-52 pointer-events-none text-[10px] space-y-1">
                              <div className="font-bold border-b border-white/10 pb-1 mb-1">Riscos nesta Célula:</div>
                              {list.map((r, i) => (
                                <div key={r.id} className="truncate">• {r.description}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>

              {/* Legend scale bar with colors */}
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] text-slate-500 font-medium mt-4">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-emerald-100 border border-emerald-250 rounded-sm"></span> Baixo (1-5)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-amber-100 border border-amber-250 rounded-sm"></span> Médio (6-10)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-orange-100 border border-orange-250 rounded-sm"></span> Alto (11-15)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-rose-100 border border-rose-250 rounded-sm"></span> Crítico (16-25)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right/Charts: Recharts Visualizations (Column Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Chart 1: Risk Class distribution */}
          <div className="border border-slate-100 rounded-2xl bg-white shadow-3xs p-5 space-y-3">
            <h5 className="font-bold text-xs text-slate-400 font-medium tracking-wide uppercase">Riscos por Classe de Criticidade</h5>
            <div className="h-44 w-full flex items-center justify-between">
              {totalRisks > 0 ? (
                <>
                  <div className="w-[55%] h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {riskChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_RISK[index % COLORS_RISK.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Custom legend list to fit card nicely */}
                  <div className="w-[40%] space-y-2 text-xs">
                    {riskChartData.map((item, idx) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS_RISK[idx] }}></span>
                        <span className="text-slate-600 font-medium">{item.name}:</span>
                        <span className="text-slate-800 font-bold ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 italic">
                  Aguardando geração de análise...
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Opportunities priorities */}
          <div className="border border-slate-100 rounded-2xl bg-white shadow-3xs p-5 space-y-3">
            <h5 className="font-bold text-xs text-slate-400 font-medium tracking-wide uppercase">Oportunidades por Prioridade</h5>
            <div className="h-44 w-full flex items-center justify-between">
              {opportunities.length > 0 ? (
                <>
                  <div className="w-[55%] h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={oppChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {oppChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_PRIORITY[index % COLORS_PRIORITY.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Custom legend list to fit card nicely */}
                  <div className="w-[40%] space-y-2 text-xs">
                    {oppChartData.map((item, idx) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS_PRIORITY[idx] }}></span>
                        <span className="text-slate-600 font-medium">{item.name}:</span>
                        <span className="text-slate-800 font-bold ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 italic">
                  Aguardando geração de análise...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Centralized button/form to add custom risks directly, aligning the columns below */}
      <div className="max-w-xl mx-auto mb-8 w-full">
        {!showAddRiskForm ? (
          <button
            onClick={() => !isEditingLocked && setShowAddRiskForm(true)}
            disabled={isEditingLocked}
            className={`w-full py-3.5 px-4 rounded-2xl bg-white border border-dashed border-indigo-200 hover:border-indigo-500 hover:bg-slate-50/45 text-xs font-black text-indigo-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-3xs disabled:opacity-40 disabled:cursor-not-allowed`}
            title={isEditingLocked ? "Desbloqueie a edição para criar riscos" : "Criar Risco Customizado (Sem SWOT)"}
          >
            <Plus className="w-4 h-4 text-indigo-600" /> Criar Risco Customizado (Sem SWOT)
          </button>
        ) : (
          <div className="border border-indigo-150 rounded-2xl bg-indigo-50/15 p-5 space-y-4 shadow-3xs animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center border-b border-indigo-100 pb-2.5">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Criar Risco Customizado
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowAddRiskForm(false);
                  setAddRiskError(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {addRiskError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold rounded-xl">
                  {addRiskError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Título do Risco *</label>
                <input
                  type="text"
                  placeholder="Ex: Falhas de produtividade na montagem industrial de fôrmas..."
                  value={newRiskDesc}
                  onChange={(e) => {
                    setNewRiskDesc(e.target.value);
                    if (addRiskError) setAddRiskError(null);
                  }}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Causa Provável / Consequência</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Falta de letramento de operários ou supervisão rala de campo, gerando perda de velocidade de ciclo..."
                  value={newRiskCause}
                  onChange={(e) => setNewRiskCause(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Probabilidade</label>
                  <select
                    value={newRiskProb}
                    onChange={(e) => setNewRiskProb(parseInt(e.target.value, 10))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                  >
                    <option value={1}>1 - Muito Baixa</option>
                    <option value={2}>2 - Baixa</option>
                    <option value={3}>3 - Média</option>
                    <option value={4}>4 - Alta</option>
                    <option value={5}>5 - Muito Alta</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Impacto</label>
                  <select
                    value={newRiskImpact}
                    onChange={(e) => setNewRiskImpact(parseInt(e.target.value, 10))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                  >
                    <option value={1}>1 - Insignificante</option>
                    <option value={2}>2 - Baixo</option>
                    <option value={3}>3 - Moderado</option>
                    <option value={4}>4 - Alto</option>
                    <option value={5}>5 - Crítico</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 bg-white p-3 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Resultado Estimado</span>
                  <span className="text-xs font-black text-slate-800">Score de Criticidade: {newRiskProb * newRiskImpact}</span>
                </div>
                <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase border ${
                  (newRiskProb * newRiskImpact) >= 16
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : (newRiskProb * newRiskImpact) >= 12
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : (newRiskProb * newRiskImpact) >= 6
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-slate-50 text-slate-500 border-slate-200"
                }`}>
                  { (newRiskProb * newRiskImpact) >= 16 ? "Crítico" : (newRiskProb * newRiskImpact) >= 12 ? "Alto" : (newRiskProb * newRiskImpact) >= 6 ? "Médio" : "Baixo" }
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowAddRiskForm(false);
                  setAddRiskError(null);
                }}
                className="px-3.5 py-2 border border-slate-200 text-slate-600 bg-white font-extrabold text-[10px] rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onSubmitNewRisk}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-slate-900 text-white font-extrabold text-[10px] rounded-lg cursor-pointer"
              >
                Adicionar Risco
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details List (Risks Rating Class Table) - Spanned into individual Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risks column with individual cards */}
        <div className="space-y-5">
          <div className="border border-slate-200/85 p-3 px-4 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h4 className="font-extrabold text-xs md:text-sm text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500" /> Riscos Estratégicos ({risks.length})
            </h4>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {risks.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={expandAllRisks}
                    className="text-[9px] font-black text-indigo-700 hover:text-indigo-900 bg-white hover:bg-slate-100 border border-indigo-150 px-2 py-1 rounded-lg uppercase tracking-wide cursor-pointer transition-all shadow-3xs"
                  >
                    🔍 Expandir Todos
                  </button>
                  <button
                    type="button"
                    onClick={collapseAllRisks}
                    className="text-[9px] font-black text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg uppercase tracking-wide cursor-pointer transition-all shadow-3xs"
                  >
                    📁 Recolher Todos
                  </button>
                </>
              )}
              <span className="text-[9px] font-black text-rose-700 bg-rose-50/50 border border-rose-150 px-2 py-1 rounded-lg uppercase tracking-wide">Ranking Criticidade</span>
            </div>
          </div>

          <div className="space-y-4">
            {risks.length === 0 ? (
              <div className="border border-slate-100 rounded-2xl bg-white shadow-3xs p-10 text-center text-xs text-slate-400 italic">
                Nenhum risco estratégico mapeado. Importe uma SWOT e clique em gerar.
              </div>
            ) : (
              [...risks]
                .sort((a, b) => b.criticality - a.criticality)
                .map((r, idx) => {
                  const isExpanded = !!expandedRisks[r.id];
                  const riskPlans = plans.filter(p => p.relatedId === r.id);
                  return (
                    <div 
                      id={`details-risk-${r.id}`} 
                      key={r.id} 
                      className={`border border-slate-150 rounded-2xl bg-white shadow-3xs hover:shadow-xs transition-all border-l-4 border-l-rose-520 relative ${
                        isExpanded ? "p-5 space-y-4" : "p-3.5 hover:bg-slate-50/60 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (!isExpanded) {
                          toggleRisk(r.id);
                        }
                      }}
                    >
                      {/* CARD HEADER - Clickable to toggle when expanded or collapsed */}
                      <div 
                        className={`flex justify-between items-start gap-4 ${isExpanded ? "cursor-pointer pb-2" : ""}`}
                        onClick={(e) => {
                          if (isExpanded) {
                            toggleRisk(r.id);
                          }
                        }}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Ref R{idx + 1}</span>
                            <span className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase border ${
                              r.criticalityClass === "Crítico"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : r.criticalityClass === "Alto"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : r.criticalityClass === "Médio"
                                ? "bg-amber-50 text-amber-700 border-amber-250"
                                : "bg-emerald-50 text-emerald-700 border-emerald-250"
                            }`}>
                              Risco {r.criticalityClass} ({r.criticality})
                            </span>
                            {riskPlans.length > 0 ? (
                              <span className="px-1.5 py-0.5 text-[8px] font-extrabold rounded bg-indigo-50 text-indigo-700 border border-indigo-150 flex items-center gap-1 leading-none">
                                <ClipboardList className="w-2.5 h-2.5 text-indigo-520" />
                                {riskPlans.length} {riskPlans.length === 1 ? "Plano" : "Planos"}
                              </span>
                            ) : (
                              !r.crossedFactors?.includes("__no_plan_required__") && (
                                <span className="px-1.5 py-0.5 text-[8px] font-extrabold rounded bg-amber-50 text-amber-750 border border-amber-200 leading-none">
                                  Sem Plano
                                </span>
                              )
                            )}
                            {r.crossedFactors?.includes("__no_plan_required__") && (
                              <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-slate-100 text-slate-500 border border-slate-200 uppercase leading-none">
                                Dispensável
                              </span>
                            )}
                          </div>
                          <h5 className="font-extrabold text-xs text-slate-800 leading-normal">{r.description}</h5>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => !isEditingLocked && setEditingRisk(r)}
                            disabled={isEditingLocked}
                            type="button"
                            className={`p-1 px-1.5 text-slate-400 hover:text-indigo-650 hover:bg-slate-100 rounded-lg transition-all cursor-pointer ${
                              isEditingLocked ? "opacity-35 cursor-not-allowed" : ""
                            }`}
                            title={isEditingLocked ? "Edição desabilitada" : "Editar Risco"}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (isEditingLocked) return;
                              setConfirmModal({
                                title: "Excluir Risco Estratégico",
                                message: "Deseja realmente excluir este risco estratégico? Candidatos a planos de defesa correspondentes serão removidos.",
                                onConfirm: () => onDeleteRisk(r.id)
                              });
                            }}
                            disabled={isEditingLocked}
                            type="button"
                            className={`p-1 px-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer ${
                              isEditingLocked ? "opacity-35 cursor-not-allowed" : ""
                            }`}
                            title={isEditingLocked ? "Edição desabilitada" : "Excluir Risco"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleRisk(r.id)}
                            type="button"
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer ml-1"
                            title={isExpanded ? "Recolher informações" : "Expandir informações"}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* DETAILED CONTENT - Shown only when expanded */}
                      {isExpanded && (
                        <>
                          <div className="text-[11px] text-slate-500 leading-relaxed grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-3 font-normal">
                            <div>
                              <strong className="text-slate-700 block mb-0.5 text-[10px] font-bold uppercase tracking-wide">Causa Base / Prob. x Impacto:</strong>
                              <span>{r.probableCause || "Não preenchido"} <span className="text-slate-400 font-mono text-[9px]">(P: {r.probability} × I: {r.impact})</span></span>
                            </div>
                            <div>
                              <strong className="text-slate-700 block mb-0.5 text-[10px] font-bold uppercase tracking-wide">Fatores Cruzados:</strong>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {r.crossedFactors.filter((fac) => fac !== "__no_plan_required__").map((fac, i) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] text-slate-600 font-bold border border-slate-200/80">
                                    {fac}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {(r.justification || r.suggestedAction) && (
                            <div className="text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-150 font-normal space-y-1.5">
                              {r.justification && (
                                <p className="text-slate-600">
                                  <strong className="text-slate-700 text-[9px] uppercase font-extrabold tracking-wider block mb-0.5 text-rose-700">Justificativa de Impacto:</strong> {r.justification}
                                </p>
                              )}
                              {r.suggestedAction && (
                                <p className="text-slate-600">
                                  <strong className="text-indigo-750 text-[9px] uppercase font-extrabold tracking-wider block mb-0.5">Defesa Recomendada (AI):</strong> {r.suggestedAction}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Associated action plans section */}
                          {plans && (
                            <div className="border-t border-slate-100 pt-3 space-y-2.5 font-normal text-xs">
                              <div className="flex justify-between items-center bg-indigo-50/20 p-2.5 rounded-xl border border-indigo-100/30">
                                <span className="font-bold text-[10px] text-indigo-750 uppercase tracking-wider flex items-center gap-1.5">
                                  <ClipboardList className="w-4 h-4 text-indigo-520" />
                                  Planos de Defesa
                                </span>
                                <button
                                  onClick={() => {
                                    if (isEditingLocked) return;
                                    setAddingPlanToId(r.id);
                                    setAddingPlanType("Risco");
                                    setAddingPlanDesc(r.description);
                                    setNewPlanState({
                                      type: "Risco",
                                      relatedId: r.id,
                                      relatedDescription: r.description,
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
                                  }}
                                  disabled={isEditingLocked}
                                  type="button"
                                  className={`text-[10px] font-bold text-indigo-600 hover:text-indigo-75 flex items-center gap-0.5 leading-none ${
                                    isEditingLocked ? "opacity-35 cursor-not-allowed" : "cursor-pointer"
                                  }`}
                                >
                                  <Plus className="w-3 h-3" /> Adicionar Plano
                                </button>
                              </div>
                              
                              {plans.filter(p => p.relatedId === r.id).length > 0 ? (
                                <div className="grid grid-cols-1 gap-2 mt-1.5">
                                  {plans.filter(p => p.relatedId === r.id).map((plan, pIdx) => (
                                    <div key={plan.id} className="text-xs bg-white border border-slate-150 p-3 rounded-xl space-y-2.5 shadow-3xs relative transition-all hover:border-slate-250">
                                      <div className="flex justify-between items-center pb-1 border-b border-slate-50">
                                        <span className="font-extrabold text-[10px] text-indigo-650 bg-indigo-55 px-1.5 py-0.5 rounded border border-indigo-150 leading-none">
                                          Plano de Ação {pIdx + 1}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          <span className={`px-1.5 py-0.5 text-[8px] font-black rounded-lg uppercase border leading-none ${getPriorityColor(plan.priority)}`}>
                                            {plan.priority}
                                          </span>
                                          <button
                                            onClick={() => {
                                              if (isEditingLocked) return;
                                              setEditingPlan(plan);
                                            }}
                                            disabled={isEditingLocked}
                                            type="button"
                                            className={`p-1 text-slate-400 hover:text-indigo-650 hover:bg-slate-100 rounded transition-all leading-none ${
                                              isEditingLocked ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                                            }`}
                                            title={isEditingLocked ? "Edição bloqueada" : "Editar Plano 5W2H"}
                                          >
                                            <Edit className="w-3 h-3" />
                                          </button>
                                          {onDeletePlan && (
                                            <button
                                              onClick={() => {
                                                if (isEditingLocked) return;
                                                setConfirmModal({
                                                  title: "Excluir Plano de Ação",
                                                  message: "Deseja realmente excluir este plano de ação?",
                                                  onConfirm: () => onDeletePlan(plan.id)
                                                });
                                              }}
                                              disabled={isEditingLocked}
                                              type="button"
                                              className={`p-1 text-slate-400 hover:text-rose-600 rounded transition-all leading-none ${
                                                isEditingLocked ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                                              }`}
                                              title={isEditingLocked ? "Edição bloqueada" : "Excluir Plano"}
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <p className="font-semibold text-slate-800 text-[11px] leading-relaxed">
                                        <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wide">What? (O que fazer):</span>
                                        {plan.what}
                                      </p>
                                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] text-slate-500 font-normal border-t border-slate-50 pt-2">
                                        <div><strong className="text-slate-600">Who (Dono):</strong> {plan.who || "Não definido"}</div>
                                        <div><strong className="text-slate-600">When (Prazo):</strong> {plan.when || "Não definido"}</div>
                                        <div className="col-span-full font-mono text-[9px] bg-slate-50 p-1.5 rounded border border-slate-150/50 flex flex-col gap-0.5">
                                          <strong className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">How (Método):</strong>
                                          <span className="text-slate-600">{plan.how}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-400 italic pl-1">
                                  {r.crossedFactors?.includes("__no_plan_required__")
                                    ? "Dispensável (Esta vulnerabilidade foi sinalizada como sem necessidade de plano de ação)."
                                    : "Nenhum plano de ação de defesa associado a este risco ainda."}
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Opportunities column with individual cards */}
        <div className="space-y-5">
          <div className="border border-slate-200/85 p-3 px-4 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h4 className="font-extrabold text-xs md:text-sm text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4.5 h-4.5 text-indigo-500" /> Oportunidades Mapeada ({opportunities.length})
            </h4>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {opportunities.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={expandAllOpps}
                    className="text-[9px] font-black text-indigo-700 hover:text-indigo-900 bg-white hover:bg-slate-100 border border-indigo-150 px-2 py-1 rounded-lg uppercase tracking-wide cursor-pointer transition-all shadow-3xs"
                  >
                    🔍 Expandir Todas
                  </button>
                  <button
                    type="button"
                    onClick={collapseAllOpps}
                    className="text-[9px] font-black text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg uppercase tracking-wide cursor-pointer transition-all shadow-3xs"
                  >
                    📁 Recolher Todas
                  </button>
                </>
              )}
              <span className="text-[9px] font-black text-indigo-700 bg-indigo-50/50 border border-indigo-150 px-2 py-1 rounded-lg uppercase tracking-wide">Ranking Impacto</span>
            </div>
          </div>

          <div className="space-y-4">
            {opportunities.length === 0 ? (
              <div className="border border-slate-100 rounded-2xl bg-white shadow-3xs p-10 text-center text-xs text-slate-400 italic">
                Nenhuma oportunidade estratégica mapeada. Importe uma SWOT e clique em gerar.
              </div>
            ) : (
              [...opportunities]
                .sort((a, b) => b.potentialImpact - a.potentialImpact)
                .map((o, idx) => {
                  const isExpanded = !!expandedOpps[o.id];
                  const oppPlans = plans.filter(p => p.relatedId === o.id);
                  return (
                    <div 
                      id={`details-opp-${o.id}`} 
                      key={o.id} 
                      className={`border border-slate-150 rounded-2xl bg-white shadow-3xs hover:shadow-xs transition-all border-l-4 border-l-indigo-500 relative ${
                        isExpanded ? "p-5 space-y-4" : "p-3.5 hover:bg-slate-50/60 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (!isExpanded) {
                          toggleOpp(o.id);
                        }
                      }}
                    >
                      {/* CARD HEADER - Clickable to toggle when expanded or collapsed */}
                      <div 
                        className={`flex justify-between items-start gap-4 ${isExpanded ? "cursor-pointer pb-2" : ""}`}
                        onClick={(e) => {
                          if (isExpanded) {
                            toggleOpp(o.id);
                          }
                        }}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Ref O{idx + 1}</span>
                            <span className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase border ${
                              o.priority === "Alta"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : o.priority === "Média"
                                ? "bg-amber-50 text-amber-700 border-amber-250"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}>
                              Prioridade {o.priority} {o.criticality ? `(${o.criticality})` : ""}
                            </span>
                            {oppPlans.length > 0 ? (
                              <span className="px-1.5 py-0.5 text-[8px] font-extrabold rounded bg-indigo-50 text-indigo-700 border border-indigo-150 flex items-center gap-1 leading-none">
                                <ClipboardList className="w-2.5 h-2.5 text-indigo-520" />
                                {oppPlans.length} {oppPlans.length === 1 ? "Plano" : "Planos"}
                              </span>
                            ) : (
                              !o.crossedFactors?.includes("__no_plan_required__") && (
                                <span className="px-1.5 py-0.5 text-[8px] font-extrabold rounded bg-amber-50 text-amber-750 border border-amber-200 leading-none">
                                  Sem Plano
                                </span>
                              )
                            )}
                            {o.crossedFactors?.includes("__no_plan_required__") && (
                              <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-slate-100 text-slate-500 border border-slate-200 uppercase leading-none">
                                Dispensável
                              </span>
                            )}
                          </div>
                          <h5 className="font-extrabold text-xs text-slate-800 leading-normal">{o.description}</h5>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => !isEditingLocked && setEditingOpp(o)}
                            disabled={isEditingLocked}
                            type="button"
                            className={`p-1 px-1.5 text-slate-455 hover:text-indigo-650 hover:bg-slate-100 rounded-lg transition-all cursor-pointer ${
                              isEditingLocked ? "opacity-35 cursor-not-allowed" : ""
                            }`}
                            title={isEditingLocked ? "Edição bloqueada" : "Editar Oportunidade"}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (isEditingLocked) return;
                              setConfirmModal({
                                title: "Excluir Oportunidade",
                                message: "Deseja realmente excluir esta oportunidade? Os planos de ação associados a ela também serão excluídos.",
                                onConfirm: () => onDeleteOpportunity(o.id)
                              });
                            }}
                            disabled={isEditingLocked}
                            type="button"
                            className={`p-1 px-1.5 text-slate-455 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer ${
                              isEditingLocked ? "opacity-35 cursor-not-allowed" : ""
                            }`}
                            title={isEditingLocked ? "Edição bloqueada" : "Excluir Oportunidade"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleOpp(o.id)}
                            type="button"
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer ml-1"
                            title={isExpanded ? "Recolher informações" : "Expandir informações"}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* DETAILED CONTENT - Shown only when expanded */}
                      {isExpanded && (
                        <>
                          <div className="text-[11px] text-slate-500 leading-relaxed grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-3 font-normal">
                            <div>
                              <strong className="text-slate-700 block mb-0.5 text-[10px] font-bold uppercase tracking-wide">Benefício Mapeado Múltiplo:</strong>
                              <span>{o.expectedBenefit || "Não preenchido"} {o.probability && o.impact && <span className="text-slate-400 font-mono text-[9px]">(P: {o.probability} × I: {o.impact})</span>}</span>
                            </div>
                            <div>
                              <strong className="text-slate-700 block mb-0.5 text-[10px] font-bold uppercase tracking-wide">Fatores Cruzados:</strong>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {o.crossedFactors.filter((fac) => fac !== "__no_plan_required__").map((fac, i) => (
                                  <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] text-slate-650 font-bold border border-slate-200/80">
                                    {fac}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {(o.justification || o.suggestedAction) && (
                            <div className="text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-150 font-normal space-y-1.5">
                              {o.justification && (
                                <p className="text-slate-600">
                                  <strong className="text-slate-700 text-[9px] uppercase font-block tracking-wider block mb-0.5 text-indigo-700">Justificativa de Oportunidade:</strong> {o.justification}
                                </p>
                              )}
                              {o.suggestedAction && (
                                <p className="text-slate-600">
                                  <strong className="text-indigo-700 text-[9px] uppercase font-block tracking-wider block mb-0.5">Ação Recomendada (AI):</strong> {o.suggestedAction}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Associated action plans section for Opportunity */}
                          {plans && (
                            <div className="border-t border-slate-100 pt-3 space-y-2.5 font-normal text-xs">
                              <div className="flex justify-between items-center bg-blue-50/20 p-2.5 rounded-xl border border-blue-100/30">
                                <span className="font-bold text-[10px] text-blue-750 uppercase tracking-wider flex items-center gap-1.5">
                                  <ClipboardList className="w-4 h-4 text-blue-500" />
                                  Planos de Alavancagem ({plans.filter(p => p.relatedId === o.id).length})
                                </span>
                                <button
                                  onClick={() => {
                                    if (isEditingLocked) return;
                                    setAddingPlanToId(o.id);
                                    setAddingPlanType("Oportunidade");
                                    setAddingPlanDesc(o.description);
                                    setNewPlanState({
                                      type: "Oportunidade",
                                      relatedId: o.id,
                                      relatedDescription: o.description,
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
                                  }}
                                  disabled={isEditingLocked}
                                  type="button"
                                  className={`text-[10px] font-bold text-blue-600 hover:text-blue-750 flex items-center gap-0.5 leading-none ${
                                    isEditingLocked ? "opacity-35 cursor-not-allowed" : "cursor-pointer"
                                  }`}
                                >
                                  <Plus className="w-3 h-3" /> Adicionar Plano
                                </button>
                              </div>
                              
                              {plans.filter(p => p.relatedId === o.id).length > 0 ? (
                                <div className="grid grid-cols-1 gap-2 mt-1.5">
                                  {plans.filter(p => p.relatedId === o.id).map((plan, pIdx) => (
                                    <div key={plan.id} className="text-xs bg-white border border-slate-150 p-3 rounded-xl space-y-2.5 shadow-3xs relative transition-all hover:border-slate-250">
                                      <div className="flex justify-between items-center pb-1 border-b border-slate-50">
                                        <span className="font-extrabold text-[10px] text-blue-650 bg-blue-55 px-1.5 py-0.5 rounded border border-blue-150 leading-none">
                                          Plano de Ação {pIdx + 1}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          <span className={`px-1.5 py-0.5 text-[8px] font-black rounded-lg uppercase border leading-none ${getPriorityColor(plan.priority)}`}>
                                            {plan.priority}
                                          </span>
                                          <button
                                            onClick={() => {
                                              if (isEditingLocked) return;
                                              setEditingPlan(plan);
                                            }}
                                            disabled={isEditingLocked}
                                            type="button"
                                            className={`p-1 text-slate-400 hover:text-indigo-650 hover:bg-slate-100 rounded transition-all leading-none ${
                                              isEditingLocked ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                                            }`}
                                            title={isEditingLocked ? "Editar Plano 5W2H" : "Editar Plano 5W2H"}
                                          >
                                            <Edit className="w-3 h-3" />
                                          </button>
                                          {onDeletePlan && (
                                            <button
                                              onClick={() => {
                                                if (isEditingLocked) return;
                                                setConfirmModal({
                                                  title: "Excluir Plano de Ação",
                                                  message: "Deseja realmente excluir este plano de ação?",
                                                  onConfirm: () => onDeletePlan(plan.id)
                                                });
                                              }}
                                              disabled={isEditingLocked}
                                              type="button"
                                              className={`p-1 text-slate-400 hover:text-rose-600 rounded transition-all leading-none ${
                                                isEditingLocked ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                                              }`}
                                              title={isEditingLocked ? "Excluir Plano" : "Excluir Plano"}
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <p className="font-semibold text-slate-800 text-[11px] leading-relaxed">
                                        <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wide">What? (O que fazer):</span>
                                        {plan.what}
                                      </p>
                                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] text-slate-500 font-normal border-t border-slate-50 pt-2">
                                        <div><strong className="text-slate-600">Who (Dono):</strong> {plan.who || "Não definido"}</div>
                                        <div><strong className="text-slate-600">When (Prazo):</strong> {plan.when || "Não definido"}</div>
                                        <div className="col-span-full font-mono text-[9px] bg-slate-50 p-1.5 rounded border border-slate-150/50 flex flex-col gap-0.5">
                                          <strong className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">How (Método):</strong>
                                          <span className="text-slate-600">{plan.how}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-400 italic pl-1">
                                  {o.crossedFactors?.includes("__no_plan_required__")
                                    ? "Dispensável (Esta oportunidade foi sinalizada como sem necessidade de plano de ação)."
                                    : "Nenhum plano de ação estratégico associado a esta oportunidade ainda."}
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* MODAL: EDITAR RISCO */}
      {editingRisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-100 flex flex-col overflow-hidden max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Editar Risco Estratégico
                </h4>
                <p className="text-[11px] text-slate-500">Ajuste os parâmetros de severidade e causas do fator estratégico mapeado.</p>
              </div>
              <button
                onClick={() => setEditingRisk(null)}
                className="p-1 px-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Descricao */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição do Risco</label>
                <textarea
                  value={editingRisk.description}
                  onChange={(e) => setEditingRisk({ ...editingRisk, description: e.target.value })}
                  rows={2}
                  className="w-full text-xs p-3 border border-slate-250 rounded-xl bg-slate-50/50 focus:outline-hidden focus:border-indigo-505 focus:bg-white resize-none"
                />
              </div>

              {/* Causa Base */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Causa Base Provável</label>
                <input
                  type="text"
                  value={editingRisk.probableCause}
                  onChange={(e) => setEditingRisk({ ...editingRisk, probableCause: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-250 rounded-xl bg-slate-50/50 focus:outline-hidden focus:border-indigo-505 focus:bg-white"
                />
              </div>

              {/* Probabilidade & Impacto Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Probabilidade</label>
                  <select
                    value={editingRisk.probability}
                    onChange={(e) => {
                      const prob = parseInt(e.target.value, 10);
                      const imp = editingRisk.impact;
                      const score = prob * imp;
                      const cls = score >= 16 ? 'Crítico' : score >= 9 ? 'Médio' : 'Baixo';
                      setEditingRisk({
                        ...editingRisk,
                        probability: prob,
                        criticality: score,
                        criticalityClass: cls
                      });
                    }}
                    className="w-full text-xs p-2.5 border border-slate-250 rounded-xl bg-white focus:outline-hidden focus:border-indigo-550"
                  >
                    <option value={1}>1 - Muito Baixa</option>
                    <option value={2}>2 - Baixa</option>
                    <option value={3}>3 - Média</option>
                    <option value={4}>4 - Alta</option>
                    <option value={5}>5 - Muito Alta</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Impacto</label>
                  <select
                    value={editingRisk.impact}
                    onChange={(e) => {
                      const imp = parseInt(e.target.value, 10);
                      const prob = editingRisk.probability;
                      const score = prob * imp;
                      const cls = score >= 16 ? 'Crítico' : score >= 9 ? 'Médio' : 'Baixo';
                      setEditingRisk({
                        ...editingRisk,
                        impact: imp,
                        criticality: score,
                        criticalityClass: cls
                      });
                    }}
                    className="w-full text-xs p-2.5 border border-slate-250 rounded-xl bg-white focus:outline-hidden focus:border-indigo-550"
                  >
                    <option value={1}>1 - Insignificante</option>
                    <option value={2}>2 - Baixo</option>
                    <option value={3}>3 - Moderado</option>
                    <option value={4}>4 - Alto</option>
                    <option value={5}>5 - Crítico</option>
                  </select>
                </div>
              </div>

              {/* Opção Não Requer Plano de Ação */}
              <div className="flex items-center gap-2 p-3 bg-indigo-50/25 border border-indigo-100/35 rounded-xl">
                <input
                  type="checkbox"
                  id="risk_no_plan_required"
                  checked={editingRisk.crossedFactors?.includes("__no_plan_required__") ?? false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    let nextFactors = editingRisk.crossedFactors ? [...editingRisk.crossedFactors] : [];
                    if (checked) {
                      if (!nextFactors.includes("__no_plan_required__")) {
                        nextFactors.push("__no_plan_required__");
                      }
                    } else {
                      nextFactors = nextFactors.filter((f) => f !== "__no_plan_required__");
                    }
                    setEditingRisk({
                      ...editingRisk,
                      crossedFactors: nextFactors
                    });
                  }}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="risk_no_plan_required" className="text-[11px] font-bold text-slate-700 hover:text-indigo-700 cursor-pointer select-none">
                  Dispensar Plano de Ação (Este risco não precisa de um plano 5W2H de defesa)
                </label>
              </div>

              {/* live criticality indicator */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Resultado Calculador</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-black text-slate-800">Score de Criticidade: {editingRisk.criticality}</span>
                    <span className="text-xs text-slate-400">(P × I)</span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase border ${
                  editingRisk.criticalityClass === "Crítico"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : editingRisk.criticalityClass === "Médio"
                    ? "bg-amber-50 text-amber-700 border-amber-250"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}>
                  Risco {editingRisk.criticalityClass} {editingRisk.criticality < 9 ? "(Será Descartado)" : ""}
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-5 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setEditingRisk(null)}
                className="px-4 py-2 border border-slate-200 text-slate-650 bg-white font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingRisk.description.trim() === "") return;
                  onUpdateRisk(editingRisk);
                  setEditingRisk(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL: EDITAR OPORTUNIDADE */}
      {editingOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-100 flex flex-col overflow-hidden max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Editar Oportunidade Estratégica
                </h4>
                <p className="text-[11px] text-slate-500">Mude a prioridade ou os retornos estimados da oportunidade estratégica ativa.</p>
              </div>
              <button
                onClick={() => setEditingOpp(null)}
                className="p-1 px-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Descricao */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição do Fator</label>
                <textarea
                  value={editingOpp.description}
                  onChange={(e) => setEditingOpp({ ...editingOpp, description: e.target.value })}
                  rows={2}
                  className="w-full text-xs p-3 border border-slate-250 rounded-xl bg-slate-50/50 focus:outline-hidden focus:border-indigo-505 focus:bg-white resize-none"
                />
              </div>

              {/* Beneficio esperado */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Benefício Mapeado Esperado</label>
                <input
                  type="text"
                  value={editingOpp.expectedBenefit}
                  onChange={(e) => setEditingOpp({ ...editingOpp, expectedBenefit: e.target.value })}
                  className="w-full text-xs p-3 border border-slate-250 rounded-xl bg-slate-50/50 focus:outline-hidden focus:border-indigo-505 focus:bg-white"
                />
              </div>

              {/* Prioridade & Impacto */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Probabilidade</label>
                  <select
                    value={editingOpp.probability || 3}
                    onChange={(e) => {
                      const prob = parseInt(e.target.value, 10);
                      const imp = editingOpp.potentialImpact || 3;
                      const score = prob * imp;
                      const prio = score >= 16 ? 'Alta' : score >= 9 ? 'Média' : 'Baixa';
                      setEditingOpp({
                        ...editingOpp,
                        probability: prob,
                        criticality: score,
                        priority: prio as 'Baixa' | 'Média' | 'Alta'
                      });
                    }}
                    className="w-full text-xs p-2.5 border border-slate-250 rounded-xl bg-white focus:outline-hidden focus:border-indigo-550"
                  >
                    <option value={1}>1 - Muito Baixa</option>
                    <option value={2}>2 - Baixa</option>
                    <option value={3}>3 - Média</option>
                    <option value={4}>4 - Alta</option>
                    <option value={5}>5 - Muito Alta</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Impacto Potencial</label>
                  <select
                    value={editingOpp.potentialImpact || 3}
                    onChange={(e) => {
                      const imp = parseInt(e.target.value, 10);
                      const prob = editingOpp.probability || 3;
                      const score = prob * imp;
                      const prio = score >= 16 ? 'Alta' : score >= 9 ? 'Média' : 'Baixa';
                      setEditingOpp({
                        ...editingOpp,
                        potentialImpact: imp,
                        impact: imp,
                        criticality: score,
                        priority: prio as 'Baixa' | 'Média' | 'Alta'
                      });
                    }}
                    className="w-full text-xs p-2.5 border border-slate-250 rounded-xl bg-white focus:outline-hidden focus:border-indigo-550"
                  >
                    <option value={1}>1 - Insignificante</option>
                    <option value={2}>2 - Baixo</option>
                    <option value={3}>3 - Moderado</option>
                    <option value={4}>4 - Alto</option>
                    <option value={5}>5 - Crítico</option>
                  </select>
                </div>
              </div>

              {/* Opção Não Requer Plano de Ação */}
              <div className="flex items-center gap-2 p-3 bg-indigo-50/25 border border-indigo-100/35 rounded-xl">
                <input
                  type="checkbox"
                  id="opp_no_plan_required"
                  checked={editingOpp.crossedFactors?.includes("__no_plan_required__") ?? false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    let nextFactors = editingOpp.crossedFactors ? [...editingOpp.crossedFactors] : [];
                    if (checked) {
                      if (!nextFactors.includes("__no_plan_required__")) {
                        nextFactors.push("__no_plan_required__");
                      }
                    } else {
                      nextFactors = nextFactors.filter((f) => f !== "__no_plan_required__");
                    }
                    setEditingOpp({
                      ...editingOpp,
                      crossedFactors: nextFactors
                    });
                  }}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="opp_no_plan_required" className="text-[11px] font-bold text-slate-700 hover:text-indigo-700 cursor-pointer select-none">
                  Dispensar Plano de Ação (Esta oportunidade não precisa de um plano 5W2H estratégico)
                </label>
              </div>

              {/* live leverage indicator */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Resultado Calculador</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-black text-slate-800">Score de Cruzamento: {editingOpp.criticality || ((editingOpp.probability || 3) * (editingOpp.potentialImpact || 3))}</span>
                    <span className="text-xs text-slate-400">(P × I)</span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase border ${
                  editingOpp.priority === "Alta"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : editingOpp.priority === "Média"
                    ? "bg-amber-50 text-amber-700 border-amber-250"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}>
                  Aproveitamento {editingOpp.priority} {((editingOpp.probability || 3) * (editingOpp.potentialImpact || 3)) < 9 ? "(Será Descartado)" : ""}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setEditingOpp(null)}
                className="px-4 py-2 border border-slate-200 text-slate-650 bg-white font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingOpp.description.trim() === "") return;
                  onUpdateOpportunity(editingOpp);
                  setEditingOpp(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR PLANO DE AÇÃO 5W2H */}
      {addingPlanToId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border border-slate-100 flex flex-col overflow-hidden my-8 max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                  <ClipboardList className={`w-4 h-4 ${addingPlanType === "Risco" ? "text-amber-500" : "text-blue-500"}`} />
                  Adicionar Plano de Ação 5W2H {addingPlanType === "Risco" ? "de Defesa" : "de Alavancagem"}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Defina um plano de ação prático e direcionado para: <strong className="text-slate-700">"{addingPlanDesc}"</strong>
                </p>
              </div>
              <button
                onClick={() => setAddingPlanToId(null)}
                className="p-1 px-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Scrollable */}
            <div className="p-6 space-y-4 overflow-y-auto" style={{ contentVisibility: "auto" }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* WHAT (O que) */}
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. O Que (What) - Ação Estratégica</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Contratar assessoria jurídica especialista em LGPD"
                    value={newPlanState.what}
                    onChange={(e) => setNewPlanState({ ...newPlanState, what: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-250 rounded-xl focus:outline-hidden focus:border-indigo-505"
                  />
                </div>

                {/* WHY (Por que) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Por Que (Why) - Justificativa</label>
                  <input
                    type="text"
                    placeholder="Ex: Eliminar risco de multas e sanções por vazamento"
                    value={newPlanState.why}
                    onChange={(e) => setNewPlanState({ ...newPlanState, why: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-250 rounded-xl focus:outline-hidden focus:border-indigo-505"
                  />
                </div>

                {/* WHO (Quem) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">3. Quem (Who) - Responsável</label>
                  <input
                    type="text"
                    placeholder="Ex: Dr. Roberto (Jurídico)"
                    value={newPlanState.who}
                    onChange={(e) => setNewPlanState({ ...newPlanState, who: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-250 rounded-xl focus:outline-hidden focus:border-indigo-505"
                  />
                </div>

                 {/* WHEN (Quando) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">4. Quando (When) - Mês Alvo & Prazo</label>
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
                      placeholder="Ex: Maio de 2026"
                      value={newPlanState.when}
                      onChange={(e) => setNewPlanState({ ...newPlanState, when: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-250 rounded-xl focus:outline-hidden focus:border-indigo-505"
                    />
                  </div>
                </div>

                {/* WHERE (Onde) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">5. Onde (Where) - Local / Setor</label>
                  <input
                    type="text"
                    placeholder="Ex: Sede ACLF / Nuvem Corporativa"
                    value={newPlanState.where}
                    onChange={(e) => setNewPlanState({ ...newPlanState, where: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-250 rounded-xl focus:outline-hidden focus:border-indigo-505"
                  />
                </div>

                {/* HOW (Como) */}
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">6. Como (How) - Método Prático</label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Realizar cotação com 3 escritórios especializados, aprovação com diretoria e assinatura do contrato SLA."
                    value={newPlanState.how}
                    onChange={(e) => setNewPlanState({ ...newPlanState, how: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-250 rounded-xl focus:outline-hidden focus:border-indigo-505 resize-none"
                  />
                </div>

                {/* HOW MUCH (Quanto custa) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">7. Quanto Custa (How Much)</label>
                  <input
                    type="text"
                    placeholder="Ex: R$ 15.000,00 ou Sem custos adicionais"
                    value={newPlanState.howMuch}
                    onChange={(e) => setNewPlanState({ ...newPlanState, howMuch: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-250 rounded-xl focus:outline-hidden focus:border-indigo-505"
                  />
                </div>

                {/* PRIORITY Level */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prioridade do Plano</label>
                  <select
                    value={newPlanState.priority}
                    onChange={(e) => setNewPlanState({ ...newPlanState, priority: e.target.value as "Crítica" | "Alta" | "Média" | "Baixa" })}
                    className="w-full text-xs p-2.5 border border-slate-250 rounded-xl bg-white focus:outline-hidden focus:border-indigo-505"
                  >
                    <option value="Crítica">Crítica</option>
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>

                {/* SUGGESTED KR's */}
                <div className="space-y-1 col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Sugestões de KR´s (Key Results)
                    </label>
                    <span className="text-[9px] text-slate-400 italic">Digite um por linha</span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Ex: Reduzir em 100% vulnerabilidades críticas de TI&#10;Implementar 5 novas políticas de segurança da informação"
                    value={newPlanState.suggestedKrs?.join("\n")}
                    onChange={(e) => {
                      const lines = e.target.value.split("\n").filter(l => l.trim() !== "");
                      setNewPlanState({ ...newPlanState, suggestedKrs: lines });
                    }}
                    className="w-full text-xs p-2.5 border border-slate-250 rounded-xl focus:outline-hidden focus:border-indigo-550 resize-none font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-5 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setAddingPlanToId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-650 bg-white font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newPlanState.what.trim()) {
                    alert("Por favor, preencha a descrição (O Que será feito) do plano de ação antes de continuar.");
                    return;
                  }
                  if (onAddPlan) {
                    onAddPlan({
                      ...newPlanState,
                      id: "plan-" + Date.now() + Math.random().toString(36).substr(2, 5),
                    } as ActionPlanItem);
                    setSuccessToast(`Plano de ação criado com sucesso! Ele já foi sincronizado e está no topo da aba "Planos de Ação 5W2H".`);
                  }
                  setAddingPlanToId(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Salvar Plano de Ação
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block justify-between items-center">Where? (Onde)</label>
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
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">When? (Mês Alvo & Prazo)</label>
                  <div className="flex gap-1.5 font-sans">
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
                      className="text-xs p-2.5 border border-slate-255 rounded-xl bg-slate-50 font-bold text-indigo-700 shrink-0 w-[110px] focus:outline-hidden"
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
                    className="w-full text-xs p-3 border border-slate-255 rounded-xl bg-slate-50/50 focus:outline-hidden focus:bg-white resize-none font-sans"
                    placeholder="e.g. Treinar 100% da equipe em 15 dias&#10;Reduzir em 20% os problemas identificados"
                  />
                  <p className="text-[10px] text-slate-400 italic font-normal">Preencha um Key Result por linha. Essas são apenas sugestões para direcionar o monitoramento.</p>
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
                  if (onUpdatePlan) {
                    onUpdatePlan(editingPlan);
                  }
                  setSuccessToast("Plano de ação sincronizado e atualizado com sucesso!");
                  setEditingPlan(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast flutuante de Sucesso */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-55 max-w-sm md:max-w-md bg-slate-900 border border-emerald-500/30 text-white p-4 rounded-xl shadow-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="p-1.5 bg-emerald-500/15 rounded-lg text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-0.5">
            <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Sincronizado</h5>
            <p className="text-xs font-semibold text-slate-200 leading-snug">{successToast}</p>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
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
