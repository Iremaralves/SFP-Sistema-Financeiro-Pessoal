# 02 — Veredicto crítico (Rita, Critical Reviewer)

> Eu li o discovery do Bruno. Os dois CSVs não são o mesmo problema —
> têm qualidade diferente, valor analítico diferente, risco diferente.
> Então tenho **dois veredictos independentes**. Sem rodeio.

---

## VEREDICTO PF (`meu_dinheiro_iremar.csv`) — 🟡 IMPORTAR PARCIAL

**Recorte: a partir de 2025-01-01. Descartar todo o 2º semestre de 2024.**

### Por que NÃO importar tudo

1. **2024 do PF é raso e sujo.** Só 6 meses (jul→dez), 202 linhas, e é o trecho que concentra a **maior parte das inconsistências de categoria** (`i2` vs `i2 Soluções`, `Vestuário ` com espaço, as 4 linhas com `Tipo`/`Status` corrompidos por vírgula na descrição). Importar isso é importar a sujeira do começo do uso do Meu Dinheiro.
2. **91 linhas com `Centro = i2 SOLUÇÕES DIGITAIS` no CSV PF** são repasses (pró-labore + pagamento de fatura). **Já há risco contábil conhecido na memória do squad** ("4 transactions Pagamento recebido somando R$ 33.479 podem ser PF→PJ classificadas errado"). Trazer mais 91 linhas dessas sem revisão **piora o problema, não resolve.**
3. **O CSV PF não cobre 12 meses móveis terminando no mês atual.** Começa em jul/2024, então em mai/2026 a janela de 12m móvel já está 100% coberta pelo banco atual + dados de 2025/2026. **2024 não entra em nenhum KPI relevante.**
4. **Detecção de sazonalidade exigiria 2 anos completos.** Não temos. Pra detectar sazonalidade real do PF, precisaríamos de 2023 + 2024 inteiros — não temos isso. Então **o argumento "histórico ajuda a ver padrão" não se aplica ao PF**.
5. **34 categorias distintas, várias com 1-4 ocorrências** (`Doação`, `Férias`, `IRPF`, `Master Marketing`, `Mãe` etc.) — vão obrigar a criar 30+ categorias canônicas só pra acomodar 5-10 lançamentos cada. **Esforço de mapeamento alto, valor analítico baixo.**

### Por que ainda assim importar 2025 em diante

1. **2025 tem 414 linhas — fluxo completo de um ano** (jan→dez). Esse é o pedaço útil: dá comparativo ano-anterior real em 2026.
2. **A taxa de poupança** (receita - despesa - pagamento cartão, dividido por receita) só faz sentido com pelo menos 12 meses históricos. 2025 entrega isso.
3. **IDs únicos preenchidos em 100% das linhas** — deduplicação contra o banco atual é trivial.
4. As **4 linhas corrompidas** estão TODAS em 2024 (vamos confirmar isso no plano), então o recorte 2025+ elimina o problema sem trabalho de limpeza manual.

**Recorte sugerido:** `Data efetiva >= 2025-01-01` AND `Status IN ('Confirmado','Conciliado')`.
Isso deixa ~480 linhas (414 de 2025 + 71 de 2026, menos pendentes/agendadas/corrompidas).

---

## VEREDICTO PJ (`meu_dinheiro_i2.csv`) — 🟢 IMPORTAR TUDO

**Sem recortes. Importar todas as 614 linhas, do `Saldo inicial` (01/02/2024) até 19/03/2026.**

### Por que esse vale o esforço

1. **Fator R precisa de 12 meses móveis terminando no mês atual.** Em mai/2026, a janela vai de **jun/2025 a mai/2026**. **Para calcular Fator R em mai/2026, eu preciso de jun/2025 — e isso só existe no CSV histórico.** Sem importar PJ, Fator R fica zerado por mais meses.
2. **Qualidade do CSV PJ é alta.** 19 categorias enxutas, 2 contas só (`CC Inter` e `Reserva Empresarial`), centro de custo com **disciplina real** (`SEBRAETEC - PE/DF/RJ/RN`), zero linha corrompida, zero duplicata de ID. **O custo de limpeza é baixo.**
3. **Subcategorias separam o que precisa estar separado para Fator R**: `Pró-labore` (folha) × `Retirada de lucro (Dividendos da i2)` × `DAS` × `GPS - INSS` × `Bolsa Estágio`. **O Meu Dinheiro já guardou isso pronto.**
4. **`Projeto` preenchido em 35% das linhas** — rastreia receita por contrato SEBRAETEC (PE/DF/RJ/RN). Esse é o tipo de dado que vale o trabalho de migrar para `notes` ou para uma nova coluna.
5. **Receita total já validada externamente**: 2024 = R$ 131k, 2025 = R$ 171k. Esses números são contabilidade real — vão alimentar DRE histórica e projeção de faturamento.
6. **1 linha de `Saldo inicial`** vira `accounts.opening_balance` direto — limpo.
7. O **resultado bruto da i2 em 2024+2025 é praticamente zero (+R$ 3.146 em 23 meses)**. Esse é um insight gerencial valioso por si só — **a empresa não acumulou caixa**, e o histórico é o que prova isso. Sem importar, o usuário não vê esse fato.

### O que assumo de risco (e tudo bem)

- Categoria `unu` (8 lançamentos) e `Pessoal` (2) precisarão de revisão manual no mapeamento — **10 lançamentos de revisão é trivial**.
- `Outras Despesas`/`Outras Receitas` (1 cada): joga em `outros` canônico, segue a vida.
- `SEBRAETEC` (170 lançamentos, mesmo nome de categoria) vai virar **categoria `receita_servico` + projeto = `SEBRAETEC - UF`** — o Centro já carrega a granularidade.

---

## Síntese dos veredictos

| CSV | Veredicto | Recorte | Linhas a importar |
|---|---|---|---:|
| **IREMAR PF** | 🟡 PARCIAL | `Data efetiva >= 2025-01-01` AND `Status IN (Confirmado, Conciliado)` | ~480 |
| **I2 PJ** | 🟢 TUDO | sem recorte (já é limpo) | 614 |

---

## O que eu NÃO quero ouvir no Step 3

- "Vamos importar 2024 do PF também por completude." Não. **Custo de limpeza > valor analítico.**
- "Vamos consolidar PF+PJ em uma view única." Não. **Quebra Fator R, mascara resultado real da empresa.** A regra crítica do squad.yaml é explícita.
- "Vamos importar com `entity_id` errado pra resolver depois." Não. **Não há "depois".**

Bruno: monta o plano. Mas só para o recorte aprovado acima.
