-- ============================================================
-- CORREÇÃO: trigger de imutabilidade do prazo original passa a
-- travar SÓ depois que o plano já foi concluído.
--
-- Antes: original_deadline_month ficava travado assim que fosse
-- definido pela primeira vez, mesmo em planos ainda em aberto —
-- por isso o dropdown "Atualizar Prazo Atual" no Painel de
-- Desempenho não conseguia mover um plano de mês (Previstos,
-- gráfico e tabela continuavam com o valor antigo).
--
-- Depois: planos em aberto (completed = false) podem ter o prazo
-- original reatribuído livremente — é replanejamento normal. Só
-- quando o plano já foi marcado como concluído (no prazo ou com
-- atraso) é que o prazo original passa a ficar travado para sempre,
-- preservando o histórico real de desempenho.
-- ============================================================

CREATE OR REPLACE FUNCTION lock_action_plan_original_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.completed = true AND OLD.original_deadline_month IS NOT NULL THEN
    NEW.original_deadline_month := OLD.original_deadline_month;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Não é necessário recriar a trigger em si (trg_lock_action_plan_original_deadline)
-- — ela já aponta para esta função, então só o corpo da função muda.
