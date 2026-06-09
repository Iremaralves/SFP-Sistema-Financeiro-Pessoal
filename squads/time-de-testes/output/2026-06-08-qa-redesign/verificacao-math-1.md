# Verificação adversarial — math-1

**Achado:** Discrepância de R$ 0,01 entre "Total da fatura" (card/donut) e badge "Cartão"/AnchorHero na mesma tela (Pessoal/Iremar).

**Veredito:** CONFIRMADO (isReal=true) · Severidade: **baixa** (mantida) · Confiança: **alta**

---

## Como foi provado

### 1. Código (duas fontes diferentes pro mesmo total)

Ambos os totais derivam do MESMO conjunto de transactions (conta `credit_card`, ciclo `2026-05-13`→`2026-06-12`, `is_transfer=false`), carregadas em `dashboard/page.tsx:42-51`. A única diferença é o método de soma:

- **Fonte A — soma bruta** (`apps/web/src/app/dashboard/page.tsx:156`):
  `faturaTotal = Σ abs(amount) onde amount<0` → passa em `metrics.faturaTotal`.
  Consumido por:
  - `AnchorHero` (label "Fatura do cartão", scope=pessoal) — `DashboardAdmin.tsx:117` → `AnchorHero.tsx:42`
  - `QuickActions` badge "Cartão" — `DashboardAdmin.tsx:127` → `QuickActions.tsx:85`

- **Fonte B — dupla arredondação** (`packages/core/src/settlement.ts:89-91`):
  `iremarPart = round(iremarTotal + casalHalf)`, `julianaPart = round(julianaTotal + casalHalf)`,
  `totalFatura = round(iremarPart + julianaPart + i2Total)`.
  Consumido por:
  - Card "Total da fatura" — `DashboardAdmin.tsx:194` (`settlement.totalFatura`)
  - Centro do `DonutSplit` "Distribuição" — `DashboardAdmin.tsx:232`

O bloco do card "Total da fatura" + donut (`DashboardAdmin.tsx:172`) NÃO é gated por scope — renderiza junto com o AnchorHero (gated só o BudgetGauge em :136). Logo, na tela Pessoal do Iremar os dois números aparecem simultaneamente.

### 2. Dados reais (SQL — household a1b2c3d4..., ciclo 13/05–12/06)

| campo | valor |
|---|---|
| iremarTotal | 1320.54 |
| julianaTotal | 2268.56 |
| casalTotal | 2583.85 |
| i2Total | 1586.21 |
| **faturaTotal (raw, line 156)** | **7759.16** |
| iremarPart = round(1320.54 + 1291.925) = round(2612.465) | 2612.47 |
| julianaPart = round(2268.56 + 1291.925) = round(3560.485) | 3560.49 |
| i2Part | 1586.21 |
| **settlement.totalFatura (double-round)** | **7759.17** |
| **diff** | **+0.01** |

### 3. Causa-raiz

`casalHalf = 2583.85 / 2 = 1291.925` (termina em .925). As duas partes (iremar e juliana) cada uma absorve esse .925 e arredonda pra cima independentemente (+0.005 cada), somando +0.01 vs a soma bruta. Exatamente o mecanismo descrito pelo revisor.

---

## Impacto / severidade

- É inconsistência **cosmética de exibição**: dois totais (7.759,16 vs 7.759,17) lado a lado pra a mesma fatura. Causa estranhamento, não erro de dinheiro.
- NÃO viola regra sagrada: a divisão por responsável reconcilia DENTRO de `settlement` (2612,47 + 3560,49 + 1586,21 = 7759,17 = centro do donut). O gap de 1 centavo é só ENTRE fontes diferentes (raw × settlement), não dentro da lógica de split.
- NÃO mistura PF/PJ; não quebra fatura/acerto/compromissos/contas.

Severidade **baixa** está correta (nem exagerada nem subestimada).

## Fix sugerido (validado)

Padronizar a fonte única. Opção mais limpa: AnchorHero + QuickActions também consumirem `settlement.totalFatura` em vez de `metrics.faturaTotal`. Alternativa: em `settlement.ts` calcular `totalFatura = round(iremarTotal + julianaTotal + casalTotal + i2Total)` sem arredondar partes intermediárias antes de somar (resultado 7759.16, batendo com a soma bruta). A 1ª opção é menos arriscada porque não altera o valor já exibido no card/donut.

**Arquivos:** `packages/core/src/settlement.ts:89-91`, `apps/web/src/app/dashboard/page.tsx:156`, `apps/web/src/components/DashboardAdmin.tsx:117,127,194,232`.
