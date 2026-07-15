import React, { useState } from "react";
import { Search, Filter, Trash2, Plus, Info, Edit, X } from "lucide-react";
import { SwotItem, SwotCategory } from "../types";

interface SwotTableProps {
  items: SwotItem[];
  onDeleteItem: (id: string) => void;
  onAddItem: (category: SwotCategory, description: string) => void;
  onUpdateItem: (updated: SwotItem) => void;
  isEditingLocked?: boolean;
}

export default function SwotTable({ 
  items, 
  onDeleteItem, 
  onAddItem, 
  onUpdateItem,
  isEditingLocked = false
}: SwotTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<SwotCategory | "Todos">("Todos");
  const [editingItem, setEditingItem] = useState<SwotItem | null>(null);

  // Check if any active item has extra planning variables
  const hasExtraMetadata = items.some(
    (item) => item.score !== undefined || item.processes !== undefined || item.stakeholders !== undefined
  );

  // New item form state
  const [addCategory, setAddCategory] = useState<SwotCategory>("Força");
  const [addDesc, setAddDesc] = useState("");

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addDesc.trim()) return;
    onAddItem(addCategory, addDesc.trim());
    setAddDesc("");
  };

  // Filtering SWOT items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "Todos" || item.category === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getCategoryBadgeClass = (category: SwotCategory) => {
    switch (category) {
      case "Força":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Fraqueza":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Oportunidade":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Ameaça":
        return "bg-rose-50 text-rose-700 border-rose-100";
    }
  };

  return (
    <div id="swot-table-container" className="space-y-6">
      {/* Controls: Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="swot-search-input"
            type="text"
            placeholder="Pesquisar fatores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 self-center mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtrar:
          </span>
          {(["Todos", "Força", "Fraqueza", "Oportunidade", "Ameaça"] as const).map((cat) => (
            <button
              id={`filter-btn-${cat.toLowerCase()}`}
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              type="button"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                selectedFilter === cat
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-3xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat === "Todos" ? "Todos os Fatores" : cat === "Força" ? "Forças" : cat === "Fraqueza" ? "Fraquezas" : cat === "Oportunidade" ? "Oportunidades" : "Ameaças"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left/Middle: Table Grid (Grid View 2 Columns) */}
        <div className="xl:col-span-2 border border-slate-100 rounded-2xl bg-white shadow-3xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold text-slate-500 whitespace-nowrap">
                  <th className="px-4 py-3 w-28">Categoria</th>
                  <th className="px-4 py-3">Fator Estratégico</th>
                  {hasExtraMetadata && (
                    <>
                      <th className="px-3 py-3 w-24 text-center">Grau (1-4)</th>
                      <th className="px-3 py-3 w-24 text-center">Auto-Ação?</th>
                      <th className="px-3 py-3 w-36">Processo</th>
                      <th className="px-3 py-3 w-32">Partes Inter.</th>
                    </>
                  )}
                  <th className="px-4 py-3 w-16 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={hasExtraMetadata ? 7 : 3} className="px-4 py-10 text-center text-slate-400 italic">
                      Nenhum fator correspondente aos filtros foi encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr id={`table-row-${item.id}`} key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-md border ${getCategoryBadgeClass(item.category)}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-normal leading-relaxed text-slate-800">
                        {item.description}
                      </td>
                      
                      {hasExtraMetadata && (
                        <>
                          <td className="px-3 py-3 text-center">
                            {item.score !== undefined ? (
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.score >= 3 
                                  ? "bg-amber-150 text-amber-900 border border-amber-200" 
                                  : "bg-slate-100 text-slate-700"
                              }`}>
                                {item.score}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {item.action ? (
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                item.action === 'Sim' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' 
                                  : 'bg-rose-50 text-rose-700 border border-rose-150'
                              }`}>
                                {item.action}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-slate-600 truncate max-w-[150px]" title={item.processes}>
                            {item.processes || <span className="text-slate-300">-</span>}
                          </td>
                          <td className="px-3 py-3 text-slate-600 truncate max-w-[130px]" title={item.stakeholders}>
                            {item.stakeholders || <span className="text-slate-300">-</span>}
                          </td>
                        </>
                      )}

                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1 items-center">
                          <button
                            id={`table-edit-${item.id}`}
                            onClick={() => !isEditingLocked && setEditingItem(item)}
                            disabled={isEditingLocked}
                            type="button"
                            className={`p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer ${
                              isEditingLocked ? "opacity-30 cursor-not-allowed" : ""
                            }`}
                            title={isEditingLocked ? "Edição bloqueada" : "Editar fator"}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`table-delete-${item.id}`}
                            onClick={() => !isEditingLocked && onDeleteItem(item.id)}
                            disabled={isEditingLocked}
                            type="button"
                            className={`p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer ${
                              isEditingLocked ? "opacity-30 cursor-not-allowed" : ""
                            }`}
                            title={isEditingLocked ? "Edição bloqueada" : "Excluir fator"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Exibindo {filteredItems.length} de {items.length} fatores estruturados na matriz ativa.</span>
          </div>
        </div>

        {/* Right: Quick Add Form Card */}
        <div className="border border-slate-150 rounded-2xl p-5 bg-slate-50/35 space-y-4">
          <h4 className="font-bold text-sm text-slate-850 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-600" /> Cadastrar Novo Fator
          </h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Adicione um fator isolado à matriz SWOT para complementar os dados importados antes de rodar a análise de risco e cruzamento.
          </p>

          <form onSubmit={handleAddNewItem} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Categoria SWOT
              </label>
              <select
                id="add-item-category-select"
                value={addCategory}
                disabled={isEditingLocked}
                onChange={(e) => setAddCategory(e.target.value as SwotCategory)}
                className={`w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500/30 ${
                  isEditingLocked ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""
                }`}
              >
                <option value="Força">Força (Aspecto Interno Positivo)</option>
                <option value="Fraqueza">Fraqueza (Aspecto Interno Negativo)</option>
                <option value="Oportunidade">Oportunidade (Aspecto Externo Positivo)</option>
                <option value="Ameaça">Ameaça (Aspecto Externo Negativo)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Descrição do Fator
              </label>
              <textarea
                id="add-item-desc-textarea"
                rows={3}
                placeholder={isEditingLocked ? "🔒 Modo de segurança ativo. Desbloqueie no topo." : "Exemplo: Escassez de mão de obra técnica no polo produtivo."}
                value={addDesc}
                disabled={isEditingLocked}
                onChange={(e) => setAddDesc(e.target.value)}
                className={`w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/30 ${
                  isEditingLocked ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""
                }`}
              />
            </div>

            <button
              id="submit-new-item-btn"
              type="submit"
              disabled={!addDesc.trim() || isEditingLocked}
              className={`w-full py-2 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-3xs cursor-pointer transition-all ${
                isEditingLocked ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Adicionar Fator à Matriz
            </button>
          </form>
        </div>
      </div>

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
            <div className="p-6 space-y-4 overflow-y-auto">
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
            <div className="p-5 border-t border-slate-100 flex justify-end gap-2.5 bg-slate-50 border-slate-150">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 border border-slate-200 text-slate-650 bg-white font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
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
