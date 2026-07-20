import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  TrendingUp, 
  TrendingDown, 
  FileSpreadsheet, 
  Shield, 
  Sparkles, 
  Percent, 
  DollarSign, 
  Clock, 
  Users,
  Building,
  Target,
  FileText,
  BookmarkCheck,
  AlertCircle,
  Mail,
  Calendar,
  Filter,
  CheckSquare
} from "lucide-react";
import OmiActionPlansTab, { OmiActionPlan, PRESET_OMI_ACTION_PLANS } from "./OmiActionPlansTab";

import {
  getOmiActionPlans,
  saveOmiActionPlans,
  deleteOmiActionPlanFromDb
} from "../lib/supabase";

export interface OmiItem {
  id: string;
  strategicObjective: string;
  dimension: "Longevidade" | "Crescimento" | "Lucratividade" | "Caixa" | string;
  stakeholder: string;
  expectation: string;
  requirement: string;
  committee: string;
  indicator: string;
  preference: "MAIOR" | "MENOR";
  target: number;
  actual: number;
  unit: string;
}

const PRESET_OMI_ITEMS: OmiItem[] = [
  {
    id: "omi-1",
    strategicObjective: "Assegurar a longevidade do negócio, sendo referência em empreendedorismo, impulsionando a inovação para captura de valor e garantindo a satisfação das nossas partes interessadas",
    dimension: "Longevidade",
    stakeholder: "CLIENTES (COMPRADORES DE IMÓVEIS)",
    expectation: "Ser atendido de forma eficiente e cordial em todas as etapas da compra, com resolução de problemas dentro dos prazos definidos.",
    requirement: "Gestão formal do atendimento ao cliente com controle de prazos e satisfação.",
    committee: "Marketing/Comitê Experiente do Cliente",
    indicator: "NPS Geral na jornada do cliente",
    preference: "MAIOR",
    target: 75,
    actual: 78,
    unit: "Score"
  },
  {
    id: "omi-2",
    strategicObjective: "Assegurar a longevidade do negócio, sendo referência em empreendedorismo, impulsionando a inovação para captura de valor e garantindo a satisfação das nossas partes interessadas",
    dimension: "Longevidade",
    stakeholder: "COLABORADORES ADMINISTRATIVOS",
    expectation: "Ter condições de trabalho adequadas, oportunidades de desenvolvimento de carreira, bem-estar e reconhecimento profissional.",
    requirement: "Alcançar nível satisfatório de percepção dos colaboradores quanto às condições de trabalho, oportunidades de desenvolvimento, bem-estar e reconhecimento.",
    committee: "Pessoas e Cultura/Comitê de Gente",
    indicator: "E-NPS Colaboradores | NPS",
    preference: "MAIOR",
    target: 50,
    actual: 52,
    unit: "Score"
  },
  {
    id: "omi-3",
    strategicObjective: "Assegurar a longevidade do negócio, sendo referência em empreendedorismo, impulsionando a inovação para captura de valor e garantindo a satisfação das nossas partes interessadas",
    dimension: "Longevidade",
    stakeholder: "COLABORADORES OPERACIONAIS",
    expectation: "Trabalhar em ambiente seguro, com condições adequadas para execução das atividades, treinamento e reconhecimento pelo desempenho.",
    requirement: "Garantir nível satisfatório de segurança, infraestrutura e capacitação dos colaboradores, assegurando o reconhecimento por desempenho.",
    committee: "Pessoas e Cultura/Comitê de Gente",
    indicator: "E-NPS Colaboradores | NPS",
    preference: "MAIOR",
    target: 45,
    actual: 43,
    unit: "Score"
  },
  {
    id: "omi-4",
    strategicObjective: "Assegurar a longevidade do negócio, sendo referência em empreendedorismo, impulsionando a inovação para captura de valor e garantindo a satisfação das nossas partes interessadas",
    dimension: "Longevidade",
    stakeholder: "COLABORADORES OPERACIONAIS",
    expectation: "Trabalhar em ambiente seguro, com condições adequadas para execução das atividades, treinamento e reconhecimento pelo desempenho.",
    requirement: "Garantir nível satisfatório de segurança, infraestrutura e capacitação dos colaboradores, assegurando o reconhecimento por desempenho.",
    committee: "SGI",
    indicator: "Índice de Acidente da Obra | índice",
    preference: "MENOR",
    target: 1.0,
    actual: 0.5,
    unit: "Taxa"
  },
  {
    id: "omi-5",
    strategicObjective: "Assegurar a longevidade do negócio, sendo referência em empreendedorismo, impulsionando a inovação para captura de valor e garantindo a satisfação das nossas partes interessadas",
    dimension: "Longevidade",
    stakeholder: "FORNECEDORES / PRESTADORES DE SERVIÇOS / EMPREITEIROS",
    expectation: "Receber pagamentos dentro dos prazos acordados.",
    requirement: "Cumprimento dos prazos contratuais de pagamento a fornecedores.",
    committee: "Financeiro",
    indicator: "Acuracidade do fluxo total de Pagamento | %",
    preference: "MAIOR",
    target: 95,
    actual: 98.2,
    unit: "%"
  },
  {
    id: "omi-6",
    strategicObjective: "Assegurar a longevidade do negócio, sendo referência em empreendedorismo, impulsionando a inovação para captura de valor e garantindo a satisfação das nossas partes interessadas",
    dimension: "Longevidade",
    stakeholder: "DIRETORES",
    expectation: "Manter equipe qualificada.",
    requirement: "Nível de desenvolvimento das competências e desempenho das equipes.",
    committee: "Pessoas e Cultura/Comitê de Gente",
    indicator: "Score de Talentos | %",
    preference: "MAIOR",
    target: 80,
    actual: 85,
    unit: "%"
  },
  {
    id: "omi-7",
    strategicObjective: "Assegurar a longevidade do negócio, sendo referência em empreendedorismo, impulsionando a inovação para captura de valor e garantindo a satisfação das nossas partes interessadas",
    dimension: "Longevidade",
    stakeholder: "DIRETORES",
    expectation: "Posicionar a empresa como referência em eficiência operacional e inovação.",
    requirement: "Nível de disseminação e consolidação da cultura de inovação na organização.",
    committee: "Gestão Estratégica",
    indicator: "Grau de Maturidade de Inovação",
    preference: "MAIOR",
    target: 4.0,
    actual: 3.8,
    unit: "Nível"
  },
  {
    id: "omi-8",
    strategicObjective: "Assegurar a longevidade do negócio, sendo referência em empreendedorismo, impulsionando a inovação para captura de valor e garantindo a satisfação das nossas partes interessadas",
    dimension: "Longevidade",
    stakeholder: "DIRETORES",
    expectation: "Garantir execução dos serviços conforme padrões estabelecidos.",
    requirement: "Nível de conformidade dos serviços executados e baixa recorrência de não conformidades.",
    committee: "Engenharia",
    indicator: "Eficiência da resolução de não conformidades | %",
    preference: "MAIOR",
    target: 92,
    actual: 94.5,
    unit: "%"
  },
  {
    id: "omi-9",
    strategicObjective: "Promover o cumprimento das exigências normativas relacionadas à Qualidade, SST e Meio Ambiente e garantir a responsabilidade social nas regiões que atuamos",
    dimension: "Longevidade",
    stakeholder: "ÓRGÃOS REGULADORES E FISCALIZADORES (ASSOCIAÇÕES E ENTIDADES DE CLASSE)",
    expectation: "Garantir cumprimento de todos os requisitos legais, regulamentares e normativos aplicáveis às atividades da empresa.",
    requirement: "Eficácia do Sistema de Gestão",
    committee: "Engenharia",
    indicator: "Índice de conformidade de gestão | Score",
    preference: "MAIOR",
    target: 95,
    actual: 96,
    unit: "Score"
  },
  {
    id: "omi-10",
    strategicObjective: "Promover o cumprimento das exigências normativas relacionadas à Qualidade, SST e Meio Ambiente e garantir a responsabilidade social nas regiões que atuamos",
    dimension: "Longevidade",
    stakeholder: "COMUNIDADE DO ENTORNO DAS OBRAS",
    expectation: "Minimizar impactos negativos e maximizar impactos positivos provenientes da implantação dos empreendimentos.",
    requirement: "Cumprimento das medidas mitigatórias e compensatórias previstas no licenciamento ambiental.",
    committee: "Legalização",
    indicator: "Aderência ao plano de Ações mitigatórias | #",
    preference: "MAIOR",
    target: 100,
    actual: 100,
    unit: "%"
  },
  {
    id: "omi-11",
    strategicObjective: "Promover o cumprimento das exigências normativas relacionadas à Qualidade, SST e Meio Ambiente e garantir a responsabilidade social nas regiões que atuamos",
    dimension: "Longevidade",
    stakeholder: "COMUNIDADE DO ENTORNO DAS OBRAS",
    expectation: "Minimizar impactos negativos e maximizar impactos positivos provenientes da implantação dos empreendimentos.",
    requirement: "Cumprimento das medidas mitigatórias e compensatórias previstas no licenciamento ambiental.",
    committee: "SGI",
    indicator: "Índice de Sustentabilidade",
    preference: "MENOR",
    target: 1.0,
    actual: 0.5,
    unit: "Taxa"
  },
  {
    id: "omi-12",
    strategicObjective: "Promover o cumprimento das exigências normativas relacionadas à Qualidade, SST e Meio Ambiente e garantir a responsabilidade social nas regiões que atuamos",
    dimension: "Longevidade",
    stakeholder: "ÓRGÃOS GOVERNAMENTAIS (IBAMA/CPRH, MTE, ENTRE OUTROS)",
    expectation: "Cumprir normas técnicas e legislação, incluindo legislação trabalhista, previdenciária e ambiental.",
    requirement: "Conformidade com os requisitos legais e normativos de segurança do trabalho",
    committee: "Engenharia",
    indicator: "Nota de Segurança do Trabalho | Score",
    preference: "MAIOR",
    target: 90,
    actual: 93.5,
    unit: "Score"
  },
  {
    id: "omi-13",
    strategicObjective: "Promover o cumprimento das exigências normativas relacionadas à Qualidade, SST e Meio Ambiente e garantir a responsabilidade social nas regiões que atuamos",
    dimension: "Longevidade",
    stakeholder: "ÓRGÃOS GOVERNAMENTAIS (IBAMA/CPRH, MTE, ENTRE OUTROS)",
    expectation: "Cumprir normas técnicas e legislação, incluindo legislação trabalhista, previdenciária e ambiental.",
    requirement: "Conformidade com os requisitos legais e normativos de segurança do trabalho",
    committee: "Engenharia",
    indicator: "Índice de Sustentabilidade",
    preference: "MAIOR",
    target: 85,
    actual: 88,
    unit: "%"
  },
  {
    id: "omi-14",
    strategicObjective: "Promover o cumprimento das exigências normativas relacionadas à Qualidade, SST e Meio Ambiente e garantir a responsabilidade social nas regiões que atuamos",
    dimension: "Longevidade",
    stakeholder: "ÓRGÃOS GOVERNAMENTAIS (IBAMA/CPRH, MTE, ENTRE OUTROS)",
    expectation: "Adotar práticas de responsabilidade ambiental, cumprindo normas e prevenindo impactos.",
    requirement: "Conformidade com os requisitos legais, ambientais e de certificações aplicáveis.",
    committee: "SGI",
    indicator: "Aderência ao plano de ação de certificações | %",
    preference: "MAIOR",
    target: 95,
    actual: 92,
    unit: "%"
  },
  {
    id: "omi-15",
    strategicObjective: "Assegurar a sustentabilidade do plano de crescimento da empresa, garantindo a rentabilidade adequada através da aderência aos índices de produtividade e orçamento e ser líder regional no desenvolvimento imobiliário",
    dimension: "Crescimento",
    stakeholder: "DIRETORES",
    expectation: "Garantir entrega dos projetos conforme cronograma e planejamento estratégico.",
    requirement: "Cumprimento do prazo das obras conforme cronograma planejado.",
    committee: "Engenharia/Planejamento Comitê Técnicas de engenharia",
    indicator: "Aderência ao cronograma de obra (IDP) | %",
    preference: "MAIOR",
    target: 90,
    actual: 91.5,
    unit: "%"
  },
  {
    id: "omi-16",
    strategicObjective: "Assegurar a sustentabilidade do plano de crescimento da empresa, garantindo a rentabilidade adequada através da aderência aos índices de produtividade e orçamento e ser líder regional no desenvolvimento imobiliário",
    dimension: "Crescimento",
    stakeholder: "DIRETORES",
    expectation: "Preservar e gerir o landbank estratégico de forma sustentável, garantindo a continuidade dos empreendimentos.",
    requirement: "VGV potencial do landbank estratégico regularizado.",
    committee: "Legalização",
    indicator: "VGV landbank legalizado | Milhões R$",
    preference: "MAIOR",
    target: 400,
    actual: 420,
    unit: "Milhões R$"
  },
  {
    id: "omi-17",
    strategicObjective: "Assegurar a sustentabilidade do plano de crescimento da empresa, garantindo a rentabilidade adequada através da aderência aos índices de produtividade e orçamento e ser líder regional no desenvolvimento imobiliário",
    dimension: "Crescimento",
    stakeholder: "DIRETORES",
    expectation: "Manter volume adequado de vendas financiadas para sustentabilidade financeira.",
    requirement: "Nível de vendas financiadas compatível com a sustentabilidade financeira da empresa.",
    committee: "Comercial",
    indicator: "Financiamento Bancário | %",
    preference: "MAIOR",
    target: 80,
    actual: 76.5,
    unit: "%"
  },
  {
    id: "omi-18",
    strategicObjective: "Entregar empreendimentos imobiliários de qualidade a custos competitivos, visando ser referência na utilização de tecnologia e melhores práticas construtivas e urbanísticas promovendo melhores margens do negócio",
    dimension: "Lucratividade",
    stakeholder: "CLIENTES (COMPRADORES DE IMÓVEIS)",
    expectation: "Receber o imóvel na data contratualmente definida, com qualidade conforme especificações do projeto.",
    requirement: "Cumprimento do cronograma de obras e especificações técnicas do projeto.",
    committee: "Engenharia/Desempenho construtivo/Comitê Técnicas de engenharia",
    indicator: "Entregas com ressalvas | %",
    preference: "MAIOR",
    target: 95,
    actual: 93,
    unit: "%"
  },
  {
    id: "omi-19",
    strategicObjective: "Entregar empreendimentos imobiliários de qualidade a custos competitivos, visando ser referência na utilização de tecnologia e melhores práticas construtivas e urbanísticas promovendo melhores margens do negócio",
    dimension: "Lucratividade",
    stakeholder: "CLIENTES (COMPRADORES DE IMÓVEIS)",
    expectation: "Receber o imóvel na data contratualmente definida, com qualidade conforme especificações do projeto.",
    requirement: "Cumprimento do cronograma de obras e especificações técnicas do projeto.",
    committee: "Marketing/Comitê Experiente do Cliente",
    indicator: "Prazo contratual | %",
    preference: "MAIOR",
    target: 98,
    actual: 100,
    unit: "%"
  },
  {
    id: "omi-20",
    strategicObjective: "Entregar empreendimentos imobiliários de qualidade a custos competitivos, visando ser referência na utilização de tecnologia e melhores práticas construtivas e urbanísticas promovendo melhores margens do negócio",
    dimension: "Lucratividade",
    stakeholder: "USUÁRIOS (MORADORES / OCUPANTES / INQUILINOS)",
    expectation: "Ter problemas técnicos solucionados dentro dos prazos definidos.",
    requirement: "Gestão eficaz do atendimento técnico pós-obra com foco na satisfação do cliente.",
    committee: "Desempenho construtivo",
    indicator: "NPS | Atendimento Pós Obra | NPS",
    preference: "MAIOR",
    target: 70,
    actual: 74,
    unit: "Score"
  },
  {
    id: "omi-21",
    strategicObjective: "Entregar empreendimentos imobiliários de qualidade a custos competitivos, visando ser referência na utilização de tecnologia e melhores práticas construtivas e urbanísticas promovendo melhores margens do negócio",
    dimension: "Lucratividade",
    stakeholder: "DIRETORES",
    expectation: "Sustentabilidade comercial e continuidade dos empreendimentos.",
    requirement: "Alcance das metas de vendas previstas para os empreendimentos.",
    committee: "Comercial/Comitê experiência do cliente",
    indicator: "Vendas Líquidas | Milhões R$",
    preference: "MAIOR",
    target: 100,
    actual: 108,
    unit: "Milhões R$"
  },
  {
    id: "omi-22",
    strategicObjective: "Entregar empreendimentos imobiliários de qualidade a custos competitivos, visando ser referência na utilização de tecnologia e melhores práticas construtivas e urbanísticas promovendo melhores margens do negócio",
    dimension: "Lucratividade",
    stakeholder: "DIRETORES",
    expectation: "Garantir a continuidade e o crescimento do portfólio de empreendimentos.",
    requirement: "Cumprimento do cronograma de lançamentos planejados.",
    committee: "Legalização/Corporativo",
    indicator: "VGL | Milhões R$",
    preference: "MAIOR",
    target: 250,
    actual: 280,
    unit: "Milhões R$"
  },
  {
    id: "omi-23",
    strategicObjective: "Entregar empreendimentos imobiliários de qualidade a custos competitivos, visando ser referência na utilização de tecnologia e melhores práticas construtivas e urbanísticas promovendo melhores margens do negócio",
    dimension: "Lucratividade",
    stakeholder: "DIRETORES",
    expectation: "Alcançar a rentabilidade prevista e o crescimento sustentável.",
    requirement: "Resultado econômico-financeiro dos projetos em conformidade com o planejado.",
    committee: "Comercial",
    indicator: "Margem dos Projetos | %",
    preference: "MAIOR",
    target: 20,
    actual: 19.5,
    unit: "%"
  },
  {
    id: "omi-24",
    strategicObjective: "Assegurar a sustentabilidade do plano de crescimento da empresa, garantindo a saúde financeira para lidar com problemas e aproveitar oportunidades de mercado",
    dimension: "Caixa",
    stakeholder: "DIRETORES",
    expectation: "Garantir sustentabilidade financeira dos empreendimentos.",
    requirement: "Geração de caixa operacional suficiente para viabilizar os empreendimentos.",
    committee: "Financeiro",
    indicator: "Geração de Caixa Operacional | %",
    preference: "MAIOR",
    target: 100,
    actual: 102.5,
    unit: "%"
  }
];

interface OmiDashboardProps {
  canEditDeadline: boolean;
}

export default function OmiDashboard({
  canEditDeadline
}: OmiDashboardProps) {

  console.log("OMI DASHBOARD RENDERIZOU");

  const [activeSubTab, setActiveSubTab] = useState<"indicators" | "actions">("indicators");

  const [items, setItems] = useState<OmiItem[]>(() => {
    const saved = localStorage.getItem("omi_dashboard_items_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return PRESET_OMI_ITEMS;
      }
    }
    return PRESET_OMI_ITEMS;
  });

  const [actionPlans, setActionPlans] = useState<OmiActionPlan[]>(() => {
  const saved = localStorage.getItem("omi_action_plans_v1");

  if (saved) {
    try {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn("Não foi possível carregar os planos OMI locais.");
    }
  }

  return PRESET_OMI_ACTION_PLANS;
});

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDimension, setSelectedDimension] = useState<string>("TODAS");
  const [selectedCommittee, setSelectedCommittee] = useState<string>("TODOS");
  const [selectedStakeholder, setSelectedStakeholder] = useState<string>("TODOS");

  // Planos de Ação Filters
  const [actionSearchTerm, setActionSearchTerm] = useState("");
  const [selectedActionCommittee, setSelectedActionCommittee] = useState<string>("TODOS");
  const [selectedActionStatus, setSelectedActionStatus] = useState<string>("TODOS");
  const [selectedActionResponsible, setSelectedActionResponsible] = useState<string>("TODOS");

  // Edit State
  const [editingItem, setEditingItem] = useState<OmiItem | null>(null);
  const [editingAction, setEditingAction] = useState<OmiActionPlan | null>(null);
  
  // Create State
  const [isCreating, setIsCreating] = useState(false);
  const [newObjective, setNewObjective] = useState("");
  const [newDimension, setNewDimension] = useState("Longevidade");
  const [newStakeholder, setNewStakeholder] = useState("");
  const [newExpectation, setNewExpectation] = useState("");
  const [newRequirement, setNewRequirement] = useState("");
  const [newCommittee, setNewCommittee] = useState("");
  const [newIndicator, setNewIndicator] = useState("");
  const [newPreference, setNewPreference] = useState<"MAIOR" | "MENOR">("MAIOR");
  const [newTarget, setNewTarget] = useState<number>(100);
  const [newActual, setNewActual] = useState<number>(100);
  const [newUnit, setNewUnit] = useState("%");

  // Create Action Plan State
  const [isCreatingAction, setIsCreatingAction] = useState(false);
  const [newActionCommittee, setNewActionCommittee] = useState("");
  const [newActionText, setNewActionText] = useState("");
  const [newActionResponsible, setNewActionResponsible] = useState("");
  const [newActionEmail, setNewActionEmail] = useState("");
  const [newActionDeadline, setNewActionDeadline] = useState("");
  const [newActionCompletionDate, setNewActionCompletionDate] = useState("");
  const [newActionStatus, setNewActionStatus] = useState<string>("No Prazo");
  const [isOmiLoaded, setIsOmiLoaded] = useState(false);  
  useEffect(() => {
    localStorage.setItem("omi_dashboard_items_v1", JSON.stringify(items));
  }, [items]);

useEffect(() => {
  localStorage.setItem("omi_dashboard_items_v1", JSON.stringify(items));
}, [items]);

useEffect(() => {
  async function loadOmiActionPlans() {
    console.log("[OMI] Iniciando carregamento");

    const data = await getOmiActionPlans();

    console.log("[OMI] Dados encontrados no Supabase:", data);
    console.log("[OMI] Planos atuais no navegador:", actionPlans.length);

    if (data && data.length > 0) {
      console.log("[OMI] Carregando planos existentes do Supabase");
      setActionPlans(data);
    } else if (data && data.length === 0) {
      console.log("[OMI] Tabela vazia. Enviando planos:", actionPlans.length);

      const result = await saveOmiActionPlans(actionPlans);

      console.log("[OMI] Resultado do salvamento:", result);

      if (!result.success) {
        console.error(
          "[OMI] Erro ao enviar carga inicial:",
          result.error
        );
      }
    }

    setIsOmiLoaded(true);
  }

  loadOmiActionPlans();
}, []);

useEffect(() => {
  if (!isOmiLoaded) return;

  localStorage.setItem(
    "omi_action_plans_v1",
    JSON.stringify(actionPlans)
  );

  async function savePlans() {
    const result = await saveOmiActionPlans(actionPlans);

    if (!result.success) {
      console.error(
        "Erro ao salvar planos OMI no Supabase:",
        result.error
      );
    }
  }

  savePlans();
}, [actionPlans, isOmiLoaded]);

  // Calculations
  const calculateAchievement = (item: OmiItem): number => {
    if (item.target === 0) return 100;
    
    let achievement = 0;
    if (item.preference === "MAIOR") {
      achievement = (item.actual / item.target) * 100;
    } else {
      // For MENOR, lower actual is better.
      // If actual is 0.5 and target is 1.0, achievement is 150% or capped/calculated.
      // Standard formula: Target / Actual * 100
      if (item.actual === 0) return 150;
      achievement = (item.target / item.actual) * 100;
    }
    
    return parseFloat(achievement.toFixed(1));
  };

  const getAchievementColorClass = (achievement: number): { bg: string, text: string, border: string } => {
    if (achievement >= 98) {
      return { bg: "bg-emerald-50/70", text: "text-emerald-700", border: "border-emerald-200" };
    } else if (achievement >= 88) {
      return { bg: "bg-amber-50/70", text: "text-amber-700", border: "border-amber-200" };
    } else {
      return { bg: "bg-rose-50/70", text: "text-rose-700", border: "border-rose-200" };
    }
  };

  const getDimensionBadgeClass = (dimension: string): string => {
    switch (dimension) {
      case "Longevidade":
        return "bg-sky-50 text-sky-700 border border-sky-200";
      case "Crescimento":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "Lucratividade":
        return "bg-amber-50 text-amber-700 border border-amber-250";
      case "Caixa":
        return "bg-violet-50 text-violet-700 border border-violet-200";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-200";
    }
  };

  const resetToPreset = () => {
    if (window.confirm("Deseja realmente redefinir a planilha OMI para os dados originais? Suas modificações serão limpas.")) {
      setItems(PRESET_OMI_ITEMS);
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.indicator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.stakeholder.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.expectation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.requirement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.committee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.strategicObjective.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDimension = selectedDimension === "TODAS" || item.dimension === selectedDimension;
    const matchesCommittee = selectedCommittee === "TODOS" || item.committee === selectedCommittee;
    const matchesStakeholder = selectedStakeholder === "TODOS" || item.stakeholder === selectedStakeholder;

    return matchesSearch && matchesDimension && matchesCommittee && matchesStakeholder;
  });

  // Extract unique filter lists
  const dimensions = ["Longevidade", "Crescimento", "Lucratividade", "Caixa"];
  const committees = Array.from(new Set(items.map(i => i.committee))).sort();
  const stakeholders = Array.from(new Set(items.map(i => i.stakeholder))).sort();

  // Stats
  const totalCount = filteredItems.length;
  const uniqueObjectivesCount = Array.from(new Set(filteredItems.map(i => i.strategicObjective))).length;
  const uniqueCommitteesCount = Array.from(new Set(filteredItems.map(i => i.committee))).length;
  const uniqueStakeholdersCount = Array.from(new Set(filteredItems.map(i => i.stakeholder))).length;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!editingItem) return;

    setItems(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
    setEditingItem(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndicator || !newObjective || !newStakeholder) {
      alert("Preencha todos os campos obrigatórios (*)");
      return;
    }

    const newItem: OmiItem = {
      id: "omi-custom-" + Date.now(),
      strategicObjective: newObjective,
      dimension: newDimension,
      stakeholder: newStakeholder.toUpperCase(),
      expectation: newExpectation,
      requirement: newRequirement,
      committee: newCommittee || "Geral",
      indicator: newIndicator,
      preference: newPreference,
      target: newTarget,
      actual: newActual,
      unit: newUnit
    };

    setItems(prev => [...prev, newItem]);
    setIsCreating(false);
    
    // reset form
    setNewObjective("");
    setNewStakeholder("");
    setNewExpectation("");
    setNewRequirement("");
    setNewCommittee("");
    setNewIndicator("");
    setNewTarget(100);
    setNewActual(100);
    setNewUnit("%");
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Deseja realmente excluir este indicador OMI?")) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Filter action plans
  const filteredActionPlans = actionPlans.filter(action => {
    const matchesSearch = 
      action.action.toLowerCase().includes(actionSearchTerm.toLowerCase()) ||
      action.responsible.toLowerCase().includes(actionSearchTerm.toLowerCase()) ||
      action.email.toLowerCase().includes(actionSearchTerm.toLowerCase());

    const matchesCommittee = selectedActionCommittee === "TODOS" || action.committee === selectedActionCommittee;
    const matchesStatus = selectedActionStatus === "TODOS" || action.status === selectedActionStatus;
    const matchesResponsible = selectedActionResponsible === "TODOS" || action.responsible === selectedActionResponsible;

    return matchesSearch && matchesCommittee && matchesStatus && matchesResponsible;
  });

  const actionCommittees = Array.from(new Set(actionPlans.map(a => a.committee))).sort();
  const actionResponsibles = Array.from(new Set(actionPlans.map(a => a.responsible))).sort();
  const actionStatuses = ["No Prazo", "Concluído", "Atrasado", "Sem Prazo"];

  // Action Stats
  const totalActionsCount = filteredActionPlans.length;
  const completedActionsCount = filteredActionPlans.filter(a => a.status === "Concluído").length;
  const onTimeActionsCount = filteredActionPlans.filter(a => a.status === "No Prazo").length;
  const delayedActionsCount = filteredActionPlans.filter(a => a.status === "Atrasado" || a.status === "Sem Prazo").length;

  const handleSaveActionEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAction) return;

    setActionPlans(prev => prev.map(act => act.id === editingAction.id ? editingAction : act));
    setEditingAction(null);
  };

  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionText || !newActionCommittee || !newActionResponsible) {
      alert("Preencha todos os campos obrigatórios (*)");
      return;
    }

    const newAct: OmiActionPlan = {
      id: "omi-act-custom-" + Date.now(),
      committee: newActionCommittee,
      action: newActionText,
      responsible: newActionResponsible,
      email: newActionEmail,
      deadline: newActionDeadline || "Sem Prazo",
      completionDate: newActionCompletionDate,
      status: newActionStatus
    };

    setActionPlans(prev => [...prev, newAct]);
    setIsCreatingAction(false);

    // reset form
    setNewActionCommittee("");
    setNewActionText("");
    setNewActionResponsible("");
    setNewActionEmail("");
    setNewActionDeadline("");
    setNewActionCompletionDate("");
    setNewActionStatus("No Prazo");
  };

  const handleDeleteAction = (id: string) => {
    if (window.confirm("Deseja realmente excluir este Plano de Ação OMI?")) {
      setActionPlans(prev => prev.filter(act => act.id !== id));
    }
  };

  const resetActionsToPreset = () => {
    if (window.confirm("Deseja realmente redefinir a lista de ações OMI para os dados originais do PDF? Suas modificações locais serão apagadas.")) {
      setActionPlans(PRESET_OMI_ACTION_PLANS);
    }
  };

  const exportActionsToCSV = () => {
    const headers = ["ID", "Painel/Comite", "Acao", "Responsavel", "E-mail", "Prazo", "Data de Conclusao", "Status"];
    const rows = filteredActionPlans.map(act => [
      act.id,
      `"${act.committee.replace(/"/g, '""')}"`,
      `"${act.action.replace(/"/g, '""')}"`,
      `"${act.responsible.replace(/"/g, '""')}"`,
      `"${act.email.replace(/"/g, '""')}"`,
      act.deadline,
      act.completionDate,
      act.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "acoes_omi_aclf_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider">
              {activeSubTab === "indicators" ? "Mapeamento Corporativo" : "Gestão 5W2H"}
            </span>
            <span className="text-slate-400 font-mono text-[10px]">Elaborador: Thamiris Eduarda • Aprovador: Fernando Fink</span>
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5.5 h-5.5 text-indigo-505" /> 
            {activeSubTab === "indicators" 
              ? "OMI — Objetivos, Metas e Indicadores" 
              : "Planos de Ação OMI — Metodologia 5W2H"}
          </h2>
          <p className="text-slate-550 text-xs font-normal">
            {activeSubTab === "indicators" 
              ? "Cruzamento sistêmico de dimensões estratégicas, expectativas de partes interessadas, requisitos e preferência de controle de performance da ACLF."
              : "Planos de ação estruturados sob a ótica 5W2H extraídos do planejamento estratégico oficial para mitigação e alcance das metas corporativas."}
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          {activeSubTab === "indicators" ? (
            <>
              <button
                onClick={() => setIsCreating(true)}
                className="p-2 px-3 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-slate-900 transition-all cursor-pointer shadow-3xs"
              >
                <Plus className="w-4 h-4" /> Novo Indicador
              </button>
              <button
                onClick={resetToPreset}
                className="p-2 px-3 border border-slate-200 text-slate-600 bg-white font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-slate-50 transition-all cursor-pointer shadow-3xs"
                title="Redefinir para dados de fábrica"
              >
                Reconfigurar Padrão
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsCreatingAction(true)}
              className="p-2 px-3 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-slate-900 transition-all cursor-pointer shadow-3xs"
            >
              <Plus className="w-4 h-4" /> Novo Plano de Ação
            </button>
          )}
        </div>
      </div>

      {/* SUB-TABS SELECTOR */}
      <div className="flex border-b border-slate-200 gap-6 print:hidden -mt-2">
        <button
          onClick={() => setActiveSubTab("indicators")}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeSubTab === "indicators" 
              ? "border-indigo-600 text-indigo-600 font-black" 
              : "border-transparent text-slate-400 hover:text-slate-650"
          }`}
        >
          Indicadores OMI ({totalCount})
        </button>
        <button
          onClick={() => setActiveSubTab("actions")}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeSubTab === "actions" 
              ? "border-indigo-600 text-indigo-600 font-black" 
              : "border-transparent text-slate-400 hover:text-slate-650"
          }`}
        >
          Planos de Ação 5W2H ({actionPlans.length})
        </button>
      </div>

      {/* INDICATORS TAB CONTENT */}
      {activeSubTab === "indicators" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* STATS OVERVIEW PANEL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-3xs space-y-2 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Objetivos Estratégicos</span>
                <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg"><Target className="w-4 h-4" /></span>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-2xl font-black text-slate-800">{uniqueObjectivesCount}</h3>
                <span className="text-[10px] font-bold text-slate-400 block">Diretrizes de longo prazo mapeadas</span>
              </div>
            </div>

            <div className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-3xs space-y-2 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Indicadores Ativos</span>
                <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg"><FileSpreadsheet className="w-4 h-4" /></span>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-2xl font-black text-slate-800">{totalCount}</h3>
                <span className="text-[10px] font-bold text-slate-400 block">Parâmetros de controle de metas</span>
              </div>
            </div>

            <div className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-3xs space-y-2 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Painéis & Comitês</span>
                <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg"><Building className="w-4 h-4" /></span>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-2xl font-black text-slate-800">{uniqueCommitteesCount}</h3>
                <span className="text-[10px] font-bold text-slate-400 block">Fóruns de governança integrados</span>
              </div>
            </div>

            <div className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-3xs space-y-2 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Partes Interessadas</span>
                <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg"><Users className="w-4 h-4" /></span>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-2xl font-black text-slate-800">{uniqueStakeholdersCount}</h3>
                <span className="text-[10px] font-bold text-slate-400 block">Grupos de interesse atendidos</span>
              </div>
            </div>
          </div>

          {/* SEARCH AND FILTERS */}
          <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl flex flex-col gap-3.5 print:hidden">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Buscar por indicador, expectativa, requisito, comitê..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs p-3 pl-10 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                />
              </div>

              {/* Dimension Selector */}
              <div className="w-full md:w-48">
                <select
                  value={selectedDimension}
                  onChange={(e) => setSelectedDimension(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                >
                  <option value="TODAS">Dimensão: Todas</option>
                  {dimensions.map(dim => (
                    <option key={dim} value={dim}>{dim}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Committee Filter */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Painel / Comitê</label>
                <select
                  value={selectedCommittee}
                  onChange={(e) => setSelectedCommittee(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                >
                  <option value="TODOS">Todos os Comitês</option>
                  {committees.map(comm => (
                    <option key={comm} value={comm}>{comm}</option>
                  ))}
                </select>
              </div>

              {/* Stakeholder Filter */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Parte Interessada</label>
                <select
                  value={selectedStakeholder}
                  onChange={(e) => setSelectedStakeholder(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                >
                  <option value="TODOS">Todas as Partes Interessadas</option>
                  {stakeholders.map(stk => (
                    <option key={stk} value={stk}>{stk}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* DATA GRID TABLE */}
          <div className="bg-white border border-slate-150 rounded-2xl shadow-3xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="py-3 px-4 w-[360px]">Objetivo Estratégico</th>
                    <th className="py-3 px-4 w-28">Dimensão</th>
                    <th className="py-3 px-4 w-40">Parte Interessada</th>
                    <th className="py-3 px-4 min-w-[340px]">Expectativa & Requisito</th>
                    <th className="py-3 px-4 w-40">Painel / Comitê</th>
                    <th className="py-3 px-4 min-w-[180px]">Indicador</th>
                    <th className="py-3 px-4 text-center w-28">Meta</th>
                    <th className="py-3 px-4 text-center w-16 print:hidden">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-normal text-slate-600">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/45 transition-colors group">
                          {/* Strategic Objective */}
                          <td className="py-3.5 px-4 font-semibold text-slate-700 leading-normal text-[10px] max-w-[360px] break-words">
                            {item.strategicObjective}
                          </td>

                          {/* Dimension */}
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg ${getDimensionBadgeClass(item.dimension)}`}>
                              {item.dimension}
                            </span>
                          </td>

                          {/* Stakeholder */}
                          <td className="py-3.5 px-4 font-bold text-slate-700 text-[10px] uppercase leading-normal">
                            {item.stakeholder}
                          </td>

                          {/* Expectation & Requirement */}
                          <td className="py-3.5 px-4 space-y-1.5 max-w-xl">
                            <p className="text-[11px] leading-relaxed"><strong className="text-slate-400 uppercase text-[9px] tracking-wide block">Expectativa:</strong> {item.expectation}</p>
                            <p className="text-[11px] leading-relaxed text-slate-500 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100"><strong className="text-indigo-400 uppercase text-[8px] tracking-wide block">Requisito:</strong> {item.requirement}</p>
                          </td>

                          {/* Committee */}
                          <td className="py-3.5 px-4 text-[11px] font-medium text-slate-600">
                            {item.committee}
                          </td>

                          {/* Indicator */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span className="font-extrabold text-slate-850 text-[11px] block leading-tight">{item.indicator}</span>
                              <span className="text-[9px] font-black uppercase text-indigo-650 bg-indigo-50/45 px-1.5 py-0.5 rounded border border-indigo-150/40">
                                Pref: {item.preference}
                              </span>
                            </div>
                          </td>

                          {/* Target */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                            {item.target} <span className="text-[9px] text-slate-400 font-normal">{item.unit}</span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingItem(item)}
                                className="p-1 text-slate-500 hover:text-indigo-650 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                                title="Editar Parâmetros OMI"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-medium italic">
                        Nenhum indicador OMI encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ACTION PLANS TAB CONTENT */}
      {activeSubTab === "actions" && (
        <OmiActionPlansTab 
          actionPlans={actionPlans} 
          setActionPlans={setActionPlans} 
          isCreatingAction={isCreatingAction} 
          setIsCreatingAction={setIsCreatingAction}
          canEditDeadline={canEditDeadline} 
        />
      )}

      {/* EDIT MODAL DIALOG */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-150 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 p-5 border-b border-slate-150 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 block">Mapeamento Corporativo</span>
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                  <Target className="w-4.5 h-4.5 text-indigo-600" /> Editar Indicador OMI
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 hover:bg-slate-200/60 rounded-lg transition-all text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Objetivo Estratégico *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex: Assegurar a longevidade do negócio..."
                  value={editingItem.strategicObjective}
                  onChange={(e) => setEditingItem({ ...editingItem, strategicObjective: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dimensão Estratégica</label>
                  <select
                    value={editingItem.dimension}
                    onChange={(e) => setEditingItem({ ...editingItem, dimension: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                  >
                    <option value="Longevidade">Longevidade</option>
                    <option value="Crescimento">Crescimento</option>
                    <option value="Lucratividade">Lucratividade</option>
                    <option value="Caixa">Caixa</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Parte Interessada *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: DIRETORIA..."
                    value={editingItem.stakeholder}
                    onChange={(e) => setEditingItem({ ...editingItem, stakeholder: e.target.value.toUpperCase() })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Expectativa</label>
                <input
                  type="text"
                  placeholder="Ex: Receber pagamentos dentro do prazo..."
                  value={editingItem.expectation}
                  onChange={(e) => setEditingItem({ ...editingItem, expectation: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Requisito</label>
                <input
                  type="text"
                  placeholder="Ex: Cumprimento dos prazos contratuais..."
                  value={editingItem.requirement}
                  onChange={(e) => setEditingItem({ ...editingItem, requirement: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Painel / Comitê</label>
                  <input
                    type="text"
                    placeholder="Ex: Engenharia, Comercial..."
                    value={editingItem.committee}
                    onChange={(e) => setEditingItem({ ...editingItem, committee: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nome do Indicador *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: NPS Geral..."
                    value={editingItem.indicator}
                    onChange={(e) => setEditingItem({ ...editingItem, indicator: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Preferência</label>
                  <select
                    value={editingItem.preference}
                    onChange={(e) => setEditingItem({ ...editingItem, preference: e.target.value as "MAIOR" | "MENOR" })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                  >
                    <option value="MAIOR">MAIOR</option>
                    <option value="MENOR">MENOR</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Meta</label>
                  <input
                    type="number"
                    step="any"
                    value={editingItem.target}
                    onChange={(e) => setEditingItem({ ...editingItem, target: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Unidade de Medida</label>
                  <input
                    type="text"
                    placeholder="Ex: %, Score, Milhões R$, Taxa..."
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 bg-white font-bold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-slate-900 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE INDICATOR MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-150 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 p-5 border-b border-slate-150 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 block">Novo Parâmetro Corporativo</span>
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                  <Plus className="w-4.5 h-4.5 text-indigo-600" /> Adicionar Indicador OMI Customizado
                </h3>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1 hover:bg-slate-200/60 rounded-lg transition-all text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Objetivo Estratégico *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex: Assegurar a longevidade do negócio, sendo referência..."
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dimensão Estratégica</label>
                  <select
                    value={newDimension}
                    onChange={(e) => setNewDimension(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                  >
                    <option value="Longevidade">Longevidade</option>
                    <option value="Crescimento">Crescimento</option>
                    <option value="Lucratividade">Lucratividade</option>
                    <option value="Caixa">Caixa</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Parte Interessada *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: DIRETORIA, CLIENTES, etc..."
                    value={newStakeholder}
                    onChange={(e) => setNewStakeholder(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Expectativa</label>
                <input
                  type="text"
                  placeholder="Ex: Receber pagamentos dentro dos prazos acordados..."
                  value={newExpectation}
                  onChange={(e) => setNewExpectation(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Requisito</label>
                <input
                  type="text"
                  placeholder="Ex: Cumprimento dos prazos contratuais de pagamento..."
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Painel / Comitê</label>
                  <input
                    type="text"
                    placeholder="Ex: Engenharia, Comercial..."
                    value={newCommittee}
                    onChange={(e) => setNewCommittee(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nome do Indicador *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: NPS Geral, Margem, Vendas..."
                    value={newIndicator}
                    onChange={(e) => setNewIndicator(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Preferência</label>
                  <select
                    value={newPreference}
                    onChange={(e) => setNewPreference(e.target.value as "MAIOR" | "MENOR")}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                  >
                    <option value="MAIOR">MAIOR</option>
                    <option value="MENOR">MENOR</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Meta</label>
                  <input
                    type="number"
                    step="any"
                    value={newTarget}
                    onChange={(e) => setNewTarget(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Unidade de Medida</label>
                <input
                  type="text"
                  placeholder="Ex: %, Score, Milhões R$, Taxa..."
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 bg-white font-bold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-slate-900 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  Criar Indicador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
