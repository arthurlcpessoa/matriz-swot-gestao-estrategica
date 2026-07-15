import React, { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  CheckCircle2, 
  Calendar, 
  AlertCircle, 
  MousePointerClick,
  Clock,
  Sparkles,
  BarChart2,
  CalendarDays,
  CheckCircle,
  HelpCircle,
  CircleDot,
  X
} from "lucide-react";
import { ActionPlanItem } from "../types";

interface PerformanceDashboardProps {
  plans: ActionPlanItem[];
  onUpdatePlan: (updated: ActionPlanItem) => void;
}

const MONTHS_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const MONTHS_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", 
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

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

export default function PerformanceDashboard({ plans, onUpdatePlan }: PerformanceDashboardProps) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Auto-esconder toast após 5.5s
  React.useEffect(() => {
    if (!successToast) return;
    const timer = setTimeout(() => {
      setSuccessToast(null);
    }, 5500);
    return () => clearTimeout(timer);
  }, [successToast]);

  // Mapear planos para seus respectivos meses de previsão
  // Para fins de flexibilidade, as ações cujo campo "when" não indica mês começam em "Outros" ou no mês atual se o usuário quiser configurar.
  const plansWithParsedMonth = plans.map(p => {
    const detectedIdx = parseMonthFromWhen(p.when);
    return {
      ...p,
      detectedMonthIdx: detectedIdx // null se for indefinido/outros
    };
  });

  // Agrupar dados por mês (0 a 11)
  const monthlyData = MONTHS_SHORT.map((label, idx) => {
    const plansInMonth = plansWithParsedMonth.filter(p => p.detectedMonthIdx === idx);
    const previsto = plansInMonth.length;
    const realizado = plansInMonth.filter(p => p.completed).length;
    const pendente = previsto - realizado;
    const porcentagem = previsto > 0 ? Math.round((realizado / previsto) * 100) : 0;

    return {
      index: idx,
      name: label,
      fullName: MONTHS_FULL[idx],
      "Previstos": previsto,
      "Realizados": realizado,
      "Pendentes": pendente,
      "porcentagem": porcentagem,
      plans: plansInMonth
    };
  });

  // Contagem de planos que não foram mapeados em nenhum mês específico do calendário
  const unmappedPlans = plansWithParsedMonth.filter(p => p.detectedMonthIdx === null);
  const unmappedPrevistos = unmappedPlans.length;
  const unmappedRealizados = unmappedPlans.filter(p => p.completed).length;
  const unmappedPorcentagem = unmappedPrevistos > 0 ? Math.round((unmappedRealizados / unmappedPrevistos) * 100) : 0;

  // Totais globais
  const totalPrevistosGlobal = plans.length;
  const totalRealizadosGlobal = plans.filter(p => p.completed).length;
  const totalPendentesGlobal = totalPrevistosGlobal - totalRealizadosGlobal;
  const porcentagemGlobal = totalPrevistosGlobal > 0 ? Math.round((totalRealizadosGlobal / totalPrevistosGlobal) * 100) : 0;

  // Mapeia ações do mês selecionado
  const activeDetailPlans = selectedMonthIndex !== null 
    ? monthlyData[selectedMonthIndex].plans 
    : [];
  const activeDetailMonthName = selectedMonthIndex !== null 
    ? MONTHS_FULL[selectedMonthIndex] 
    : "";

  return (
    <div id="performance-dashboard-container" className="space-y-6">
      
      {/* Cabeçalho do Painel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-slate-150 p-6 rounded-2xl shadow-3xs gap-4 mb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full w-fit">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-600" />
            Meta & Cronograma
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Painel de Desempenho 5W2H</h3>
          <p className="text-xs text-slate-500">Acompanhe as metas previstas versus realizadas e o percentual de eficácia tática mensal.</p>
        </div>

        {/* Global Performance Badge */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-150 p-4 rounded-xl shrink-0">
          <div className="relative flex items-center justify-center w-12 h-12 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-600 shrink-0">
            <TrendingUp className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">Eficácia Geral</span>
            <span className="text-xl font-black text-slate-800 tracking-tight leading-none">
              {porcentagemGlobal}% <span className="text-xs text-slate-500 font-normal">concluídos</span>
            </span>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Previstos */}
        <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-3xs space-y-2 relative overflow-hidden group hover:border-slate-300 transition-all">
          <div className="absolute right-3 top-3 opacity-10 group-hover:scale-110 transition-transform">
            <CalendarDays className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Ações Previstas</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{totalPrevistosGlobal}</span>
            <span className="text-[10px] text-slate-500">planos totais</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1">
            <div className="bg-slate-450 h-1 rounded-full" style={{ width: "100%" }}></div>
          </div>
        </div>

        {/* Realizados */}
        <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-3xs space-y-2 relative overflow-hidden group hover:border-emerald-200 transition-all">
          <div className="absolute right-3 top-3 opacity-10 group-hover:scale-110 transition-transform">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Concluídas / Realizadas</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-650">{totalRealizadosGlobal}</span>
            <span className="text-[10px] text-emerald-600 font-semibold">{porcentagemGlobal}% do total</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1">
            <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${porcentagemGlobal}%` }}></div>
          </div>
        </div>

        {/* Pendentes */}
        <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-3xs space-y-2 relative overflow-hidden group hover:border-indigo-200 transition-all">
          <div className="absolute right-3 top-3 opacity-10 group-hover:scale-110 transition-transform">
            <Clock className="w-10 h-10 text-indigo-500" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Pendentes / Em Prazo</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{totalPendentesGlobal}</span>
            <span className="text-[10px] text-slate-500">em andamento</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1">
            <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${100 - porcentagemGlobal}%` }}></div>
          </div>
        </div>

        {/* Mapeados Eficazes */}
        <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-3xs space-y-2 relative overflow-hidden group hover:border-amber-200 transition-all">
          <div className="absolute right-3 top-3 opacity-10 group-hover:scale-110 transition-transform">
            <HelpCircle className="w-10 h-10 text-amber-500" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Sem Mês Definido</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-650">{unmappedPrevistos}</span>
            <span className="text-[10px] text-amber-600 font-semibold">{unmappedRealizados} concluidos</span>
          </div>
          <div className="text-[9px] text-slate-400 italic">Identificados como "Outros" no cronograma</div>
        </div>
      </div>

      {/* Gráfico & Tabela Comparativa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico Comparativo Principal (2 colunas) */}
        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-3xs lg:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h4 className="font-extrabold text-sm text-slate-850 flex items-center gap-1.5">
                <BarChart2 className="w-4.5 h-4.5 text-indigo-650" />
                Planos Previstos vs Realizados por Mês
              </h4>
              <p className="text-[11px] text-slate-500">Clique em qualquer barra para abrir as tarefas daquele mês específico.</p>
            </div>

            {/* Custom Legend */}
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-slate-350 rounded-xs"></span>
                <span className="text-slate-500">Previstos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs"></span>
                <span className="text-emerald-600">Concluídos</span>
              </div>
            </div>
          </div>

          {/* Gráfico Recharts */}
          <div className="h-72 w-full pt-4">
            {plans.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">
                Nenhum plano de ação disponível para exibição no gráfico.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                  onClick={(state) => {
                    if (state && state.activeTooltipIndex !== undefined) {
                      setSelectedMonthIndex(state.activeTooltipIndex);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: "rgba(99, 102, 241, 0.04)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white rounded-xl p-3 shadow-xl border border-slate-800 space-y-1 text-xs">
                            <p className="font-extrabold text-[11px] border-b border-white/10 pb-1 mb-1 text-indigo-300">
                              {data.fullName}
                            </p>
                            <p className="font-medium text-[11px]">
                              Previstos: <span className="font-bold text-slate-205">{data["Previstos"]}</span>
                            </p>
                            <p className="font-medium text-[11px]">
                              Realizados: <span className="font-bold text-emerald-400">{data["Realizados"]}</span>
                            </p>
                            <p className="font-medium text-[11px]">
                              Pendente: <span className="font-bold text-indigo-300">{data["Pendentes"]}</span>
                            </p>
                            <p className="text-[10px] font-black text-teal-300 pt-1">
                              Eficácia: {data.porcentagem}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  {/* Barra - Previstos (Cinza Azulado) */}
                  <Bar 
                    dataKey="Previstos" 
                    fill="#cbd5e1" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={38}
                  >
                    {monthlyData.map((entry, index) => {
                      const isSelected = selectedMonthIndex === index;
                      return (
                        <Cell 
                          key={`cell-prev-${index}`} 
                          fill={isSelected ? "#94a3b8" : "#cbd5e1"} 
                        />
                      );
                    })}
                  </Bar>

                  {/* Barra - Realizados/Concluídos (Verde Esmeralda) */}
                  <Bar 
                    dataKey="Realizados" 
                    fill="#10b981" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={38}
                  >
                    {monthlyData.map((entry, index) => {
                      const isSelected = selectedMonthIndex === index;
                      return (
                        <Cell 
                          key={`cell-real-${index}`} 
                          fill={isSelected ? "#047857" : "#10b981"} 
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="text-[11px] text-slate-400 text-center italic font-normal pt-2 border-t border-slate-50">
            Dica: Toque em qualquer mês no gráfico para detalhar, gerenciar as pendências e ver os percentuais específicos.
          </div>
        </div>

        {/* Tabela de Eficácia e Status Anual */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-3xs space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-sm text-slate-850 flex items-center gap-1.5 pb-2.5 border-b border-slate-100">
              <Calendar className="w-4.5 h-4.5 text-emerald-600" />
              Tabela de Metas Anuais
            </h4>
            
            <div className="space-y-1.5 overflow-y-auto max-h-[300px] scrollbar-thin pt-2 pr-1">
              {monthlyData.map((m) => {
                const isSelected = selectedMonthIndex === m.index;
                const hasAcoes = m["Previstos"] > 0;
                
                return (
                  <button
                    key={m.name}
                    onClick={() => setSelectedMonthIndex(isSelected ? null : m.index)}
                    type="button"
                    className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-indigo-600 border-indigo-700 text-white shadow-xs" 
                        : "bg-slate-50/50 hover:bg-slate-100/50 border-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${hasAcoes ? (m.porcentagem === 100 ? 'bg-emerald-500' : 'bg-indigo-400') : 'bg-slate-300'}`}></span>
                      <span className="text-[11px] font-bold">{m.fullName}</span>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>
                        {m["Realizados"]}/{m["Previstos"]}
                      </span>
                      <span className={`text-[10px] p-1 font-extrabold rounded-md min-w-[36px] text-center ${
                        isSelected 
                          ? m.porcentagem === 100 ? 'bg-emerald-700 text-white' : 'bg-indigo-800 text-white'
                          : m.porcentagem === 100 ? 'bg-emerald-50 text-emerald-700' : hasAcoes ? 'bg-indigo-50 text-indigo-750' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {m.porcentagem}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setSelectedMonthIndex(null)}
              className="w-full text-center py-2 text-[11px] font-bold text-slate-600 hover:text-indigo-600 border border-dashed border-slate-200 hover:border-indigo-300 bg-slate-50/20 rounded-xl cursor-pointer"
            >
              Ver Todas sem Mês Marcado ({unmappedPrevistos})
            </button>
          </div>
        </div>
      </div>

      {/* Seção de Detalhamento por Mês Selecionado */}
      <div id="details-month-action-section" className="bg-white border border-slate-150 rounded-2xl p-6 shadow-3xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-100 gap-3">
          <div className="space-y-0.5">
            <h4 id="month-header-details" className="font-extrabold text-sm text-slate-850 flex items-center gap-1.5">
              <CircleDot className="w-5 h-5 text-indigo-605" />
              {selectedMonthIndex !== null 
                ? `Planos Relacionados a ${activeDetailMonthName}` 
                : "Todos os Planos de Ação Cadastrados"}
            </h4>
            <p className="text-[11px] text-slate-500">
              {selectedMonthIndex !== null 
                ? `Exibindo apenas as ${activeDetailPlans.length} ações táticas com metas previstas para o mês de ${activeDetailMonthName}.` 
                : `Exibindo todas as ${plans.length} ações cadastradas no sistema. Utilize o gráfico ou a tabela de metas anuais acima para filtrar.`
              }
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedMonthIndex !== null && (
              <button
                onClick={() => setSelectedMonthIndex(null)}
                className="text-[11px] font-bold text-indigo-650 hover:text-indigo-850 cursor-pointer bg-indigo-50 hover:bg-indigo-100/70 px-3 py-1.5 rounded-lg border border-indigo-200/50 transition-all"
              >
                Mostrar Todos os Meses
              </button>
            )}
          </div>
        </div>

        {/* Filtros rápidos adicionais por Badges de meses com planos */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            onClick={() => setSelectedMonthIndex(null)}
            className={`px-3 py-1 text-[10.5px] font-bold rounded-lg border transition-all cursor-pointer ${
              selectedMonthIndex === null 
                ? "bg-slate-800 border-slate-900 text-white shadow-3xs" 
                : "bg-slate-50 border-slate-150 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Todos ({plans.length})
          </button>
          
          {MONTHS_SHORT.map((m, idx) => {
            const count = plansWithParsedMonth.filter(p => p.detectedMonthIdx === idx).length;
            if (count === 0) return null;
            const isSelected = selectedMonthIndex === idx;

            return (
              <button
                key={m}
                onClick={() => setSelectedMonthIndex(idx)}
                className={`px-2.5 py-1 text-[10.5px] font-bold rounded-lg border transition-all cursor-pointer ${
                  isSelected 
                    ? "bg-indigo-600 border-indigo-700 text-white shadow-3xs" 
                    : "bg-indigo-50/40 border-indigo-100 text-indigo-700 hover:bg-indigo-50"
                }`}
              >
                {MONTHS_FULL[idx]} ({count})
              </button>
            );
          })}

          {unmappedPrevistos > 0 && (
            <button
              onClick={() => setSelectedMonthIndex(-1)} // -1 representará os sem data
              className={`px-2.5 py-1 text-[10.5px] font-bold rounded-lg border transition-all cursor-pointer ${
                selectedMonthIndex === -1 
                  ? "bg-amber-600 border-amber-700 text-white shadow-3xs" 
                  : "bg-amber-50/40 border-amber-100 text-amber-700 hover:bg-amber-50"
              }`}
            >
              Sem Mês Definido ({unmappedPrevistos})
            </button>
          )}
        </div>

        {/* Lista de Ações Encontradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            selectedMonthIndex === null 
              ? plansWithParsedMonth 
              : selectedMonthIndex === -1 
                ? unmappedPlans 
                : activeDetailPlans
          ).length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              Nenhuma ação tática agendada para este filtro de data.
            </div>
          ) : (
            (
              selectedMonthIndex === null 
                ? plansWithParsedMonth 
                : selectedMonthIndex === -1 
                  ? unmappedPlans 
                  : activeDetailPlans
            ).map((plan, index) => {
              const isCompleted = !!plan.completed;
              // Detecta o nome do mês para exibir uma tag elegante se estiver no modo "Todos"
              const parsedMonthLabel = plan.detectedMonthIdx !== null 
                ? MONTHS_FULL[plan.detectedMonthIdx] 
                : "Sem Mês Definido";

              return (
                <div 
                  key={plan.id}
                  className={`p-4 border rounded-xl flex flex-col justify-between transition-all duration-300 relative ${
                    isCompleted 
                      ? 'border-emerald-250 bg-emerald-50/5' 
                      : 'border-slate-150 bg-white hover:border-slate-250 shadow-3xs hover:shadow-2xs'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                            {plan.type}
                          </span>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                            plan.priority === "Crítica" || plan.priority === "Alta" 
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-slate-100 text-slate-700 border border-slate-150"
                          }`}>
                            Prioridade {plan.priority}
                          </span>
                          
                          {/* Tag Indicativa de Mês de Vinculação */}
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            plan.detectedMonthIdx !== null 
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            Meta: {parsedMonthLabel}
                          </span>
                        </div>
                        
                        <h5 className={`font-extrabold text-xs text-slate-850 tracking-tight leading-snug ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                          {plan.what}
                        </h5>
                      </div>

                      {/* Botão de Checkbox Completo */}
                      <button 
                        onClick={() => onUpdatePlan({ ...plan, completed: !isCompleted })}
                        className="p-1 cursor-pointer shrink-0"
                        title={isCompleted ? "Marcar como pendente" : "Marcar como concluído"}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5.5 h-5.5 text-emerald-600" />
                        ) : (
                          <div className="w-5.5 h-5.5 border-2 border-slate-300 rounded-full hover:border-indigo-500 transition-colors" />
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                      <strong>Por que:</strong> {plan.why}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium">
                      <div>
                        <strong className="text-slate-400">Quem:</strong> {plan.who}
                      </div>
                      <div>
                        <strong className="text-slate-400">Onde:</strong> {plan.where}
                      </div>
                      <div>
                        <strong className="text-slate-400">Procedimento:</strong> {plan.how}
                      </div>
                      <div>
                        <strong className="text-slate-400">Prazo original:</strong> {plan.when}
                      </div>
                    </div>
                  </div>

                  {/* Atribuição rápida de Mês */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wide">
                      Mudar ou Atribuir Mês:
                    </span>
                    <select
                      value={plan.detectedMonthIdx !== null ? plan.detectedMonthIdx : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        let updatedText = "";
                        if (val === "") {
                          updatedText = "Imediato";
                          onUpdatePlan({ ...plan, when: updatedText });
                        } else {
                          const monthIdx = parseInt(val, 10);
                          const monthName = MONTHS_FULL[monthIdx];
                          updatedText = `${monthName} de 2026`;
                          onUpdatePlan({ ...plan, when: updatedText });
                        }
                        setSuccessToast(`Prazo da ação "${plan.what}" alterado para "${updatedText}" e sincronizado no banco de dados!`);
                      }}
                      className="text-[10px] p-1.5 border border-slate-200 rounded-lg bg-white font-bold text-slate-700 outline-hidden hover:border-indigo-300 cursor-pointer"
                    >
                      <option value="">Não definido (Outros)</option>
                      {MONTHS_FULL.map((name, idx) => (
                        <option key={name} value={idx}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Toast flutuante de Sucesso */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-55 max-w-sm md:max-w-md bg-slate-900 border border-emerald-500/30 text-white p-4 rounded-xl shadow-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="p-1.5 bg-emerald-500/15 rounded-lg text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-0.5">
            <h5 className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase leading-none">Sincronizado</h5>
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

    </div>
  );
}
