export type SwotCategory = 'Força' | 'Fraqueza' | 'Oportunidade' | 'Ameaça';

export interface SwotItem {
  id: string;
  category: SwotCategory;
  description: string;
  score?: number;       // Grau de importância/gravidade (1, 2, 3 ou 4)
  action?: 'Sim' | 'Não'; // Podemos potencializar? / Podemos minimizar?
  processes?: string;   // Processos de atuação
  stakeholders?: string;// Partes interessadas
}

export interface RiskItem {
  id: string;
  description: string;
  probableCause: string;
  impact: number;        // 1 a 5
  probability: number;   // 1 a 5
  criticality: number;   // impact * probability
  criticalityClass: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  crossedFactors: string[]; // e.g., ["Item Força", "Item Ameaça"]
  justification?: string;   // Justificativa curta (Regra 8)
  suggestedAction?: string; // Ação sugerida (Regra 8)
}

export interface OpportunityItem {
  id: string;
  description: string;
  expectedBenefit: string;
  potentialImpact: number; // 1 a 5 (ou Impacto no cruzamento)
  probability?: number;    // 1 a 5 (Regra 3)
  impact?: number;         // 1 a 5 (Regra 3)
  criticality?: number;    // Score = Probabilidade * Impacto (Regra 4)
  priority: 'Baixa' | 'Média' | 'Alta';
  crossedFactors: string[];
  justification?: string;   // Justificativa curta (Regra 8)
  suggestedAction?: string; // Ação sugerida (Regra 8)
}

export interface ActionPlanItem {
  id: string;
  type: 'Risco' | 'Oportunidade';
  relatedId: string; // ID do risco ou oportunidade associado
  relatedDescription: string;
  // 5W2H
  what: string;      // What (O que fazer)
  why: string;       // Why (Por que fazer)
  where: string;     // Where (Onde será feito)
  when: string;      // When (Quando / Prazo)
  who: string;       // Who (Quem será o responsável)
  how: string;       // How (Como será feito / Procedimento)
  howMuch: string;   // How much (Quanto custará / Recursos)
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  suggestedKrs?: string[]; // Sugestões de Key Results (KRs) para monitoramento
  completed?: boolean;     // Status de conclusão: true = Concluído/Realizado, false/undefined = Pendente/Previsto

  // Mês (0-11) em que o plano foi originalmente previsto, congelado na primeira
  // gravação e nunca sobrescrito por alterações posteriores de "when".
  // Usado como baseline para o Painel de Desempenho.
  originalDeadlineMonth?: number | null;
  // Classificação da conclusão, definida pelo usuário ao marcar o plano como concluído.
  completionType?: 'no_prazo' | 'atrasado' | null;
  // Mês (0-11) em que a conclusão realmente ocorreu. Igual a originalDeadlineMonth
  // quando completionType é 'no_prazo'; informado manualmente quando 'atrasado'.
  actualCompletionMonth?: number | null;
}

export interface StrategicAnalysisResponse {
  risks: RiskItem[];
  opportunities: OpportunityItem[];
  actionPlans: ActionPlanItem[];
}
