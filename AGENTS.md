# Regras do Projeto (AGENTS.md)

Este arquivo contém instruções críticas que os agentes do Google AI Studio Build devem seguir rigorosamente em qualquer futura edição ou atualização deste aplicativo.

## Diretrizes de Escopo e Proteção de Dados

1. **PROIBIDO ALTERAR OS PLANOS DE AÇÃO INTEGRADOS**:
   - Os planos de ação mapeados e definidos no arquivo `/src/data/templates.ts` (na constante `ACLF_DEFAULT_ACTION_PLANS`) estão consolidados e em conformidade estrita com a planilha de planejamento estratégico do usuário.
   - **Sob nenhuma circunstância** os agentes devem modificar, excluir, adicionar novos planos de ação padrão, ou alterar os campos (`what`, `why`, `where`, `when`, `who`, `priority`, etc.) dos planos já existentes nesta constante ou no fluxo de cache/inicialização, a menos que o usuário peça explicitamente por escrito em um prompt futuro.
   - Qualquer tentativa de re-gerar, re-inicializar ou auto-completar planos de mitigação deve ser evitada para respeitar a estrutura atual de correspondência exata.
