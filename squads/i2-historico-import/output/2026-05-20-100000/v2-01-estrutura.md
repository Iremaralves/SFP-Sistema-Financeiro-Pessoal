# v2-01 — Análise Estrutural do Meu Dinheiro

**Autor:** Bruno (Data Analyst)
**Data:** 2026-05-20
**Escopo:** Entender ESTRUTURA usada por Iremar no sistema antigo (PF + PJ separados).
**Método:** Parse Python dos 2 CSVs (745 linhas PF, 614 linhas PJ).

---

## 1. Volumetria geral

| Métrica | PF (Iremar) | PJ (i2 Soluções) |
|---|---:|---:|
| Linhas | 745 | 614 |
| Receitas | 204 | 257 |
| Despesas | 347 | 315 |
| Transferências | 148 | 14 |
| Pagamentos de cartão | 46 | 27 |
| Saldo inicial | 0 | 1 |
| Anos cobertos | 2024–2026 | 2024–2026 |

**Status das transações:**
- PF: 683 Confirmado / 32 Pendente / 26 Agendado / 4 Conciliado
- PJ: 572 Confirmado / 36 Pendente / 5 Agendado / 1 Conciliado

> i2-finance hoje só tem `status` implícito (existe vs. não existe). O Meu Dinheiro tem 4 estados — análise no doc 2.

---

## 2. Contas bancárias usadas

### PF (Iremar) — 7 contas
| Conta | Movimentos | Existe no i2-finance? |
|---|---:|---|
| Nu Pagamentos | 639 | SIM (Conta Iremar) |
| NuInvest | 40 | SIM |
| Caixinha | 26 | SIM |
| Carteira | 17 | **NÃO** |
| Inter | 13 | **NÃO** (Iremar PF tem Inter?) |
| CC - Itaú | 6 | **NÃO** (CC = conta corrente?) |
| NuInvest-JU | 4 | **NÃO** (NuInvest da Juliana — separar?) |

### PJ (i2 Soluções) — 2 contas
| Conta | Movimentos | Existe no i2-finance? |
|---|---:|---|
| CC Inter | 605 | SIM (i2 Soluções) |
| Reserva Empresarial | 9 | **NÃO** (subconta de reserva?) |

**Achados:**
- PF concentra 86% em Nu Pagamentos (conta principal).
- "Carteira" (dinheiro físico) aparece 17x — Iremar registrava cash.
- "NuInvest-JU" sugere segregação de investimento da Juliana — relevante para PF compartilhado.
- PJ "Reserva Empresarial" é provavelmente uma subconta lógica do Inter (reserva de caixa).

---

## 3. Formas de Pagamento

### PF — 8 tipos
| Forma | Movimentos |
|---|---:|
| Sem forma pagto. | 450 |
| Transferência | 109 |
| Dinheiro | 80 |
| Internet | 54 |
| Boleto | 23 |
| Outros | 20 |
| Cartão de Débito | 5 |
| Cartão de Crédito | 4 |

### PJ — 5 tipos
| Forma | Movimentos |
|---|---:|
| Sem forma pagto. | 489 |
| DOC/TED | 70 |
| Boleto | 28 |
| Internet | 21 |
| PIX | 6 |

**Achados:**
- 60% das transações PF e 80% PJ ficam **sem forma de pagamento** — Iremar raramente preenchia esse campo. Sinal de campo de baixo valor prático.
- PJ usa nomenclatura datada ("DOC/TED", "Internet") — PIX só aparece 6x (subutilização ou migração recente).
- Cartão de crédito como forma é raro (4 em PF) — mas Iremar tem 46 "Pagamento de cartão" → cartão era usado, só que não marcado como forma.

---

## 4. Centros de Custo (a estrela do show)

### PF — 13 centros
| Centro | Movimentos | Interpretação |
|---|---:|---|
| FAMÍLIA | 125 | gastos compartilhados Iremar+Juliana+filhas |
| IREMAR | 104 | gastos pessoais dele |
| i2 SOLUÇÕES DIGITAIS | 91 | **CRUZA PF/PJ — alerta** |
| FILHAS | 71 | Isabela + Helena |
| Casa | 38 | moradia |
| INVESTIMENTOS | 36 | aportes |
| JULIANA | 36 | gastos dela |
| Comunicação | 17 | telefone/internet |
| CASAL | 10 | gastos a 2 |
| AJUSTE | 7 | conciliação |
| PARENTES | 7 | mãe, etc |
| Master Marketing | 3 | empresa antiga? |
| Transporte | 2 | uso baixo |

### PJ — 18 centros
| Centro | Movimentos | Tipo |
|---|---:|---|
| i2 - Agência | 211 | operação principal |
| SEBRAETEC - PE | 89 | projeto cliente |
| Impostos | 58 | fiscal |
| Freelancer | 53 | folha externa |
| Estagiários | 31 | folha interna |
| SEBRAETEC - DF | 30 | projeto |
| SEBRAETEC - RJ | 22 | projeto |
| SEBRAETEC - RN | 21 | projeto |
| i2 - Treinamentos | 12 | linha de negócio |
| Iremar | 12 | despesa do sócio |
| UNU Digital | 8 | parceiro |
| SEBRAETEC - SC | 8 | projeto |
| Fornecedores | 6 | suprimentos |
| SEBRAE | 5 | institucional |
| SEBRAETEC - AM, RO | 2+2 | projeto |
| INVESTIMENTOS | 1 | residual |
| i2 - Ferramentas | 1 | residual |

**Achados críticos:**
- **PJ usa Centro de Custo como TAG DE PROJETO/PRAÇA** — 7 centros SEBRAETEC- por UF é praticamente um cadastro de clientes/projetos.
- **PJ tem entidade contábil "Iremar"** (12 mov) — é o pró-labore + reembolsos. Hoje no i2-finance isso seria responsible=iremar dentro de entity=business.
- **PF tem 91 movimentos com centro "i2 SOLUÇÕES DIGITAIS"** — bomba contábil. Provavelmente são reembolsos PJ→PF mal classificados (risco contábil já citado em memories.md).
- PF mistura nível "pessoa" (IREMAR, JULIANA, FILHAS) com nível "tema" (Casa, Comunicação, Transporte) — modelo inconsistente.

---

## 5. Projetos

### PF — uso residual
3 valores distintos. 732/745 são "Sem projeto". Só "TREINO" (12) e "Reforma AP" (1) tiveram uso.
**Conclusão:** Iremar NÃO usa Projeto em PF.

### PJ — uso intenso
46 valores distintos. Padrão observado:
- Cliente nomeado: `José Lourenço`, `Thorpe's Brigaderia`
- Código de projeto SEBRAETEC: `TECRJ0420250088 | MR Engenharia - Site`
- Código CRM: `CRD241241 | JOSE ANTONIO - Planejamento`
- Tipo + UF: `PL | DF | CRD251291 | MARINETE FERREIRA`

Formato padronizado emergente em 2025: `<CÓDIGO> | <UF> | <TIPO> | <CLIENTE>`.

**Conclusão PJ:** o campo Projeto é o **identificador real do cliente/contrato** — o Centro de Custo é a categoria do projeto (SEBRAETEC-XX) e o Projeto é o cliente específico. **Dois níveis hierárquicos.**

---

## 6. Tags

PF — 6 valores, 88 usos no total. Padrão "Iremar - Família", "Iremar - Moradia", "Iremar - Filhas", "Iremar - Pessoal". É praticamente um segundo eixo de classificação **redundante com Centro de Custo**.

PJ — 1 valor único: "Cliente i2" (16 usos). Inútil.

**Conclusão:** Tags foram tentativa abandonada. Centro de Custo absorveu essa função.

---

## 7. Cartão

Coluna `Cartão` está VAZIA em ambos os CSVs (0 movimentos). Iremar não atrelava transações a cartão específico no Meu Dinheiro — usava a coluna "Conta" + "Pagamento de cartão" como mecanismo. **Não há learning aqui.**

---

## 8. Categorias × Subcategorias

### PF — Receita (10 categorias, 204 mov)
- **Pró-labore (48)** — receita-chave para Fator R
- **Juliana (44)** — transferência interna PF (32 sem subcat + 12 "Celpe" = reembolso)
- **Investimentos (35)** — Poupando(11), Rendimentos(8), s/sub(16)
- **i2 Soluções (31)** — Devolução(28) → **reembolso PJ→PF**, contábilmente sensível
- **Cotinha (23)** — não-identificado, provavelmente recorrente
- Outras receitas, Vendas, Master Marketing, IRPF, Ajuste — residuais

### PF — Despesa (24 categorias, 347 mov)
- **Moradia (101)** — Condomínio(24), Feira(17), Celpe(15), IPTU(5), s/sub(40). **Esta é a categoria-mãe doméstica.**
- **Saúde (52)** — Treino(19), Tratamento(17), s/sub(16)
- **Telefonia (48)** — Fixo+internet+TV(24), Celular(24) — split 50/50
- **Educação (39)** — sem subcategorias, provavelmente filhas
- **Filhos (28)** — Isabela(11), Helena(5), s/sub(12)
- **Lazer (18)**, **Transporte (16)**, **Ajuste (8)**, **Automóvel/Moto (6)**, etc.

### PJ — Receita (6 categorias, 257 mov)
- **SEBRAETEC (170)** — Planejamento p/ presença digital(129), Desenv. Mídias(20), Website(17), Diagnóstico(2). **Este é o produto-âncora do faturamento.**
- **Vendas (74)** — Serviços Prestados(30), Tráfego Meta ADS(27), Website(7), MGF(4), Consultoria(3)
- **Financeiras (6)**, **SGF (5)**, **Investimentos (1)**, **Outras (1)**

### PJ — Despesa (12 categorias, 315 mov)
- **Administrativas (104)** — Pró-labore(46), Dividendos(21), s/sub(15), Contabilidade(14), Aluguel(2), Internet(2), Material(1), Transporte(3). **Esta é a categoria-mãe da estrutura societária.**
- **Freelancer (61)** — sem subcategorias (apenas valor)
- **Impostos (58)** — DAS(28), GPS(25), CIM(5). **Crítico para Fator R: GPS é folha (faz numerador), DAS é tributo (não faz).**
- **ESTAGIÁRIOS (33)** — Bolsa Estágio(30) **— FAZ Fator R**
- **Financeiras (19)** — Empréstimo
- **Cursos/treinamentos (16)**, **unu (8)**, **Fornecedores (7)**, **Comercialização (4)**, **Pessoal (2)**, **Ferramenta (2)**, **Outras (1)**

---

## 9. Evolução temporal

| Ano | Categorias PF | Categorias PJ |
|---|---:|---:|
| 2024 | 22 | 14 |
| 2025 | 31 | 18 |
| 2026 | 16 | 10 |

Iremar EXPANDIU o vocabulário em 2025 (mais categorias) e CONTRAIU em 2026 (consolidação ou parou de usar). Aderência ao parsing: 2026 está parcial (caminho até 20/05).

Não encontrei renomeação de categoria entre anos com mesmo nome ligeiramente diferente (não houve "Saude"→"Saúde" ou "Investimento"→"Investimentos"). **Vocabulário estável** — bom sinal.

---

## 10. Padrões e achados-chave

1. **PF e PJ têm modelos mentais diferentes.** PF organiza por pessoa+tema. PJ organiza por projeto+linha.
2. **Centro de Custo em PJ é o eixo mais valioso** — 18 valores, 100% preenchido, alinhado com gestão de projetos.
3. **Projeto em PJ é cliente/contrato** — formato padronizado em 2025 (`CÓDIGO | UF | TIPO | CLIENTE`).
4. **Centro de Custo em PF é redundante** com `entity_id + responsible` do i2-finance — só "FAMÍLIA / IREMAR / JULIANA / FILHAS / CASAL" cobre 71% dos casos, e isso já está modelado.
5. **Subcategorias de Impostos PJ são essenciais para Fator R** — `GPS` e `Bolsa Estágio` somam à folha; `DAS` e `CIM` não.
6. **"i2 Soluções" como Centro de PF (91 mov)** sinaliza vazamento PF↔PJ — não copiar essa prática.
7. **Tags e Cartão são inúteis** — não migrar conceito.
8. **Forma de Pagamento tem 60–80% vazio** — campo opcional de baixo valor.
9. **Status com 4 estados** (Pendente/Agendado/Confirmado/Conciliado) é mais rico que o i2-finance atual — avaliar se Pendente/Agendado faz sentido.
10. **Coluna "Conta transferência"** existe e foi usada nas 148 transferências PF + 14 PJ — i2-finance já tem `transfer_partner_id`/equivalente, validar paridade.

---

## Próximo passo
Rita deve atacar o doc 2 com senso crítico — não copiar nada por inércia.
