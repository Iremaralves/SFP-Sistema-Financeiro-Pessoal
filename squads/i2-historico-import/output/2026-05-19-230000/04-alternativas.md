# 04 — Alternativas (Rita, Critical Reviewer)

> O recorte aprovado descarta **2024 inteiro do PF** (~265 linhas, jul→dez/2024) +
> linhas pendentes/agendadas/corrompidas. O PJ entra completo, então este documento
> é praticamente todo sobre o **resíduo do PF** e sobre **preservação** geral.

---

## 1. O que NÃO entra na importação

| Bloco | Linhas | Destino proposto |
|---|---:|---|
| PF 2024-07 a 2024-12 (Confirmadas) | ~190 | Congelar como arquivo morto (seção 2) |
| PF Pendente / Agendado | 58 | Descartar (seção 4) — não são fato consumado |
| PF Tipo/Status corrompido | 4 | Descartar com log auditável (seção 4) |
| PF 91 linhas com `Centro = i2 SOLUÇÕES DIGITAIS` | 91 | Revisão manual antes de qualquer import (seção 3) |

---

## 2. Arquivamento do histórico não importado (preservação)

**Princípio:** o dado não some, só não vira `transaction` viva no banco.

1. **Copiar os 2 CSVs originais** intactos para `/Users/iremaralvesii/Financeiro/squads/i2-historico-import/_archive/` (que já não está no git por padrão, mas conferir `.gitignore`).
2. **Gerar PDF "Histórico Meu Dinheiro — Iremar PF 2024-07 a 2024-12"** com:
   - resumo executivo (receita/despesa/poupança total)
   - lista de transações por mês (formatação simples)
   - assinatura `gerado em <data> a partir de meu_dinheiro_iremar.csv ID Único=<min>..<max>`
3. Subir PDF para o Drive em `Financeiro > Histórico > 2024 PF.pdf` (manual — Iremar faz).
4. **Não criar tabela `historic_transactions`** ou similar. Bloat de schema sem ROI.

> Se um dia o Iremar precisar consultar uma despesa específica de set/2024, abre o PDF ou o CSV.
> Isso é **bom o suficiente** — não é dado operacional, é dado de arquivo.

---

## 3. As 91 linhas PF com `Centro = i2 SOLUÇÕES DIGITAIS` (cuidado especial)

Essas são **receitas no PF que representam saídas no PJ** (pró-labore, dividendos, pagamento de fatura do cartão do Iremar pela i2). Tem 2 formas certas de tratar:

### Opção A — Tratar como `transfer` PF↔PJ (preferida)
- No banco, criar como **par de transactions** (uma saída no PJ + uma entrada no PF) ligadas por `transfer_group_id`.
- Não dobra a receita consolidada da família.
- Requer que a importação PJ já tenha rodado primeiro (para parear).

### Opção B — Importar só do lado PJ (saída) e ignorar do lado PF
- Mais simples, menos linhas no PF.
- Mas perde o registro de que dinheiro entrou na conta do Iremar.
- Aceitável se o Iremar concordar que o "lado PF" é redundante.

**Recomendação:** Opção A. Vale a hora extra de implementação. **Não aceitar import dessas 91 linhas como `Receita` simples no PF** — vai inflar a renda familiar artificialmente e quebrar a taxa de poupança.

---

## 4. Saldo de abertura (cutoff date)

Para o PF, em vez de importar 2024-07 a 2024-12:

1. Calcular o **saldo de cada conta PF em 31/12/2024** a partir do CSV (saldo inicial + soma das transações de 2024).
2. Atualizar `accounts.opening_balance` para cada conta PF com esse valor, com `opening_balance_date = 2024-12-31`.
3. **Não criar transações para 2024**. O banco começa a "narrativa" em 2025-01-01.

**Para o PJ** já temos `Saldo inicial` explícito no CSV (linha de 01/02/2024). Reusar.

---

## 5. Categorias mortas / a unificar antes de importar

Use este documento como input para o squad **i2-financas** (que está populando `categories`):

| Pedido para i2-financas | Motivo |
|---|---|
| Não criar `i2` e `i2 Soluções` como categorias canônicas separadas no PF | Mesma coisa no CSV — unificar antes |
| Garantir que `Pró-labore` e `Dividendos (Retirada de lucros)` sejam categorias **distintas** no PJ | Fator R |
| Criar subcategoria `pro_labore` e `bolsa_estagio` como "folha de pagamento" no Fator R | Mesma razão |
| Não criar `unu` como categoria | Abreviação obscura — exige revisão manual das 8 linhas |
| Não criar `Vestuário ` (com espaço) | Bug de export do Meu Dinheiro |

---

## 6. Bloqueios obrigatórios antes de qualquer import

Lista curta, em ordem:

1. ✅ `categories` populadas (squad i2-financas)
2. ✅ Os 4 "Pagamento recebido" de R$ 33.479 reclassificados (memória do squad)
3. ✅ Mapa de categorias (seção 3 do `03-plano-import.md`) revisado pelo Iremar
4. ✅ Plano de tratamento das 91 linhas cruzadas PF×PJ (opção A vs B) decidido pelo Iremar
5. ✅ `pg_dump` antes do import

**Se 1 ou 2 não estiver feito: postergar import. Sem exceção.**

---

## 7. Resumo executivo das alternativas

- **PJ:** importar tudo. Sem alternativas.
- **PF 2025+:** importar com recorte. Sem alternativas.
- **PF 2024:** **arquivar como PDF no Drive + zerar saldo via `opening_balance` em 2024-12-31**. Não importar.
- **PF Pendente/Agendado:** descartar — não vira fato.
- **PF linhas corrompidas (4):** descartar com log; não vale o tempo de remontar manualmente.
- **PF×PJ 91 linhas:** virar `transfer_group` (Opção A) — não duplicar receita.

Pronto. Bola pro Iremar decidir as 2 perguntas em aberto:
1. **Opção A ou B** para os repasses PF↔PJ?
2. Quando o squad **i2-financas** termina o seed de `categories`? Sem isso, o import fica em fila.
