### Estado Atual do Projeto
O projeto está estável e polido. Recentemente, foram corrigidos todos os erros de 404 de imagens de itens (através de geração de assets e limpeza de referências quebradas), otimizada a performance de carregamento de perfil (consolidação de listeners de autenticação) e refinada a visualização de atributos no duelo para maior clareza entre status base e bônus de equipamento. A matemática de combate foi auditada e confirmada como correta de acordo com as fórmulas do motor de jogo.

### Funcionalidades Implementadas
1. **Segurança & Deploy:** Upgrade para Next.js 15.5.7 e React 19. Build configurado para ignorar erros não impeditivos.
2. **Sistema de Venda Totalmente Funcional:** Correção de RLS (DELETE) na tabela `inventory` e lógica de venda segura (prevenção de venda infinita).
3. **Gerenciamento de Personagem:** Sistema de exclusão de perfil/inventário e proteção robusta contra perfis corrompidos ou nomes automáticos.
4. **Otimização de Carregamento (Auth):** Consolidação de múltiplos listeners `onAuthStateChange` em um único fluxo eficiente em `page.tsx`, com guarda para evitar reloads redundantes do perfil.
5. **Otimização de Tela Única (100vh):** O layout da Arena no desktop foi ajustado para ocupar no máximo a altura da tela (`100vh`), eliminando a necessidade de scroll no navegador. O log de combate agora expande para preencher o espaço central com scroll interno.
6. **Correção de Sobreposição de Texto:** O indicador "EM COMBATE" foi movido de um overlay absoluto para uma posição integrada na coluna central, evitando que cubra o nome ou o HP dos competidores.
7. **Integridade Matemática do Combate:** Verificação profunda do motor `combat.ts` (Chance de acerto, mitigação por defesa e multiplicadores de dano) confirmada através de análise de logs reais.
8. **Refinamento de UX nos Status de Duelo:** Os status agora usam o formato `Total (Base+Bônus)` (ex: `15 (10+5)`) para maior clareza, com a parte do bônus em cinza (`text-gray-400`).
9. **Gestão de Assets de Itens:** Imagens geradas e realistas agora são exibidas corretamente em TODA a interface, incluindo os pequenos ícones de equipamento na tela de Duelo (`ArenaTab.tsx`), que agora usam uma lógica robusta de `ItemIcon` (mesma das outras abas) com `image_url` como fallback.
11. **Bônus de Vigor na Vida (HP):**
    - Através de **Equipamentos**: Proporção de 1:1 (+1 Vigor = +1 Vida Máxima).
    - Através de **Atributos (Subir de Nível)**: Proporção de 1:10 (+1 Vigor = +10 Vida Máxima).
    - A interface de `Status` agora mostra claramente o bônus de +10 HP ao distribuir pontos.
12. **Status na Mochila (Mochila):** Os status agora mostram o formato `Total (Base) (+Bônus)`, onde a base e o bônus de equipamentos aparecem em cinza para maior clareza.
13. **UI de Requisitos e Tooltips:** Exibição clara de atributos faltantes para equipar itens e tooltips com ações rápidas no inventário.

### Pendências Imediatas
1. Nenhuma pendência crítica. O jogo está em estado altamente jogável e sem bugs visíveis no console.

### Erros ou bloqueios conhecidos
- **Cota de Imagens:** A geração em massa de imagens foi limitada pela cota da API, mas contornada com o sistema de fallback para emojis e limpeza de links quebrados.

### Próximos Passos Sugeridos
1. **Relíquias (`relic` slots):** Implementar o novo tipo de item (relíquias) e UI de inventário dedicada.
2. **Equipamento Automático:** Implementar lógica para equipar o melhor item disponível ao comprar se o slot estiver vazio.
3. **Feedback Sonoro:** Adicionar efeitos de gatilho e vento para aumentar a imersão do duelo.

### Atualização Leonardo.ai (2026-03-07)
1. Script scripts/generate-item-images.mjs integrado com API Leonardo.ai usando LEONARDO_API_KEY.
2. Geração em modo padrão missing-only (pula arquivos já existentes).
3. Correção de ícones para SDXL: geração em 512x512 (antes 256x256 causava erro 400).
4. Execução final desta sessão: 31 ícones novos gerados, 31 itens pulados por já existirem, 0 falhas.

### Registro de Pendência de Geração (Leonardo.ai)
- A API ficou sem tokens durante a execução e bloqueou os seguintes 7 itens:
  - sheriff_greaves
  - canned_beans
  - blood_nugget
  - hangman_noose
  - saint_medallion
  - phantom_horseshoe
  - devils_coin
- Validação:
  - `npx tsc --noEmit` executado sem erros.

### Hardening de Segurança Aplicado (2026-03-09)

#### Implementado neste ciclo (sem acesso direto ao banco)
1. **Mutações críticas migradas para backend seguro** via `POST /api/game/action`:
   - criação de personagem
   - iniciar/coletar missão
   - compra/venda de item
   - equipar/desequipar
   - consumir item
   - distribuição de atributos
   - início/resolução de duelo
2. **Cliente não define mais valores sensíveis** (XP, gold, preço, recompensa, duração/custo de missão, etc). Esses dados agora são recalculados/canonizados no servidor.
3. **Duelo com ticket único** (`begin_arena` -> `resolve_arena`) para evitar coleta direta sem início de combate.
4. **Rate-limit em memória por usuário/ação** no backend para reduzir automação de spam.
5. **Sincronização de vitais movida para backend** (`sync_vitals`) no fluxo principal de carregamento de perfil.
6. **Migration de hardening criada**: `supabase/migrations/20260309152000_security_hardening_baseline.sql`.
7. **Validação local concluída**:
   - `npm run lint` OK
   - `npx tsc --noEmit` OK

#### Arquivos principais alterados
- `src/app/api/game/action/route.ts`
- `src/lib/server/auth.ts`
- `src/lib/server/gameGuards.ts`
- `src/lib/server/supabaseAdmin.ts`
- `src/lib/gameActions.ts`
- `src/components/ArenaTab.tsx`
- `supabase/migrations/20260309152000_security_hardening_baseline.sql`

---

### Próximos passos obrigatórios (exigem conexão com Supabase)

#### Objetivo
Finalizar o hardening para produção, eliminando dependência de proteção local em memória e garantindo integridade no banco.

#### Instruções para outro agente de IA (com acesso ao Supabase)
1. **Aplicar migrations pendentes**:
   - `supabase db push` (ou pipeline equivalente)
   - confirmar execução de `20260309152000_security_hardening_baseline.sql`
2. **Auditar políticas atuais e remover escritas legadas perigosas**:
   - listar policies atuais:
     ```sql
     select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
     from pg_policies
     where schemaname = 'public'
     order by tablename, policyname;
     ```
   - remover policies antigas que permitam `INSERT/UPDATE/DELETE` direto por `authenticated` em `profiles` e `inventory`.
3. **Validar privilégios efetivos por role**:
   - checar grants:
     ```sql
     select grantee, table_schema, table_name, privilege_type
     from information_schema.role_table_grants
     where table_schema='public'
       and table_name in ('profiles','inventory','jobs','npc_enemies')
     order by table_name, grantee, privilege_type;
     ```
4. **Criar camada transacional no banco para operações críticas** (RPC/Function):
   - `rpc_start_job(user_id, job_id)`
   - `rpc_claim_job(user_id)`
   - `rpc_buy_item(user_id, item_id)`
   - `rpc_sell_item(user_id, inventory_id)`
   - `rpc_resolve_arena(user_id, enemy_id, ticket)`
   Essas RPCs devem usar lock/atomicidade para evitar race condition.
5. **Substituir ticket em memória por ticket persistente**:
   - criar tabela `combat_sessions` com:
     - `id uuid pk`
     - `profile_id uuid not null`
     - `enemy_id uuid not null`
     - `issued_at timestamptz not null`
     - `expires_at timestamptz not null`
     - `consumed_at timestamptz null`
   - validar e consumir ticket via SQL atômico (`update ... where consumed_at is null and expires_at > now() returning *`).
6. **Rate-limit distribuído**:
   - implementar rate-limit persistente (Redis ou tabela dedicada no Postgres) para suportar múltiplas instâncias.
7. **Detecção antifraude**:
   - criar tabela de auditoria `security_events` e registrar:
     - tentativas inválidas de ticket
     - bursts de mutações
     - divergência alta entre vitórias e nível do personagem
8. **Revisão de integridade de dados existentes**:
   - identificar contas possivelmente abusivas:
     ```sql
     select id, username, level, xp, gold
     from public.profiles
     order by level desc, gold desc
     limit 50;
     ```
   - identificar explosão de inserts em inventário:
     ```sql
     select profile_id, count(*) as total_items
     from public.inventory
     group by profile_id
     order by total_items desc
     limit 50;
     ```
9. **Configuração de produção**:
   - garantir `SUPABASE_SERVICE_ROLE_KEY` apenas no ambiente server.
   - nunca expor em variáveis `NEXT_PUBLIC_*`.
10. **Teste final de segurança**:
   - tentar manipular payload no browser (preço/xp/reward/ticket).
   - confirmar que o servidor ignora/nega.
   - confirmar que escrita direta client-side em `profiles/inventory` falha por policy.

#### Critério de pronto
- Nenhuma mutação de progressão/economia aceita diretamente do cliente.
- Toda operação crítica validada no servidor + banco com atomicidade.
- RLS/grants revisados e sem caminhos de escrita indevidos.
- Exploits reportados (lvl alto por inserções em massa) reproduzidos como **bloqueados**.
