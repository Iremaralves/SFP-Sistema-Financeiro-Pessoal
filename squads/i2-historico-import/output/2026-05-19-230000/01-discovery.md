# 01 — Discovery (Bruno, Senior Data Analyst)

> Amostras + estatísticas + inconsistências dos 2 CSVs exportados do **Meu Dinheiro**.
> Analisados separadamente (PF Iremar × PJ i2). Headers são idênticos (27 colunas).

---

## 1. Cabeçalho comum (27 colunas)

`Tipo, Status, Data prevista, Data efetiva, Venc. Fatura, Valor previsto, Valor efetivo, Descrição, Categoria, Subcategoria, Conta, Conta transferência, Centro, Contato, CPF/CNPJ, Razão social, Forma, Projeto, N. Documento, Observações, Data competência, ID Único, Tags, Cartão, Repetição, Meta de Economia, Data de criação`

**Boa notícia:** todo registro tem **`ID Único`** preenchido — usar como chave de deduplicação na importação.

---

## 2. IREMAR PF — `meu_dinheiro_iremar.csv`

| Item | Valor |
|---|---|
| Total linhas (sem header) | **745** |
| Período (Data efetiva) | **2024-07-01 → 2026-03-28** (~21 meses) |
| Período (Data prevista) | 2024-07-01 → 2026-06-24 |
| IDs únicos / total | 745 / 745 — **zero duplicatas** |
| Valor efetivo zerado/vazio | 58 linhas (8%) — em geral linhas pendentes/agendadas |
| Sem Categoria | 0 |

### 2.1 Distribuição por Tipo
| Tipo | Qtd |
|---|---:|
| Despesa | 347 |
| Receita | 204 |
| Transferência | 148 |
| Pagamento (fatura cartão) | 46 |

### 2.2 Distribuição por Status
Confirmado 683 · Conciliado 4 · Pendente 32 · Agendado 26

### 2.3 Por ano (Data efetiva)
2024: 202 · 2025: 414 · 2026: 71

### 2.4 Fluxo agregado por ano (R$)
| Ano | Receita | Despesa | Pagamento cartão |
|---|---:|---:|---:|
| 2024 (jul→dez) | 88.355 | -28.577 | -56.942 |
| 2025 (full) | 169.512 | -78.250 | -109.211 |
| 2026 (jan→mar) | 48.220 | -14.566 | -29.670 |

### 2.5 Contas usadas (PF)
`Nu Pagamentos` 639 · `NuInvest` 40 · `Caixinha` 26 · `Carteira` 17 · `Inter` 13 · `CC - Itaú` 6 · `NuInvest-JU` 4

### 2.6 Categorias (34 distintas)
`Ajuste, Alimentação, Automóvel / Carro, Automóvel / Moto, Cotinha, Doação, Educação, Empréstimos, Familiares Diversas, Filhos, Férias, IRPF, Impostos e Tarifas, Investimentos, Jantar, Juliana, Lanche, Lazer, Master Marketing, Moradia, Mãe, Outras despesas, Outras receitas, Pagamento de cartão, Presentes, Pró-labore, Saúde, Telefonia, Transferência, Transporte, Vendas, Vestuário, i2, i2 Soluções`

### 2.7 Inconsistências detectadas (PF)
- **Duas categorias para a mesma coisa**: `i2` e `i2 Soluções` (deviam ser uma).
- **`Jantar` e `Lanche`** são na prática subdivisões de `Alimentação` — granularidade inconsistente.
- **`Automóvel / Carro` vs `Automóvel / Moto`** — ok semanticamente, mas o normal seria categoria única + subcategoria.
- **`Vestuário ` com trailing space** — bug clássico de export.
- **91 linhas no PF têm `Centro = i2 SOLUÇÕES DIGITAIS`** — são repasses (Pró-labore + Pagamento de cartão da i2 → Iremar). Pareiam com lançamentos do CSV PJ. **Risco de duplicar receita** se não houver controle.
- **2 linhas com `Tipo` corrompido** ("Painho: 225", "Lígia R$ 370") — quebra de CSV por descrição com vírgula. Precisariam ser remontadas manualmente ou descartadas.
- **2 linhas com `Status` corrompido** ("52", "00\"") — mesmo problema.
- **Tags preenchidas em só 88 / 745** linhas (12%) · **Projeto em só 13** (1.7%) — campos quase vazios, podem ser **descartados**.

---

## 3. I2 PJ — `meu_dinheiro_i2.csv`

| Item | Valor |
|---|---|
| Total linhas (sem header) | **614** |
| Período (Data efetiva) | **2024-02-01 → 2026-03-19** (~26 meses) |
| Período (Data prevista) | 2024-02-01 → 2026-05-30 |
| IDs únicos / total | 614 / 614 — **zero duplicatas** |
| Valor efetivo zerado/vazio | 42 linhas (7%) |
| Sem Categoria | 1 linha |

### 3.1 Distribuição por Tipo
| Tipo | Qtd |
|---|---:|
| Despesa | 315 |
| Receita | 257 |
| Pagamento (fatura cartão) | 27 |
| Transferência | 14 |
| Saldo inicial | 1 |

### 3.2 Distribuição por Status
Confirmado 572 · Conciliado 1 · Pendente 36 · Agendado 5 — **CSV bem mais limpo que o PF.**

### 3.3 Por ano (Data efetiva)
2024: 206 · 2025: 291 · 2026: 76

### 3.4 Fluxo agregado por ano (R$)
| Ano | Receita | Despesa | Pagamento cartão | Resultado bruto |
|---|---:|---:|---:|---:|
| 2024 (fev→dez, 11m) | **131.448** | -119.002 | -10.802 | +1.644 |
| 2025 (full, 12m) | **171.013** | -149.053 | -20.458 | +1.502 |
| 2026 (jan→mar) | 48.968 | -49.180 | -6.424 | -6.636 |
| **Total 26 meses** | **351.430** | -317.236 | -37.685 | **-3.491** |

### 3.5 Contas (PJ)
`CC Inter` 605 · `Reserva Empresarial` 9 — **simples, sem ambiguidade.**

### 3.6 Categorias (19 distintas — bem mais enxutas que PF)
`Administrativas, Comercialização, Cursos/treinamento/programas, ESTAGIÁRIOS, Ferramenta, Financeiras, Fornecedores, Freelancer, Impostos, Investimentos, Outras Despesas, Outras Receitas, Pagamento de cartão, Pessoal, SEBRAETEC, SGF, Transferência, Vendas, unu`

### 3.7 Subcategorias relevantes (PJ)
- 129 lançamentos com subcategoria `Planejamento para presença digital` → linha de produto SEBRAETEC.
- 46 lançamentos `Pró-labore`.
- 28 lançamentos `DAS` + 25 `GPS — INSS` → **série temporal limpa** para Fator R.
- 21 `Retirada de lucro (Dividendos da i2)` separada de `Pró-labore` — exatamente o que o cálculo do Fator R precisa.

### 3.8 Centros (PJ — bem usados)
`i2 - Agência` 211 · `SEBRAETEC - PE` 89 · `Impostos` 58 · `Freelancer` 53 · `Estagiários` 31 · `SEBRAETEC - DF` 30 · `SEBRAETEC - RJ` 22 · `SEBRAETEC - RN` 21

**`Projeto` preenchido em 217 / 614 (35%)** — útil para rastrear receita por contrato SEBRAETEC.

### 3.9 Inconsistências detectadas (PJ)
- `Outras Despesas` / `Outras Receitas` ocorrem 1 vez cada — **categorias mortas**.
- `Pessoal` (2 lançamentos) e `unu` (8 lançamentos) — **categorias ambíguas / abreviações** que precisariam normalização.
- 1 linha **sem Categoria**.
- **1 linha com Tipo = `Saldo inicial`** — não é lançamento, é abertura de conta. Vira `opening_balance` em `accounts`.
- Mistura de caixa (`SEBRAETEC`) — categoria com **170 ocorrências** dilui análise; o útil é o **Centro** (`SEBRAETEC - PE/DF/RJ/RN`).

---

## 4. Diferenças estruturais entre os 2 CSVs

| Aspecto | IREMAR PF | I2 PJ |
|---|---|---|
| Linhas | 745 | 614 |
| Período | 21 meses (07/24–03/26) | **26 meses (02/24–03/26)** |
| Contas | 7 distintas | **2 distintas** |
| Categorias | 34 (inconsistentes) | 19 (limpas) |
| Centros usados | Sim (FAMÍLIA, IREMAR, FILHAS, JULIANA, i2…) | Sim, e com **disciplina** (`i2 - Agência`, `SEBRAETEC - UF`) |
| Tags | 12% preenchidas | 3% preenchidas |
| Projeto | 1.7% preenchido | **35%** preenchido (SEBRAETEC) |
| Linhas corrompidas | 4 (Tipo/Status quebrados) | 0 |
| Qualidade geral | **Média** | **Alta** |

---

## 5. Conclusão técnica do Discovery

1. O CSV **PJ é dramaticamente mais limpo** que o PF: poucas contas, poucas categorias, disciplina de Centro e Projeto.
2. O CSV **PF tem inconsistências de categoria** (`i2`/`i2 Soluções`, `Jantar`/`Lanche` vs `Alimentação`, `Vestuário ` com espaço, 4 linhas corrompidas).
3. **`ID Único` é o pulo do gato** para deduplicação — 100% preenchido nos dois.
4. **Risco real de duplicação cruzada**: 91 linhas no PF têm `Centro = i2 SOLUÇÕES DIGITAIS` que pareiam com saídas do PJ (pró-labore + pagamento de cartão). Se importar os dois sem regra, o repasse aparece em duplicidade na visão consolidada.
5. **Fator R precisa de 12 meses móveis** — o PJ entrega isso confortavelmente (26 meses).
6. **Saldo inicial do PJ** (1 linha) é candidato natural a `opening_balance`.

Próximo passo: **Rita avalia se vale a pena importar — com veredictos PF e PJ separados.**
