# Project Status - Velmora

## 1. Estado Atual
Projeto em fase avancada com UI dark medieval e mecanicas centrais no estilo Souls-like ja integradas.

O game agora combina:
- onboarding com planejamento de build
- sistema de equipamentos multi-slot com paperdoll visual de silhueta humana
- combate com calculos de carga, requisitos e escalonamento
- tela de status organizada com todos os dados visíveis
- base pronta para retratos de classe gerados por IA

## 2. Funcionalidades Implementadas

### Core Souls-like
- Motor de calculo em `src/lib/soulslike.ts` com:
  - `equip load` maximo e atual
  - tiers de mobilidade (`light`, `medium`, `heavy`, `overloaded`)
  - bonus de esquiva e penalidade de stamina por tier
  - `attack rating` por scaling de arma
  - penalidade por requisito nao atendido

### Combate
- `ArenaTab` atualizado para consumir estatisticas derivadas do sistema Souls-like.
- Painel de combate agora exibe estado da carga e alertas de requisito faltando.

### Inventario e Equipamentos (atualizado)
- Paperdoll redesenhado com layout de silhueta humana:
  - Coluna central (de cima para baixo): Capacete → Peitoral (com SVG de silhueta) → Luvas → Calças → Botas
  - Coluna esquerda: Arma + Escudo + painel de bônus de stats
  - Coluna direita: Resumo Souls-like (carga, tier, AR) + lista de itens equipados
  - Slots com tooltip rico (stats, raridade, requisitos, peso)
  - Drag & drop entre bolsa e paperdoll mantido
  - Grid da bolsa (10×3) com hover scale e borda por raridade

### Tela de Status (atualizado)
- Removido: texto "Resumo Souls-like"
- Cabeçalho do personagem com avatar, nome, nível e build archetype
- Barras animadas de HP e XP
- Cards de atributos com pips coloridos por stat + botão de gasto de ponto
- Painel de combate à direita com: Attack Rating, Build, Carga (barra visual + tier + %), Bônus Esquiva, Penalidade Stamina, aviso de requisitos faltando
- Painel separado de Bônus de Equipamento

### Itens e Loja
- Catalogo de itens expandido com:
  - `weight`, `requirements`, `scaling`, novos tipos de item
- Loja com filtros por todos os slots e informacoes detalhadas de build.
- Itens: 5 helmet, 5 gloves, 5 legs, 5 boots, peitorais do tipo `chest`

### Onboarding de Personagem
- Criacao de personagem com distribuicao inicial de status.
- 8 pontos totais obrigatorios, maximo 4 por atributo, validacao dupla (frontend/backend)
- Presets: Balanceada, Forca, Destreza, Tanque

### Google AI / Nano Banana
- API key validada e modelos disponiveis consultados.
- Script de geracao de retratos criado (`scripts/generate-class-images.mjs`).
- Integracao visual pronta na tela de classes (`/classes/*.png`).
- Fallback de imagem implementado em `CharacterPortrait`.

## 3. Bloqueios Conhecidos
- Geracao de imagem via Gemini/Nano Banana bloqueada por quota:
  - `HTTP 429 RESOURCE_EXHAUSTED`
  - limite free tier atual em `0` para modelos de imagem
- Para desbloquear: habilitar billing/quota no Google AI Studio/Cloud.

## 4. Qualidade Tecnica
- `npx tsc --noEmit` passando para todas as alteracoes recentes (InventoryTab + StatusTab).
- Existem warnings/erros de lint preexistentes no projeto em arquivos antigos.

## 5. Proximos Passos Sugeridos
1. Adicionar animação de transição ao equipar/desequipar itens no paperdoll.
2. Incluir silhueta SVG mais detalhada ou sprite de personagem no centro do paperdoll.
3. Ativar quota de imagem no Google AI e rodar `node scripts/generate-class-images.mjs`.
4. Balancear curva de progressao por classe (soft caps e custo por level).
5. Persistir no banco metricas de build derivadas (ex.: attack rating e equip tier) para analytics.
6. Revisar lint legacy para reduzir ruido tecnico nas proximas sprints.
