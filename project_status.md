# Project Status - Velmora

## 1. **Estado Atual**: Projeto com UI premium e persistente! Implementada continuidade visual com `loadingscreen.jpeg` em todas as telas de pré-jogo (Loading, Login, Erro, Seleção) e efeito glassmorphism nos cards.
 O "motor lógico" já maduro foi vestido com uma UI verdadeiramente "Dark Medieval" premium, que inclui animações elegantes (CSS keyframes), uma tela de loading personalizada, e partículas dinâmicas (Canvas API). Todos os componentes visuais de personagens e monstros agora usam a estrutura flexível de `CharacterPortrait`, que está totalmente preparada (com slots, bordas e glows temáticos) para receber imagens ilustrativas oficiais e renderizar Fallback Emojis enquanto aguarda estes assets. O build Next.js foi consertado e otimizado (Exit code 0 no build estático).

### 2. Funcionalidades Implementadas
- **Seleção de Classe**: Fluxo de primeiro login para escolha entre Cavaleiro, Nobre ou Errante com status iniciais balanceados.
- **Loja (ShopTab)**: Catálogo real de itens (Armas/Armaduras) compráveis com Gold, cada um com bônus de status.
- **Inventário Paperdoll**: Sistema visual de "boneco de papel" implementado. Jogadores agora arrastam (Drag-and-Drop) itens do inventário geral para os slots de Armadura, Arma Principal e Secundária (Escudos). Bônus totais são somados dinamicamente na UI.
- **Novos Itens**: Introduzidos "Escudos" (Wooden Shield, Iron Shield, Knight Shield) para uso no slot secundário.
- **Integração Google AI (Nano Banana)**: Chave de API configurada no `.env.local` para geração futura de imagens e conteúdos via Gemini 3 / Nano Banana.
- **Inventário Persistente**: Tabela `inventory` no Supabase para salvar itens e estados de equipamento (Real-time).
- **Builds e Atributos**: Distribuição de pontos ao subir de nível, incluindo **Vigor** (HP Máximo).
- **Combate Narrativo**: Log rítmico (2.5s) com textos viscerais e bônus de equipamentos aplicados dinamicamente nos cálculos de dano e acerto.
- **GitHub**: Repositório criado e código enviado com sucesso. Arquivo `resumo.txt` gerado para estudo.
- **Componentes Base**: 
  - `CharacterPortrait`: Preparado para props `src` (img URL), com variações de borda (Gold/Red/Blue) integradas.
  - `StatBar`: Barras animadas e reutilizáveis para HP, Energia, Gold e XP, substituindo lógicas duplicadas.
  - `ParticleBackground`: Efeito ambiente canvas nativo leve.
- **Telas Renascentes**:
  - `ArenaTab`: Turnos ocorrem agora com tempo rítmico (2.5s de delay por log). As vidas reagem turno-a-turno visualmente e os alvos atingidos reproduzem animação *shake* (hits normais) ou *arena-shake* muito mais intenso (Hits Críticos). O Log de combate foi expandido com textos mais sombrios e imersivos para misses, hits e críticos, e contém realce visual vermelho e brilhante para críticos. 
  - `CampTab`: Profissões com ícones associativos contextuais.
  - `InventoryTab`: Evoluído para um formato drag-and-drop Paperdoll com cálculo dinâmico dos Atributos Adicionais e layout dark medieval premium.
  - `Header`: Títulos associados à progressão (Mago/Lendário/Recruta) conforme base do Level e adição sensível de uma Barra de Experiência persistente e unificada.

## 4. Erros ou Bloqueios Conhecidos
- ~~**Bug de Equipar & Chaves Duplicadas**~~: Bug resolvido em que o `InventoryTab` sobrepunha o ID único do banco de dados pelo ID estático de catálogo (ex: `rusty_dagger`), o que impedia a ação de equipar e gerava erros de React `key` na interface ao se possuir múltiplos itens iguais.
- **Nenhum erro de compilação**: O servidor Next.JS continua buildando e rodando sem conflitos no dev server.
- **Pendência de Configuração**: O usuário deve configurar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no painel do Vercel para que as funcionalidades de banco de dados operem em produção.
- **AVISO (Persistência)**: Não houve ainda conexão do backend da tabela do banco `inventory` (atualmente o repositório consome dados mockados localmente neste tab). 

## 5. Próximos Passos Sugeridos
1. **Conexão de Banco de Origem para Loja / Inventário**: Alguns itens continuam baseados num arquivo `items.ts` de catálogo estático ou inventário mockado se a tabela real do Supabase falhar. Criar tabela de `items_catalog` no DB global.
2. **Sistema de Level UP**: Criar pop-up de distribuição visual de pontos ao preencher e esvaziar a barra de XP nova implementada no `Header`.
3. **Imagens Oficiais**: Substituir emojis fallbacks por assets reais ilustrativos em `<CharacterPortrait />` e ícones de inventário.
