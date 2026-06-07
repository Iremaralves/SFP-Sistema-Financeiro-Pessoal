# v2-02 — Recomendações Críticas

**Autora:** Rita (Critical Reviewer)
**Data:** 2026-05-20
**Premissa:** Cada item parte de "não copiar" e precisa de justificativa para virar "copiar". Sistema antigo não é referência por si só.

---

## Veredictos

| # | Item | Veredicto | Prioridade | Esforço |
|---|---|---|---|---|
| 1 | Centro de Custo em PJ | 🟢 IMPLEMENTAR | Alta | M |
| 2 | Centro de Custo em PF | 🔴 NÃO IMPLEMENTAR | — | — |
| 3 | Projeto/Cliente em PJ | 🟢 IMPLEMENTAR (separado de centro) | Média | M |
| 4 | Subcategorias de Impostos PJ (DAS/GPS/CIM) | 🟢 IMPLEMENTAR como categories seed | Alta | P |
| 5 | Subcategorias de Receita PJ (SEBRAETEC/Vendas) | 🟢 IMPLEMENTAR como categories seed | Alta | P |
| 6 | Categoria Moradia com subcategorias PF | 🟢 IMPLEMENTAR como categories seed | Média | P |
| 7 | Conta "Carteira" / dinheiro físico | 🟡 OPCIONAL | Baixa | P |
| 8 | Conta "CC - Itaú" e "Inter" em PF | 🟡 INVESTIGAR antes | Baixa | P |
| 9 | Conta "Reserva Empresarial" PJ | 🟢 IMPLEMENTAR | Média | P |
| 10 | Conta NuInvest-JU separada | 🔴 NÃO IMPLEMENTAR | — | — |
| 11 | Forma de Pagamento (PIX/Boleto/etc) | 🔴 NÃO IMPLEMENTAR como tabela | — | — |
| 12 | Tags | 🔴 NÃO IMPLEMENTAR | — | — |
| 13 | Cartão (coluna específica) | 🔴 NÃO IMPLEMENTAR | — | — |
| 14 | Status com 4 estados (Pendente/Agendado/Confirmado/Conciliado) | 🟡 PARCIAL: 2 estados (pending/confirmed) | Média | M |
| 15 | Coluna `Data competência` separada de `Data efetiva` | 🟢 IMPLEMENTAR | Média | M |

---

## 1. Centro de Custo em PJ — 🟢 IMPLEMENTAR

**Dados:** 18 valores únicos, 100% das transações PJ preenchidas, distribuição diversa (i2-Agência 211, SEBRAETEC-UF 174, Impostos 58, Freelancer 53, Estagiários 31).

**Justificativa:**
- Iremar PROVOU uso por 614 transações em 2 anos. Não é hipótese, é histórico.
- Permite responder pergunta de negócio que o i2-finance hoje NÃO responde: "quanto custou cada projeto SEBRAETEC?" e "qual a margem de cada linha (Agência vs Treinamentos)?"
- Categoria não substitui: "Despesa Administrativa" diz O QUE foi gasto; Centro de Custo diz POR QUEM/POR QUE.
- Esforço contido: 1 tabela `cost_centers` (id, name, entity_id, active) + coluna `cost_center_id` em `transactions` nullable.

**Cautelas:**
- Só PJ. Não criar para PF.
- Tabela com seed do que já existia, mas Iremar deve poder editar — alguns SEBRAETEC-UF antigos podem ser arquivados.
- Não-obrigatório — null safe.

---

## 2. Centro de Custo em PF — 🔴 NÃO IMPLEMENTAR

**Dados:** 13 valores. FAMÍLIA(125) + IREMAR(104) + FILHAS(71) + JULIANA(36) + CASAL(10) + PARENTES(7) = 353 movimentos (47% do PF) podem ser cobertos por `responsible` (iremar | juliana | casal | i2). Casa(38) + Comunicação(17) + Transporte(2) são CATEGORIA, não centro.

**Justificativa para vetar:**
- Redundante com `entity_id + responsible` já existentes.
- "i2 SOLUÇÕES DIGITAIS" como centro PF (91 mov) é justamente o anti-padrão que QUEREMOS extinguir — não validar isso copiando.
- Adicionar coluna nullable em PF tentaria recriar a confusão.
- Princípio do squad: "Preservar o que já funciona acima de tudo".

**Alternativa:** se em algum momento aparecer demanda real (ex: separar gasto com "FILHAS / Isabela" vs "FILHAS / Helena"), isso já está coberto por `responsible` + `Category > Subcategory`.

---

## 3. Projeto/Cliente em PJ — 🟢 IMPLEMENTAR (separado de Cost Center)

**Dados:** 46 projetos distintos em PJ, 217 movimentos preenchidos, padrão `CÓDIGO | UF | TIPO | CLIENTE` consolidado em 2025.

**Justificativa:**
- Centro de Custo = categoria do projeto (SEBRAETEC-PE). Projeto = cliente específico (TECRJ0420250088 | MR Engenharia). São **dois eixos diferentes** e Iremar usava os dois.
- Permite faturamento por cliente, custo por cliente, margem por contrato.
- Risco baixo: nullable, só PJ.

**Cautelas:**
- Não criar dropdown gigante com 46 valores legados. Implementar como tabela `projects` (id, code, client_name, uf, status active|archived, cost_center_id opcional) com criação inline.
- NÃO migrar os 46 valores legados — só estrutura. Iremar cria novos conforme precisa.

---

## 4. Subcategorias de Impostos PJ — 🟢 IMPLEMENTAR como seed

**Dados:** DAS(28), GPS(25), CIM(5). GPS e Bolsa Estágio (30) compõem folha para Fator R. DAS não.

**Justificativa:**
- Fator R é regra fiscal viva. Errar a separação custa dinheiro real.
- Não dá pra confiar na descrição livre — campo categoria/subcategoria PRECISA classificar.
- Esforço P: 3 linhas no seed da tabela `categories`.

**Seed sugerido:**
- `Impostos > DAS` (tributo)
- `Impostos > GPS` (folha — flag `is_payroll_for_factor_r = true`)
- `Impostos > CIM` (tributo municipal)
- `Pessoal > Bolsa Estágio` (folha — flag)
- `Pessoal > Pró-labore` (folha — flag)
- `Pessoal > Freelancer` (NÃO folha — PJ)

---

## 5. Subcategorias de Receita PJ — 🟢 IMPLEMENTAR como seed

**Dados:** SEBRAETEC tem 5 subcategorias bem definidas (Planejamento 129, Mídias 20, Website 17, Diagnóstico 2, Plan+Rede+Site 2). Vendas tem Tráfego Meta ADS(27), Serviços(30), Website(7), MGF(4), Consultoria(3).

**Justificativa:**
- Análise de mix de receita por produto. Iremar já discriminava — é gestão de negócio, não overhead.
- Categoria-mãe `SEBRAETEC` representa 66% das receitas PJ (170/257). Vale a granularidade.

---

## 6. Categoria Moradia com subcategorias PF — 🟢 IMPLEMENTAR como seed

**Dados:** Moradia(101) → Condomínio(24), Feira(17), Celpe(15), IPTU(5), s/sub(40).

**Justificativa:** É a maior categoria de despesa PF (29%). Subcategorias têm uso real e estável.

**Seed:** Telefonia > Fixo+Internet+TV / Celular; Saúde > Treino / Tratamento; Filhos > Isabela / Helena; Investimentos > Poupando / Rendimentos.

---

## 7. Conta "Carteira" (dinheiro físico) — 🟡 OPCIONAL

17 movimentos. Útil para quem registra cash. Mas Iremar registrou pouco — pode não valer a pena. Decisão do Iremar; estrutura comporta sem mudança de schema.

---

## 8. Contas "CC - Itaú" e "Inter" em PF — 🟡 INVESTIGAR

CC-Itaú(6), Inter(13). Antes de cadastrar, perguntar: essas contas ainda existem ou foram fechadas? Se ativas, cadastrar como `accounts` normais. Sem schema-change.

---

## 9. "Reserva Empresarial" PJ — 🟢 IMPLEMENTAR

9 movimentos. Provavelmente é subconta do Inter para reserva de caixa. Cadastrar como `account` separada com `parent_account_id = CC Inter` se i2-finance tiver hierarquia, senão como conta independente com flag `is_reserve = true`.

**Justificativa:** Saudável separar capital de giro de reserva — Iremar já fazia isso.

---

## 10. NuInvest-JU separada — 🔴 NÃO IMPLEMENTAR

4 movimentos em 2 anos. Volume não justifica conta separada. Resolver com `responsible = juliana` em transações da conta NuInvest.

---

## 11. Forma de Pagamento como tabela — 🔴 NÃO IMPLEMENTAR

60% PF e 80% PJ vazios. Quando preenchido, divide entre PIX/DOC-TED/Boleto/Internet — informação que não muda o trabalho contábil nem aparece em relatório. **Custo de implementação > valor.**

**Alternativa:** se necessário, manter como campo livre `payment_method TEXT NULL` em transactions, sem tabela. Mas Rita recomenda NÃO ter o campo — descrição já cobre.

---

## 12. Tags — 🔴 NÃO IMPLEMENTAR

PF tem 6 valores totais (88 usos em 745); PJ tem 1 valor (16 em 614). Sistema de tags geral é prematuro. Categoria + Centro de Custo cobre tudo o que Tags cobria.

---

## 13. Cartão como coluna — 🔴 NÃO IMPLEMENTAR

ZERO transações tinham esse campo preenchido em ambos os CSVs. Conceito morto.

---

## 14. Status com 4 estados — 🟡 PARCIAL

Distribuição PF: Confirmado 683, Pendente 32, Agendado 26, Conciliado 4.
Distribuição PJ: Confirmado 572, Pendente 36, Agendado 5, Conciliado 1.

**Análise:**
- `Confirmado` = dia D, aconteceu (já é o default do i2-finance).
- `Pendente` = previsto, ainda não pago — útil para contas a pagar/receber. **Vale.**
- `Agendado` = futuro programado — pode confundir com `Pendente`. **Não vale separar.**
- `Conciliado` = bateu com extrato bancário — vale como flag boolean separada (`reconciled`), não como status. **Vale como flag.**

**Proposta:** `status ENUM('pending','confirmed')` + `reconciled BOOLEAN`. Implementação mínima útil.

---

## 15. `Data competência` separada — 🟢 IMPLEMENTAR

CSV tem 3 datas: prevista, efetiva, competência. Competência é importante para regime contábil (despesa de novembro paga em dezembro é competência novembro). i2-finance tem só `date` hoje.

**Proposta:** adicionar `accrual_date DATE NULL` em transactions (data de competência), mantendo `date` como data financeira. Null = igual a `date`.

---

## Conflitos com decisões já tomadas

- `categories` está sendo seed-popolada pelo squad i2-financas. **Sincronizar antes**: levar o seed sugerido aqui (itens 4, 5, 6) como insumo para o seed do i2-financas, não criar categorias paralelas.
- Restore point antes de qualquer DDL (regra company.md).
- Time-de-testes precisa validar cada mudança individualmente — itens 1, 3, 9, 14, 15 mexem em schema.

---

## Resumo executivo para o Iremar

**Vale implementar (4 mudanças de schema, baixo risco cada):**
1. `cost_centers` + coluna em transactions (só PJ)
2. `projects` + coluna em transactions (só PJ)
3. `accrual_date` em transactions
4. `status` ENUM + `reconciled` flag

**Vale popular como seed (sem schema-change, sincronizar com i2-financas):**
- Subcategorias de Impostos/Pessoal PJ com flag `is_payroll_for_factor_r`
- Subcategorias de Receita PJ (SEBRAETEC/Vendas)
- Subcategorias de Moradia/Saúde/Telefonia PF

**Não vale (poupar complexidade):**
- Centro de Custo em PF, Forma de Pagamento, Tags, Cartão, NuInvest-JU separada
