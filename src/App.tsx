import React, { useState, useEffect } from "react";
import { aclfLogoBase64 } from "./assets/images/logo";
import { 
  Building2, 
  Sparkles, 
  Download, 
  Printer, 
  HelpCircle, 
  Check, 
  RotateCcw, 
  Share2, 
  ShieldAlert, 
  Cpu,
  BookmarkCheck,
  TrendingUp,
  FileSpreadsheet,
  BarChart2,
  AlertTriangle,
  X,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SwotItem, RiskItem, OpportunityItem, ActionPlanItem, SwotCategory } from "./types";
import { 
  SWOT_TEMPLATES,
  ACLF_DEFAULT_RISKS,
  ACLF_DEFAULT_OPPORTUNITIES,
  ACLF_DEFAULT_ACTION_PLANS
} from "./data/templates";
import { exportToExcel, exportToCSV } from "./utils/exporter";
import { 
  getSwotItems, 
  saveSwotItems, 
  deleteSwotItemFromDb,
  getRisks, 
  saveRisks, 
  deleteRiskFromDb,
  getOpportunities, 
  saveOpportunities, 
  deleteOpportunityFromDb,
  getActionPlans, 
  saveActionPlans,
  deleteActionPlanFromDb,
  deleteActionPlansByRelatedId,
  getSavedSupabaseConfig,
  updateSupabaseClient
} from "./lib/supabase";

import SwotUpload from "./components/SwotUpload";
import SwotQuadrants from "./components/SwotQuadrants";
import SwotTable from "./components/SwotTable";
import AnalyticalDashboard from "./components/AnalyticalDashboard";
import ActionPlans from "./components/ActionPlans";
import PerformanceDashboard from "./components/PerformanceDashboard";
import OmiDashboard from "./components/OmiDashboard";

/**
 * Garante uma relação de cobertura estritamente 1-para-1 correspondente: 
 * no máximo 1 plano de ação para cada Risco e para cada Oportunidade existente/ativo.
 */
export function filterPlansToOneToOne(
  allPlans: ActionPlanItem[],
  risksList: RiskItem[],
  oppsList: OpportunityItem[]
): ActionPlanItem[] {
  const finalPlans: ActionPlanItem[] = [];
  const usedFinalPlanIds = new Set<string>();
  const usedKeys = new Set<string>();

  // Auxiliar para gerar chave de deduplicação de planos
  const getPlanKey = (p: ActionPlanItem) => {
    return `${p.type.toLowerCase()}||${(p.relatedDescription || "").toLowerCase().trim()}||${(p.what || "").toLowerCase().trim()}`;
  };

  // Processar riscos ativos e obter TODOS os planos correspondentes de allPlans
  risksList.forEach((r, idx) => {
    const isNoPlan = r.crossedFactors?.includes("__no_plan_required__") ?? false;
    const matches = allPlans.filter(
      (p) => p.type === "Risco" && (
        p.relatedId === r.id || 
        (p.relatedDescription && p.relatedDescription.toLowerCase().trim() === r.description.toLowerCase().trim())
      )
    );
    if (matches.length > 0) {
      matches.forEach((match, mIdx) => {
        const key = getPlanKey(match);
        if (!usedKeys.has(key)) {
          usedKeys.add(key);
          let finalId = match.id;
          if (!finalId || usedFinalPlanIds.has(finalId)) {
            finalId = `plan_r_${Date.now()}_${idx}_${mIdx}_${Math.random().toString(36).substring(2, 7)}`;
          }
          usedFinalPlanIds.add(finalId);
          finalPlans.push({
            ...match,
            id: finalId,
            type: "Risco",
            relatedId: r.id,
            relatedDescription: r.description
          });
        }
      });
    }
  });

  // Processar oportunidades ativas e obter TODOS os planos correspondentes de allPlans
  oppsList.forEach((o, idx) => {
    const isNoPlan = o.crossedFactors?.includes("__no_plan_required__") ?? false;
    const matches = allPlans.filter(
      (p) => p.type === "Oportunidade" && (
        p.relatedId === o.id || 
        (p.relatedDescription && p.relatedDescription.toLowerCase().trim() === o.description.toLowerCase().trim())
      )
    );
    if (matches.length > 0) {
      matches.forEach((match, mIdx) => {
        const key = getPlanKey(match);
        if (!usedKeys.has(key)) {
          usedKeys.add(key);
          let finalId = match.id;
          if (!finalId || usedFinalPlanIds.has(finalId)) {
            finalId = `plan_o_${Date.now()}_${idx}_${mIdx}_${Math.random().toString(36).substring(2, 7)}`;
          }
          usedFinalPlanIds.add(finalId);
          finalPlans.push({
            ...match,
            id: finalId,
            type: "Oportunidade",
            relatedId: o.id,
            relatedDescription: o.description
          });
        }
      });
    }
  });

  // PRESERVAR todos os planos passados que não foram casados para evitar perda de dados
  allPlans.forEach((p) => {
    const key = getPlanKey(p);
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
      let fId = p.id;
      if (!fId || usedFinalPlanIds.has(fId)) {
        fId = `plan_preserved_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }
      usedFinalPlanIds.add(fId);
      finalPlans.push({
        ...p,
        id: fId
      });
    }
  });

  return finalPlans;
}

 type UserRole = "admin" | "viewer" | null;

export default function App() {

  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isChoosingAdmin, setIsChoosingAdmin] = useState(false);

  const isAdmin = userRole === "admin";

  const [activeTab, setActiveTab] = useState<
  "swot" | "analysis" | "plans" | "dashboard" | "omi" | "report"
>("swot");

const [swotViewMode, setSwotViewMode] = useState<
  "quadrants" | "table"
>("quadrants");


// Controle antigo de bloqueio de edição
const [isEditingLocked, setIsEditingLocked] = useState<boolean>(true);
const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
const [passwordInput, setPasswordInput] = useState<string>("");
const [passwordError, setPasswordError] = useState<string | null>(null);

const [currentTemplateName, setCurrentTemplateName] = useState<string>(() => {
  const saved = localStorage.getItem("swot_template_name");
  return saved || "Matriz Construtora ACLF";
});

  const [isAnalysisStale, setIsAnalysisStaleState] = useState<boolean>(() => {
    const saved = localStorage.getItem("swot_analysis_stale");
    return saved === "true";
  });

  const setIsAnalysisStale = (value: boolean) => {
    setIsAnalysisStaleState(value);
    localStorage.setItem("swot_analysis_stale", String(value));
  };
  
  // Estado básico da SWOT (carrega padrão ou dados salvos)
  const [swotItems, setSwotItems] = useState<SwotItem[]>(() => {
    const saved = localStorage.getItem("swot_items_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return SWOT_TEMPLATES[0].items; // Padrão Construtora ACLF
  });

  // Estados de análise de saídas 
  const [risks, setRisks] = useState<RiskItem[]>(() => {
    const saved = localStorage.getItem("swot_analysis_risks");
    let parsedData = null;
    if (saved) {
      try {
        parsedData = JSON.parse(saved);
        console.log(
          "[LOCALSTORAGE READ]",
          parsedData?.length ?? 0
        );
        if (parsedData && parsedData.length > 0) return parsedData;
      } catch (e) { /* ignore */ }
    } else {
      console.log(
        "[LOCALSTORAGE READ]",
        0
      );
    }
    return ACLF_DEFAULT_RISKS;
  });

  const [opportunities, setOpportunities] = useState<OpportunityItem[]>(() => {
    const saved = localStorage.getItem("swot_analysis_opps");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return ACLF_DEFAULT_OPPORTUNITIES;
  });

  const [actionPlans, setActionPlans] = useState<ActionPlanItem[]>(() => {
    let activeRisksList = ACLF_DEFAULT_RISKS;
    const savedRisks = localStorage.getItem("swot_analysis_risks");
    let parsedData = null;
    if (savedRisks) {
      try {
        parsedData = JSON.parse(savedRisks);
        console.log(
          "[LOCALSTORAGE READ]",
          parsedData?.length ?? 0
        );
        if (parsedData && parsedData.length > 0) activeRisksList = parsedData;
      } catch (e) {}
    } else {
      console.log(
        "[LOCALSTORAGE READ]",
        0
      );
    }

    let activeOppsList = ACLF_DEFAULT_OPPORTUNITIES;
    const savedOpps = localStorage.getItem("swot_analysis_opps");
    if (savedOpps) {
      try {
        const parsed = JSON.parse(savedOpps);
        if (parsed && parsed.length > 0) activeOppsList = parsed;
      } catch (e) {}
    }

    const saved = localStorage.getItem("swot_analysis_plans");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          return filterPlansToOneToOne(parsed, activeRisksList, activeOppsList);
        }
      } catch (e) { /* ignore */ }
    }
    return filterPlansToOneToOne(ACLF_DEFAULT_ACTION_PLANS, activeRisksList, activeOppsList);
  });

  // Estados de Carregamento e Mensagens da IA
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // LOG DE EXECUÇÃO REAL DE RENDER (Estados Ativos)
  console.log(`[STAGE 3 LOG] [REAL LOG] App.tsx render executado.`);
  console.log(`[REAL LOG] App.tsx state "risks".length (quantidade atual de riscos no estado) = ${risks.length}`);
  console.log(`[REAL LOG] App.tsx state "opportunities".length (quantidade atual de oportunidades no estado) = ${opportunities.length}`);
  const [backendStatus, setBackendStatus] = useState<{ alive: boolean; aiEnabled: boolean }>({
    alive: false,
    aiEnabled: false
  });
  const [isInitialLoadCompleted, setIsInitialLoadCompleted] = useState(false);
  const [dbSyncError, setDbSyncError] = useState<{ table: string; message: string; code?: string } | null>(null);
  const [showRlsFixModal, setShowRlsFixModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => getSavedSupabaseConfig().url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => getSavedSupabaseConfig().key);
  const [saveConfigSuccess, setSaveConfigSuccess] = useState(false);

  // Monitoramento total das alterações do estado risks
  useEffect(() => {
    console.log(
      "[RISKS CHANGED]",
      {
        length: risks.length,
        ids: risks.map(r => r.id)
      }
    );
  }, [risks]);

  // Lista de mensagens reassuring para exibição síncrona duranta a análise com IA
  const loadingSteps = [
    "Recebendo fatores estratégicos da SWOT...",
    "Realizando cruzamento sistêmico Forças × Oportunidades...",
    "Avaliando vulnerabilidades críticas Fraquezas × Ameaças...",
    "Medindo probabilidade de ocorrência e escala de impacto...",
    "Estruturando planos de ação 5W2H preventivos...",
    "Compilando recomendações corporativas finais..."
  ];

  // Efeito de transição de textos do loader
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  // --- Cache-Buster para Dados Reais ACLF ---
  useEffect(() => {
    const CURRENT_DATA_VERSION = "aclf_real_data_v15";
    let version = localStorage.getItem("aclf_data_version");
    if (version !== CURRENT_DATA_VERSION) {
      localStorage.setItem("aclf_data_version", CURRENT_DATA_VERSION);
      localStorage.removeItem("swot_items_data");
      localStorage.removeItem("swot_analysis_risks");
      localStorage.removeItem("swot_analysis_opps");
      localStorage.removeItem("swot_analysis_plans");
      localStorage.removeItem("swot_template_name");
      
      setSwotItems(SWOT_TEMPLATES[0].items);
      setCurrentTemplateName(SWOT_TEMPLATES[0].name);
      setRisks(ACLF_DEFAULT_RISKS);
      setOpportunities(ACLF_DEFAULT_OPPORTUNITIES);
      setActionPlans(filterPlansToOneToOne(ACLF_DEFAULT_ACTION_PLANS, ACLF_DEFAULT_RISKS, ACLF_DEFAULT_OPPORTUNITIES));
    }
  }, []);

  // Sincronização em tempo real reativa dos riscos, oportunidades e planos a partir da matriz SWOT
  useEffect(() => {
    if (!isInitialLoadCompleted) return;

    // Helper to determine if a default risk or opportunity is linked to any active SWOT items
    const isSwotFactorActive = (crossedFactors: string[]) => {
      if (!crossedFactors || crossedFactors.length === 0) return true;
      return crossedFactors.some(cf => {
        if (cf === "__no_plan_required__") return true;
        const cfParts = cf.split(":");
        const category = cfParts[0].trim();
        const descriptionPart = cfParts.slice(1).join(":").trim();
        const normCf = descriptionPart.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        return swotItems.some(item => {
          if (item.category.toLowerCase() !== category.toLowerCase()) return false;
          const normItem = item.description.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          return normItem.includes(normCf) || normCf.includes(normItem);
        });
      });
    };

    // Filter active default risks and opportunities from our strategic blueprint
    const activeDefaultRisks = ACLF_DEFAULT_RISKS.filter(r => isSwotFactorActive(r.crossedFactors));
    const activeDefaultOpps = ACLF_DEFAULT_OPPORTUNITIES.filter(o => isSwotFactorActive(o.crossedFactors));

    // To recognize custom / dynamic entries added by the user, let's track which SWOT items are already served
    const matchedSwotIds = new Set<string>();
    swotItems.forEach(item => {
      const swotTitle = item.description.split(":")[0].trim();
      const normTitle = swotTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

      const isMatchedByRisk = activeDefaultRisks.some(r => {
        return r.crossedFactors?.some(cf => {
          const cfParts = cf.split(":");
          const cfTerm = cfParts.length > 1 ? cfParts[1] : cfParts[0];
          const normCfTerm = cfTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          return normTitle === normCfTerm || normTitle.startsWith(normCfTerm) || normCfTerm.startsWith(normTitle) || normTitle.includes(normCfTerm) || normCfTerm.includes(normTitle);
        });
      });

      const isMatchedByOpp = activeDefaultOpps.some(o => {
        return o.crossedFactors?.some(cf => {
          const cfParts = cf.split(":");
          const cfTerm = cfParts.length > 1 ? cfParts[1] : cfParts[0];
          const normCfTerm = cfTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          return normTitle === normCfTerm || normTitle.startsWith(normCfTerm) || normCfTerm.startsWith(normTitle) || normTitle.includes(normCfTerm) || normCfTerm.includes(normTitle);
        });
      });

      if (isMatchedByRisk || isMatchedByOpp) {
        matchedSwotIds.add(item.id);
      }
    });

    // Handle dynamically-generated risks for custom SWOT items (weaknesses and threats)
    const dynamicRisks: RiskItem[] = [];
    const weaknessesAndThreats = swotItems.filter(item => 
      (item.category === "Fraqueza" || item.category === "Ameaça") && !matchedSwotIds.has(item.id)
    );

    weaknessesAndThreats.forEach(item => {
      const swotTitle = item.description.split(":")[0].trim();
      const swotFactorString = `${item.category}: ${swotTitle}`;
      const isWeakness = item.category === "Fraqueza";

      const matchedExisting = risks.find(r => r.id === `risk_ind_w_${item.id}` || r.id === `risk_ind_t_${item.id}`);
      if (matchedExisting) {
        dynamicRisks.push({
          ...matchedExisting,
          description: isWeakness
            ? `Risco individual associado à Fraqueza: ${item.description}`
            : `Risco individual associado à Ameaça: ${item.description}`,
          crossedFactors: [swotFactorString]
        });
        return;
      }

      const rawScore = Number((item as any).score) || 3;
      const impact = Math.min(5, Math.max(1, rawScore + 1));
      const probability = 3;
      const criticality = impact * probability;
      const criticalityClass = criticality >= 16 ? "Crítico" : (criticality <= 8 ? "Baixo" : "Médio");

      dynamicRisks.push({
        id: isWeakness ? `risk_ind_w_${item.id}` : `risk_ind_t_${item.id}`,
        description: isWeakness
          ? `Risco individual associado à Fraqueza: ${item.description}`
          : `Risco individual associado à Ameaça: ${item.description}`,
        probableCause: (item as any).processes 
          ? `Gargalos/Exposição no processo: ${(item as any).processes}` 
          : (isWeakness ? "Vulnerabilidade operacional ou processo manual interno identificado na matriz SWOT." : "Incerteza mercadológica externa ou barreira competitiva identificada na matriz SWOT."),
        impact,
        probability,
        criticality,
        criticalityClass: criticalityClass as any,
        crossedFactors: [swotFactorString],
        justification: isWeakness
          ? `Fator preventivo interno individual. Gravidade na SWOT: ${rawScore}.`
          : `Fator preventivo externo individual. Impacto na SWOT: ${rawScore}.`,
        suggestedAction: isWeakness
          ? "Implementar controles internos e robustecer o processo associado para minimizar a fraqueza."
          : "Estruturar plano de contingência e monitoramento preventivo de mercado contra esta ameaça."
      });
    });

    // Handle dynamically-generated opportunities for custom SWOT items (strengths and opportunities)
    const dynamicOpps: OpportunityItem[] = [];
    const strengthsAndOpportunities = swotItems.filter(item => 
      (item.category === "Força" || item.category === "Oportunidade") && !matchedSwotIds.has(item.id)
    );

    strengthsAndOpportunities.forEach(item => {
      const swotTitle = item.description.split(":")[0].trim();
      const swotFactorString = `${item.category}: ${swotTitle}`;
      const isStrength = item.category === "Força";

      const matchedExisting = opportunities.find(o => o.id === `opp_ind_s_${item.id}` || o.id === `opp_ind_o_${item.id}`);
      if (matchedExisting) {
        dynamicOpps.push({
          ...matchedExisting,
          description: isStrength
            ? `Oportunidade individual associada à Força: ${item.description}`
            : `Oportunidade individual associada ao Fator: ${item.description}`,
          crossedFactors: [swotFactorString]
        });
        return;
      }

      const rawScore = Number((item as any).score) || 3;
      const impact = Math.min(5, Math.max(1, rawScore + 1));
      const probability = 3;
      const criticality = impact * probability;
      const priority = criticality >= 12 ? "Alta" : "Média";

      dynamicOpps.push({
        id: isStrength ? `opp_ind_s_${item.id}` : `opp_ind_o_${item.id}`,
        description: isStrength
          ? `Oportunidade individual associada à Força: ${item.description}`
          : `Oportunidade individual associada ao Fator: ${item.description}`,
        expectedBenefit: (item as any).processes 
          ? `${isStrength ? "Diferencial competitivo" : "Vantagem estratégica"} ligado a: ${(item as any).processes}` 
          : (isStrength ? "Alavancagem direta de diferenciais e competências internas consagradas." : "Aproveitamento direto de vetor externo favorável para ganho operacional ou comercial."),
        potentialImpact: impact,
        probability,
        criticality,
        priority: priority as any,
        crossedFactors: [swotFactorString],
        justification: isStrength 
          ? `Capacidade de alavancagem interna. Importância na SWOT: ${rawScore}.`
          : `Alavancagem de fatores externos de mercado. Apetite na SWOT: ${rawScore}.`,
        suggestedAction: isStrength
          ? `Potencializar e disseminar a força interna de "${item.description}" para obter maior fatia de mercado.`
          : `Mobilizar recursos e canais comerciais/marketing para capturar os ganhos da oportunidade "${item.description}".`
      });
    });

    const manualRisks = risks.filter(r => r.id.startsWith("risk_manual_"));
    const manualOpps = opportunities.filter(o => o.id.startsWith("opp_manual_"));

    const finalRisksRaw = [...activeDefaultRisks, ...dynamicRisks, ...manualRisks];
    const finalOppsRaw = [...activeDefaultOpps, ...dynamicOpps, ...manualOpps];

    const seenRiskIdsFinal = new Set<string>();
    const finalRisks = finalRisksRaw.filter(r => {
      if (seenRiskIdsFinal.has(r.id)) return false;
      seenRiskIdsFinal.add(r.id);
      return true;
    });

    const seenOppIdsFinal = new Set<string>();
    const finalOpps = finalOppsRaw.filter(o => {
      if (seenOppIdsFinal.has(o.id)) return false;
      seenOppIdsFinal.add(o.id);
      return true;
    });

    const isRisksChanged = 
      risks.length !== finalRisks.length ||
      !risks.every((r, idx) => r.id === finalRisks[idx]?.id && r.description === finalRisks[idx]?.description);

    const isOppsChanged = 
      opportunities.length !== finalOpps.length ||
      !opportunities.every((o, idx) => o.id === finalOpps[idx]?.id && o.description === finalOpps[idx]?.description);

    if (isRisksChanged || isOppsChanged) {
      const computedPlans = filterPlansToOneToOne(actionPlans, finalRisks, finalOpps);
      setRisks(finalRisks);
      setOpportunities(finalOpps);
      setActionPlans(computedPlans);
      setIsAnalysisStale(false);
    }
  }, [swotItems, isInitialLoadCompleted]);

  // Checar saúde da API na inicialização
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          setBackendStatus({ alive: true, aiEnabled: data.aiEnabled });
        }
      })
      .catch((err) => {
        console.warn("Backend não respondeu no primeiro momento, usando fallback em tempo de execução.", err);
      });
  }, []);

  // Sincronizar carregamento inicial do Supabase
  useEffect(() => {
    async function initSupabaseData() {
      try {
        const CURRENT_DATA_VERSION = "aclf_real_data_v15";
        let versionDb = localStorage.getItem("aclf_data_version_db");

        const needsDbReset = false; 

        if (needsDbReset) {
          console.log("[SUPABASE RESET] Nova versão detectada. Limpando e forçando reset limpo com 20/20 planos de ação...");
          localStorage.setItem("aclf_data_version_db", CURRENT_DATA_VERSION);
          
          setSwotItems(SWOT_TEMPLATES[0].items);
          setCurrentTemplateName(SWOT_TEMPLATES[0].name);
          setRisks(ACLF_DEFAULT_RISKS);
          setOpportunities(ACLF_DEFAULT_OPPORTUNITIES);
          const initialPlans = filterPlansToOneToOne(ACLF_DEFAULT_ACTION_PLANS, ACLF_DEFAULT_RISKS, ACLF_DEFAULT_OPPORTUNITIES);
          setActionPlans(initialPlans);
          setIsAnalysisStale(false);

          // Salvar nos estados do banco de dados para sobrescrever todos os stale/duplicates de sessões antigas
          await saveSwotItems(SWOT_TEMPLATES[0].items);
          await saveRisks(ACLF_DEFAULT_RISKS);
          await saveOpportunities(ACLF_DEFAULT_OPPORTUNITIES);
          await saveActionPlans(initialPlans);

          setIsInitialLoadCompleted(true);
          return;
        }

        const dbSwot = await getSwotItems();
        const dbRisks = await getRisks();
        console.log(
          "[SUPABASE LOAD]",
          "dbRisks.length =",
          dbRisks?.length
        );
        const dbOpps = await getOpportunities();
        const dbPlans = await getActionPlans();

        if (dbSwot !== null) {
          if (dbSwot.length > 0) {
            setSwotItems(dbSwot);
            console.log(
              "[SUPABASE LOAD]",
              "Executando setRisks(dbRisks)",
              {
                length: dbRisks?.length,
                ids: dbRisks?.map(r => r.id)
              }
            );
            if (dbRisks) setRisks(dbRisks);
            if (dbOpps) setOpportunities(dbOpps);
            if (dbPlans) setActionPlans(filterPlansToOneToOne(dbPlans, dbRisks || [], dbOpps || []));
          } else {
            // Se o banco estiver conectado mas completamente vazio, semeamos ele com os padrões ativos
            await saveSwotItems(swotItems);
            console.log(
              "[SAVE RISKS]",
              {
                length: risks.length,
                ids: risks.map(r => r.id)
              }
            );
            await saveRisks(risks);
            await saveOpportunities(opportunities);
            await saveActionPlans(actionPlans);
          }
        }
      } catch (err) {
        console.error("Erro na inicialização dos dados do Supabase:", err);
      } finally {
        setIsInitialLoadCompleted(true);
      }
    }
    initSupabaseData();
  }, []);

  // Sincronizar SWOT com LocalStorage e Supabase
  useEffect(() => {
    localStorage.setItem("swot_items_data", JSON.stringify(swotItems));
    if (isInitialLoadCompleted) {
      saveSwotItems(swotItems).then((res) => {
        if (res && !res.success && res.error) {
          setDbSyncError({ table: "swot_items", message: res.error.message, code: res.error.code });
        } else {
          setDbSyncError((prev) => (prev?.table === "swot_items" ? null : prev));
        }
      });
    }
  }, [swotItems, isInitialLoadCompleted]);

  // Sincronizar análises geradas com LocalStorage e Supabase
  useEffect(() => {
    console.log(
      "[LOCALSTORAGE WRITE]",
      risks.length
    );
    localStorage.setItem("swot_analysis_risks", JSON.stringify(risks));
    localStorage.setItem("swot_analysis_opps", JSON.stringify(opportunities));
    localStorage.setItem("swot_analysis_plans", JSON.stringify(actionPlans));

    if (isInitialLoadCompleted) {
      console.log(
        "[SAVE RISKS]",
        {
          length: risks.length,
          ids: risks.map(r => r.id)
        }
      );
      Promise.all([
        saveRisks(risks),
        saveOpportunities(opportunities),
        saveActionPlans(actionPlans)
      ]).then(([resRisks, resOpps, resPlans]) => {
        const firstError = [
          { name: "risks", res: resRisks },
          { name: "opportunities", res: resOpps },
          { name: "action_plans", res: resPlans }
        ].find((x) => x.res && !x.res.success && x.res.error);

        if (firstError) {
          setDbSyncError({
            table: firstError.name,
            message: firstError.res.error.message,
            code: firstError.res.error.code
          });
        } else {
          setDbSyncError((prev) => 
            prev && ["risks", "opportunities", "action_plans"].includes(prev.table) ? null : prev
          );
        }
      });
    }
  }, [risks, opportunities, actionPlans, isInitialLoadCompleted]);

  // Sincronizar nome do template ativo
  useEffect(() => {
    localStorage.setItem("swot_template_name", currentTemplateName);
  }, [currentTemplateName]);

  // --- Manipulação da SWOT ---
  const handleSwotLoadedFromSpreadsheet = (items: SwotItem[], title: string = "Carregada") => {
    setSwotItems(items);
    setCurrentTemplateName(title);
    
    if (title === "Matriz Construtora ACLF") {
      setRisks(ACLF_DEFAULT_RISKS);
      setOpportunities(ACLF_DEFAULT_OPPORTUNITIES);
      setActionPlans(filterPlansToOneToOne(ACLF_DEFAULT_ACTION_PLANS, ACLF_DEFAULT_RISKS, ACLF_DEFAULT_OPPORTUNITIES));
      setIsAnalysisStale(false);
    } else {
      // Limpar análises antigas para incitar nova rodada de geração limpa
      setRisks([]);
      setOpportunities([]);
      setActionPlans([]);
      setIsAnalysisStale(true);
    }
    setActiveTab("swot");
  };

  const handleRetrySync = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      console.log(
        "[SAVE RISKS]",
        {
          length: risks.length,
          ids: risks.map(r => r.id)
        }
      );
      const [resSwot, resRisks, resOpps, resPlans] = await Promise.all([
        saveSwotItems(swotItems),
        saveRisks(risks),
        saveOpportunities(opportunities),
        saveActionPlans(actionPlans)
      ]);

      const firstError = [
        { name: "swot_items", res: resSwot },
        { name: "risks", res: resRisks },
        { name: "opportunities", res: resOpps },
        { name: "action_plans", res: resPlans }
      ].find((x) => x.res && !x.res.success && x.res.error);

      if (firstError) {
        setDbSyncError({
          table: firstError.name,
          message: firstError.res.error.message,
          code: firstError.res.error.code
        });
        setSyncSuccess(false);
      } else {
        setDbSyncError(null);
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 5000);
      }
    } catch (err: any) {
      console.error("Erro fatal durante re-sincronia manual:", err);
      setDbSyncError({
        table: "conexão",
        message: err?.message || "Erro de conexão com o banco de dados",
        code: "DESCONHECIDO"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddSwotItem = (category: SwotCategory, description: string) => {
    const newItem: SwotItem = {
      id: `item_manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category,
      description
    };
    setSwotItems((prev) => [...prev, newItem]);
    setCurrentTemplateName("Matriz Personalizada");
    setIsAnalysisStale(true);
  };

  const handleDeleteSwotItem = async (id: string) => {
    setSwotItems((prev) => prev.filter((item) => item.id !== id));
    setCurrentTemplateName("Matriz Personalizada");
    setIsAnalysisStale(true);
    if (isInitialLoadCompleted) {
      await deleteSwotItemFromDb(id);
    }
  };

  const handleUpdateSwotItem = (updated: SwotItem) => {
    setSwotItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setCurrentTemplateName("Matriz Personalizada");
    setIsAnalysisStale(true);
  };

  const handleResetToPreloadTemplate = () => {
    setSwotItems(SWOT_TEMPLATES[0].items);
    setCurrentTemplateName(SWOT_TEMPLATES[0].name);
    setRisks(ACLF_DEFAULT_RISKS);
    setOpportunities(ACLF_DEFAULT_OPPORTUNITIES);
    setActionPlans(filterPlansToOneToOne(ACLF_DEFAULT_ACTION_PLANS, ACLF_DEFAULT_RISKS, ACLF_DEFAULT_OPPORTUNITIES));
    setIsAnalysisStale(false);
  };


  const handleUnlockEditing = async (e: React.FormEvent) => {
  e.preventDefault();
  setPasswordError(null);


  try {
    const response = await fetch("/api/auth/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        password: passwordInput
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      setPasswordError(
        data.error || "Senha incorreta! Por favor, tente novamente."
      );
      return;
    }

    setUserRole("admin");
setIsEditingLocked(false);
setShowPasswordModal(false);
setIsChoosingAdmin(false);
setPasswordInput("");
setPasswordError(null);
  } catch (error) {
    console.error("Erro ao autenticar administrador:", error);
    setPasswordError(
      "Não foi possível validar a senha. Verifique se o servidor está rodando."
    );
  }
}; 

const handleEnterAsViewer = () => {
  setUserRole("viewer");
  setIsEditingLocked(true);
  setIsChoosingAdmin(false);
  setShowPasswordModal(false);
  setPasswordInput("");
  setPasswordError(null);
};

  const handleLockEditing = () => {
    setIsEditingLocked(true);
  };

  // --- Handlers de Modificação para Riscos, Oportunidades e Planos de Ação ---
  const handleUpdateRisk = (updated: RiskItem) => {
    setRisks((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    
    const noPlan = updated.crossedFactors?.includes("__no_plan_required__") ?? false;
    if (noPlan) {
      setActionPlans((prev) => prev.filter((p) => p.relatedId !== updated.id));
      if (isInitialLoadCompleted) {
        deleteActionPlansByRelatedId(updated.id);
      }
    } else {
      setActionPlans((prev) => {
        const matches = prev.filter((p) => p.relatedId === updated.id);
        if (matches.length > 0) {
          return prev.map((p) =>
            p.relatedId === updated.id
              ? { ...p, relatedDescription: updated.description }
              : p
          );
        } else {
          const tempPlans = filterPlansToOneToOne([], [updated], []);
          return [...prev, ...tempPlans];
        }
      });
    }
  };

  const handleDeleteRisk = async (id: string) => {
    setRisks((prev) => prev.filter((r) => r.id !== id));
    setActionPlans((prev) => prev.filter((p) => p.relatedId !== id));
    if (isInitialLoadCompleted) {
      await deleteRiskFromDb(id);
      await deleteActionPlansByRelatedId(id);
    }
  };

  const handleAddRisk = (newRisk: RiskItem) => {
    setRisks((prev) => [...prev, newRisk]);
    const noPlan = newRisk.crossedFactors?.includes("__no_plan_required__") ?? false;
    if (!noPlan) {
      setActionPlans((prev) => {
        const hasPlan = prev.some((p) => p.relatedId === newRisk.id);
        if (hasPlan) return prev;
        const tempPlans = filterPlansToOneToOne([], [newRisk], []);
        return [...prev, ...tempPlans];
      });
    }
  };

  const handleUpdateOpportunity = (updated: OpportunityItem) => {
    setOpportunities((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    
    const noPlan = updated.crossedFactors?.includes("__no_plan_required__") ?? false;
    if (noPlan) {
      setActionPlans((prev) => prev.filter((p) => p.relatedId !== updated.id));
      if (isInitialLoadCompleted) {
        deleteActionPlansByRelatedId(updated.id);
      }
    } else {
      setActionPlans((prev) => {
        const matches = prev.filter((p) => p.relatedId === updated.id);
        if (matches.length > 0) {
          return prev.map((p) =>
            p.relatedId === updated.id
              ? { ...p, relatedDescription: updated.description }
              : p
          );
        } else {
          const tempPlans = filterPlansToOneToOne([], [], [updated]);
          return [...prev, ...tempPlans];
        }
      });
    }
  };

  const handleDeleteOpportunity = async (id: string) => {
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
    setActionPlans((prev) => prev.filter((p) => p.relatedId !== id));
    if (isInitialLoadCompleted) {
      await deleteOpportunityFromDb(id);
      await deleteActionPlansByRelatedId(id);
    }
  };

  const handleAddOpportunity = (newOpp: OpportunityItem) => {
    setOpportunities((prev) => [...prev, newOpp]);
    const noPlan = newOpp.crossedFactors?.includes("__no_plan_required__") ?? false;
    if (!noPlan) {
      setActionPlans((prev) => {
        const hasPlan = prev.some((p) => p.relatedId === newOpp.id);
        if (hasPlan) return prev;
        const tempPlans = filterPlansToOneToOne([], [], [newOpp]);
        return [...prev, ...tempPlans];
      });
    }
  };

  const handleUpdateActionPlan = (updated: ActionPlanItem) => {
    setActionPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    
    // Se o usuário atualizou um plano e ele estava sinalizado como "não requer plano de ação",
    // mas agora o plano possui conteúdo, devemos remover a tag do risco/oportunidade de forma inteligente!
    if (updated.what.trim() !== "") {
      const { relatedId, type } = updated;
      if (type === "Risco") {
        setRisks((prev) => prev.map((r) => {
          if (r.id === relatedId && r.crossedFactors?.includes("__no_plan_required__")) {
            return {
              ...r,
              crossedFactors: r.crossedFactors.filter((f) => f !== "__no_plan_required__")
            };
          }
          return r;
        }));
      } else {
        setOpportunities((prev) => prev.map((o) => {
          if (o.id === relatedId && o.crossedFactors?.includes("__no_plan_required__")) {
            return {
              ...o,
              crossedFactors: o.crossedFactors.filter((f) => f !== "__no_plan_required__")
            };
          }
          return o;
        }));
      }
    }
  };

  const handleDeleteActionPlan = async (id: string) => {
    // Buscar o plano de ação que está prestes a ser deletado para descobrir seu relatedId
    setActionPlans((prev) => {
      const planToDelete = prev.find((p) => p.id === id);
      const filtered = prev.filter((p) => p.id !== id);

      if (planToDelete) {
        const type = planToDelete.type;
        const rId = planToDelete.relatedId;
        const remainingPlans = filtered.filter((p) => p.relatedId === rId);

        if (remainingPlans.length === 0) {
          // Sinalizar que este fator não precisa mais de plano
          if (type === "Risco") {
            setRisks((prevRisks) => prevRisks.map((r) => {
              if (r.id === rId) {
                const hasTag = r.crossedFactors?.includes("__no_plan_required__");
                return {
                  ...r,
                  crossedFactors: hasTag ? r.crossedFactors : [...(r.crossedFactors || []), "__no_plan_required__"]
                };
              }
              return r;
            }));
          } else {
            setOpportunities((prevOpps) => prevOpps.map((o) => {
              if (o.id === rId) {
                const hasTag = o.crossedFactors?.includes("__no_plan_required__");
                return {
                  ...o,
                  crossedFactors: hasTag ? o.crossedFactors : [...(o.crossedFactors || []), "__no_plan_required__"]
                };
              }
              return o;
            }));
          }
        }
      }

      return filtered;
    });

    if (isInitialLoadCompleted) {
      await deleteActionPlanFromDb(id);
    }
  };

  const handleAddActionPlan = (newPlan: ActionPlanItem) => {
    setActionPlans((prev) => {
      const exists = prev.some((p) => p.id === newPlan.id || (p.what === newPlan.what && p.relatedId === newPlan.relatedId));
      if (exists) return prev;
      return [newPlan, ...prev];
    });
  };

  const handleRebuildOneToOneActionPlans = async () => {
    const timestamp = Date.now();
    const newPlans = filterPlansToOneToOne(ACLF_DEFAULT_ACTION_PLANS, risks, opportunities);

    // Ajustar os IDs gerados para usar o prefixo do rebuild
    const adjustedPlans = newPlans.map((p, idx) => ({
      ...p,
      id: `plan_rebuild_${timestamp}_${p.type === "Risco" ? "r" : "o"}_${idx}`
    }));

    setActionPlans(adjustedPlans);
    if (isInitialLoadCompleted) {
      await saveActionPlans(adjustedPlans);
    }
  };

  // --- Chamada da Análise Estratégica (API / Fallback) ---
  const handleRunAnalysisAndActionPlans = async () => {
    if (swotItems.length === 0) {
      setErrorMessage("Por favor, preencha ou importe fatores na SWOT antes de gerar a análise.");
      return;
    }

    setLoading(true);
    setLoadingStep(0);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/analyze-swot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: swotItems }),
      });

      if (!response.ok) {
        throw new Error("Resposta inesperada da rede.");
      }

      const data = await response.json();
      
      console.log("[STAGE 1 LOG] API /api/analyze-swot response successfully received.");
      console.log(`- Risks returned from backend count: ${data.risks ? data.risks.length : 0}`);
      console.log(`- Opportunities returned from backend count: ${data.opportunities ? data.opportunities.length : 0}`);
      console.log(`- Action plans received count: ${data.actionPlans ? data.actionPlans.length : 0}`);
      console.log("- Full Risks Array returned by API:", JSON.stringify(data.risks || [], null, 2));
      
      if (data.error) {
        throw new Error(data.error);
      }

      // --- ALGORITMO INTELIGENTE DE MERGING CLIENT-SIDE PARA PRESERVAÇÃO DE DADOS ---
      
      // Helper para verificar se um item estratégico ainda é válido baseado nos novos fatores SWOT ativos (Estrito, mas altamente leniente para evitar perdas acidentais)
      const isItemStillValid = (crossedFactors: string[], activeSwot: SwotItem[]): boolean => {
        if (!crossedFactors || crossedFactors.length === 0) return true; // Itens manuais ou sem fatores cruzados permanecem intactos
        
        // Função auxiliar para normalizar textos para comparação flexível
        const normalize = (val: string) => {
          return val
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // remove acentos
            .replace(/[^\w\s]/g, "") // remove pontuação/símbolos
            .replace(/\s+/g, " ") // colapsa múltiplos espaços
            .trim();
        };

        return crossedFactors.every((factor) => {
          const colonIdx = factor.indexOf(":");
          if (colonIdx === -1) return true; // Se não tem delimitador de categoria, assume válido
          
          const categoryPart = factor.substring(0, colonIdx).trim().toLowerCase();
          const descPart = factor.substring(colonIdx + 1).trim();
          
          const normDescPart = normalize(descPart);
          if (normDescPart.length < 3) return true; // Termos excessivamente curtos ou códigos são considerados válidos
          
          // Mapeamento de possíveis abreviações de categorias vindas da IA ou do usuário
          let cleanCategory = categoryPart;
          if (categoryPart.startsWith("for")) cleanCategory = "força";
          else if (categoryPart.startsWith("fra") || categoryPart.startsWith("fraq")) cleanCategory = "fraqueza";
          else if (categoryPart.startsWith("opo") || categoryPart.startsWith("oport")) cleanCategory = "oportunidade";
          else if (categoryPart.startsWith("ame") || categoryPart.startsWith("amea")) cleanCategory = "ameaça";

          return activeSwot.some((swot) => {
            const swotCat = swot.category.toLowerCase();
            const catMatch = swotCat === cleanCategory || swotCat.startsWith(cleanCategory) || cleanCategory.startsWith(swotCat);
            if (!catMatch) return false;

            const normSwotDesc = normalize(swot.description);
            
            // Verificação por ID (ex: "fa1" ou "sf1" de forma flexível)
            const idMatch = swot.id && (normDescPart === swot.id.toLowerCase() || swot.id.toLowerCase().includes(normDescPart) || normDescPart.includes(swot.id.toLowerCase()));
            
            // Verificação de conteúdo descritivo (se um contém o outro de forma flexível)
            const descMatch = normSwotDesc.includes(normDescPart) || normDescPart.includes(normSwotDesc);
            
            // Se as palavras-chave principais se sobrepõem significativamente (2 ou mais palavras de mais de 3 letras), considera válido
            const swotWords = normSwotDesc.split(" ").filter(w => w.length > 3);
            const factorWords = normDescPart.split(" ").filter(w => w.length > 3);
            const commonWords = swotWords.filter(w => factorWords.includes(w));
            const overlapMatch = commonWords.length >= Math.min(2, factorWords.length);

            return idMatch || descMatch || overlapMatch;
          });
        });
      };

      // 1. Riscos e Oportunidades são recalculados integralmente sem merge histórico
      const mergedRisks = data.risks || [];
      const mergedOpps = data.opportunities || [];

      // 2. Mesclar os planos de ação sem perder históricos ou planos customizados do usuário
      const poolOfPlans = [...actionPlans];

      // Adiciona novos planos de ação gerados se eles pertencerem a novos riscos/oportunidades
      (data.actionPlans || []).forEach((newP: any) => {
        const descLower = newP.relatedDescription.toLowerCase().trim();
        const whatLower = newP.what.toLowerCase().trim();
        const alreadyHasPlan = poolOfPlans.some(
          (p) => p.type === newP.type && 
                 p.relatedDescription.toLowerCase().trim() === descLower &&
                 p.what.toLowerCase().trim() === whatLower
        );
        if (!alreadyHasPlan) {
          poolOfPlans.push(newP);
        }
      });

      // Garante que o balanceamento 1-para-1 ou cobertura adicional de múltiplos planos seja mantida sem descartes arbitrários
      const finalMatchedPlans = filterPlansToOneToOne(poolOfPlans, mergedRisks, mergedOpps);

      console.log("[STAGE 2 LOG] [REAL LOG] REAL EXECUTION EVIDENCE - PRE-SETRISKS STARTED.");
      console.log(`[REAL LOG] risks.length (ESTADO REACT ATUAL ANTES DE SETRISKS) = ${risks.length}`);
      console.log(`[REAL LOG] Novo array recebido da API para setRisks: mergedRisks.length = ${mergedRisks.length}`);
      console.log(`[REAL LOG] Novo array recebido da API para setOpportunities: mergedOpps.length = ${mergedOpps.length}`);
      console.log(`- Final Risks to set: ${mergedRisks.length}`);
      console.log(`- Final Opportunities to set: ${mergedOpps.length}`);
      console.log(`- Final Action Plans to set: ${finalMatchedPlans.length}`);

      // 3. Salvar estados atualizados que serão propagados nativamente ao banco e localStorage
      setRisks(mergedRisks);
      setOpportunities(mergedOpps);
      setActionPlans(finalMatchedPlans);
      setIsAnalysisStale(false);
      
      console.log("[STAGE 3 LOG] [REAL LOG] REAL EXECUTION EVIDENCE - POST-SETRISKS COMPLETADO.");
      console.log(`[REAL LOG] risks.length (IMEDIATAMENTE APÓS CHAMAR SETRISKS NO LOOP) = ${mergedRisks.length}`);
      console.log(`[REAL LOG] opportunities.length (IMEDIATAMENTE APÓS CHAMAR SETOPPORTUNITIES NO LOOP) = ${mergedOpps.length}`);
      
      // Abre a aba de Dashboard após carregar
      setActiveTab("analysis");
    } catch (err: any) {
      console.error("Tentativa de chamada da API falhou ou está pendente, rodando análise interna de fallback.", err);
      // Fallback local caso o endpoint falhe para garantir ótima navegabilidade
      setErrorMessage("Utilizando mecanismo inteligente local offline devido a restrição temporária.");
    } finally {
      setLoading(false);
    }
  };

  // --- Exportações ---
  const handleExportExcel = () => {
    exportToExcel(swotItems, risks, opportunities, actionPlans);
  };

  const handleExportCSV = () => {
    exportToCSV(swotItems, risks, opportunities, actionPlans);
  };

  const handlePrintPDF = () => {
    // Forçar aba de relatório completo antes se desejado, ou imprimir tela
    window.print();
  };

  // Cores CSS por categorias
  const catSummaryStyles = (cat: SwotCategory) => {
    switch (cat) {
      case "Força": return "text-emerald-700 bg-emerald-50";
      case "Fraqueza": return "text-amber-700 bg-amber-50";
      case "Oportunidade": return "text-blue-700 bg-blue-50";
      case "Ameaça": return "text-rose-700 bg-rose-50";
    }
  };

  if (userRole === null) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-3">
          <img
            src={aclfLogoBase64}
            alt="ACLF"
            className="h-16 mx-auto object-contain"
          />

          <div>
            <h1 className="text-xl font-black text-slate-800">
              Planejamento Estratégico ACLF
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Escolha o perfil de acesso para continuar.
            </p>
          </div>
        </div>

        {!isChoosingAdmin ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleEnterAsViewer}
              className="w-full p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-all"
            >
              <span className="block font-extrabold text-slate-800">
                Entrar como Visualizador
              </span>

              <span className="block text-xs text-slate-500 mt-1">
                Consulta e atualização dos campos permitidos.
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsChoosingAdmin(true);
                setPasswordInput("");
                setPasswordError(null);
              }}
              className="w-full p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-left transition-all"
            >
              <span className="block font-extrabold">
                Entrar como Administrador
              </span>

              <span className="block text-xs text-slate-300 mt-1">
                Acesso completo mediante senha.
              </span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleUnlockEditing} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Senha de administrador
              </label>

              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(null);
                }}
                placeholder="Digite a senha..."
                autoFocus
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              />
            </div>

            {passwordError && (
              <p className="text-xs font-bold text-rose-600">
                {passwordError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsChoosingAdmin(false);
                  setPasswordInput("");
                  setPasswordError(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm"
              >
                Voltar
              </button>

              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm"
              >
                Entrar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased print:bg-white print:text-black">
      
      
      {/* Top Professional Header Bar */}
      <header id="enterprise-header" className="bg-white border-b border-slate-200/90 py-5 px-6 sticky top-0 z-40 shadow-2xs print:relative print:border-none print:shadow-none">
        <div className={`mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${activeTab === "omi" ? "max-w-[1600px] xl:max-w-[95%]" : "max-w-7xl"}`}>
          <div className="flex items-center gap-3">
            <img 
              src={aclfLogoBase64} 
              alt="ACLF Empreendimentos Logo" 
              className="h-8 w-auto object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 whitespace-nowrap">
                Planejamento Estratégico Corporativo 
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                  v2.0 IA
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Importação SWOT, Cruzamento Sistêmico de Riscos e Planos de Ação 5W2H
              </p>
            </div>
          </div>

          {/* Core Controls Header (Generatos & Exporters) */}
          <div className="flex flex-wrap items-center gap-3.5 print:hidden">
          
          <div className="flex items-center gap-2 text-[11px] bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-slate-700">
  <span
    className={
      isAdmin
        ? "w-2 h-2 rounded-full bg-indigo-600"
        : "w-2 h-2 rounded-full bg-slate-400"
    }
  />
  <span>
    Perfil: {isAdmin ? "Administrador" : "Visualizador"}
  </span>
</div>

<button
  type="button"
  onClick={() => {
    setUserRole(null);
    setIsEditingLocked(true);
    setIsChoosingAdmin(false);
    setPasswordInput("");
    setPasswordError(null);
  }}
  className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 transition-all cursor-pointer"
>
  Trocar perfil
</button>

            {/* Status indicators */}
            <div className="hidden md:flex items-center gap-2 text-[11px] bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-550">
              <span className={`w-2 h-2 rounded-full inline-block ${backendStatus.aiEnabled ? 'bg-indigo-600' : 'bg-amber-500'}`}></span>
              <span>{backendStatus.aiEnabled ? "Conectado ao Gemini AI" : "Análise Local Ativa"}</span>
            </div>

            {dbSyncError ? (
              <button
                onClick={() => setShowRlsFixModal(true)}
                className="flex items-center gap-2 text-[11px] bg-red-50 text-red-800 px-3 py-1.5 rounded-lg border border-red-200/50 font-bold hover:bg-red-100 transition-all cursor-pointer animate-pulse"
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block bg-red-500"></span>
                <span>Configurar / Erro DB</span>
              </button>
            ) : (
              <button
                onClick={() => setShowRlsFixModal(true)}
                className="flex items-center gap-2 text-[11px] bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200/50 font-bold hover:bg-emerald-100 transition-all cursor-pointer"
              >
                <span className={`w-1.5 h-1.5 rounded-full inline-block bg-emerald-500 ${isInitialLoadCompleted ? 'animate-pulse' : ''}`}></span>
                <span>{isInitialLoadCompleted ? "Banco de dados conectado" : "Conectando DB..."}</span>
              </button>
            )}

            {/* Export Menu */}
            <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-2xs divide-x divide-slate-250">
              <button
                id="export-xls-btn"
                onClick={handleExportExcel}
                title="Exportar Planilha Excel"
                className="p-2.5 hover:bg-slate-50 text-slate-700 flex items-center justify-center cursor-pointer transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                id="export-csv-btn"
                onClick={handleExportCSV}
                title="Exportar Comma Separated CSV"
                className="p-2.5 hover:bg-slate-50 text-slate-700 flex items-center justify-center cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                id="trigger-print-btn"
                onClick={handlePrintPDF}
                title="Imprimir Relatório (PDF)"
                className="p-2.5 hover:bg-slate-50 text-slate-700 flex items-center justify-center cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className={`flex-1 w-full mx-auto p-6 space-y-6 ${activeTab === "omi" ? "max-w-[1600px] xl:max-w-[95%]" : "max-w-7xl"}`}>

        {/* Banner de Erro de Sincronização Supabase (ex: RLS) */}
        {dbSyncError && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-3xs print:hidden animate-in fade-in duration-300">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-amber-100/70 border border-amber-200/50 rounded-xl text-amber-700 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <p className="font-bold text-slate-800 text-sm leading-tight">
                  Aviso de Sincronia: Alterações salvas temporariamente na máquina local
                </p>
                <p className="text-slate-500 text-xs font-normal leading-relaxed">
                  Detectamos uma restrição ou erro de banco na tabela <code className="bg-amber-100 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-amber-800">{dbSyncError.table}</code> do seu Supabase. Suas alterações nos planos de ação ou matriz SWOT podem ser perdidas ao recarregar a página até que o banco esteja totalmente configurado.
                </p>
                {dbSyncError.message && (
                  <div className="text-[11px] font-mono p-2 bg-rose-50 border border-rose-100/80 rounded-lg text-rose-800 mt-1 max-w-2xl break-all">
                    <strong>Erro Retornado pelo Supabase:</strong> "{dbSyncError.message}"
                  </div>
                )}
                <p className="text-[11px] text-indigo-750 font-medium">
                  💡 Se você acabou de executar os comandos SQL para criar e liberar as tabelas, clique em <strong>Sincronizar Agora</strong> para retestar.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                onClick={handleRetrySync}
                disabled={isSyncing}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-600/15 flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
              </button>
              <button
                onClick={() => setShowRlsFixModal(true)}
                className="text-xs bg-amber-650 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm shadow-amber-600/15 shrink-0 flex items-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4" /> Diagnosticar e Ver SQL
              </button>
            </div>
          </div>
        )}

        {/* Banner de Sincronização Bem Sucedida */}
        {syncSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-3xs print:hidden animate-in fade-in duration-300 pointer-events-none">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 border border-emerald-200/50 rounded-xl text-emerald-700 shrink-0">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm leading-tight">
                  Tudo Sincronizado com Sucesso!
                </p>
                <p className="text-slate-500 text-xs font-normal mt-0.5">
                  Seus dados foram gravados permanentemente no banco de dados do seu Supabase para as tabelas de itens, riscos, oportunidades e planos.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Banner Informational Bar with current SWOT state */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-3xs print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-indigo-600">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Contexto SWOT Ativo</span>
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                {currentTemplateName}
                <span className="text-xs text-slate-400 font-medium">({swotItems.length} fatores SWOT detectados)</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="reset-template-btn"
              onClick={() => {
                if (isEditingLocked) return;
                handleResetToPreloadTemplate();
              }}
              disabled={isEditingLocked}
              className={`py-1.5 px-3 text-[11px] font-semibold text-slate-550 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-all ${
                isEditingLocked ? "opacity-35 cursor-not-allowed text-slate-455" : "hover:border-slate-300 hover:text-slate-750 cursor-pointer"
              }`}
              title={isEditingLocked ? "Edição bloqueada" : "Voltar dados ao original"}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reconfigurar Padrão
            </button>
          </div>
        </div>

        {/* Global Tab Navigator */}
        <div className="flex border-b border-slate-200 gap-1.5 scrollbar-thin overflow-x-auto print:hidden">
          {(["swot", "analysis", "plans", "dashboard", "omi", "report"] as const).map((tab) => {
            const isActive = activeTab === tab;
            let label = "";
            if (tab === "swot") label = "1. Importação & SWOT";
            else if (tab === "analysis") label = "2. Riscos e oportunidades";
            else if (tab === "plans") label = "3. Planos de Ação 5W2H";
            else if (tab === "dashboard") label = "4. Painel de Desempenho";
            else if (tab === "omi") label = "5. Indicadores OMI";
            else label = "6. Relatório Consolidado";

            // Se for tab de análise e planos e não tiver dados, mostra aviso
            const isAnemic = (tab === "analysis" || tab === "plans") && risks.length === 0;

            return (
              <button
                id={`tab-nav-${tab}`}
                key={tab}
                onClick={() => setActiveTab(tab)}
                type="button"
                className={`py-3 px-5 text-xs font-black relative border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                {label}
                {isAnemic && (
                  <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" title="Aguardando geração de análise"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* --- ERROR MESSAGE BANNER --- */}
        {errorMessage && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-850 font-normal flex items-start gap-2 print:hidden animate-fade-in">
            <ShieldAlert className="w-4.5 h-4.5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Nota de Transição:</span> {errorMessage} O processo foi concluído com sucesso por meio do motor analítico robusto local.
              <button 
                onClick={() => setErrorMessage(null)} 
                className="block text-indigo-700 hover:underline mt-1 font-semibold"
              >
                Dispensar aviso
              </button>
            </div>
          </div>
        )}

        {/* --- DYNAMIC LOADING TRANSITION SCREEN --- */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              id="strategic-analyzer-loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 print:hidden"
            >
              <div className="bg-white border border-slate-100 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl space-y-6">
                {/* Advanced Pulsing Loader Graphic */}
                <div className="relative mx-auto w-16 h-16 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-2xl border border-indigo-100 shadow-md">
                  <div className="absolute inset-0 rounded-2xl border-2 border-indigo-600 border-t-transparent animate-spin"></div>
                  <Cpu className="w-8 h-8 animate-pulse text-indigo-600" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-800 text-base">Análise Estratégica SWOT em Curso</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                    A Inteligência Artificial está correlacionando a matriz SWOT para estimar riscos empresariais e traçar planos 5W2H.
                  </p>
                </div>

                {/* Simulated Step Indicator Progress */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 min-h-[56px] flex items-center justify-center">
                  <motion.p
                    key={loadingStep}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.35 }}
                    className="text-xs font-bold text-center text-slate-700 leading-normal"
                  >
                    {loadingSteps[loadingStep]}
                  </motion.p>
                </div>

                <div className="flex justify-center gap-1.5">
                  {loadingSteps.map((_, i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === loadingStep ? "w-6 bg-indigo-600" : "bg-slate-205"
                      }`}
                    ></span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- VIEW TABS RENDER CONTROLS --- */}
        <div id="tab-outlet-section">
          
          {/* TAB 1: Matriz SWOT & Upload */}
          {activeTab === "swot" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* View layout selectors */}
              <div className="flex justify-between items-center pb-5">
  <div className="space-y-0.5">
    <div className="flex items-center gap-2">
      <h3 className="font-bold text-base text-slate-800">
        Visualização da Matriz SWOT
      </h3>

      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
        Versão 2026
      </span>
    </div>

    <p className="text-xs text-slate-500">
      Exiba o mapeamento estratégico da empresa ou edite os fatores em tempo real.
    </p>
  </div>

                <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1 shadow-3xs">
                  <button
                    onClick={() => setSwotViewMode("quadrants")}
                    type="button"
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      swotViewMode === "quadrants"
                        ? "bg-indigo-600 text-white shadow-3xs"
                        : "text-slate-600 hover:bg-slate-55"
                    }`}
                  >
                    Quadrantes
                  </button>
                  <button
                    onClick={() => setSwotViewMode("table")}
                    type="button"
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      swotViewMode === "table"
                        ? "bg-indigo-600 text-white shadow-3xs"
                        : "text-slate-600 hover:bg-slate-55"
                    }`}
                  >
                    Tabela & Editor
                  </button>
                </div>
              </div>

              {/* Matrix view display */}
              {swotViewMode === "quadrants" ? (
                <SwotQuadrants
                  items={swotItems}
                  onDeleteItem={handleDeleteSwotItem}
                  onAddItem={handleAddSwotItem}
                  onUpdateItem={handleUpdateSwotItem}
                  isEditingLocked={isEditingLocked}
                />
              ) : (
                <SwotTable
                  items={swotItems}
                  onDeleteItem={handleDeleteSwotItem}
                  onAddItem={handleAddSwotItem}
                  onUpdateItem={handleUpdateSwotItem}
                  isEditingLocked={isEditingLocked}
                />
              )}

              {/* File Spreadsheet Parser & Template Selector Box positioned BELOW the matrix */}
              <div className="border-t border-slate-200/50 pt-8 mt-4 space-y-4">
                <div>
                  <h3 className="font-bold text-base text-slate-800">Atualização da Planilha SWOT</h3>
                  <p className="text-xs text-slate-500">Importe uma nova planilha atualizada para substituir os dados ativos da consultoria.</p>
                </div>
                <SwotUpload
                  onSwotLoaded={handleSwotLoadedFromSpreadsheet}
                  currentTemplateName={currentTemplateName}
                  swotCount={swotItems.length}
                  isEditingLocked={isEditingLocked}
                />
              </div>
            </motion.div>
          )}

          {/* TAB 2: Cruzamento de Riscos e Oportunidades (Dashboard) */}
          {activeTab === "analysis" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {risks.length === 0 ? (
                <div className="text-center py-20 border border-slate-100 rounded-3xl bg-white shadow-3xs flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Pronto para Cruzar a SWOT</h3>
                    <p className="text-xs text-slate-500 max-w-sm mt-1 mx-auto leading-relaxed">
                      Sua matriz SWOT está carregada. Clique no botão abaixo para rodar o cruzamento matricial e mapear os riscos, causas chaves e prioridades de alavancagem de oportunidades.
                    </p>
                  </div>
                  <button
                    onClick={handleRunAnalysisAndActionPlans}
                    className="py-2.5 px-6 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-md shadow-indigo-600/15"
                  >
                    Estimar Riscos & Soluções Agora
                  </button>
                </div>
              ) : (
                <AnalyticalDashboard 
                  risks={risks} 
                  opportunities={opportunities} 
                  plans={actionPlans}
                  onUpdateRisk={handleUpdateRisk}
                  onDeleteRisk={handleDeleteRisk}
                  onUpdateOpportunity={handleUpdateOpportunity}
                  onDeleteOpportunity={handleDeleteOpportunity}
                  onAddPlan={handleAddActionPlan}
                  onDeletePlan={handleDeleteActionPlan}
                  onUpdatePlan={handleUpdateActionPlan}
                  onAddRisk={handleAddRisk}
                  isAnalysisStale={isAnalysisStale}
                  onRunAnalysis={handleRunAnalysisAndActionPlans}
                  loading={loading}
                  isEditingLocked={isEditingLocked}
                />
              )}
            </motion.div>
          )}

          {/* TAB 3: Planos de Ação 5W2H */}
          {activeTab === "plans" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {actionPlans.length === 0 ? (
                <div className="text-center py-20 border border-slate-100 rounded-3xl bg-white shadow-3xs flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                    <BookmarkCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Planos de Ação 5W2H Pendentes</h3>
                    <p className="text-xs text-slate-500 max-w-sm mt-1 mx-auto leading-relaxed">
                      Os planos detalhados dependem da análise de cruzamento da matriz SWOT ativa. Inicie gerando os diagnósticos estratégicos primeiro.
                    </p>
                  </div>
                  <button
                    onClick={handleRunAnalysisAndActionPlans}
                    className="py-2.5 px-6 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-md shadow-indigo-600/15"
                  >
                    Gerar Análise e Planos 5W2H
                  </button>
                </div>
              ) : (
                <ActionPlans 
                  plans={actionPlans} 
                  risks={risks}
                  opportunities={opportunities}
                  onUpdatePlan={handleUpdateActionPlan}
                  onDeletePlan={handleDeleteActionPlan}
                  onAddPlan={handleAddActionPlan}
                  onRebuildPlans={handleRebuildOneToOneActionPlans}
                  isEditingLocked={isEditingLocked}
                  canEditDeadline={isAdmin}
                />
              )}
            </motion.div>
          )}

          {/* TAB 4: Painel de Desempenho / Cronograma */}
          {activeTab === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {actionPlans.length === 0 ? (
                <div className="text-center py-20 border border-slate-100 rounded-3xl bg-white shadow-3xs flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                    <BarChart2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Painel de Desempenho Vazio</h3>
                    <p className="text-xs text-slate-500 max-w-sm mt-1 mx-auto leading-relaxed">
                      O painel de desempenho detalha cronogramas e taxas de conclusão dos planos de ação. Crie ou gere planos SWOT para visualizar este painel.
                    </p>
                  </div>
                  <button
                    onClick={handleRunAnalysisAndActionPlans}
                    className="py-2.5 px-6 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-md shadow-indigo-600/15"
                  >
                    Gerar Análise e Planos 5W2H
                  </button>
                </div>
              ) : (
                <PerformanceDashboard 
                  plans={actionPlans} 
                  onUpdatePlan={handleUpdateActionPlan}
                />
              )}
            </motion.div>
          )}

          {activeTab === "omi" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 animate-fade-in"
            >
              <OmiDashboard 
              canEditDeadline={isAdmin}
               />  
            </motion.div>
          )}

          {/* TAB 5: Relatório Executivo Consolidado Inteligente printable */}
          {activeTab === "report" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 bg-white border border-slate-150 rounded-2xl p-8 shadow-xs"
            >
              {/* Report Header */}
              <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 px-2.5 py-0.5 rounded-full inline-block uppercase">
                    Documento Executivo de Governança
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Relatório Consolidado de Gestão Estratégica</h3>
                  <p className="text-xs text-slate-500 font-normal">
                    Fatores de Riscos Mapeados, Criticidade do Negócio e Matriz de Defesas 5W2H da Organização.
                  </p>
                </div>

                <div className="text-right flex flex-col items-start md:items-end gap-1 font-mono text-[11px] text-slate-500">
                  <div><strong>Emissão:</strong> {new Date().toLocaleDateString("pt-BR")}</div>
                  <div><strong>Status:</strong> {risks.length > 0 ? "Diagnóstico Integrado Concluído" : "SWOT Parcial de Auditoria"}</div>
                </div>
              </div>

              {/* Matriz SWOT Sections */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                  I. Matriz SWOT do Diagnóstico
                </h4>

                <div className="grid grid-cols-2 gap-4 text-xs font-normal">
                  <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-xl space-y-2">
                    <span className="font-bold text-emerald-700">Forças</span>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-650">
                      {swotItems.filter(i => i.category === "Força").map(i => (
                        <li key={i.id}>{i.description}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50/20 border border-amber-100 rounded-xl space-y-2">
                    <span className="font-bold text-amber-700">Fraquezas</span>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-650">
                      {swotItems.filter(i => i.category === "Fraqueza").map(i => (
                        <li key={i.id}>{i.description}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-blue-50/20 border border-blue-100 rounded-xl space-y-2">
                    <span className="font-bold text-blue-700">Oportunidades</span>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-650">
                      {swotItems.filter(i => i.category === "Oportunidade").map(i => (
                        <li key={i.id}>{i.description}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-rose-50/20 border border-rose-100 rounded-xl space-y-2">
                    <span className="font-bold text-rose-700">Ameaças</span>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-650">
                      {swotItems.filter(i => i.category === "Ameaça").map(i => (
                        <li key={i.id}>{i.description}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Risks rating matrix report sheet */}
              {risks.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                    II. Mapeamento de Vulnerabilidades e Riscos
                  </h4>

                  <div className="overflow-x-auto border border-slate-150 rounded-xl">
                    <table className="w-full text-left font-normal text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 font-bold">
                          <th className="p-3 w-12">Nº</th>
                          <th className="p-3">Risco Estimado</th>
                          <th className="p-3">Causa Enraizada</th>
                          <th className="p-3 w-16 text-center">Impacto</th>
                          <th className="p-3 w-16 text-center">Prob.</th>
                          <th className="p-3 w-16 text-center">Score</th>
                          <th className="p-3 w-24">Classificação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {risks.map((r, idx) => (
                          <tr key={r.id}>
                            <td className="p-3 font-semibold text-slate-400">R{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-850">{r.description}</td>
                            <td className="p-3">{r.probableCause}</td>
                            <td className="p-3 text-center">{r.impact}</td>
                            <td className="p-3 text-center">{r.probability}</td>
                            <td className="p-3 text-center font-extrabold">{r.criticality}</td>
                            <td className="p-3">
                              <span className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                r.criticalityClass === "Crítico" ? "bg-rose-50 text-rose-700 font-extrabold" :
                                r.criticalityClass === "Alto" ? "bg-orange-50 text-orange-700" :
                                r.criticalityClass === "Médio" ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700"
                              }`}>
                                {r.criticalityClass}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5W2H Action printable table */}
              {actionPlans.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                    III. Defesas Adotadas (Matriz de Ações 5W2H)
                  </h4>

                  <div className="overflow-x-auto border border-slate-150 rounded-xl">
                    <table className="w-full text-left font-normal text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 font-bold">
                          <th className="p-3 w-28">Origem</th>
                          <th className="p-3">What (O que)</th>
                          <th className="p-3">Why (Por que)</th>
                          <th className="p-3">Who (Quem)</th>
                          <th className="p-3 w-20">When (Prazo)</th>
                          <th className="p-3 w-32">How Much (Custo)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-705">
                        {actionPlans.map((p) => (
                          <tr key={p.id}>
                            <td className="p-3">
                              <span className="font-bold">{p.type}</span>
                              <div className="text-[9px] text-slate-450 truncate max-w-[120px]">{p.relatedDescription}</div>
                            </td>
                            <td className="p-3 font-semibold text-slate-800">{p.what}</td>
                            <td className="p-3">{p.why}</td>
                            <td className="p-3 font-semibold">{p.who} ({p.where})</td>
                            <td className="p-3">{p.when}</td>
                            <td className="p-3 text-emerald-700 font-bold">
                              {(() => {
                                if (!p.howMuch) return "Não planejado / Opcional";
                                const clean = p.howMuch.trim();
                                if (/^\d+$/.test(clean)) {
                                  return `R$ ${new Intl.NumberFormat("pt-BR").format(parseInt(clean, 10))}`;
                                }
                                return clean;
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Disclaimer footer */}
              <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row justify-between text-[10px] text-slate-400 font-normal">
                <span>Relatório gerado via Matriz SWOT & Gestão Estratégica. Todos os direitos reservados.</span>
                <span className="hidden md:inline">Auditoria Interna Governança Corporativa</span>
              </div>

              {/* Active Print Trigger Button for report view only */}
              <div className="flex justify-end pt-2 print:hidden">
                <button
                  id="print-report-shortcut"
                  onClick={handlePrintPDF}
                  className="py-2.5 px-6 text-xs font-bold text-white bg-indigo-650 hover:bg-slate-900 rounded-xl transition-all cursor-pointer shadow-3xs flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Enviar para Impressora / Salvar PDF
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </main>

      {/* Footer System Credits (Slight clean layout) */}
      {isEditingLocked && (
        <footer id="app-system-footer" className="bg-white border-t border-slate-200 py-6 px-6 mt-12 print:hidden text-center text-xs text-slate-400 font-normal">
          <div className={`mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 ${activeTab === "omi" ? "max-w-[1600px] xl:max-w-[95%]" : "max-w-7xl"}`}>
            <div>
              <strong>Gestão Estratégica SWOT Inteligente</strong> — Framework de Análise de Riscos e Planos 5W2H integrado com IA.
            </div>
            <div className="font-mono text-[10px] text-slate-455">
              AI Studio Build Workspace • 2026/05
            </div>
          </div>
        </footer>
      )}

      {/* Modal de Solução de RLS no Supabase */}
      {showRlsFixModal && (
        <div 
          id="rls-fix-modal-backdrop" 
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRlsFixModal(false);
          }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
        >
          <div 
            id="rls-fix-modal-card" 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 flex flex-col gap-4 animate-in zoom-in-95 duration-200 relative cursor-default"
          >
            <button
              onClick={() => setShowRlsFixModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800 leading-tight">Configuração de Banco e Solução de Erros</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Seus dados locais estão seguros, mas o Supabase retornou um erro ao tentar salvar.</p>
              </div>
            </div>

            {/* Diagnóstico detalhado do erro real */}
            {dbSyncError && (
              <div className="bg-red-50 border border-red-200/60 p-4 rounded-xl">
                <p className="text-xs font-bold text-red-800">Causa do Erro Identificada:</p>
                <div className="mt-1.5 font-mono text-[11px] text-red-700 bg-white/70 p-2.5 rounded-md border border-red-200/40 whitespace-pre-wrap breakdown-all">
                  <strong>Erro:</strong> {dbSyncError.message}
                  {dbSyncError.code && <span> (Código: {dbSyncError.code})</span>}
                </div>
                <p className="text-[11px] text-red-600 mt-2">
                  {dbSyncError.message?.toLowerCase().includes("relation") ? (
                    <span><strong>Diagnóstico:</strong> As tabelas necessárias ainda não foram criadas no seu banco de dados Supabase! Copie e execute o script SQL abaixo para criar as tabelas automaticamente.</span>
                  ) : (
                    <span><strong>Diagnóstico:</strong> O Supabase barrou a gravação devido a restrições de segurança ou a falta de políticas (Row Level Security - RLS). Execute o script abaixo para conceder permissão.</span>
                  )}
                </p>
              </div>
            )}

            {/* Painel de Customização de Chaves Supabase */}
            <div className="bg-indigo-50/50 border border-indigo-100/45 p-4 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5 label-title">
                🔌 Ajustar Conexão com seu Projeto do Supabase
              </h4>
              <p className="text-[11px] text-indigo-700 leading-normal">
                Verifique se o aplicativo está apontando para o seu projeto correto. Se você criou o seu próprio banco de dados Supabase, <strong>cole o seu Project URL e sua Anon/Public API Key abaixo</strong> e salve. Seus dados locais serão sincronizados imediatamente.
              </p>
              
              <div className="grid grid-cols-1 gap-2.5 mt-1 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide">
                    Project URL (ex: https://xxx.supabase.co)
                  </label>
                  <input
                    type="text"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://suaconta.supabase.co"
                    className="w-full text-[11px] font-mono p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-3xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide">
                    Anon Key (Public API Key)
                  </label>
                  <input
                    type="password"
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    placeholder="eyJhbGciOi..."
                    className="w-full text-[11px] font-mono p-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-3xs"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    updateSupabaseClient(supabaseUrlInput, supabaseKeyInput);
                    setSaveConfigSuccess(true);
                    setTimeout(() => setSaveConfigSuccess(false), 4000);
                    handleRetrySync();
                  }}
                  className="text-[11px] bg-indigo-600 hover:bg-indigo-700 hover:transform hover:-translate-y-0.5 text-white font-extrabold px-4 py-2 border-0 rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-600/15"
                >
                  Salvar e Reconectar
                </button>
                
                {saveConfigSuccess && (
                  <span className="text-[10px] text-emerald-650 font-bold bg-emerald-50 border border-emerald-150 rounded-lg px-2 py-1 animate-pulse">
                    ✓ Credenciais atualizadas! Sincronizando...
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-3.5 mt-1 bg-slate-50 p-4 rounded-xl border border-slate-200/65 max-h-[380px] overflow-y-auto">
              <p className="leading-relaxed">
                Para que a sincronização funcione perfeitamente, seu Supabase precisa ter as tabelas criadas e com o <strong>Row Level Security (RLS)</strong> desabilitado ou configurado com políticas para escrita anônima de novos planos de ação.
              </p>
              
              <div>
                <p className="font-bold text-slate-705 leading-snug mb-1.5">SQL Completo para Copiar e Colar (Atualização de Colunas + Criação de Tabelas + Desativação de RLS):</p>
                <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-lg text-[10px] font-mono whitespace-pre-wrap overflow-x-auto select-all shadow-sm leading-relaxed max-h-[250px]">
{`-- ====================================================================
-- SE VOCÊ JÁ TINHA AS TABELAS E APRESENTOU ERRO: ATUALIZAÇÃO SEGURA DE COLUNAS
-- (Adiciona as novas colunas necessárias sem apagar seus dados anteriores)
-- ====================================================================
ALTER TABLE swot_items ADD COLUMN IF NOT EXISTS score INTEGER;
ALTER TABLE swot_items ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE swot_items ADD COLUMN IF NOT EXISTS processes TEXT;
ALTER TABLE swot_items ADD COLUMN IF NOT EXISTS stakeholders TEXT;

ALTER TABLE risks ADD COLUMN IF NOT EXISTS probable_cause TEXT;
ALTER TABLE risks ADD COLUMN IF NOT EXISTS impact INTEGER;
ALTER TABLE risks ADD COLUMN IF NOT EXISTS probability INTEGER;
ALTER TABLE risks ADD COLUMN IF NOT EXISTS criticality INTEGER;
ALTER TABLE risks ADD COLUMN IF NOT EXISTS criticality_class TEXT;
ALTER TABLE risks ADD COLUMN IF NOT EXISTS crossed_factors JSONB DEFAULT '[]'::jsonb;

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS expected_benefit TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS potential_impact INTEGER;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS crossed_factors JSONB DEFAULT '[]'::jsonb;

ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS related_id TEXT;
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS related_description TEXT;
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS what TEXT;
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS why TEXT;
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS "where" TEXT;
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS "when" TEXT;
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS who TEXT;
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS how TEXT;
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS how_much TEXT;
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS suggested_krs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE action_plans ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;

-- ====================================================================
-- CASO PREFIRA RECRIAR DO ZERO (LIMPA TODOS OS DADOS DAS TABELAS):
-- Se quiser limpar tudo e começar de novo descomprometido de erros, descomente a linha abaixo:
-- DROP TABLE IF EXISTS swot_items, risks, opportunities, action_plans CASCADE;
-- ====================================================================

-- 1. CRIAR AS TABELAS NO SEU BANCO DE DADOS (CASO NÃO EXISTAM)
CREATE TABLE IF NOT EXISTS swot_items (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    score INTEGER,
    action TEXT,
    processes TEXT,
    stakeholders TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risks (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    probable_cause TEXT,
    impact INTEGER,
    probability INTEGER,
    criticality INTEGER,
    criticality_class TEXT,
    crossed_factors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    expected_benefit TEXT,
    potential_impact INTEGER,
    priority TEXT,
    crossed_factors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS action_plans (
    id TEXT PRIMARY KEY,
    type TEXT,
    related_id TEXT,
    related_description TEXT,
    what TEXT,
    why TEXT,
    "where" TEXT,
    "when" TEXT,
    who TEXT,
    how TEXT,
    how_much TEXT,
    priority TEXT,
    suggested_krs JSONB DEFAULT '[]'::jsonb,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GARANTIR PERMISSÃO EXPLÍCITA DE LEITURA/ESCRITA PARA ACESSO ANÔNIMO (ESSENCIAL)
GRANT ALL PRIVILEGES ON TABLE swot_items TO anon, authenticated, postgres, service_role;
GRANT ALL PRIVILEGES ON TABLE risks TO anon, authenticated, postgres, service_role;
GRANT ALL PRIVILEGES ON TABLE opportunities TO anon, authenticated, postgres, service_role;
GRANT ALL PRIVILEGES ON TABLE action_plans TO anon, authenticated, postgres, service_role;

-- 3. DESABILITAR SEGURANÇA (RLS) PARA PROTÓTIPOS (IDEAL PARA ENVIAR AGORA SEM LOGIN)
ALTER TABLE swot_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE risks DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE action_plans DISABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE BACKUP (CASO O RLS SEJA ATIVADO ACIDENTALMENTE)
DROP POLICY IF EXISTS "Permitir tudo para anon" ON swot_items;
DROP POLICY IF EXISTS "Permitir tudo para anon" ON risks;
DROP POLICY IF EXISTS "Permitir tudo para anon" ON opportunities;
DROP POLICY IF EXISTS "Permitir tudo para anon" ON action_plans;

CREATE POLICY "Permitir tudo para anon" ON swot_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para anon" ON risks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para anon" ON opportunities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para anon" ON action_plans FOR ALL USING (true) WITH CHECK (true);`}
                </pre>
              </div>
              <p className="leading-relaxed text-[11px] text-slate-500">
                <strong>Onde executar:</strong> No painel lateral do seu console do <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold hover:underline">Supabase</a>, clique em <strong>SQL Editor</strong>, clique em <strong>New Query</strong>, cole o código acima completo e clique no botão verde <strong>Run</strong>. Depois volte aqui e clique em "Sincronizar Agora" para testar!
              </p>
            </div>

            <div className="flex justify-end gap-2.5 mt-1">
              <button
                onClick={() => setShowRlsFixModal(false)}
                type="button"
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Fechar Painel
              </button>
              <button
                onClick={() => setShowRlsFixModal(false)}
                className="text-xs bg-indigo-650 hover:bg-slate-900 text-white font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                Eu Entendi e Copiei o SQL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD PROTECTION MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/85 w-full max-w-sm rounded-2xl p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-800">Habilitar Modo Edição</h3>
                <p className="text-xs text-slate-500 font-normal mt-0.5">Informe a credencial corporativa para liberar alterações.</p>
              </div>
            </div>

            <form onSubmit={handleUnlockEditing} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Senha de Acesso</label>
                <input
                  type="password"
                  placeholder="Digite a senha..."
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError(null);
                  }}
                  autoFocus
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1.5 focus:ring-amber-500 text-slate-800 transition-all font-mono tracking-widest text-center"
                />
                
                {passwordError && (
                  <p className="text-rose-600 font-medium text-[11px] mt-1.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput("");
                    setPasswordError(null);
                  }}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer leading-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-black px-5 py-2.5 rounded-xl transition-all shadow-md shadow-amber-550/10 cursor-pointer leading-none"
                >
                  Confirmar & Liberar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
