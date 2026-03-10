## Project Status - 2026-03-10

### Resumo
O projeto esta funcional e com progresso consistente em combate, economia, itens e progressao. As tarefas recentes pedidas foram implementadas no codigo e validadas com lint.

### Concluido
- Seguranca server-side para acoes criticas de jogo.
- Sistema de imagens com compressao automatica no build/dev (`prebuild` e `predev` com `scripts/optimize-images.mjs`).
- Rebalanceamento global de itens (peso por raridade/slot/preco) com controle de `vigor`.
- Progressao com limite de nivel maximo `60`.
- Nova curva de XP mais dificil para progressao ate o nivel maximo.
- Rebalanceamento de recompensas de arena (XP/Gold) com multiplicador por dificuldade relativa.
- Rebalanceamento de recompensas de jobs com penalidade anti-farm para jobs muito abaixo do nivel do jogador.
- Limitadores de atributos base no backend (`strength/defense/agility/accuracy/vigor` com cap de 80).
- Onboarding atualizado: criacao sem distribuicao inicial e com `5` pontos livres para distribuir depois.
- UI atualizada para curva de XP nova e exibicao de nivel maximo (`MAX`) em Header/Status.

### Em Aberto / Dependencias Operacionais
- Aplicar migration no banco para reforcar caps no Postgres:
  - `supabase/migrations/20260310113000_cap_level_and_stats.sql`
- Subir o ultimo lote de alteracoes para o GitHub (ainda local no workspace).

### Arquivos-chave alterados nesta etapa
- `src/app/api/game/action/route.ts`
- `src/lib/progression.ts`
- `src/components/Header.tsx`
- `src/components/StatusTab.tsx`
- `src/components/ClassSelectionScreen.tsx`
- `src/lib/gameActions.ts`
- `supabase/migrations/20260310113000_cap_level_and_stats.sql`

### Validacao
- `npm run lint` executado com sucesso.
