import * as XLSX from 'xlsx';
import { SwotItem, RiskItem, OpportunityItem, ActionPlanItem, SwotCategory } from '../types';

/**
 * Normaliza categorias importadas da planilha para baterem com o enum SwotCategory da aplicação
 */
export function normalizeCategory(val: string): SwotCategory | null {
  const normalized = val.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  
  if (["forca", "forcas", "strengths", "strength", "s"].includes(normalized)) {
    return "Força";
  }
  if (["fraqueza", "fraquezas", "weaknesses", "weakness", "w"].includes(normalized)) {
    return "Fraqueza";
  }
  if (["oportunidade", "oportunidades", "opportunities", "opportunity", "o"].includes(normalized)) {
    return "Oportunidade";
  }
  if (["ameaca", "ameacas", "threats", "threat", "t"].includes(normalized)) {
    return "Ameaça";
  }
  return null;
}

/**
 * Lê e decodifica arquivo CSV/XLSX
 */
export function parseSwotSpreadsheet(file: File): Promise<SwotItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Não foi possível ler o arquivo.");

        const workbook = XLSX.read(data, { type: 'binary', codepage: 65001 });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converte planilha em formato matriz (array de arrays) para termos controle absoluto sobre as colunas
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (rawRows.length === 0) {
          throw new Error("A planilha está vazia.");
        }

        // Encontrar as colunas "Categoria" e "Descrição" independentemente da ordem e caixa alta/baixa
        const headers: string[] = (rawRows[0] as any[]).map(h => String(h || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
        
        let colCategoryIdx = headers.findIndex(h => h.includes("categoria") || h.includes("category") || h === "tipo" || h === "swot");
        let colDescIdx = headers.findIndex(h => h.includes("descricao") || h.includes("description") || h.includes("fator") || h.includes("texto"));
        let colScoreIdx = headers.findIndex(h => h.includes("grau") || h.includes("importancia") || h.includes("gravidade") || h === "score" || h === "peso");
        let colActionIdx = headers.findIndex(h => h.includes("potencializar") || h.includes("minimizar") || h.includes("acao") || h.includes("action"));
        let colProcessesIdx = headers.findIndex(h => h.includes("processo") || h.includes("area") || h.includes("departamento"));
        let colStakeholderIdx = headers.findIndex(h => h.includes("partes") || h.includes("stakeholder") || h.includes("interessad"));

        // Se não achar cabeçalho mapeável, assume colunas 0 e 1 por padrão
        if (colCategoryIdx === -1) colCategoryIdx = 0;
        if (colDescIdx === -1) colDescIdx = 1;

        const swotItems: SwotItem[] = [];

        // Ignora cabeçalhos e processa as linhas seguintes
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i] as any[];
          if (!row || row.length === 0) continue;

          const rawCat = row[colCategoryIdx];
          const rawDesc = row[colDescIdx];

          if (!rawCat || !rawDesc) continue;

          const category = normalizeCategory(String(rawCat));
          const description = String(rawDesc).trim();

          let score: number | undefined;
          if (colScoreIdx !== -1 && row[colScoreIdx] !== undefined && row[colScoreIdx] !== "") {
            const parsedScore = parseInt(String(row[colScoreIdx]), 10);
            if (!isNaN(parsedScore)) score = parsedScore;
          }

          let action: 'Sim' | 'Não' | undefined;
          if (colActionIdx !== -1 && row[colActionIdx] !== undefined && row[colActionIdx] !== "") {
            const parsedAct = String(row[colActionIdx]).trim().toLowerCase();
            if (parsedAct === "sim" || parsedAct === "s" || parsedAct === "yes" || parsedAct === "y" || parsedAct === "true" || parsedAct === "1") {
              action = "Sim";
            } else if (parsedAct === "nao" || parsedAct === "não" || parsedAct === "n" || parsedAct === "no" || parsedAct === "false" || parsedAct === "0") {
              action = "Não";
            }
          }

          let processes: string | undefined;
          if (colProcessesIdx !== -1 && row[colProcessesIdx] !== undefined && row[colProcessesIdx] !== "") {
            processes = String(row[colProcessesIdx]).trim();
          }

          let stakeholders: string | undefined;
          if (colStakeholderIdx !== -1 && row[colStakeholderIdx] !== undefined && row[colStakeholderIdx] !== "") {
            stakeholders = String(row[colStakeholderIdx]).trim();
          }

          if (category && description) {
            swotItems.push({
              id: `item_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
              category,
              description,
              ...(score !== undefined && { score }),
              ...(action !== undefined && { action }),
              ...(processes && { processes }),
              ...(stakeholders && { stakeholders })
            });
          }
        }

        if (swotItems.length === 0) {
          throw new Error("Nenhum item válido encontrado. Certifique-se de preencher as colunas 'Categoria' e 'Descrição'.");
        }

        resolve(swotItems);
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Erro de leitura do arquivo."));
    reader.readAsBinaryString(file);
  });
}

/**
 * Cria e faz download de um arquivo Excel detalhado em múltiplas planilhas (SWOT, Riscos, Oportunidades, Planos 5W2H)
 */
export function exportToExcel(
  swotItems: SwotItem[],
  risks: RiskItem[],
  opps: OpportunityItem[],
  plans: ActionPlanItem[]
) {
  const wb = XLSX.utils.book_new();

  // Guia 1: Matriz SWOT
  const swotData = swotItems.map((item, idx) => ({
    "Nº": idx + 1,
    "Categoria": item.category,
    "Fator Estratégico/Descrição": item.description
  }));
  const wsSwot = XLSX.utils.json_to_sheet(swotData);
  XLSX.utils.book_append_sheet(wb, wsSwot, "Matriz SWOT");

  // Guia 2: Análise de Riscos
  const risksData = risks.map((r, idx) => ({
    "Ref": `R${idx + 1}`,
    "Descrição do Risco": r.description,
    "Causa Provável": r.probableCause,
    "Impacto (1-5)": r.impact,
    "Probabilidade (1-5)": r.probability,
    "Criticidade": r.criticality,
    "Classificação de Criticidade": r.criticalityClass,
    "Fatores Cruzados Relacionados": r.crossedFactors.join(" | ")
  }));
  const wsRisks = XLSX.utils.json_to_sheet(risksData);
  XLSX.utils.book_append_sheet(wb, wsRisks, "Gestão de Riscos");

  // Guia 3: Oportunidades Mapeadas
  const oppsData = opps.map((o, idx) => ({
    "Ref": `O${idx + 1}`,
    "Oportunidade Estratégica": o.description,
    "Benefício Esperado": o.expectedBenefit,
    "Grau de Impacto (1-5)": o.potentialImpact,
    "Prioridade": o.priority,
    "Fatores Cruzados Relacionados": o.crossedFactors.join(" | ")
  }));
  const wsOpps = XLSX.utils.json_to_sheet(oppsData);
  XLSX.utils.book_append_sheet(wb, wsOpps, "Oportunidades");

  // Guia 4: Planos de Ação 5W2H
  const plansData = plans.map((p, idx) => ({
    "Ref": `PLAN-${idx + 1}`,
    "Origem": p.type,
    "Item Vinculado": p.relatedDescription,
    "What (O que fazer)": p.what,
    "Why (Por que fazer)": p.why,
    "Where (Onde fazer)": p.where,
    "When (Quando/Prazo)": p.when,
    "Who (Quem fará)": p.who,
    "How (Como fazer)": p.how,
    "How Much (Quanto custará)": p.howMuch,
    "Prioridade Geral": p.priority
  }));
  const wsPlans = XLSX.utils.json_to_sheet(plansData);
  XLSX.utils.book_append_sheet(wb, wsPlans, "Planos de Ação 5W2H");

  XLSX.writeFile(wb, `SWOT_Gestao_Estrategica_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Exporta para CSV
 */
export function exportToCSV(
  swotItems: SwotItem[],
  risks: RiskItem[],
  opps: OpportunityItem[],
  plans: ActionPlanItem[]
) {
  let csvContent = "\uFEFF"; // BOM para acentuação correta no Excel brasileiro

  // Seções organizadas com cabeçalho
  csvContent += "=== MATRIZ SWOT ===\n";
  csvContent += "Categoria;Descrição\n";
  swotItems.forEach(item => {
    csvContent += `"${item.category}";"${item.description.replace(/"/g, '""')}"\n`;
  });

  csvContent += "\n=== ANÁLISE DE RISCOS ===\n";
  csvContent += "Descrição;Causa Provável;Impacto;Probabilidade;Criticidade;Classificação;Fatores Cruzados\n";
  risks.forEach(r => {
    csvContent += `"${r.description.replace(/"/g, '""')}";"${r.probableCause.replace(/"/g, '""')}";${r.impact};${r.probability};${r.criticality};"${r.criticalityClass}";"${r.crossedFactors.join(" | ").replace(/"/g, '""')}"\n`;
  });

  csvContent += "\n=== OPORTUNIDADES ===\n";
  csvContent += "Descrição;Benefício Esperado;Potencial Impacto;Prioridade;Fatores Cruzados\n";
  opps.forEach(o => {
    csvContent += `"${o.description.replace(/"/g, '""')}";"${o.expectedBenefit.replace(/"/g, '""')}";${o.potentialImpact};"${o.priority}";"${o.crossedFactors.join(" | ").replace(/"/g, '""')}"\n`;
  });

  csvContent += "\n=== PLANOS DE AÇÃO 5W2H ===\n";
  csvContent += "Origem;Vinculado;What;Why;Where;When;Who;How;How Much;Prioridade\n";
  plans.forEach(p => {
    csvContent += `"${p.type}";"${p.relatedDescription.replace(/"/g, '""')}";"${p.what.replace(/"/g, '""')}";"${p.why.replace(/"/g, '""')}";"${p.where.replace(/"/g, '""')}";"${p.when.replace(/"/g, '""')}";"${p.who.replace(/"/g, '""')}";"${p.how.replace(/"/g, '""')}";"${p.howMuch.replace(/"/g, '""')}";"${p.priority}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Relatorio_SWOT_Estrategico_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
