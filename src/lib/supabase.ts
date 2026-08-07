import { createClient } from "@supabase/supabase-js";
import { OmiActionPlan } from "../components/OmiActionPlansTab";
import { SwotItem, RiskItem, OpportunityItem, ActionPlanItem } from "../types";
import { parseMonthFromWhen } from "./planMonth";

// As chaves fornecidas pelo usuário para o Supabase ou salvas no localStorage
export function getSavedSupabaseConfig() {
  const env = (import.meta as any).env || {};
  const url = localStorage.getItem("custom_supabase_url") || env.VITE_SUPABASE_URL || "https://dcaazjqckvfqmgdapooj.supabase.co";
  const key = localStorage.getItem("custom_supabase_anon_key") || env.VITE_SUPABASE_ANON_KEY || "sb_publishable_OR5xjC4W7XAwAHQA8dk8kw_5pBrSIhz";
  return { url, key };
}

const initialConfig = getSavedSupabaseConfig();
export let supabase = createClient(initialConfig.url, initialConfig.key); 

export function updateSupabaseClient(url: string, key: string) {
  localStorage.setItem("custom_supabase_url", url ? url.trim() : "");
  localStorage.setItem("custom_supabase_anon_key", key ? key.trim() : "");
  supabase = createClient(url ? url.trim() : "", key ? key.trim() : "");
}

// --- SWOT ITEMS ---
export async function getSwotItems(): Promise<SwotItem[] | null> {
  try {
    const { data, error } = await supabase
      .from("swot_items")
      .select("*")
      .order("created_at", { ascending: true });
    
    if (error) {
      console.warn("Erro ao buscar swot_items no Supabase. O banco de dados foi configurado com o SQL fornecido?", error.message);
      return null;
    }
    return data as SwotItem[];
  } catch (err) {
    console.error("Falha na requisição getSwotItems:", err);
    return null;
  }
}

export async function saveSwotItems(items: SwotItem[]): Promise<{ success: boolean; error?: any }> {
  try {
    if (items.length === 0) {
      // Se a lista estiver vazia, podemos limpar no banco
      const { error } = await supabase.from("swot_items").delete().neq("id", "none");
      if (error) return { success: false, error };
      return { success: true };
    }

    // --- RECONCILIAÇÃO PARANÓICA (LIMPAR ÓRFÃOS) ---
    const { data: existing } = await supabase.from("swot_items").select("id");
    if (existing && existing.length > 0) {
      const currentIds = new Set(items.map(item => item.id));
      const orphans = existing.map(e => e.id).filter(id => !currentIds.has(id));
      if (orphans.length > 0) {
        await supabase.from("swot_items").delete().in("id", orphans);
      }
    }

    const formatted = items.map(item => ({
      id: item.id,
      category: item.category,
      description: item.description,
      score: item.score || null,
      action: item.action || null,
      processes: item.processes || null,
      stakeholders: item.stakeholders || null
    }));

    const { error } = await supabase.from("swot_items").upsert(formatted);
    if (error) {
      console.warn("Erro ao salvar swot_items no Supabase:", error.message);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.error("Falha na requisição saveSwotItems:", err);
    return { success: false, error: err };
  }
}

export async function deleteSwotItemFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("swot_items").delete().eq("id", id);
    return !error;
  } catch (err) {
    console.error("Falha na deleção de swot_item:", err);
    return false;
  }
}

// --- RISKS ---
export async function getRisks(): Promise<RiskItem[] | null> {
  try {
    const { data, error } = await supabase
      .from("risks")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Erro ao buscar risks no Supabase:", error.message);
      return null;
    }

    // Mapear snake_case para camelCase
    return data.map((r: any) => ({
      id: r.id,
      description: r.description,
      probableCause: r.probable_cause,
      impact: r.impact,
      probability: r.probability,
      criticality: r.criticality,
      criticalityClass: r.criticality_class,
      crossedFactors: Array.isArray(r.crossed_factors) ? r.crossed_factors : []
    })) as RiskItem[];
  } catch (err) {
    console.error("Falha no getRisks:", err);
    return null;
  }
}

export async function saveRisks(items: RiskItem[]): Promise<{ success: boolean; error?: any }> {
  try {
    if (items.length === 0) {
      const { error } = await supabase.from("risks").delete().neq("id", "none");
      if (error) return { success: false, error };
      return { success: true };
    }

    // --- RECONCILIAÇÃO PARANÓICA (LIMPAR ÓRFÃOS) ---
    const { data: existing } = await supabase.from("risks").select("id");
    if (existing && existing.length > 0) {
      const currentIds = new Set(items.map(item => item.id));
      const orphans = existing.map(e => e.id).filter(id => !currentIds.has(id));
      if (orphans.length > 0) {
        await supabase.from("risks").delete().in("id", orphans);
      }
    }

    const formatted = items.map(r => ({
      id: r.id,
      description: r.description,
      probable_cause: r.probableCause,
      impact: r.impact,
      probability: r.probability,
      criticality: r.criticality,
      criticality_class: r.criticalityClass,
      crossed_factors: r.crossedFactors || []
    }));

    const { error } = await supabase.from("risks").upsert(formatted);
    if (error) {
      console.error("Erro detalhado no saveRisks:", error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.error("Falha fatal no saveRisks:", err);
    return { success: false, error: err };
  }
}

export async function deleteRiskFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("risks").delete().eq("id", id);
    return !error;
  } catch (err) {
    console.error("Falha no deleteRiskFromDb:", err);
    return false;
  }
}

// --- OPPORTUNITIES ---
export async function getOpportunities(): Promise<OpportunityItem[] | null> {
  try {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Erro ao buscar opportunities no Supabase:", error.message);
      return null;
    }

    return data.map((o: any) => ({
      id: o.id,
      description: o.description,
      expectedBenefit: o.expected_benefit,
      potentialImpact: o.potential_impact,
      priority: o.priority,
      crossedFactors: Array.isArray(o.crossed_factors) ? o.crossed_factors : []
    })) as OpportunityItem[];
  } catch (err) {
    console.error("Falha no getOpportunities:", err);
    return null;
  }
}

export async function saveOpportunities(items: OpportunityItem[]): Promise<{ success: boolean; error?: any }> {
  try {
    if (items.length === 0) {
      const { error } = await supabase.from("opportunities").delete().neq("id", "none");
      if (error) return { success: false, error };
      return { success: true };
    }

    // --- RECONCILIAÇÃO PARANÓICA (LIMPAR ÓRFÃOS) ---
    const { data: existing } = await supabase.from("opportunities").select("id");
    if (existing && existing.length > 0) {
      const currentIds = new Set(items.map(item => item.id));
      const orphans = existing.map(e => e.id).filter(id => !currentIds.has(id));
      if (orphans.length > 0) {
        await supabase.from("opportunities").delete().in("id", orphans);
      }
    }

    const formatted = items.map(o => ({
      id: o.id,
      description: o.description,
      expected_benefit: o.expectedBenefit,
      potential_impact: o.potentialImpact,
      priority: o.priority,
      crossed_factors: o.crossedFactors || []
    }));

    const { error } = await supabase.from("opportunities").upsert(formatted);
    if (error) {
      console.error("Erro detalhado no saveOpportunities:", error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.error("Falha fatal no saveOpportunities:", err);
    return { success: false, error: err };
  }
}

export async function deleteOpportunityFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("opportunities").delete().eq("id", id);
    return !error;
  } catch (err) {
    console.error("Falha no deleteOpportunityFromDb:", err);
    return false;
  }
}

// --- ACTION PLANS ---
export async function getActionPlans(): Promise<ActionPlanItem[] | null> {
  try {
    const { data, error } = await supabase
      .from("action_plans")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Erro ao buscar action_plans no Supabase:", error.message);
      return null;
    }

    return data.map((a: any) => ({
      id: a.id,
      type: a.type,
      relatedId: a.related_id,
      relatedDescription: a.related_description,
      what: a.what,
      why: a.why,
      where: a.where,
      when: a.when,
      who: a.who,
      how: a.how,
      howMuch: a.how_much,
      priority: a.priority,
      suggestedKrs: Array.isArray(a.suggested_krs) ? a.suggested_krs : [],
      completed: a.completed ?? false,
      originalDeadlineMonth: a.original_deadline_month ?? null,
      completionType: a.completion_type ?? null,
      actualCompletionMonth: a.actual_completion_month ?? null
    })) as ActionPlanItem[];
  } catch (err) {
    console.error("Falha no getActionPlans:", err);
    return null;
  }
}

export async function saveActionPlans(items: ActionPlanItem[]): Promise<{ success: boolean; error?: any }> {
  try {
    if (items.length === 0) {
      const { error } = await supabase.from("action_plans").delete().neq("id", "none");
      if (error) return { success: false, error };
      return { success: true };
    }

    // --- RECONCILIAÇÃO PARANÓICA (LIMPAR ÓRFÃOS) ---
    const { data: existing } = await supabase.from("action_plans").select("id");
    if (existing && existing.length > 0) {
      const currentIds = new Set(items.map(item => item.id));
      const orphans = existing.map(e => e.id).filter(id => !currentIds.has(id));
      if (orphans.length > 0) {
        await supabase.from("action_plans").delete().in("id", orphans);
      }
    }

    const formatted = items.map(a => {
      // Congela o prazo original na primeira gravação do plano. Uma vez definido,
      // este valor nunca é recalculado aqui (e o banco também trava isso via trigger),
      // então alterações posteriores de "when" não afetam mais o Painel de Desempenho.
      const originalDeadlineMonth = a.originalDeadlineMonth ?? parseMonthFromWhen(a.when);

      return {
        id: a.id,
        type: a.type,
        related_id: a.relatedId,
        related_description: a.relatedDescription,
        what: a.what,
        why: a.why,
        where: a.where,
        when: a.when,
        who: a.who,
        how: a.how,
        how_much: a.howMuch,
        priority: a.priority,
        suggested_krs: a.suggestedKrs || [],
        completed: a.completed ?? false,
        original_deadline_month: originalDeadlineMonth,
        completion_type: a.completionType ?? null,
        actual_completion_month: a.actualCompletionMonth ?? null
      };
    });

    const { error } = await supabase.from("action_plans").upsert(formatted);
    if (error) {
      console.error("Erro detalhado no saveActionPlans:", error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.error("Falha fatal no saveActionPlans:", err);
    return { success: false, error: err };
  }
}

export async function deleteActionPlanFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("action_plans").delete().eq("id", id);
    return !error;
  } catch (err) {
    console.error("Falha no deleteActionPlanFromDb:", err);
    return false;
  }
}

export async function deleteActionPlansByRelatedId(relatedId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("action_plans").delete().eq("related_id", relatedId);
    return !error;
  } catch (err) {
    console.error("Falha ao deletar planos de ação por relatedId:", err);
    return false;
  }
}


// --- OMI ACTION PLANS ---

export async function getOmiActionPlans(): Promise<OmiActionPlan[] | null> {
  try {
    const { data, error } = await supabase
      .from("omi_action_plans")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Erro ao buscar omi_action_plans:", error.message);
      return null;
    }

    return data.map((a: any) => ({
      id: a.id,
      committee: a.committee,
      action: a.action,
      responsible: a.responsible,
      email: a.email,
      deadline: a.deadline,
      completionDate: a.completion_date,
      status: a.status
    })) as OmiActionPlan[];
  } catch (err) {
    console.error("Falha no getOmiActionPlans:", err);
    return null;
  }
}

export async function saveOmiActionPlans(
  items: OmiActionPlan[]
): Promise<{ success: boolean; error?: any }> {
  try {
    if (items.length === 0) {
      const { error } = await supabase
        .from("omi_action_plans")
        .delete()
        .neq("id", "none");

      if (error) return { success: false, error };

      return { success: true };
    }

    const { data: existing } = await supabase
      .from("omi_action_plans")
      .select("id");

    if (existing && existing.length > 0) {
      const currentIds = new Set(items.map(item => item.id));

      const orphans = existing
        .map(e => e.id)
        .filter(id => !currentIds.has(id));

      if (orphans.length > 0) {
        await supabase
          .from("omi_action_plans")
          .delete()
          .in("id", orphans);
      }
    }

    const formatted = items.map(item => ({
      id: item.id,
      committee: item.committee,
      action: item.action,
      responsible: item.responsible,
      email: item.email,
      deadline: item.deadline,
      completion_date: item.completionDate,
      status: item.status
    }));

    const { error } = await supabase
      .from("omi_action_plans")
      .upsert(formatted);

    if (error) {
      console.error("Erro ao salvar omi_action_plans:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error("Falha no saveOmiActionPlans:", err);
    return { success: false, error: err };
  }
}

export async function deleteOmiActionPlanFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("omi_action_plans")
      .delete()
      .eq("id", id);

    return !error;
  } catch (err) {
    console.error("Falha no deleteOmiActionPlanFromDb:", err);
    return false;
  }
}

// --- OMI INDICATOR MONTHLY RESULTS ---

export interface OmiIndicatorResult {
  id?: number;
  indicatorId: string;
  year: number;
  month: number;
  result: number | null;
}

export async function getOmiIndicatorResults(
  year: number,
  month: number
): Promise<OmiIndicatorResult[] | null> {
  try {
    const { data, error } = await supabase
      .from("omi_indicator_results")
      .select("*")
      .eq("year", year)
      .eq("month", month)
      .order("indicator_id", { ascending: true });

    if (error) {
      console.warn(
        "Erro ao buscar resultados mensais dos indicadores OMI:",
        error.message
      );
      return null;
    }

    return data.map((item: any) => ({
      id: item.id,
      indicatorId: item.indicator_id,
      year: item.year,
      month: item.month,
      result: item.result === null ? null : Number(item.result)
    }));
  } catch (error) {
    console.error(
      "Falha ao buscar resultados mensais dos indicadores OMI:",
      error
    );
    return null;
  }
}

export async function getOmiIndicatorResultsByYear(
  year: number
): Promise<OmiIndicatorResult[] | null> {
  try {
    const { data, error } = await supabase
      .from("omi_indicator_results")
      .select("*")
      .eq("year", year)
      .order("indicator_id", { ascending: true })
      .order("month", { ascending: true });

    if (error) {
      console.warn(
        "Erro ao buscar resultados anuais dos indicadores OMI:",
        error.message
      );
      return null;
    }

    return data.map((item: any) => ({
      indicatorId: item.indicator_id,
      year: item.year,
      month: item.month,
      result:
        item.result !== null
          ? Number(item.result)
          : null
    }));
  } catch (error) {
    console.error(
      "Falha ao buscar resultados anuais dos indicadores OMI:",
      error
    );
    return null;
  }
}

export async function saveOmiIndicatorResults(
  items: OmiIndicatorResult[]
): Promise<{ success: boolean; error?: any }> {
  try {
    if (items.length === 0) {
      return { success: true };
    }

    const formatted = items.map((item) => ({
      indicator_id: item.indicatorId,
      year: item.year,
      month: item.month,
      result: item.result,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from("omi_indicator_results")
      .upsert(formatted, {
        onConflict: "indicator_id,year,month"
      });

    if (error) {
      console.error(
        "Erro ao salvar resultados mensais dos indicadores OMI:",
        error
      );

      return {
        success: false,
        error
      };
    }

    return { success: true };
  } catch (error) {
    console.error(
      "Falha ao salvar resultados mensais dos indicadores OMI:",
      error
    );

    return {
      success: false,
      error
    };
  }
}

// --- OMI INDICATOR SETTINGS ---

export type OmiFinalMeasurement =
  | "last"
  | "average"
  | "sum"
  | "ytd";

export interface OmiIndicatorSetting {
  indicatorId: string;
  finalMeasurement: OmiFinalMeasurement;
}

export async function getOmiIndicatorSettings(): Promise<
  OmiIndicatorSetting[] | null
> {
  try {
    const { data, error } = await supabase
      .from("omi_indicator_settings")
      .select("*")
      .order("indicator_id", { ascending: true });

    if (error) {
      console.warn(
        "Erro ao buscar mensurações finais dos indicadores OMI:",
        error.message
      );
      return null;
    }

    return data.map((item: any) => ({
      indicatorId: item.indicator_id,
      finalMeasurement: item.final_measurement as OmiFinalMeasurement
    }));
  } catch (error) {
    console.error(
      "Falha ao buscar mensurações finais dos indicadores OMI:",
      error
    );
    return null;
  }
}

export async function saveOmiIndicatorSettings(
  items: OmiIndicatorSetting[]
): Promise<{ success: boolean; error?: any }> {
  try {
    if (items.length === 0) {
      return { success: true };
    }

    const formatted = items.map((item) => ({
      indicator_id: item.indicatorId,
      final_measurement: item.finalMeasurement,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from("omi_indicator_settings")
      .upsert(formatted, {
        onConflict: "indicator_id"
      });

    if (error) {
      console.error(
        "Erro ao salvar mensurações finais dos indicadores OMI:",
        error
      );

      return {
        success: false,
        error
      };
    }

    return { success: true };
  } catch (error) {
    console.error(
      "Falha ao salvar mensurações finais dos indicadores OMI:",
      error
    );

    return {
      success: false,
      error
    };
  }
}