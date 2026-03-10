# Tabela de Balanceamento de Itens

## 1) Orçamento Base de Poder por Raridade

| Raridade | Poder Base |
|---|---:|
| common | 22 |
| uncommon | 38 |
| rare | 58 |
| epic | 84 |
| legendary | 116 |

Regra aplicada:
- `poder_alvo_item = poder_base_raridade * peso_slot * multiplicador_preco_no_grupo`
- Multiplicador por preço no grupo (ordenado menor -> maior): de `0.90` até `1.14`.

## 2) Peso de Poder por Slot

| Slot | Peso |
|---|---:|
| weapon | 1.28 |
| chest | 1.22 |
| shield | 0.98 |
| legs | 0.94 |
| helmet | 0.72 |
| boots | 0.72 |
| gloves | 0.66 |

## 3) Vigor Máximo por Raridade e Slot

Vigor máximo final por item:
- `cap = cap_raridade + bonus_slot + bonus_preco`
- `bonus_preco` varia de `0` a `2` dependendo de quanto o preço do item excede o preço de referência do tier/slot.

Cap base por raridade:

| Raridade | Cap Base de VIG |
|---|---:|
| common | 1 |
| uncommon | 2 |
| rare | 3 |
| epic | 4 |
| legendary | 5 |

Bônus por slot:

| Slot | Bônus de VIG |
|---|---:|
| chest | +2 |
| weapon | +1 |
| legs | +1 |
| shield | +1 |
| helmet | +0 |
| gloves | +0 |
| boots | +0 |

## 4) Perfis de Build (Diretriz)

| Build | Prioridade de atributos | Identidade |
|---|---|---|
| Pistoleiro Ágil | AGI > PON > FOR | mobilidade e cadência |
| Atirador Preciso | PON > AGI > FOR | acerto consistente |
| Brutamonte | DEF > FOR > VIG | troca e pressão |
| Balanceado | FOR/DEF/AGI/PON próximos | versatilidade |
| Parede Viva | DEF > VIG > FOR | sobrevivência |

Observações:
- O rebalanceamento preserva o "formato" do item (quais stats ele já favorece), ajustando apenas a intensidade para coerência de valor e raridade.
- Armas têm ajuste conjunto de atributos e dano (`min_damage`/`max_damage`) para manter progressão real.
