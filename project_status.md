# Status do Projeto - Far West RPG

## 1. Estado Atual
O jogo está estável, com as mecânicas de progressão (nível 60) e caps de status (80) implementados. A economia e os itens foram balanceados. A interface de inventário e duelo está refinada.

## 2. Funcionalidades Implementadas
- **Cap de Nível:** 60 (com curva de XP ajustada).
- **Cap de Atributos:** 80 (via banco de dados).
- **Rebalanceamento Total:** Todos os itens de sets e base ajustados.
- **Novas Armas Lendárias:** Imagens ultra-realistas geradas e aplicadas nos sets (Lobo, Xama, Fantasma, Xerife).
- **Correção de Jobs:** Buffer de tempo adicionado para evitar erros de coleta (Corrigido).

## 3. Pendências Imediatas
- Gerar imagens únicas para os 12 cards de trabalho (Aguardando reset de cota ou nova chave API).
- Aplicar melhorias em itens comuns/incomuns que ainda usam templates repetidos (hue-shift).

## 4. Erros ou Bloqueios Conhecidos
- **API Quota:** Chaves de API atuais (Gemini/Leonardo) atingiram o limite de uso automatizado hoje.
- **Geração Interna:** A cota interna de geração de imagens também foi atingida durante esta sessão.

## 5. Próximos Passos Sugeridos
1. Assim que a cota resetar, rodar `node scripts/generate-job-images.mjs` para finalizar os cards de trabalho.
2. Identificar mais 10 armas de tiers inferiores que ainda usam imagens repetidas para substituição.
3. Testar o fluxo de "Claim Job" no jogo para confirmar se o buffer de 2s resolveu o problema para o usuário.
