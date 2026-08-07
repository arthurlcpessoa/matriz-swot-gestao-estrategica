-- ============================================================
-- 1. NOVAS COLUNAS na tabela action_plans
-- ============================================================

-- Prazo ORIGINAL congelado (0=Janeiro ... 11=Dezembro).
-- É a baseline oficial para o indicador. Nunca deve ser sobrescrito
-- depois de definido (ver trigger na seção 3).
ALTER TABLE action_plans
  ADD COLUMN IF NOT EXISTS original_deadline_month SMALLINT;

-- Classificação da conclusão: só é preenchida quando completed = true.
-- 'no_prazo'  -> concluído dentro do prazo originalmente previsto
-- 'atrasado'  -> concluído depois do prazo originalmente previsto
ALTER TABLE action_plans
  ADD COLUMN IF NOT EXISTS completion_type TEXT;

-- Mês em que a conclusão REALMENTE ocorreu (0-11).
-- Quando completion_type = 'no_prazo', este valor é igual a original_deadline_month.
-- Quando completion_type = 'atrasado', é o mês informado pelo usuário no modal.
ALTER TABLE action_plans
  ADD COLUMN IF NOT EXISTS actual_completion_month SMALLINT;

-- ============================================================
-- 2. VALIDAÇÕES (garantem que só entrem valores válidos)
-- Criadas de forma idempotente: cada bloco checa em pg_constraint
-- se a constraint já existe antes de tentar criá-la, permitindo
-- reexecutar o script inteiro sem erro caso uma rodada anterior
-- tenha sido interrompida no meio.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'action_plans_original_deadline_month_check'
  ) THEN
    ALTER TABLE action_plans
      ADD CONSTRAINT action_plans_original_deadline_month_check
      CHECK (original_deadline_month IS NULL OR original_deadline_month BETWEEN 0 AND 11);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'action_plans_actual_completion_month_check'
  ) THEN
    ALTER TABLE action_plans
      ADD CONSTRAINT action_plans_actual_completion_month_check
      CHECK (actual_completion_month IS NULL OR actual_completion_month BETWEEN 0 AND 11);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'action_plans_completion_type_check'
  ) THEN
    ALTER TABLE action_plans
      ADD CONSTRAINT action_plans_completion_type_check
      CHECK (completion_type IS NULL OR completion_type IN ('no_prazo', 'atrasado'));
  END IF;
END $$;

-- ============================================================
-- 3. TRIGGER DE IMUTABILIDADE do prazo original
-- Garante, no próprio banco, que uma vez definido,
-- original_deadline_month nunca é sobrescrito — mesmo que a
-- aplicação envie um valor diferente num upsert em lote.
-- ============================================================

CREATE OR REPLACE FUNCTION lock_action_plan_original_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.original_deadline_month IS NOT NULL THEN
    NEW.original_deadline_month := OLD.original_deadline_month;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lock_action_plan_original_deadline ON action_plans;

CREATE TRIGGER trg_lock_action_plan_original_deadline
BEFORE UPDATE ON action_plans
FOR EACH ROW
EXECUTE FUNCTION lock_action_plan_original_deadline();

-- ============================================================
-- 4. MIGRAÇÃO DE DADOS EXISTENTES (segura, não destrutiva)
-- ============================================================

-- 4a. Preenche o prazo original a partir do texto livre em "when",
-- usando a mesma heurística de nomes de mês (pt-BR) já usada no
-- front-end (parseMonthFromWhen). Só roda onde ainda está NULL,
-- então é seguro rodar mais de uma vez.
UPDATE action_plans
SET original_deadline_month = CASE
  WHEN "when" ILIKE '%janeiro%'  OR "when" ILIKE '%jan%' THEN 0
  WHEN "when" ILIKE '%fevereiro%' OR "when" ILIKE '%fev%' THEN 1
  WHEN "when" ILIKE '%março%' OR "when" ILIKE '%marco%' OR "when" ILIKE '%mar%' THEN 2
  WHEN "when" ILIKE '%abril%' OR "when" ILIKE '%abr%' THEN 3
  WHEN "when" ILIKE '%maio%' OR "when" ILIKE '%mai%' THEN 4
  WHEN "when" ILIKE '%junho%' OR "when" ILIKE '%jun%' THEN 5
  WHEN "when" ILIKE '%julho%' OR "when" ILIKE '%jul%' THEN 6
  WHEN "when" ILIKE '%agosto%' OR "when" ILIKE '%ago%' THEN 7
  WHEN "when" ILIKE '%setembro%' OR "when" ILIKE '%set%' THEN 8
  WHEN "when" ILIKE '%outubro%' OR "when" ILIKE '%out%' THEN 9
  WHEN "when" ILIKE '%novembro%' OR "when" ILIKE '%nov%' THEN 10
  WHEN "when" ILIKE '%dezembro%' OR "when" ILIKE '%dez%' THEN 11
  WHEN "when" ~ '(0[1-9]|1[0-2])' THEN (regexp_match("when", '(0[1-9]|1[0-2])'))[1]::int - 1
  ELSE NULL
END
WHERE original_deadline_month IS NULL;

-- 4b. Para planos JÁ concluídos antes desta feature (sem forma de
-- saber se foram no prazo ou não), classifica como "no_prazo" no
-- mês do próprio prazo original — preserva o comportamento visual
-- que o painel já tinha até hoje. Não afeta planos concluídos daqui
-- para frente (esses passam pelo novo fluxo com o modal).
UPDATE action_plans
SET completion_type = 'no_prazo',
    actual_completion_month = original_deadline_month
WHERE completed = true
  AND completion_type IS NULL;
