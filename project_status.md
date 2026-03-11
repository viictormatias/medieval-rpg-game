# Far West - Status do Projeto

## Estado Atual
O projeto está em fase de polimento de UI e expansão de conteúdo (legendários). Recentemente foram implementadas correções críticas nos tooltips do inventário para garantir visibilidade total.

## Funcionalidades Implementadas
- **Sistema de Duelo (Arena):** Combate funcional com log em tempo real e barras dinâmicas.
- **Inventário:** Gerenciamento de itens, equipamentos e consumíveis.
- **Loja da Fronteira:** Compra e venda de itens com requisitos Souls-like.
- **Atributos:** FOR, DEF, AGI, PON, VIG com scaling em armas e bônus de equipamento.
- **Artes Lendárias:** 50+ novas imagens realistas para armas e acessórios de tier alto.
- **Correção de UI (Tooltips):** 
    - Tooltips de itens equipados agora detectam a borda da tela e abrem para a esquerda.
    - Z-index forçado (10000) para garantir que o card flutue sobre qualquer outro container.
    - Removido `overflow-hidden` dos painéis principais que causavam corte lateral (clipping).

## Pendências Imediatas
1. **Cards de Trabalho:** Gerar 12 artes únicas para as missões (Aguardando reset de cota de API).
2. **Comparação de Itens:** Implementar visualização de "Equipado vs. Selecionado" no inventário.
3. **Equilíbrio:** Revisar tabelas de XP e dano para o endgame (Nível 50-60).

## Erros ou Bloqueios Conhecidos
- **Cota de API:** Limite diário atingido para geração de novas imagens hoje.
- **Build Cache:** Recomenda-se rodar `rm -rf .next` caso ocorram erros de 404 em arquivos internos após grandes mudanças.

## Próximos Passos Sugeridos
1. **Geração de Imagens:** Assim que a cota resetar, rodar `node scripts/generate-job-images.mjs`.
2. **Refonte de Itens:** Substituir as imagens de itens genéricos (poções, botas simples) por versões geradas mais únicas.
3. **Feedback Sonoro:** Adicionar efeitos de áudio para cliques, compras e disparos na arena.
