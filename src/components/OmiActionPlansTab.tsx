import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Clock, 
  Users, 
  Building, 
  FileText, 
  BookmarkCheck, 
  AlertCircle, 
  Mail, 
  Calendar,
  CalendarOff,
  Filter
} from "lucide-react";
  

import {
  saveOmiActionPlans,
  deleteOmiActionPlanFromDb
} from "../lib/supabase";

export interface OmiActionPlan {
  id: string;
  committee: string;
  action: string;
  responsible: string;
  email: string;
  deadline: string;
  completionDate: string;
  status: "No Prazo" | "Concluído" | "Atrasado" | "Sem Prazo" | string;
}

export function autoCalculateStatus(
  deadline: string,
  completionDate: string,
  manualStatus?: string
): "No Prazo" | "Concluído" | "Atrasado" | "Sem Prazo" {
  if ((completionDate && completionDate.trim() !== "") || manualStatus === "Concluído") {
    return "Concluído";
  }

  const cleanDeadline = deadline ? deadline.trim() : "";

  if (!cleanDeadline || cleanDeadline.toLowerCase() === "sem prazo") {
    return "Sem Prazo";
  }

  // Regex to match DD/MM/YYYY
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = cleanDeadline.match(dateRegex);

  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // Months are 0-indexed in JS Date
    const year = parseInt(match[3], 10);

    const deadlineDate = new Date(year, month, day, 23, 59, 59);
    const today = new Date();

    if (today.getTime() > deadlineDate.getTime()) {
      return "Atrasado";
    } else {
      return "No Prazo";
    }
  }

  if (manualStatus === "Atrasado" || manualStatus === "Sem Prazo") {
    return manualStatus as any;
  }
  
  return "No Prazo";
}

export const PRESET_OMI_ACTION_PLANS: OmiActionPlan[] = [
  {
    id: "omi-act-1",
    committee: "Experiência do Cliente",
    action: "Revisar processos de entrega de empreendimentos com o Pós Obra (entrega e garantia)",
    responsible: "Camila e Taciana",
    email: "camilapeixoto@aclf.com.br; tacianafarias@aclf.com.br",
    deadline: "31/08/2026",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-2",
    committee: "Pessoas e Cultura/Gente",
    action: "Cumprir plano de ação do resultado da pesquisa de clima 2025",
    responsible: "Ana Cristina",
    email: "anacristina@aclf.com.br",
    deadline: "18/09/2026",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-3",
    committee: "Pessoas e Cultura/Gente",
    action: "Avaliar o resultado trimestral do plano de ação e das ações de endomarketing",
    responsible: "Ana Cristina",
    email: "anacristina@aclf.com.br",
    deadline: "30/04/2026",
    completionDate: "19/06/2026",
    status: "Concluído"
  },
  {
    id: "omi-act-4",
    committee: "Engenharia/SGI",
    action: "Montar calendário das caminhadas de Segurança (Participantes e obra a ser inspecionada)",
    responsible: "José Henrique e Coordenadores",
    email: "josehenrique@aclf.com.br; theognes@aclf.com.br; andrepessoa@aclf.com.br; camilomaldonado@aclf.com.br",
    deadline: "30/01/2026",
    completionDate: "11/03/2026",
    status: "Concluído"
  },
  {
    id: "omi-act-5",
    committee: "Engenharia/SGI",
    action: "Iniciar rotina de caminhadas de segurança",
    responsible: "José Henrique e Coordenadores",
    email: "josehenrique@aclf.com.br; theognes@aclf.com.br; andrepessoa@aclf.com.br; camilomaldonado@aclf.com.br",
    deadline: "13/04/2026",
    completionDate: "13/04/2026",
    status: "Concluído"
  },
  {
    id: "omi-act-6",
    committee: "Engenharia/SGI",
    action: "Apresentar os desvios identificados nas caminhadas nas reuniões semanais",
    responsible: "Coordenadores",
    email: "theognes@aclf.com.br; andrepessoa@aclf.com.br; camilomaldonado@aclf.com.br",
    deadline: "02/02/2026",
    completionDate: "13/04/2026",
    status: "Concluído"
  },
  {
    id: "omi-act-7",
    committee: "Financeiro",
    action: "Implantar provisão mensal para contratos recorrentes nas áreas corporativas",
    responsible: "Suellen Severo",
    email: "suellensevero@aclf.com.br",
    deadline: "01/07/2026",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-8",
    committee: "Financeiro",
    action: "Aumentar a previsibilidade dos desembolsos através do levantamento antecipado de boletos registrados contra os CNPJs do grupo, via DDA",
    responsible: "Suellen Severo",
    email: "suellensevero@aclf.com.br",
    deadline: "01/07/2026",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-9",
    committee: "Financeiro",
    action: "Padronizar sistemática de adiantamentos e reembolsos",
    responsible: "Suellen Severo",
    email: "suellensevero@aclf.com.br",
    deadline: "01/07/2026",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-10",
    committee: "Pessoas e Cultura/Gente",
    action: "Realizar reunião de alinhamento com os líderes para estruturação dos PDIs",
    responsible: "Ana Cristina",
    email: "anacristina@aclf.com.br",
    deadline: "30/04/2026",
    completionDate: "30/04/2026",
    status: "Concluído"
  },
  {
    id: "omi-act-11",
    committee: "Pessoas e Cultura/Gente",
    action: "Compartilhar competências definidas nas reuniões para construção do PDI",
    responsible: "Ana Cristina",
    email: "anacristina@aclf.com.br",
    deadline: "30/04/2026",
    completionDate: "30/04/2026",
    status: "Concluído"
  },
  {
    id: "omi-act-12",
    committee: "Pessoas e Cultura/Gente",
    action: "Definir ritos, datas e realizar acompanhamento bimestral",
    responsible: "Ana Cristina",
    email: "anacristina@aclf.com.br",
    deadline: "30/04/2026",
    completionDate: "30/04/2026",
    status: "Concluído"
  },
  {
    id: "omi-act-13",
    committee: "Gestão Estratégica/Comitê de Tecnologia",
    action: "Realizar capacitação em Inteligência Artificial",
    responsible: "Juliana",
    email: "julianamonteiro@aclf.com.br",
    deadline: "31/07/2026",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-14",
    committee: "Gestão Estratégica/Comitê de Tecnologia",
    action: "Realizar ciclo de programa de inovação com foco em soluções digitais",
    responsible: "Juliana",
    email: "julianamonteiro@aclf.com.br",
    deadline: "30/09/2026",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-15",
    committee: "Gestão Estratégica/Comitê de Tecnologia",
    action: "Contratar nova parceria estratégica para desenvolvimento e implantação da automação das atividades operacionais",
    responsible: "Joeides Paz",
    email: "joeidespaz@aclf.com.br",
    deadline: "15/05/2026",
    completionDate: "",
    status: "Atrasado"
  },
  {
    id: "omi-act-16",
    committee: "Gestão Estratégica/Comitê de Tecnologia",
    action: "Realizar estudo e avaliação de ferramentas de IA corporativa para apoiar produtividade e eficiência dos processos internos da ACLF",
    responsible: "Joeides Paz",
    email: "joeidespaz@aclf.com.br",
    deadline: "15/04/2026",
    completionDate: "12/05/2026",
    status: "Concluído"
  },
  {
    id: "omi-act-17",
    committee: "Engenharia",
    action: "Implantação da caminhada do SGI para avaliar a resolução das não Conformidades",
    responsible: "José Henrique",
    email: "josehenrique@aclf.com.br",
    deadline: "30/04/2026",
    completionDate: "30/04/2026",
    status: "Concluído"
  },
  {
    id: "omi-act-18",
    committee: "Legalização",
    action: "Criar o cronograma de Ações Mitigatórias",
    responsible: "Bárbara",
    email: "barbaraoliveira@aclf.com.br",
    deadline: "Sem Prazo",
    completionDate: "",
    status: "Sem Prazo"
  },
  {
    id: "omi-act-19",
    committee: "Engenharia/SGI",
    action: "Implantar equipamentos para captar água da chuva, com o objetivo de utilizá-la em atividades que não exijam uso de água potável",
    responsible: "Coordenadores de Obra",
    email: "theognes@aclf.com.br; andrepessoa@aclf.com.br; camilomaldonado@aclf.com.br",
    deadline: "30/12/2026",
    completionDate: "30/05/2026",
    status: "Concluído"
  },
  {
    id: "omi-act-20",
    committee: "Engenharia/SGI",
    action: "Capacitação e reciclagem com foco no aprimoramento das ações voltadas para o atendimento dos índices previstos pela organização",
    responsible: "Laura e Jessica",
    email: "laura@aclf.com.br; jessicasantana@aclf.com.br",
    deadline: "05/06/2026",
    completionDate: "29/05/2026",
    status: "Concluído"
  },
  {
    id: "omi-act-21",
    committee: "Engenharia/SGI",
    action: "Trabalhar conjuntamente com o setor de Planejamento as três principais fontes de desperdício do Lean Construction, agregando as ações e dinâmicas ao longo do ano, a exemplo da Semana da Qualidade, Semana do Meio Ambiente, entre outras",
    responsible: "Laura e Jessica",
    email: "laura@aclf.com.br; jessicasantana@aclf.com.br",
    deadline: "15/05/2026",
    completionDate: "12/06/2026",
    status: "Concluído"
  },
  {
    id: "omi-act-22",
    committee: "Engenharia/SGI",
    action: "Apoiar as áreas e processos no que diz respeito ao consumo consciente (quadros de gestão à vista, placas educativas)",
    responsible: "Laura e Jessica",
    email: "laura@aclf.com.br; jessicasantana@aclf.com.br",
    deadline: "05/06/2026",
    completionDate: "12/06/2026",
    status: "Concluído"
  },
  {
    id: "omi-act-23",
    committee: "SGI",
    action: "Realizar monitoramentos periódicos dos processos envolvidos no tocante à certificação do Selo Azul",
    responsible: "José Henrique",
    email: "josehenrique@aclf.com.br",
    deadline: "30/12/2026",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-24",
    committee: "SGI",
    action: "Acompanhar semanalmente, no momento do check-in do SGI, as ações em curso para atendimento das certificações existentes da organização",
    responsible: "José Henrique",
    email: "josehenrique@aclf.com.br",
    deadline: "30/12/2026",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-25",
    committee: "Legalização",
    action: "Assegurar o alinhamento estratégico para a regularização de terrenos dos lançamentos previstos 2026-2028",
    responsible: "Bárbara",
    email: "barbaraoliveira@aclf.com.br",
    deadline: "Contínuo",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-26",
    committee: "Comercial",
    action: "Monitorar mensalmente o Plano de Vendas pactuado com a Caixa, com análise de realizado x meta, e projeção de enquadramento",
    responsible: "Kysia",
    email: "kysia@aclf.com.br",
    deadline: "Mensal",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-27",
    committee: "Comercial",
    action: "Definir rotina para suspender tabela de venda direta em períodos estratégicos da obra para garantir aderência ao plano associativo",
    responsible: "Kysia",
    email: "kysia@aclf.com.br",
    deadline: "Pontual",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-28",
    committee: "Pós Obra",
    action: "Concluir o reforço da equipe de Atendimento Pós-Obra",
    responsible: "Bruno",
    email: "brunoguedes@aclf.com.br",
    deadline: "30/12/2026",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-29",
    committee: "Pós Obra",
    action: "Capacitar a equipe no padrão de atendimento vigente",
    responsible: "Bárbara",
    email: "barbaraoliveira@aclf.com.br",
    deadline: "31/12/2026",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-30",
    committee: "Pós Obra",
    action: "Validar a conformidade dos registros e procedimentos do atendimento pós-obra",
    responsible: "Bruno",
    email: "brunoguedes@aclf.com.br",
    deadline: "01/01/2027",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-31",
    committee: "Comercial",
    action: "Melhorar rotina semanal de gestão por funil (leads, propostas, visitas e fechamentos) com meta diária por imobiliária e corretor com acompanhamento individual ( house aclf )",
    responsible: "Suellen Severo",
    email: "suellensevero@aclf.com.br",
    deadline: "29/12/2026",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-32",
    committee: "Legalização",
    action: "Estabelecer rotina de antecipar processos para garantir que as licenças e autorizações seja emitidas em prazo factível previsto para lançamento",
    responsible: "Suellen Severo",
    email: "suellensevero@aclf.com.br",
    deadline: "Contínuo",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-33",
    committee: "Planejamento/Comercial/Obra",
    action: "Estabelecer rotina para utilizar o comitê de vendas para discutir preço e margem por empreendimento, avaliando descontos concedidos, perfil de venda e impacto na rentabilidade antes de qualquer ajuste de tabela",
    responsible: "Suellen Severo",
    email: "suellensevero@aclf.com.br",
    deadline: "29/12/2026",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-34",
    committee: "Financeiro",
    action: "Criar dashboard de acompanhamento pela Diretoria para apoiar nas decisões",
    responsible: "Suellen Severo",
    email: "suellensevero@aclf.com.br",
    deadline: "30/06/2026",
    completionDate: "",
    status: "Atrasado"
  },
  {
    id: "omi-act-35",
    committee: "Financeiro",
    action: "Implantar plano de redução da inadimplência",
    responsible: "Suellen Severo",
    email: "suellensevero@aclf.com.br",
    deadline: "30/08/2026",
    completionDate: "",
    status: "No Prazo"
  },
  {
    id: "omi-act-36",
    committee: "Financeiro",
    action: "Adaptar o processo de gestão das previsões financeiras, originadas in Suprimentos, para que as ordens de compra sejam registadas no ERP com o cronograma de desembolso de acordo com as condições comerciais negociadas com o fornecedor",
    responsible: "Suellen Severo",
    email: "suellensevero@aclf.com.br",
    deadline: "30/09/2026",
    completionDate: "",
    status: "No Prazo"
  }
];



  // Filter acti
interface OmiActionPlansTabProps {
  actionPlans: OmiActionPlan[];
  setActionPlans: React.Dispatch<React.SetStateAction<OmiActionPlan[]>>;
  isCreatingAction: boolean;
  setIsCreatingAction: (val: boolean) => void;
  canEditDeadline: boolean;
}

export default function OmiActionPlansTab({
  actionPlans,
  setActionPlans,
  isCreatingAction,
  setIsCreatingAction,
  canEditDeadline
}: OmiActionPlansTabProps) {

  useEffect(() => {
  let updated = false;

  const newPlans = actionPlans.map(act => {
    const computed = autoCalculateStatus(
      act.deadline,
      act.completionDate,
      act.status
    );

    if (computed !== act.status) {
      updated = true;
      return { ...act, status: computed };
    }

    return act;
  });

  if (updated) {
    setActionPlans(newPlans);
  }
}, []);

  // Planos de Ação Filters
  const [actionSearchTerm, setActionSearchTerm] = useState("");
  const [selectedActionCommittee, setSelectedActionCommittee] = useState<string>("TODOS");
  const [selectedActionStatus, setSelectedActionStatus] = useState<string>("TODOS");
  const [selectedActionResponsible, setSelectedActionResponsible] = useState<string>("TODOS");

  // Edit State
  const [editingAction, setEditingAction] = useState<OmiActionPlan | null>(null);


  const [isSendingReminders, setIsSendingReminders] = useState(false);
const [reminderResult, setReminderResult] = useState<{
  sender: string;
  overdueActionsCount: number;
  emailsCount: number;
  emails: Array<{
    to: string;
    responsible: string;
    subject: string;
    actionsCount: number;
    html: string; 
  }>;
} | null>(null);

  // Create Action Plan Form Fields
  const [newActionCommittee, setNewActionCommittee] = useState("");
  const [newActionText, setNewActionText] = useState("");
  const [newActionResponsible, setNewActionResponsible] = useState("");
  const [newActionEmail, setNewActionEmail] = useState("");
  const [newActionDeadline, setNewActionDeadline] = useState("");

  const [newActionCompletionDate, setNewActionCompletionDate] = useState("");
  const [newActionStatus, setNewActionStatus] = useState("No Prazo");

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
  const delayedActionsCount = filteredActionPlans.filter(a => a.status === "Atrasado").length;
  const noDeadlineActionsCount = filteredActionPlans.filter(a => a.status === "Sem Prazo").length;

const handleSaveActionEdit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingAction) return;

  const finalStatus = autoCalculateStatus(
    editingAction.deadline,
    editingAction.completionDate,
    editingAction.status
  );

  const updatedAction = {
    ...editingAction,
    status: finalStatus
  };

  const updatedPlans = actionPlans.map(act =>
    act.id === editingAction.id ? updatedAction : act
  );

  setActionPlans(updatedPlans);

  await saveOmiActionPlans(updatedPlans);

  setEditingAction(null);
};

  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionText || !newActionCommittee || !newActionResponsible) {
      alert("Preencha todos os campos obrigatórios (*)");
      return;
    }

    const finalStatus = autoCalculateStatus(newActionDeadline, newActionCompletionDate, newActionStatus);

    const newAct: OmiActionPlan = {
      id: "omi-act-custom-" + Date.now(),
      committee: newActionCommittee,
      action: newActionText,
      responsible: newActionResponsible,
      email: newActionEmail,
      deadline: newActionDeadline || "Sem Prazo",
      completionDate: newActionCompletionDate,
      status: finalStatus
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

  
  const handleSendReminders = async () => {
  const delayedActions = actionPlans.filter(
    action =>
      action.status === "Atrasado" &&
      action.completionDate.trim() === "" &&
      action.email.trim() !== ""
  );

  if (delayedActions.length === 0) {
    alert("Nenhuma ação atrasada com e-mail cadastrado foi encontrada.");
    return;
  }

  const confirmed = window.confirm(
    `Foram encontradas ${delayedActions.length} ação(ões) atrasada(s).\n\nDeseja gerar a simulação dos lembretes por e-mail?`
  );

  if (!confirmed) {
    return;
  }

  try {
    setIsSendingReminders(true);
    setReminderResult(null);

    const response = await fetch("/api/emails/send-reminders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        actionPlans: actionPlans.map(action => ({
          id: action.id,
          title: action.action,
          action: action.action,
          description: action.action,
          responsible: action.responsible,
          responsibleEmail: action.email,
          deadline: action.deadline,
          status: action.status,
          completionDate: action.completionDate
        }))
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Não foi possível preparar os lembretes."
      );
    }

    setReminderResult(data);
  } catch (error) {
    console.error("Erro ao simular lembretes:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Ocorreu um erro ao simular os lembretes."
    );
  } finally {
    setIsSendingReminders(false);
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ACTION TOOLBAR */}
      <div className="flex justify-end items-center gap-2 print:hidden -mt-2">

        {canEditDeadline && (
  <button
    type="button"
    onClick={handleSendReminders}
    disabled={isSendingReminders}
    className="p-1.5 px-3 border border-indigo-200 text-indigo-700 bg-indigo-50 font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-indigo-100 transition-all cursor-pointer shadow-3xs disabled:opacity-50 disabled:cursor-not-allowed"
    title="Gerar simulação dos lembretes das ações atrasadas"
  >
    <Mail className="w-3.5 h-3.5" />

    {isSendingReminders
      ? "Preparando..."
      : "Simular Lembretes"}
  </button>
)}

        <button
          onClick={exportActionsToCSV}
          className="p-1.5 px-3 border border-slate-200 text-slate-600 bg-white font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-slate-50 transition-all cursor-pointer shadow-3xs"
          title="Exportar plano de ações consolidado para Excel/CSV"
        >
          <Download className="w-3.5 h-3.5 text-indigo-600" /> Exportar Planilha
        </button>
        <button
          onClick={resetActionsToPreset}
          className="p-1.5 px-3 border border-slate-200 text-slate-650 bg-white font-bold text-xs rounded-xl flex items-center gap-1.5 hover:bg-slate-50 transition-all cursor-pointer shadow-3xs"
          title="Redefinir lista de ações para os dados originais do PDF"
        >
          Reconfigurar Ações OMI
        </button>
      </div>

      {reminderResult && (
  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 print:hidden">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-indigo-700" />

          <h3 className="text-sm font-extrabold text-indigo-900">
            Simulação de lembretes concluída
          </h3>
        </div>

        <p className="text-xs text-indigo-700 mt-1">
          {reminderResult.overdueActionsCount} ação(ões) atrasada(s) geraram{" "}
          {reminderResult.emailsCount} e-mail(s).
        </p>

        <p className="text-[10px] text-indigo-600 mt-1">
          Remetente configurado: {reminderResult.sender}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setReminderResult(null)}
        className="self-end sm:self-start p-1.5 text-indigo-500 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg cursor-pointer"
        title="Fechar resultado"
      >
        <X className="w-4 h-4" />
      </button>
    </div>

    <div className="mt-4 space-y-2">
      {reminderResult.emails.map((emailPreview, index) => (
        <div
          key={`${emailPreview.to}-${index}`}
          className="bg-white border border-indigo-100 rounded-xl p-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-xs font-bold text-slate-800 break-all">
              {emailPreview.to}
            </span>

            <span className="text-[10px] font-bold text-indigo-700">
              {emailPreview.actionsCount} ação(ões)
            </span>
          </div>

          <p className="text-[10px] text-slate-500 mt-1">
            Responsável: {emailPreview.responsible}
          </p>

          <p className="text-[10px] text-slate-500">
            Assunto: {emailPreview.subject}
          </p>
        </div>
      ))}
    </div>

    <p className="text-[10px] font-semibold text-indigo-700 mt-3">
      Modo de simulação ativo: nenhum e-mail foi enviado.
    </p>
  </div>
)}

      {/* STATS OVERVIEW FOR ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-3xs space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total de Ações OMI</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg"><FileText className="w-4 h-4" /></span>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-slate-800">{totalActionsCount}</h3>
            <span className="text-[10px] font-bold text-slate-400 block">Planos de ação 5W2H mapeados</span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-3xs space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Concluídas</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg"><BookmarkCheck className="w-4 h-4" /></span>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-emerald-700">{completedActionsCount}</h3>
            <span className="text-[10px] font-bold text-slate-400 block">Ações totalmente finalizadas</span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-3xs space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">No Prazo / Ativas</span>
            <span className="p-1.5 bg-sky-50 text-sky-700 rounded-lg"><Clock className="w-4 h-4" /></span>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-sky-700">{onTimeActionsCount}</h3>
            <span className="text-[10px] font-bold text-slate-400 block">Ações em andamento no prazo</span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-3xs space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Atrasadas</span>
            <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg"><AlertCircle className="w-4 h-4" /></span>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-rose-700">{delayedActionsCount}</h3>
            <span className="text-[10px] font-bold text-slate-400 block">Ações com prazo vencido</span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-3xs space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Sem Prazo</span>
            <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg"><CalendarOff className="w-4 h-4" /></span>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl font-black text-slate-700">{noDeadlineActionsCount}</h3>
            <span className="text-[10px] font-bold text-slate-400 block">Ações sem data definida</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS FOR ACTIONS */}
      <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl flex flex-col gap-3.5 print:hidden">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Buscar ação, responsável ou e-mail do executor..."
              value={actionSearchTerm}
              onChange={(e) => setActionSearchTerm(e.target.value)}
              className="w-full text-xs p-3 pl-10 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
            />
          </div>

          <div className="w-full md:w-56">
            <select
              value={selectedActionStatus}
              onChange={(e) => setSelectedActionStatus(e.target.value)}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
            >
              <option value="TODOS">Status: Todos</option>
              {actionStatuses.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Filtrar por Painel / Comitê</label>
            <select
              value={selectedActionCommittee}
              onChange={(e) => setSelectedActionCommittee(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
            >
              <option value="TODOS">Todos os Comitês</option>
              {actionCommittees.map(comm => (
                <option key={comm} value={comm}>{comm}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Filtrar por Responsável</label>
            <select
              value={selectedActionResponsible}
              onChange={(e) => setSelectedActionResponsible(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
            >
              <option value="TODOS">Todos os Responsáveis</option>
              {actionResponsibles.map(resp => (
                <option key={resp} value={resp}>{resp}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ACTION PLANS TABLE */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-3xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4 w-12 text-center">Ref</th>
                <th className="py-3 px-4 w-44">Painel / Comitê</th>
                <th className="py-3 px-4 min-w-[380px]">Plano de Ação (5W2H)</th>
                <th className="py-3 px-4 w-52">Responsável</th>
                <th className="py-3 px-4 w-32 text-center">Prazo</th>
                <th className="py-3 px-4 w-32 text-center">Conclusão</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
                <th className="py-3 px-4 text-center w-16 print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-normal text-slate-600">
              {filteredActionPlans.length > 0 ? (
                filteredActionPlans.map((action, idx) => {
                  const numberId = action.id.startsWith("omi-act-") && !action.id.includes("custom")
                    ? action.id.replace("omi-act-", "")
                    : `C-${idx + 1}`;

                  let badgeColor = "bg-slate-50 text-slate-600 border-slate-200";
                  if (action.status === "Concluído") {
                    badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  } else if (action.status === "No Prazo") {
                    badgeColor = "bg-sky-50 text-sky-700 border-sky-200";
                  } else if (action.status === "Atrasado") {
                    badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
                  } else if (action.status === "Sem Prazo") {
                    badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                  }

                  return (
                    <tr key={action.id} className="hover:bg-slate-50/45 transition-colors group">
                      {/* ID Number */}
                      <td className="py-3.5 px-4 text-center font-mono font-extrabold text-slate-450 text-[10px]">
                        #{numberId}
                      </td>

                      {/* Committee */}
                      <td className="py-3.5 px-4 font-bold text-slate-700 text-[10.5px]">
                        {action.committee}
                      </td>

                      {/* Action text */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800 text-[11px] leading-relaxed max-w-2xl">
                        {action.action}
                      </td>

                      {/* Responsible & Email */}
                      <td className="py-3.5 px-4 space-y-1">
                        <span className="font-extrabold text-slate-700 text-[11px] block">{action.responsible}</span>
                        {action.email && (
                          <span className="text-[10px] text-slate-450 font-medium flex items-center gap-1 leading-none break-all">
                            <Mail className="w-3 h-3 text-slate-450 inline" /> {action.email}
                          </span>
                        )}
                      </td>

                      {/* Deadline */}
                      <td className="py-3.5 px-4 text-center font-mono text-[10.5px] font-bold text-slate-600">
                        {action.deadline}
                      </td>

                      {/* Completion Date */}
                      <td className="py-3.5 px-4 text-center font-mono text-[10.5px] text-slate-500">
                        {action.completionDate || "—"}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg border ${badgeColor}`}>
                          {action.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingAction(action)}
                            className="p-1 text-slate-500 hover:text-indigo-650 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="Editar Plano de Ação"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAction(action.id)}
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
                    Nenhum plano de ação OMI encontrado com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT ACTION MODAL */}
      {editingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-150 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 p-5 border-b border-slate-150 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 block">Plano de Ação 5W2H</span>
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                  <Edit className="w-4.5 h-4.5 text-indigo-600" /> Editar Plano de Ação OMI
                </h3>
              </div>
              <button
                onClick={() => setEditingAction(null)}
                className="p-1 hover:bg-slate-200/60 rounded-lg transition-all text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveActionEdit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Painel / Comitê OMI *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Engenharia/SGI, Comercial, Financeiro..."
                  value={editingAction.committee}
                  onChange={(e) => setEditingAction({ ...editingAction, committee: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Descrição do Plano de Ação *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva a ação a ser executada..."
                  value={editingAction.action}
                  onChange={(e) => setEditingAction({ ...editingAction, action: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Responsável Executor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nome Sobrenome..."
                    value={editingAction.responsible}
                    onChange={(e) => setEditingAction({ ...editingAction, responsible: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">E-mails de Contato</label>
                  <input
                    type="text"
                    placeholder="Ex: responsavel@aclf.com.br..."
                    value={editingAction.email}
                    onChange={(e) => setEditingAction({ ...editingAction, email: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Prazo / Deadline</label>
                  <input
                    disabled={!canEditDeadline}
                    type="text"
                    placeholder="Ex: 30/09/2026, Contínuo, Mensal..."
                    value={editingAction.deadline}
                    onChange={(e) => {
                      const dline = e.target.value;
                      const computedStatus = autoCalculateStatus(dline, editingAction.completionDate, editingAction.status);
                      setEditingAction({ ...editingAction, deadline: dline, status: computedStatus });
                    }}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Data de Conclusão</label>
                  <input
                    type="text"
                    placeholder="Ex: 19/06/2026 (se concluído)..."
                    value={editingAction.completionDate}
                    onChange={(e) => {
                      const compDate = e.target.value;
                      const computedStatus = autoCalculateStatus(editingAction.deadline, compDate, editingAction.status);
                      setEditingAction({ ...editingAction, completionDate: compDate, status: computedStatus });
                    }}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Status do Plano <span className="text-[9px] text-slate-400 normal-case font-normal">(Atualizado automaticamente por data)</span>
                </label>
                <select
                  value={editingAction.status}
                  onChange={(e) => {
                    const selectedStatus = e.target.value;
                    let compDate = editingAction.completionDate;
                    if (selectedStatus === "Concluído" && !compDate) {
                      const today = new Date();
                      compDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
                    } else if (selectedStatus !== "Concluído" && compDate) {
                      compDate = "";
                    }
                    const computedStatus = autoCalculateStatus(editingAction.deadline, compDate, selectedStatus);
                    setEditingAction({ ...editingAction, status: computedStatus, completionDate: compDate });
                  }}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs font-bold"
                >
                  <option value="No Prazo">No Prazo</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Atrasado">Atrasado</option>
                  <option value="Sem Prazo">Sem Prazo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAction(null)}
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

      {/* CREATE ACTION MODAL */}
      {isCreatingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-150 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 p-5 border-b border-slate-150 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 block">Novo Plano de Ação</span>
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                  <Plus className="w-4.5 h-4.5 text-indigo-600" /> Adicionar Ação OMI 5W2H
                </h3>
              </div>
              <button
                onClick={() => setIsCreatingAction(false)}
                className="p-1 hover:bg-slate-200/60 rounded-lg transition-all text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateAction} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Painel / Comitê OMI *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Engenharia/SGI, Comercial, Financeiro..."
                  value={newActionCommittee}
                  onChange={(e) => setNewActionCommittee(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Descrição do Plano de Ação *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva detalhadamente a ação a ser tomada..."
                  value={newActionText}
                  onChange={(e) => setNewActionText(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Responsável Executor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nome Sobrenome..."
                    value={newActionResponsible}
                    onChange={(e) => setNewActionResponsible(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">E-mails de Contato</label>
                  <input
                    type="text"
                    placeholder="Ex: responsavel@aclf.com.br..."
                    value={newActionEmail}
                    onChange={(e) => setNewActionEmail(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Prazo / Deadline</label>
                  <input
                    type="text"
                    placeholder="Ex: 30/09/2026, Contínuo, Mensal..."
                    value={newActionDeadline}
                    onChange={(e) => {
                      const dline = e.target.value;
                      setNewActionDeadline(dline);
                      const computedStatus = autoCalculateStatus(dline, newActionCompletionDate, newActionStatus);
                      setNewActionStatus(computedStatus);
                    }}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Data de Conclusão</label>
                  <input
                    type="text"
                    placeholder="Deixe vazio se em andamento..."
                    value={newActionCompletionDate}
                    onChange={(e) => {
                      const compDate = e.target.value;
                      setNewActionCompletionDate(compDate);
                      const computedStatus = autoCalculateStatus(newActionDeadline, compDate, newActionStatus);
                      setNewActionStatus(computedStatus);
                    }}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Status do Plano <span className="text-[9px] text-slate-400 normal-case font-normal">(Atualizado automaticamente por data)</span>
                </label>
                <select
                  value={newActionStatus}
                  onChange={(e) => {
                    const selectedStatus = e.target.value;
                    let compDate = newActionCompletionDate;
                    if (selectedStatus === "Concluído" && !compDate) {
                      const today = new Date();
                      compDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
                      setNewActionCompletionDate(compDate);
                    } else if (selectedStatus !== "Concluído" && compDate) {
                      compDate = "";
                      setNewActionCompletionDate("");
                    }
                    const computedStatus = autoCalculateStatus(newActionDeadline, compDate, selectedStatus);
                    setNewActionStatus(computedStatus);
                  }}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:border-indigo-500 shadow-3xs font-bold"
                >
                  <option value="No Prazo">No Prazo</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Atrasado">Atrasado</option>
                  <option value="Sem Prazo">Sem Prazo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingAction(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 bg-white font-bold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-slate-900 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  Criar Plano de Ação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
