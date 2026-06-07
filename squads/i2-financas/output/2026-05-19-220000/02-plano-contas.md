# 02 — Plano de Contas + Regras (Marcos)

> Plano de contas mínimo viável para gestão financeira (não é ERP).
> Estrutura: 2 dimensões obrigatórias (`entity_id` + `category_id`) + 1 dimensão de atribuição (`responsible`).

## 1. Princípios

1. **Categoria descreve a natureza do gasto** (o quê), não quem pagou. Quem pagou = `responsible`.
2. **A mesma categoria pode aparecer em PF e PJ** — `entity_id` separa o universo.
3. **Categoria tem `default_responsible`** mas pode ser sobrescrita por transação.
4. **Toda categoria pertence a um grupo** (fixo, variável, investimento, receita) — esse grupo é o que vira KPI.
5. **Tudo o que não casar com regra → categoria "A Classificar"**. Nunca deixar `NULL`.

## 2. Catálogo canônico de categorias

### 2.1 PESSOA FÍSICA (entity = Família)

#### Grupo: Custo Fixo Essencial (não negociável no curto prazo)
| Categoria | Default responsible | Exemplos típicos |
|---|---|---|
| Moradia — Aluguel/Cond | iremar | Condomínio, Apartamento (Juliana), IPTU |
| Moradia — Utilidades | iremar | Internet, energia, água, gás |
| Educação — Escolas | iremar | Escola Helena, Escola Isabela |
| Saúde — Plano | iremar | Plano de saúde, dentista contratado |
| Transporte — Veículo | iremar | Seguro carro, IPVA, NuTag (pedágio) |

#### Grupo: Custo Variável Recorrente (controlável)
| Categoria | Default responsible | Exemplos |
|---|---|---|
| Alimentação — Mercado | casal | Atacadao, supermercados |
| Alimentação — Padaria/Conveniência | casal | Padaria Eldorado, Padaria Canaa |
| Alimentação — Restaurante/Delivery | casal | iFood, Ifd*Ifood Club, restaurantes |
| Alimentação — Feira/Hortifruti | iremar | "Feira de casa" (compromisso recorrente) |
| Saúde — Farmácia | casal | Drogasil, farmácias |
| Saúde — Terapia/Profissional | iremar | Terapia |
| Transporte — Combustível | casal | Petrobras Premmia, Premmia*Br |
| Transporte — Apps | casal | Uber, 99, Dl*Uberrides |
| Transporte — Estacionamento | casal | Bompark |
| Lazer — Streaming | casal | Netflix, Amazon Prime |
| Lazer — Restaurante/Bar | casal | Amary Gastrobar, Machadus |
| Lazer — Viagem | casal | Airbnb, hotéis, passagens |
| Compras — Casa | casal | Amazon (genérico), utilidades |
| Compras Pessoais — Iremar | iremar | Academia, vestuário dele |
| Compras Pessoais — Juliana | juliana | Suave Depil Beleza, vestuário dela |
| Beleza/Cuidados | casal | Salão, estética compartilhada |

#### Grupo: Investimento e Reserva (não é gasto — é alocação)
| Categoria | Default responsible | Exemplos |
|---|---|---|
| Investimento — Tesouro Direto | iremar | Aporte mensal R$ 1.000 (100% Iremar) |
| Investimento — Reserva Segurança | iremar | Caixinha NuBank R$ 700/mês |
| Investimento — Outros | iremar | NuInvest, ações |

#### Grupo: Receita PF
| Categoria | Default responsible | Origem |
|---|---|---|
| Receita — Pró-labore | iremar | R$ 5.000/mês PJ → PF |
| Receita — Lucros distribuídos | iremar | ~R$ 3.000/mês variável |
| Receita — Salário Juliana | juliana | (se houver) |
| Receita — Reembolso/Outros | iremar | Cashback, devoluções, IOF de volta |

#### Grupo: Ajuste / Não classificado
| Categoria | Default responsible | Uso |
|---|---|---|
| A Classificar | unassigned | Default quando nenhuma regra casa — fila de revisão |
| Transferência entre contas | casal | Internas; não entra em receita nem despesa |

---

### 2.2 PESSOA JURÍDICA (entity = i2 Soluções Digitais)

#### Grupo: Receita Bruta
| Categoria | Exemplos |
|---|---|
| Receita — Serviços prestados | Pagamentos recebidos com NF emitida |
| Receita — Reembolso de cliente | Cobranças de despesas a clientes |

#### Grupo: Pessoal (entra no Fator R — folha)
| Categoria | Exemplos |
|---|---|
| Folha — Pró-labore | Pró-labore Iremar R$ 5.000 |
| Folha — Salários | Funcionários CLT (se houver) |
| Folha — INSS | R$ 550/mês |
| Folha — FGTS/Encargos | Se houver CLT |

> **Importante (Fator R)**: a soma de (Pró-labore + Salários + INSS empresa) dividida pela receita bruta dos últimos 12 meses define se a i2 entra no Anexo III (mais barato) ou Anexo V. Meta: manter ≥ 28%.

#### Grupo: Impostos
| Categoria | Exemplos |
|---|---|
| Imposto — DAS Simples | DAS R$ 2.600,21 (variável) |
| Imposto — IRPJ retido | Se aplicável |
| Imposto — ISS | Se destacado em NF |

#### Grupo: Custo Operacional fixo
| Categoria | Exemplos |
|---|---|
| Infra — SaaS Desenvolvimento | Claude.Ai, Cursor, GitHub, Vercel, DigitalOcean |
| Infra — SaaS Produtividade | Google Workspace, Apple iCloud (PJ), Notion |
| Infra — SaaS Design/Conteúdo | Canva, Freepik, KlingAi, Figma |
| Serviços — Contabilidade | Honorário contador |
| Serviços — Terceirizados | Andre Luiz Multichat, freelancers |
| Serviços — Certificado digital | Certificador anual |

#### Grupo: Operacional variável
| Categoria | Exemplos |
|---|---|
| Marketing — Anúncios | Meta Ads, Google Ads |
| Viagem — Cliente | Airbnb (cliente), passagens PJ |
| Material de escritório | Papelaria, hardware |
| Taxas bancárias | TED, manutenção conta PJ, IOF |

#### Grupo: Distribuição
| Categoria | Exemplos |
|---|---|
| Distribuição — Lucros | Retirada de lucros R$ 3.000 (variável) |

---

## 3. Regras de classificação automática (palavras-chave)

> Sintaxe: `pattern` (regex case-insensitive) → categoria + responsible default. Aplicar **antes** da inserção e **também em batch** sobre histórico não classificado.

### 3.1 Alimentação
```
/atacad(ao|ão)|carrefour|extra mercado|assai|sams club|tenda atacado/  → Mercado / casal
/drogasil|drogaria|farmacia|raia|pacheco|pague menos/                  → Farmácia / casal
/padaria|panificadora/                                                 → Padaria / casal
/ifood|ifd\*|rappi|james delivery|99food/                              → Delivery / juliana (rever)
/uber\s*eats/                                                          → Delivery / casal
/restaurante|bar |gastrobar|pizza|sushi|burger|hamburg/                → Restaurante / casal
/feira (de )?casa|hortifruti|sacolao|sacolão/                          → Feira / iremar
```

### 3.2 Transporte
```
/uber\s*\*|dl\s*\*?uber|99\s*pop|99app/                                → Apps / casal
/petrobras|shell|ipiranga|premmia|posto /                              → Combustível / casal
/nutag|sem parar|conectcar|veloe|estapar/                              → Pedágio/Estac / casal
/bompark|estapar|park /                                                → Estacionamento / casal
```

### 3.3 Lazer
```
/netflix|spotify|youtube premium|amazon prime|disney|hbo|paramount/    → Streaming / casal
/cinemark|kinoplex|cinepolis|cinema/                                   → Cinema / casal
/airbnb hmpnazbzpq/                                                    → Viagem / iremar  (fixa)
/airbnb hmt5nrjpkh/                                                    → Viagem / juliana (fixa)
/airbnb|booking|decolar|latam|gol|azul|hotel/                          → Viagem / casal
```

### 3.4 PJ — SaaS
```
/claude\.ai|claude ai|anthropic/                                        → SaaS Dev / i2
/cursor|github|vercel|digitalocean|supabase|cloudflare/                → SaaS Dev / i2
/google workspace|google one|notion\.so|notion\s|slack|linear/         → SaaS Produtividade / i2
/canva|freepik|adobe|figma|kling/                                      → SaaS Design / i2
/apple\.com\/bill|itunes|appstore/                                     → SaaS Apple / i2 (rever caso a caso)
/iof[: ]intl|iof de compra internacional/                              → Tarifa PJ / i2
```

### 3.5 PJ — Folha e tributos
```
/pro\s*labore|pró-labore/                                              → Pró-labore / i2
/das simples|das mei|simples nacional|das s/                           → DAS / i2
/inss/                                                                  → INSS / i2
/retirada de lucros|distribuição de lucros/                            → Lucros / i2
```

### 3.6 PJ — Serviços
```
/andre luiz|andré luiz/                                                → Terceirizado / i2
/certificador/                                                         → Certificado digital / i2
```

### 3.7 Casa
```
/condom(í|i)nio/                                                       → Moradia / iremar
/iptu|prefeitura/                                                      → Moradia / iremar
/ipva|detran|cetran/                                                   → Transporte / iremar
/internet|vivo fibra|claro net|tim live|oi fibra/                      → Utilidades / iremar
/escola|colégio|colegio|educa(ç|c)ão/                                  → Educação / iremar
/plano de sa(ú|u)de|hapvida|amil|bradesco saude|unimed/                → Saúde / iremar
/terapia|psic(o|ó)log/                                                 → Terapia / iremar
```

### 3.8 Sobrescritas conhecidas (do histórico)
```
/gilberto luiz/                                                        → Compras pessoais Iremar / iremar
/real tech/                                                            → Compras Juliana / juliana
/thomas auto/                                                          → Manutenção carro / casal
/suave depil/                                                          → Beleza Juliana / juliana
/ebncanva/                                                             → SaaS Design / i2
```

## 4. Regras de negócio explícitas (não cobertas por palavra-chave)

### R1 — Conta determina entity_id
- Toda transação em `Cartão Nubank` ou `Conta Iremar`/`Conta Juliana`/`Caixinha`/`NuInvest` → `entity_id = Família`
- Toda transação em `i2 Soluções` (conta company) → `entity_id = i2 Soluções Digitais`

### R2 — Casal por default no cartão compartilhado
- Tudo no `Cartão Nubank` começa como `responsible='casal'`, **exceto** se palavra-chave indicar dono específico (regras 3.x acima).

### R3 — Compras pessoais ≠ casal
- Despesas claramente pessoais (academia, vestuário, beleza individual, hobbies) → vão para "Compras Pessoais — [Nome]" e **não entram no acerto do dia 13**.

### R4 — Investimento não é gasto
- Aporte em Tesouro Direto e Reserva de Segurança são **transferências entre contas** quando saem do `checking` para `investment`. Não devem aparecer como "despesa" em relatórios de consumo.

### R5 — Pagamento de fatura ≠ despesa
- "Pagamento recebido" no `Cartão Nubank` é uma transferência da conta corrente para o cartão. Tem que virar `transfers`, não `transactions` no relatório de fluxo.

### R6 — IOF e estornos PJ andam juntos
- "IOF de compra internacional" segue a entity da transação original (geralmente PJ por causa de SaaS).
- "IOF de volta de ..." idem.

### R7 — Reembolsos i2 → Iremar
- Toda saída da PJ que paga despesa pessoal (sem NF) é tecnicamente uma **distribuição de lucros antecipada** ou **adiantamento**. Registrar como `income_records.kind='i2_reimbursement'` para rastrear.

### R8 — Categoria "A Classificar" tem SLA
- Toda transação em "A Classificar" deve sair em até 7 dias. KPI operacional: `tx_a_classificar > 5` por mais de 1 semana = alerta vermelho na UI.

## 5. Migração: como sair do estado atual

1. **Seed inicial** (DDL fora do escopo deste squad — entregar para i2-melhorias):
   - Inserir as ~50 categorias canônicas em `public.categories` para o household
   - Inserir `default_responsible` quando aplicável
2. **Re-link das 28 regras existentes** ao novo `category_id`
3. **Adicionar as ~30 regras novas** acima
4. **Backfill**: rodar motor de regras sobre as 255 transações órfãs → projeção: ≥ 70% devem categorizar automaticamente
5. **Triagem manual** do resto (~30% = ~75 transações) — viável em uma sessão

## 6. O que NÃO está no escopo deste plano

- Centro de custo PJ (não há equipe ainda)
- Contas de balanço (ativo/passivo) — sistema é DRE-light, não contabilidade plena
- Reconciliação bancária via Open Finance (proibido no memory)
- Tags livres — categorias chapadas bastam por enquanto
