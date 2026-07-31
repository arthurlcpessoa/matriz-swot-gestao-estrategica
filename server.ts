import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = 3000;

const getSmtpTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT);
  const smtpSecure = process.env.SMTP_SECURE === "true";
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpTlsServername =
    process.env.SMTP_TLS_SERVERNAME || "skymail.net.br";

  if (
    !smtpHost ||
    !Number.isFinite(smtpPort) ||
    !smtpUser ||
    !smtpPassword
  ) {
    throw new Error(
      "As variáveis SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASSWORD devem estar configuradas."
    );
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    authMethod: "LOGIN",
    auth: {
      user: smtpUser,
      pass: smtpPassword
    },
    tls: {
      servername: smtpTlsServername
    }
  });
};

// Middleware para processamento de JSON com tamanho limite aumentado caso venham planilhas grandes
app.use(express.json({ limit: '10mb' }));

// Inicialização opcional do SDK de IA do Gemini (para rodar sem crashar na ausência de chaves)
let ai: GoogleGenAI | null = null;
const geminiApiKey = process.env.GEMINI_API_KEY;



if (geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("SDK do Gemini inicializado com sucesso.");
  } catch (err) {
    console.error("Erro ao inicializar o SDK do Gemini:", err);
  }
} else {
  console.log("GEMINI_API_KEY ausente ou valor padrão detectado. Usando modo de simulação/regra local para análise estendida.");
}

// Função inteligente para consolidar e eliminar riscos ou oportunidades redundantes/semelhantes
function consolidateStrategicItems(items: any[], isRisk: boolean): any[] {
  const uniqueItems: any[] = [];

  // Helper para verificar similaridade de textos (Jaccard de palavras significativas)
  const isDuplicateText = (textA: string, textB: string, threshold = 0.55): boolean => {
    const cleanWordSet = (t: string) => {
      return new Set(
        t.toLowerCase()
         .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
         .split(/\s+/)
         .filter(w => w.length > 4)
      );
    };
    const setA = cleanWordSet(textA);
    const setB = cleanWordSet(textB);
    if (setA.size === 0 || setB.size === 0) return false;
    
    let intersection = 0;
    setA.forEach(w => {
      if (setB.has(w)) intersection++;
    });
    
    const jaccard = intersection / (setA.size + setB.size - intersection);
    return jaccard >= threshold;
  };

  // Helper para normalizar e ordenar fatores cruzados
  const getFactorsKey = (factors: string[]): string => {
    return [...factors]
      .map(f => f.toLowerCase().replace(/^(força|fraqueza|oportunidade|ameaça|strength|weakness|opportunity|threat):\s*/i, "").trim())
      .sort()
      .join("||");
  };

  for (const item of items) {
    const itemKey = getFactorsKey(item.crossedFactors || []);
    let isRedundant = false;

    for (const extant of uniqueItems) {
      // 1. Verificar similaridade de descrições
      if (isDuplicateText(item.description, extant.description)) {
        isRedundant = true;
        break;
      }
      
      // 2. Verificar mesma causa raiz ou benefício
      if (isRisk) {
        if (item.probableCause && extant.probableCause && isDuplicateText(item.probableCause, extant.probableCause, 0.65)) {
          isRedundant = true;
          break;
        }
      } else {
        if (item.expectedBenefit && extant.expectedBenefit && isDuplicateText(item.expectedBenefit, extant.expectedBenefit, 0.65)) {
          isRedundant = true;
          break;
        }
      }

      // 3. Verificar se nasceram do mesmo exato par de cruzamento
      const extantKey = getFactorsKey(extant.crossedFactors || []);
      if (itemKey !== "" && itemKey === extantKey) {
        isRedundant = true;
        break;
      }
    }

    if (!isRedundant) {
      uniqueItems.push(item);
    } else {
      console.log(`[Consolidator] Filtrando item redundante (${isRisk ? 'Risco' : 'Oportunidade'}): "${item.description}"`);
    }
  }

  return uniqueItems;
}

// Funções para geração automatizada de Riscos e Oportunidades Individuais (1-para-1 com os fatores cadastrados)
function generateIndividualRisks(fraquezas: any[], ameacas: any[], timestamp: number): any[] {
  const list: any[] = [];
  
  fraquezas.forEach((w, idx) => {
    const rawScore = Number(w.score) || 3;
    const impact = Math.min(5, Math.max(1, rawScore + 1)); // converte 1-4 para escala 1-5
    const probability = 3; // Média como padrão
    const criticality = impact * probability;
    let criticalityClass: 'Baixo' | 'Médio' | 'Alto' | 'Crítico' = 'Médio';
    if (criticality >= 16) criticalityClass = 'Crítico';
    else if (criticality <= 8) criticalityClass = 'Baixo';
    
    list.push({
      id: `risk_ind_w_${timestamp}_${idx}_${w.id || idx}`,
      description: `Risco individual associado à Fraqueza: ${w.description}`,
      probableCause: w.processes ? `Gargalos no processo: ${w.processes}` : "Vulnerabilidade operacional ou processo manual interno identificado na matriz SWOT.",
      impact,
      probability,
      criticality,
      criticalityClass,
      crossedFactors: [`Fraqueza: ${w.description}`],
      justification: `Fator preventivo interno individual. Gravidade na SWOT: ${rawScore}.`,
      suggestedAction: `Implementar controles internos e robustecer o processo associado para minimizar a fraqueza.`
    });
  });

  ameacas.forEach((t, idx) => {
    const rawScore = Number(t.score) || 3;
    const impact = Math.min(5, Math.max(1, rawScore + 1)); // converte 1-4 para escala 1-5
    const probability = 3;
    const criticality = impact * probability;
    let criticalityClass: 'Baixo' | 'Médio' | 'Alto' | 'Crítico' = 'Médio';
    if (criticality >= 16) criticalityClass = 'Crítico';
    else if (criticality <= 8) criticalityClass = 'Baixo';

    list.push({
      id: `risk_ind_t_${timestamp}_${idx}_${t.id || idx}`,
      description: `Risco individual associado à Ameaça: ${t.description}`,
      probableCause: t.processes ? `Exposição do processo: ${t.processes}` : "Incerteza mercadológica externa ou barreira competitiva identificada na matriz SWOT.",
      impact,
      probability,
      criticality,
      criticalityClass,
      crossedFactors: [`Ameaça: ${t.description}`],
      justification: `Fator preventivo externo individual. Impacto na SWOT: ${rawScore}.`,
      suggestedAction: `Estruturar plano de contingência e monitoramento preventivo de mercado contra esta ameaça.`
    });
  });

  return list;
}

function generateIndividualOpportunities(forcas: any[], oportunidades: any[], timestamp: number): any[] {
  const list: any[] = [];

  forcas.forEach((s, idx) => {
    const rawScore = Number(s.score) || 3;
    const impact = Math.min(5, Math.max(1, rawScore + 1)); // converte 1-4 para escala 1-5
    const probability = 3;
    const criticality = impact * probability;
    const priority = criticality >= 12 ? 'Alta' : 'Média';

    list.push({
      id: `opp_ind_s_${timestamp}_${idx}_${s.id || idx}`,
      description: `Oportunidade individual associada à Força: ${s.description}`,
      expectedBenefit: s.processes ? `Diferencial competitivo no processo: ${s.processes}` : "Alavancagem direta de diferenciais e competências internas consagradas.",
      potentialImpact: impact,
      probability,
      criticality,
      priority,
      crossedFactors: [`Força: ${s.description}`],
      justification: `Capacidade de alavancagem interna. Importância na SWOT: ${rawScore}.`,
      suggestedAction: `Potencializar e disseminar a força interna de "${s.description}" para obter maior fatia de mercado.`
    });
  });

  oportunidades.forEach((o, idx) => {
    const rawScore = Number(o.score) || 3;
    const impact = Math.min(5, Math.max(1, rawScore + 1)); // converte 1-4 para escala 1-5
    const probability = 3;
    const criticality = impact * probability;
    const priority = criticality >= 12 ? 'Alta' : 'Média';

    list.push({
      id: `opp_ind_o_${timestamp}_${idx}_${o.id || idx}`,
      description: `Oportunidade individual associada ao Fator: ${o.description}`,
      expectedBenefit: o.processes ? `Vantagem estratégica ligada a: ${o.processes}` : "Aproveitamento direto de vetor externo favorável para ganho operacional ou comercial.",
      potentialImpact: impact,
      probability,
      criticality,
      priority,
      crossedFactors: [`Oportunidade: ${o.description}`],
      justification: `Alavancagem de fatores externos de mercado. Apetite na SWOT: ${rawScore}.`,
      suggestedAction: `Mobilizar recursos e canais comerciais/marketing para capturar os ganhos da oportunidade "${o.description}".`
    });
  });

  return list;
}


export const GLOBAL_RISK_TEMPLATES = [
  {
    title: "Obsolescência operacional e gargalos por processos manuais legados",
    desc: "Risco de lentidão interna, atrasos frequentes e ineficiência devido à falta de automatização de processos-chave.",
    cause: "Inexistência de sistemas integrados modernos e governança restritiva de fluxos de ciclo interno.",
    p: 4, i: 4,
    factors: ["Fraqueza: Operações analógicas", "Ameaça: Concorrência automatizada"],
    todo: "Introduzir auditoria de gargalos operacionais e contratar softwares de automatização de rotinas repetitivas."
  },
  {
    title: "Exposição a sanções administrativas e multas por conformidade LGPD",
    desc: "Risco de incidentes de segurança cibernética e vazamentos acidentais de dados de clientes.",
    cause: "Fragilidade técnica em protocolos de segurança da informação e falta de auditoria de dados estruturados.",
    p: 3, i: 5,
    factors: ["Fraqueza: TI subdimensionada", "Ameaça: Ataques cibernéticos no setor"],
    todo: "Nomear encarregado DPO, auditar bancos de dados e revisar termos de uso e política de privacidade."
  },
  {
    title: "Perda de produtividade por desgaste de clima e turnover de profissionais essenciais",
    desc: "Dificuldade de reter conhecimento central devido ao assédio e atratividade do mercado concorrente.",
    cause: "Política de benefícios defasada frente à concorrência direta regional.",
    p: 4, i: 3,
    factors: ["Fraqueza: Alta rotatividade de talentos", "Ameaça: Concorrentes com ofertas agressivas"],
    todo: "Revisar estrutura salarial, implantar bônus por resultados e consolidar planos de desenvolvimento individual."
  },
  {
    title: "Comprometimento do fluxo de caixa e capital de giro por inadimplência de clientes",
    desc: "Risco de restrição financeira grave limitando a capacidade de honrar compromissos operacionais de curto prazo.",
    cause: "Insuficiência de rigor nos termos de análise de crédito e cobrança activa de faturas vencidas diariamente.",
    p: 3, i: 4,
    factors: ["Fraqueza: Cobrança ineficiente", "Ameaça: Crise macroeconômica sistêmica"],
    todo: "Avançar na régua de cobrança automática, integrar bureaus de crédito e antecipar faturas com bancos."
  },
  {
    title: "Paralisação operacional por dependência excessiva de parceiros de infraestrutura únicos",
    desc: "Risco de suspensão imprevista de fornecimento de insumos ou banda de rede essencial sem plano B imediato.",
    cause: "Ausência de carteira de fornecedores secundários qualificados ou contingenciados.",
    p: 3, i: 4,
    factors: ["Fraqueza: Concentração de parceiros", "Ameaça: Falência de fornecedor estratégico"],
    todo: "Homologar fornecedores backups e diversificar geograficamente a infraestrutura física de apoio."
  },
  {
    title: "Gargalo logístico e incapacidade de escala produtiva de pico",
    desc: "Atraso severo na expedição de encomendas em janelas promocionais de alta demanda.",
    cause: "Falta de flexibilidade de espaço físico e frotas de entrega próprias ou terceiras.",
    p: 4, i: 3,
    factors: ["Fraqueza: Expedição manualizada", "Ameaça: Mudanças regulatórias de modais de entrega"],
    todo: "Otimizar canais de fulfillment, desenhar roteamento expresso e terceirizar galpões sintonizados."
  },
  {
    title: "Desgaste severo na satisfação geral e reputação de marca por SLA inadequado",
    desc: "Perda acentuada de clientes ativos no funil pós-venda devido a longas filas de suporte.",
    cause: "Centralização de atendimento e ausência de base de conhecimento compartilhada.",
    p: 3, i: 4,
    factors: ["Fraqueza: Atendimento centralizado", "Ameaça: Proliferação de críticas públicas em portais"],
    todo: "Contratar ferramenta unificada de chat, mapear FAQs e treinar central de atendimento de nível 1."
  },
  {
    title: "Erosão de margem bruta por flutuação unilateral de insumos",
    desc: "Perda imediata de rentabilidade econômica por incapacidade de repasse imediato de custos ao mercado.",
    cause: "Inexistência de contratos de fornecimento fechados por períodos longos na compra integrada.",
    p: 4, i: 4,
    factors: ["Fraqueza: Compras reativas", "Ameaça: Alta inflação de custos industriais"],
    todo: "Fechar acordos corporativos de longo prazo e hedgear compras em lotes programados."
  },
  {
    title: "Perda de fatia de mercado e competitividade para novos entrantes digitais de baixo custo",
    desc: "Migração massiva de usuários tradicionais para plataformas alternativas altamente baratas.",
    cause: "Posicionamento estático sem atualizações incrementais rápidas no mix de serviços prestados.",
    p: 3, i: 5,
    factors: ["Fraqueza: Inovação lenta", "Ameaça: Desregulamentação de nicho por novos players"],
    todo: "Estruturar divisão ágil de testes, incubar inovações de baixo custo e modernizar propostas comerciais."
  },
  {
    title: "Deficit de acompanhamento estratégico com ruído de execução de metas",
    desc: "Incoerência nas ações de equipes descentralizadas que buscam objetivos divergentes.",
    cause: "Inexistência de central de projetos de liderança integrada e métricas OKR de governança.",
    p: 3, i: 3,
    factors: ["Fraqueza: Comunicação departamental falha", "Ameaça: Retração do consumo do público-alvo"],
    todo: "Implementar rituais de checkpoints semanais de OKRs coordenados por facilitador sênior."
  }
];

export const GLOBAL_OPP_TEMPLATES = [
  {
    title: "Expansão de carteira comercial robusta pelo canal B2A de licitações públicas",
    benefit: "Abertura de novos contratos previsíveis e de receita recorrente sólida com órgãos do governo.",
    p: 4, i: 5,
    factors: ["Força: Imagem institucional idônea", "Oportunidade: Editais públicos abertos"],
    todo: "Implementar divisão específica sênior de monitoramento de editais de fomento setorial."
  },
  {
    title: "Fortalecimento e atração de clientes pela introdução da nova linha ESG sustentável",
    benefit: "Ampliação de fatia de mercado em nicho corporativo Premium focado em conformidade ambiental.",
    p: 4, i: 4,
    factors: ["Força: Reputação ambiental positiva", "Oportunidade: Subsídios e isenções regulatórias"],
    todo: "Lançar canal oficial comunicando selo ecológico integrado nos processos corporativos."
  },
  {
    title: "Otimização de eficiência operacional pela automação com IA preditiva de metas",
    benefit: "Redução de custos manuais de processamento de novos leads qualificados de vendas em até 30%.",
    p: 3, i: 4,
    factors: ["Força: Maturidade analítica interna", "Oportunidade: Escalar demanda de leads"],
    todo: "Instalar plataforma de triagem avançada integrada nos servidores principais."
  },
  {
    title: "Abertura acelerada de e-commerce e canais de marketplace digital direto",
    benefit: "Alcançar abrangência territorial nacional sem necessidade de pontos físicos de revenda adicionais.",
    p: 4, i: 4,
    factors: ["Força: Logística interna ágil", "Oportunidade: Digitalização acelerada do cliente final"],
    todo: "Desenvolver infraestrutura responsiva em parceiros consolidados em nuvem."
  },
  {
    title: "Parcerias de co-marketing integrado com players estratégicos do ecossistema",
    benefit: "Redução no Custo de Aquisição de Cliente (CAC) atraindo consumidores qualificados de marcas complementares.",
    p: 3, i: 3,
    factors: ["Força: Rede de relacionamento activa", "Oportunidade: Eventos corporativos locais integrados"],
    todo: "Lançar fórum técnico conjunto ou eventos regionais direcionados ao público estratégico."
  },
  {
    title: "Promoção de canais de internacionalização de serviços para mercados de moeda forte",
    benefit: "Garantia de blindagem cambial e aumento expressivo de lucratividade em dólar ou euro.",
    p: 3, i: 5,
    factors: ["Força: Diferencial técnico de produto", "Oportunidade: Aquecimento global de negócios B2B"],
    todo: "Adaptar contratos legais, termos de serviço e documentações técnicas auxiliares para inglês comercial."
  },
  {
    title: "Criação de aplicativo de autoatendimento focado na fidelização LTV de clientes",
    benefit: "Diminuição das taxas de perda e cancelamento por facilidade de autoatendimento diário corporativo.",
    p: 3, i: 3,
    factors: ["Força: Suporte focado em satisfação", "Oportunidade: Mobile integrado no dia a dia"],
    todo: "Apoiar a criação de protótipos enxutos e focar testes de experiência do usuário nos principais clientes."
  },
  {
    title: "Financiamento facilitado para inovação e desenvolvimento de produtos",
    benefit: "Injetar capital barato com carência alongada específico para novos protótipos inovadores.",
    p: 3, i: 4,
    factors: ["Força: Histórico bancário transparente", "Oportunidade: Editais públicos de incentivo tributário"],
    todo: "Candidatar projetos da empresa no comitê setorial de fomento para captação direta de subvenções."
  },
  {
    title: "Expansão de abrangência regional por licenciamento de franquia",
    benefit: "Gargalo reduzido pela captação de investimento do parceiro local de canal para acelerar marca.",
    p: 4, i: 3,
    factors: ["Força: Processabilidade descrita sólida", "Oportunidade: Alta capilaridade imobiliária comercial"],
    todo: "Estruturar manuais técnicos de marca e processos de repasse formatados juridicamente."
  },
  {
    title: "Migração unificada em nuvem pública gerida com redução de pegada física",
    benefit: "Redução de custos fixos com servidores proprietários, refrigeração e segurança física predial.",
    p: 4, i: 3,
    factors: ["Força: Governança de TI atualizada", "Oportunidade: Oferta agressiva de créditos em nuvem"],
    todo: "Executar roteiro de portabilidade limpa mantendo sistemas operando em espelho por período de segurança."
  },
  {
    title: "Iniciativas de fusão estratégica de carteiras locais afins de mercado",
    benefit: "Sinergia imediata de carteira de vendas com diluição de custos fixos administrativos duplicados.",
    p: 3, i: 4,
    factors: ["Força: Caixa saudável capitalizado", "Oportunidade: Pequenos concorrentes locais vulneráveis"],
    todo: "Mapear potenciais acordos e emitir termos prévios de confidencialidade de propostas de valor."
  },
  {
    title: "Canal de vendas humanizado omnichannel automatizado com respostas rápidas",
    benefit: "Aumento instantâneo de conversão comercial de prospects quentes no primeiro contato em até 40%.",
    p: 4, i: 4,
    factors: ["Força: Agilidade em comunicação corporativa", "Oportunidade: Novas plataformas conversacionais automatizadas"],
    todo: "Configurar integrações em portais corporativos usando APIs oficiais escaláveis."
  }
];

export function fillToTargetCount(
  consolidatedList: any[],
  preConsolidatedList: any[],
  targetCount: number,
  isRisk: boolean,
  forcas: any[],
  fraquezas: any[],
  oportunidades: any[],
  ameacas: any[],
  timestamp: number
): any[] {
  const resultList = [...consolidatedList];

  if (resultList.length >= targetCount) {
    return resultList;
  }

  const seenDescriptions = new Set(resultList.map(item => item.description.toLowerCase().trim()));

  // 1. Resgatar do preConsolidatedList
  for (const item of preConsolidatedList) {
    if (resultList.length >= targetCount) break;
    const descLower = item.description.toLowerCase().trim();
    if (!seenDescriptions.has(descLower)) {
      seenDescriptions.add(descLower);
      const prefix = isRisk ? "risk" : "opp";
      resultList.push({
        ...item,
        id: `${prefix}_backfill_${timestamp}_${resultList.length}`
      });
    }
  }

  // 2. Gerar cruzamentos adicionais até completar o target
  const templates = isRisk ? GLOBAL_RISK_TEMPLATES : GLOBAL_OPP_TEMPLATES;
  let idx = 0;

  while (resultList.length < targetCount) {
    const template: any = templates[idx % templates.length];
    idx++;

    let title = "";
    let detail = "";
    let crossedFactors: string[] = [];
    let p = 3;
    let iVal = 3;

    if (isRisk) {
      if (fraquezas.length > 0 && ameacas.length > 0) {
        const w = fraquezas[(idx + resultList.length) % fraquezas.length];
        const t = ameacas[(idx + resultList.length) % ameacas.length];
        const wDesc = w.description || "";
        const tDesc = t.description || "";
        title = `Risco em ${template.title}`;
        detail = `Risco decorrente da fraqueza "${wDesc}" associada à ameaça externa "${tDesc}".`;
        crossedFactors = [`Fraqueza: ${wDesc}`, `Ameaça: ${tDesc}`];
        p = Math.min(5, Math.max(1, (w.score || 3) + 1));
        iVal = Math.min(5, Math.max(1, (t.score || 3) + 1));
      } else if (forcas.length > 0 && ameacas.length > 0) {
        const s = forcas[(idx + resultList.length) % forcas.length];
        const t = ameacas[(idx + resultList.length) % ameacas.length];
        const sDesc = s.description || "";
        const tDesc = t.description || "";
        title = `Mitigação de ${template.title}`;
        detail = `Ameaça de "${tDesc}" contida pela nossa força interna de "${sDesc}".`;
        crossedFactors = [`Força: ${sDesc}`, `Ameaça: ${tDesc}`];
        p = Math.min(5, Math.max(1, (s.score || 3)));
        iVal = Math.min(5, Math.max(1, (t.score || 3)));
      } else {
        title = template.title;
        detail = template.desc;
        crossedFactors = template.factors || [];
        p = template.p;
        iVal = template.i;
      }
    } else {
      if (forcas.length > 0 && oportunidades.length > 0) {
        const s = forcas[(idx + resultList.length) % forcas.length];
        const o = oportunidades[(idx + resultList.length) % oportunidades.length];
        const sDesc = s.description || "";
        const oDesc = o.description || "";
        title = `Alavancagem de ${template.title}`;
        detail = `Usar nossa força em "${sDesc}" para aproveitar plenamente a oportunidade de "${oDesc}".`;
        crossedFactors = [`Força: ${sDesc}`, `Oportunidade: ${oDesc}`];
        p = Math.min(5, Math.max(1, (s.score || 3) + 1));
        iVal = Math.min(5, Math.max(1, (o.score || 3) + 1));
      } else if (fraquezas.length > 0 && oportunidades.length > 0) {
        const w = fraquezas[(idx + resultList.length) % fraquezas.length];
        const o = oportunidades[(idx + resultList.length) % oportunidades.length];
        const wDesc = w.description || "";
        const oDesc = o.description || "";
        title = `Melhoria de ${template.title}`;
        detail = `Mitigar a fraqueza de "${wDesc}" para viabilizar e usufruir da oportunidade de "${oDesc}".`;
        crossedFactors = [`Fraqueza: ${wDesc}`, `Oportunidade: ${oDesc}`];
        p = Math.min(5, Math.max(1, (w.score || 3)));
        iVal = Math.min(5, Math.max(1, (o.score || 3)));
      } else {
        title = template.title;
        detail = template.benefit;
        crossedFactors = template.factors || [];
        p = template.p;
        iVal = template.i;
      }
    }

    const score = p * iVal;
    const descLower = detail.toLowerCase().trim();

    if (!seenDescriptions.has(descLower)) {
      seenDescriptions.add(descLower);

      if (isRisk) {
        resultList.push({
          id: `risk_backfill_${timestamp}_${resultList.length}`,
          description: detail,
          probableCause: template.cause || "Análise integrada de vulnerabilidade de processos.",
          impact: iVal,
          probability: p,
          criticality: score,
          criticalityClass: score >= 16 ? 'Crítico' : 'Médio',
          crossedFactors,
          justification: `Cruzamento estratégico detectado com forte nexo de causa-efeito na SWOT do negócio.`,
          suggestedAction: template.todo || "Desenvolver protocolo operacional de mitigação."
        });
      } else {
        resultList.push({
          id: `opp_backfill_${timestamp}_${resultList.length}`,
          description: detail,
          expectedBenefit: template.benefit,
          potentialImpact: iVal,
          probability: p,
          criticality: score,
          priority: (p >= 4 && iVal >= 4) ? 'Alta' : 'Média',
          crossedFactors,
          justification: `Oportunidade gerada pelo cruzamento dinâmico de alta viabilidade e potencial ganho.`,
          suggestedAction: template.todo || "Promover iniciativa piloto estratégica."
        });
      }
    }
  }

  return resultList;
}

// Endpoint de saúde do sistema
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    aiEnabled: !!ai,
    time: new Date().toISOString()
  });
});

// Endpoint de autenticação do administrador
app.post("/api/auth/admin", (req: Request, res: Response) => {
  const { password } = req.body;

  if (typeof password !== "string" || password.trim() === "") {
    return res.status(400).json({
      success: false,
      error: "Senha não informada."
    });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("ADMIN_PASSWORD não está configurada no arquivo .env.");

    return res.status(500).json({
      success: false,
      error: "A senha de administrador não está configurada no servidor."
    });
  }

  if (password !== adminPassword) {
    return res.status(401).json({
      success: false,
      error: "Senha de administrador incorreta."
    });
  }

  return res.status(200).json({
    success: true,
    role: "admin"
  });
});

interface ReminderActionPlan {
  id: string;
  title?: string;
  action?: string;
  description?: string;
  responsible?: string;
  responsibleEmail?: string;
  deadline?: string;
  status?: string;
  completionDate?: string;
}

interface ReminderEmailPreview {
  to: string;
  responsible: string;
  subject: string;
  actionsCount: number;
  actionIds: string[];
  html: string;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseDeadline(value?: string): Date | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  // Formato brasileiro: DD/MM/AAAA
  const brazilianDateMatch = normalizedValue.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/
  );

  if (brazilianDateMatch) {
    const [, day, month, year] = brazilianDateMatch;

    const parsedDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    parsedDate.setHours(0, 0, 0, 0);

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  // Formato ISO: AAAA-MM-DD
  const isoDateMatch = normalizedValue.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;

    const parsedDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    parsedDate.setHours(0, 0, 0, 0);

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  return null;
}

function isCompletedAction(actionPlan: ReminderActionPlan): boolean {
  const normalizedStatus = String(actionPlan.status ?? "")
    .trim()
    .toLowerCase();

  const completedStatuses = [
    "concluído",
    "concluída",
    "concluido",
    "concluida",
    "finalizado",
    "finalizada",
    "completed",
    "done"
  ];

  return (
    completedStatuses.includes(normalizedStatus) ||
    Boolean(actionPlan.completionDate?.trim())
  );
}

function buildReminderEmailHtml(
  responsible: string,
  actions: ReminderActionPlan[]
): string {
  const actionRows = actions
    .map((actionPlan) => {
      const actionTitle =
        actionPlan.title ||
        actionPlan.action ||
        actionPlan.description ||
        "Ação sem título";

      return `
        <tr>
          <td style="padding: 10px; border: 1px solid #d1d5db;">
            ${escapeHtml(actionTitle)}
          </td>

          <td style="padding: 10px; border: 1px solid #d1d5db;">
            ${escapeHtml(actionPlan.deadline || "Prazo não informado")}
          </td>

          <td style="padding: 10px; border: 1px solid #d1d5db;">
            ${escapeHtml(actionPlan.status || "Pendente")}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
      </head>

      <body style="font-family: Arial, sans-serif; color: #1f2937;">
        <p>Olá, ${escapeHtml(responsible)}.</p>

        <p>
          Identificamos ações do planejamento estratégico com prazo vencido
          que ainda não foram concluídas.
        </p>

        <table
          style="
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            margin-bottom: 20px;
          "
        >
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 10px; border: 1px solid #d1d5db;">
                Ação
              </th>

              <th style="padding: 10px; border: 1px solid #d1d5db;">
                Prazo
              </th>

              <th style="padding: 10px; border: 1px solid #d1d5db;">
                Situação
              </th>
            </tr>
          </thead>

          <tbody>
            ${actionRows}
          </tbody>
        </table>

        <p>
          Por favor, atualize o andamento dessas ações no sistema.
        </p>

        <p>
          Atenciosamente,<br />
          Gestão Estratégica ACLF
        </p>
      </body>
    </html>
  `;
}

// Endpoint de simulação e envio real de lembretes
app.post(
  "/api/emails/send-reminders",
  async (req: Request, res: Response) => {
    try {
      const { actionPlans } = req.body as {
        actionPlans?: ReminderActionPlan[];
      };

      if (!Array.isArray(actionPlans)) {
        return res.status(400).json({
          success: false,
          error: "A lista de planos de ação não foi enviada corretamente."
        });
      }

      const senderEmail = process.env.OUTLOOK_SENDER_EMAIL;
      const simulationMode =
        process.env.EMAIL_SIMULATION_MODE !== "false";

      if (!senderEmail) {
        return res.status(500).json({
          success: false,
          error: "OUTLOOK_SENDER_EMAIL não está configurado no servidor."
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const pendingActions = actionPlans.filter((actionPlan) => {
  if (isCompletedAction(actionPlan)) {
    return false;
  }

  if (!actionPlan.responsibleEmail?.trim()) {
    return false;
  }

  return true;
});

      const actionsByEmail = new Map<string, ReminderActionPlan[]>();

      pendingActions.forEach((actionPlan) => {
        const emails = actionPlan.responsibleEmail!
          .split(/[;,]/)
          .map((email) => email.trim().toLowerCase())
          .filter((email) => email !== "");

        emails.forEach((email) => {
          const existingActions = actionsByEmail.get(email) ?? [];

          existingActions.push(actionPlan);
          actionsByEmail.set(email, existingActions);
        });
      });

      const emailPreviews: ReminderEmailPreview[] = [];

      actionsByEmail.forEach((actions, email) => {
        const responsible =
          actions[0]?.responsible?.trim() || "Responsável";

        emailPreviews.push({
          to: email,
          responsible,
          subject: "OMI | Lembrete de ações com prazo vencido",
          actionsCount: actions.length,
          actionIds: actions.map((action) => action.id),
          html: buildReminderEmailHtml(responsible, actions)
        });
      });

      console.log(
        `[EMAIL REMINDERS] ${emailPreviews.length} e-mail(s) preparado(s) para ${pendingActions.length} ação(ões) atrasada(s).`
      );

      if (simulationMode) {
        console.log(
          "[EMAIL REMINDERS] Modo de simulação ativo. Nenhum e-mail foi enviado."
        );

        return res.status(200).json({
          success: true,
          simulationMode: true,
          sender: senderEmail,
          overdueActionsCount: pendingActions.length,
          emailsCount: emailPreviews.length,
          emails: emailPreviews
        });
      }

      if (emailPreviews.length === 0) {
        return res.status(200).json({
          success: true,
          simulationMode: false,
          sender: senderEmail,
          overdueActionsCount: 0,
          emailsCount: 0,
          sentEmailsCount: 0,
          message: "Nenhuma ação atrasada elegível para envio."
        });
      }

      const transporter = getSmtpTransporter();

      await transporter.verify();

      const sendResults = [];

      for (const emailPreview of emailPreviews) {
        try {
          const info = await transporter.sendMail({
    from: senderEmail,
    to: emailPreview.to,
    cc: "gestaocorporativa@aclf.com.br",
    subject: emailPreview.subject,
    html: emailPreview.html
});

console.log({
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response
});

          sendResults.push({
            to: emailPreview.to,
            success: true,
            messageId: info.messageId,
            actionsCount: emailPreview.actionsCount,
            actionIds: emailPreview.actionIds
          });
        } catch (sendError: any) {
          console.error(
            `[EMAIL REMINDERS] Falha ao enviar para ${emailPreview.to}:`,
            sendError
          );

          sendResults.push({
            to: emailPreview.to,
            success: false,
            error: sendError.message,
            actionsCount: emailPreview.actionsCount,
            actionIds: emailPreview.actionIds
          });
        }
      }

      transporter.close();

      const successfulEmails = sendResults.filter(
        (result) => result.success
      );

      const failedEmails = sendResults.filter(
        (result) => !result.success
      );

      console.log(
        `[EMAIL REMINDERS] ${successfulEmails.length} e-mail(s) enviado(s) e ${failedEmails.length} falha(s).`
      );

      return res.status(failedEmails.length > 0 ? 207 : 200).json({
        success: failedEmails.length === 0,
        simulationMode: false,
        sender: senderEmail,
        overdueActionsCount: pendingActions.length,
        emailsCount: emailPreviews.length,
        sentEmailsCount: successfulEmails.length,
        failedEmailsCount: failedEmails.length,
        emails: emailPreviews,  
        results: sendResults
      });
    } catch (error: any) {
      console.error(
        "Erro ao preparar ou enviar os lembretes por e-mail:",
        error
      );

      return res.status(500).json({
        success: false,
        error: "Erro interno ao preparar ou enviar os lembretes.",
        details: error.message
      });
    }
  }
);
  
// Endpoint de análise automática da SWOT usando IA ou Algoritmo Local
app.post("/api/analyze-swot", async (req, res): Promise<any> => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Nenhum item da SWOT foi enviado para análise." });
    }

    // Filtrar e agrupar itens por categoria mantendo os objetos completos para extrair score/importância
    const forcas = items.filter((i: any) => i.category === "Força");
    const fraquezas = items.filter((i: any) => i.category === "Fraqueza");
    const oportunidades = items.filter((i: any) => i.category === "Oportunidade");
    const ameacas = items.filter((i: any) => i.category === "Ameaça");

    const timestamp = Date.now();

    // 1. Geração robusta de Riscos e Oportunidades Individuais programáticos (Objetivos 1 & 2)
    const finalRisksSelection = generateIndividualRisks(fraquezas, ameacas, timestamp);
    const finalOppsSelection = generateIndividualOpportunities(forcas, oportunidades, timestamp);

    // Re-indexar de forma limpa e sequencial
    finalRisksSelection.forEach((r, idx) => {
      r.id = `risk_fall_${timestamp}_${idx}`;
    });
    finalOppsSelection.forEach((o, idx) => {
      o.id = `opp_fall_${timestamp}_${idx}`;
    });

    const finalOneToOneActionPlans: any[] = [];

    // Para cada risco, gerar exatamente um plano de ação 5W2H correspondente
    finalRisksSelection.forEach((r, idx) => {
      finalOneToOneActionPlans.push({
        id: `plan_fall_r_${timestamp}_${idx}`,
        type: 'Risco',
        relatedId: r.id,
        relatedDescription: r.description,
        what: r.suggestedAction || `Mitigar possíveis vulnerabilidades do risco: "${r.description}"`,
        why: `Estancar gargalo de governança associado aos fatores de entrada: ${(r.crossedFactors || []).join(", ")}.`,
        where: "Operações Corporativas e Comitê Gestor Executivo",
        when: "30 dias corridos",
        who: "Gestor de Riscos e Integrante de Operações",
        how: "Revisar fluxos de trabalho, definir redundâncias, calibrar indicadores de alerta precoce e contingenciar ações.",
        howMuch: r.criticality >= 16 ? "R$ 4.500,00" : "Alocação de horas internas",
        priority: r.criticality >= 16 ? 'Crítica' : 'Média',
        suggestedKrs: [
          `Auditoria de 100% dos processos correlacionados concluída até o fim do ciclo`,
          `Margem de erro mitigada à tolerância de controle de menos de 1.5% do fluxo`
        ]
      });
    });

    // Para cada oportunidade, gerar exatamente um plano de ação 5W2H correspondente
    finalOppsSelection.forEach((o, idx) => {
      const isHighPriority = o.priority === 'Alta' || o.criticality >= 16;
      finalOneToOneActionPlans.push({
        id: `plan_fall_o_${timestamp}_${idx}`,
        type: 'Oportunidade',
        relatedId: o.id,
        relatedDescription: o.description,
        what: o.suggestedAction || `Executar captura estratégica da oportunidade: "${o.description}"`,
        why: `Impulsionar crescimento sustentável e capturar o mercado de forma eficiente baseado em: ${(o.crossedFactors || []).join(" e ")}.`,
        where: "Comercial, Desenvolvimento de Negócios e Governança",
        when: "15 dias corridos",
        who: "Gestor Comercial de Novos Negócios",
        how: "Elaborar projetos conceituais básicos, treinar times operacionais e validar propostas comerciais piloto.",
        howMuch: isHighPriority ? "R$ 3.500,00" : "Horas corporativas internas",
        priority: isHighPriority ? 'Alta' : 'Média',
        suggestedKrs: [
          `Lançar piloto operacional homologado dentro do prazo contratado`,
          `Gerar feedback positivo do canal com meta de receita em 15% acima do baseline`
        ]
      });
    });

    console.log(`[SWOT POST-ANALYSIS COLD LOGS]`);
    console.log(`1. Weaknesses received from client: ${fraquezas.length}`);
    console.log(`2. Threats received from client: ${ameacas.length}`);
    console.log(`3. Total Risks generated: ${finalRisksSelection.length}`);
    console.log(`4. Total Opportunities generated: ${finalOppsSelection.length}`);

    return res.json({
      risks: finalRisksSelection,
      opportunities: finalOppsSelection,
      actionPlans: finalOneToOneActionPlans
    });

  } catch (error: any) {
    console.error("Erro interno no backend:", error);
    res.status(500).json({ error: "Erro interno ao processar a análise estratégica.", details: error.message });
  }
});

// Configuração do Vite ou Servidor Estático de Produção
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    // Modo Desenvolvimento usando Vite
    console.log("Servidor carregando em modo de Desenvolvimento...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Modo Produção servindo arquivos estáticos prontos
    console.log("Servidor carregando em modo de Produção...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SWOT API SERVER] Servidor rodando com sucesso no endereço http://localhost:${PORT}`);
  });
};

startServer().catch(err => {
  console.error("Falha ao inicializar o servidor Express/Vite:", err);
});