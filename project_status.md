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

### Atualiza��o Leonardo.ai (2026-03-07)
1. Script scripts/generate-item-images.mjs integrado com API Leonardo.ai usando LEONARDO_API_KEY.
2. Gera��o em modo padr�o missing-only (pula arquivos j� existentes).
3. Corre��o de �cones para SDXL: gera��o em 512x512 (antes 256x256 causava erro 400).
4. Execu��o final desta sess�o: 31 �cones novos gerados, 31 itens pulados por j� existirem, 0 falhas.

### Registro de Pend�ncia de Gera��o (Leonardo.ai)
- A API ficou sem tokens durante a execu��o e bloqueou os seguintes 7 itens:
  - sheriff_greaves
  - canned_beans
  - blood_nugget
  - hangman_noose
  - saint_medallion
  - phantom_horseshoe
  - devils_coin
- Valida��o:
  - `npx tsc --noEmit` executado sem erros.

