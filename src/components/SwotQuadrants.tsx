import React, { useState } from "react";
import { PlusCircle, Trash2, Shield, HeartCrack, TrendingUp, AlertTriangle, Edit, X, Info } from "lucide-react";
import { motion } from "motion/react";
import { SwotItem, SwotCategory } from "../types";

interface SwotQuadrantsProps {
  items: SwotItem[];
  onDeleteItem: (id: string) => void;
  onAddItem: (category: SwotCategory, description: string) => void;
  onUpdateItem: (updated: SwotItem) => void;
  isEditingLocked?: boolean;
}

export default function SwotQuadrants({ 
  items, 
  onDeleteItem, 
  onAddItem, 
  onUpdateItem,
  isEditingLocked = false
}: SwotQuadrantsProps) {
  const [editingItem, setEditingItem] = useState<SwotItem | null>(null);
  // Input states for quick additions
  const [newDesc, setNewDesc] = React.useState<Record<SwotCategory, string>>({
    Força: "",
    Fraqueza: "",
    Oportunidade: "",
    Ameaça: ""
  });

  const handleQuickAdd = (category: SwotCategory) => {
    const text = newDesc[category].trim();
    if (!text) return;
    onAddItem(category, text);
    setNewDesc(prev => ({ ...prev, [category]: "" }));
  };

  // Helper filters
  const forcas = items.filter(i => i.category === "Força");
  const fraquezas = items.filter(i => i.category === "Fraqueza");
  const oportunidades = items.filter(i => i.category === "Oportunidade");
  const ameacas = items.filter(i => i.category === "Ameaça");

  const categoriesConfig: {
    category: SwotCategory;
    title: string;
    english: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    icon: React.ReactNode;
    list: SwotItem[];
    placeholder: string;
  }[] = [
    {
      category: "Força",
      title: "Forças",
      english: "Strengths (Interno / Positivo)",
      bgColor: "bg-emerald-50/70",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-700",
      icon: <Shield className="w-5 h-5 text-emerald-650" />,
      list: forcas,
      placeholder: "Adicionar força... (ex: Patente registrada)"
    },
    {
      category: "Fraqueza",
      title: "Fraquezas",
      english: "Weaknesses (Interno / Negativo)",
      bgColor: "bg-amber-50/70",
      borderColor: "border-amber-200",
      textColor: "text-amber-700",
      icon: <HeartCrack className="w-5 h-5 text-amber-650" />,
      list: fraquezas,
      placeholder: "Adicionar fraqueza... (ex: Dependência de 2 fornecedores)"
    },
    {
      category: "Oportunidade",
      title: "Oportunidades",
      english: "Opportunities (Externo / Positivo)",
      bgColor: "bg-blue-50/70",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      icon: <TrendingUp className="w-5 h-5 text-blue-650" />,
      list: oportunidades,
      placeholder: "Adicionar oportunidade... (ex: Novo nicho de e-commerce)"
    },
    {
      category: "Ameaça",
      title: "Ameaças",
      english: "Threats (Externo / Negativo)",
      bgColor: "bg-rose-50/70",
      borderColor: "border-rose-200",
      textColor: "text-rose-700",
      icon: <AlertTriangle className="w-5 h-5 text-rose-650" />,
      list: ameacas,
      placeholder: "Adicionar ameaça... (ex: Entrada de rival internacional)"
    }
  ];

  return (
    <div id="swot-quadrants-grid" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {categoriesConfig.map((config) => (
        <motion.div
          id={`quadrant-${config.category.toLowerCase()}`}
          key={config.category}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`flex flex-col border rounded-2xl p-5 ${config.bgColor} ${config.borderColor} shadow-xs min-h-[320px]`}
        >
          {/* Quadrant Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              {config.icon}
              <div>
                <h4 className={`font-bold text-lg leading-tight ${config.textColor}`}>
                  {config.title}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                  {config.english}
                </p>
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${config.textColor} bg-white/85 shadow-2xs border ${config.borderColor}`}>
              {config.list.length} {config.list.length === 1 ? "item" : "itens"}
            </span>
          </div>

          {/* List Section */}
          <div className="flex-1 overflow-y-auto mb-4 max-h-[220px] pr-1 space-y-2">
            {config.list.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-medium italic">
                Nenhum ponto registrado. Use o campo abaixo para cadastrar.
              </div>
            ) : (
              config.list.map((item, idx) => (
                <div
                  id={`item-row-${item.id}`}
                  key={item.id}
                  className="group flex gap-2 justify-between items-start bg-white/70 hover:bg-white p-2.5 rounded-lg border border-slate-100 transition-all duration-200 shadow-3xs"
                >
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-slate-400 mt-1 shrink-0">
                      {config.category[0]}{idx + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-700 leading-relaxed font-normal">
                        {item.description}
                      </p>
                      
                      {(item.score !== undefined || item.processes || item.action) && (
                        <div className="flex flex-wrap gap-1 items-center pb-0.5">
                          {item.score !== undefined && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded" title="Grau de relevância">
                              Grau: {item.score}
                            </span>
                          )}
                          {item.action && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              item.action === 'Sim' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700'
                            }`} title="Possibilidade de Ação">
                              Ação: {item.action}
                            </span>
                          )}
                          {item.processes && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded max-w-[120px] truncate" title={`Processo: ${item.processes}`}>
                              {item.processes}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0">
                    <button
                      id={`edit-btn-${item.id}`}
                      onClick={() => !isEditingLocked && setEditingItem(item)}
                      disabled={isEditingLocked}
                      type="button"
                      className={`p-1 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 rounded-md transition-all duration-200 cursor-pointer ${
                        isEditingLocked ? "opacity-35 cursor-not-allowed" : ""
                      }`}
                      title={isEditingLocked ? "Modo de segurança ativo" : "Editar fator"}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`delete-btn-${item.id}`}
                      onClick={() => !isEditingLocked && onDeleteItem(item.id)}
                      disabled={isEditingLocked}
                      type="button"
                      className={`p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all duration-200 ${
                        isEditingLocked ? "opacity-35 cursor-not-allowed" : ""
                      }`}
                      title={isEditingLocked ? "Modo de segurança ativo" : "Excluir fator"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Add Form */}
          <div className="flex gap-2 mt-auto pt-2 border-t border-slate-200/40">
            <input
              id={`quick-input-${config.category}`}
              type="text"
              placeholder={isEditingLocked ? "🔒 Edição desabilitada." : config.placeholder}
              value={newDesc[config.category]}
              disabled={isEditingLocked}
              onChange={(e) => setNewDesc(prev => ({ ...prev, [config.category]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleQuickAdd(config.category);
              }}
              className={`flex-1 text-xs bg-white/90 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-350 ${
                isEditingLocked ? "bg-slate-100/60 cursor-not-allowed text-slate-400" : ""
              }`}
            />
            <button
              id={`quick-add-${config.category}`}
              onClick={() => handleQuickAdd(config.category)}
              disabled={isEditingLocked}
              type="button"
              className={`p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-850 transition-all shadow-3xs cursor-pointer ${
                isEditingLocked ? "opacity-40 cursor-not-allowed text-slate-300 bg-slate-50" : ""
              }`}
              title={isEditingLocked ? "Edição bloqueada" : "Adicionar item"}
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}

      {/* MODAL: EDITAR FATOR SWOT */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-100 flex flex-col overflow-hidden max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 border-slate-150">
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-indigo-600" />
                  Editar Fator SWOT
                </h4>
                <p className="text-[11px] text-slate-500">Ajuste os parâmetros e a descrição do elemento selecionado.</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 px-1.5 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 overflow-y-auto w-full text-left">
              {/* Categoria */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Categoria SWOT</label>
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as SwotCategory })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="Força">Força (Aspecto Interno Positivo)</option>
                  <option value="Fraqueza">Fraqueza (Aspecto Interno Negativo)</option>
                  <option value="Oportunidade">Oportunidade (Aspecto Externo Positivo)</option>
                  <option value="Ameaça">Ameaça (Aspecto Externo Negativo)</option>
                </select>
              </div>

              {/* Descricao */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Descrição do Fator</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={3}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden focus:border-indigo-500 focus:bg-white resize-none"
                />
              </div>

              {/* Advanced planning variables */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-indigo-500" /> Atributos de Planejamento Estratégico (Opcional)
                </h5>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grau de Impacto (1 a 4)</label>
                    <select
                      value={editingItem.score !== undefined ? editingItem.score : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingItem({
                          ...editingItem,
                          score: val === "" ? undefined : parseInt(val, 10)
                        });
                      }}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="">Sem nível atribuído</option>
                      <option value="1">1 - Baixo</option>
                      <option value="2">2 - Médio</option>
                      <option value="3">3 - Alto</option>
                      <option value="4">4 - Muito Alto / Crítico</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Auto-Ação?</label>
                    <select
                      value={editingItem.action !== undefined ? editingItem.action : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingItem({
                          ...editingItem,
                          action: val === "" ? undefined : (val as 'Sim' | 'Não')
                        });
                      }}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="">Sem definição</option>
                      <option value="Sim">Sim (Controlável e Acionável)</option>
                      <option value="Não">Não (Externo ou Não Controlável)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Processo de Atuação</label>
                  <input
                    type="text"
                    value={editingItem.processes || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, processes: e.target.value || undefined })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                    placeholder="Processo corporativo afetado..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Partes Interessadas Atreladas</label>
                  <input
                    type="text"
                    value={editingItem.stakeholders || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, stakeholders: e.target.value || undefined })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                    placeholder="Ex: Clientes, Diretoria, Fornecedores..."
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-5 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50 border-slate-150 text-right">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 border border-slate-200 text-slate-655 bg-white font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingItem.description.trim() === "") return;
                  onUpdateItem(editingItem);
                  setEditingItem(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Salvar Fator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
