# Memória — Squad i2-gestao-decisoria

## Missão
Transformar o i2 Finance de "registro do passado" em "ferramenta de decisão".
O Iremar hoje decide pagamentos da semana de cabeça/planilha. O app precisa
responder "quanto preciso ter na conta sexta pra pagar todo mundo?" e
"posso usar o cartão esse mês?".

## Cenário-âncora (caso real do Iremar, usar como teste em TODAS as fases)
Folha de uma semana da i2:
- Pedro: R$ 1.200
- Alana: R$ 550
- Eduarda: bolsa estágio PROPORCIONAL (começou 11/05 — não é R$ 500 cheio)
- Mayana: R$ 750
- Iremar: R$ 3.000
- Contadora: R$ 500
→ Iremar quer ver o TOTAL e saber quanto tirar do cofre (Caixinha/NuInvest).

## Regras permanentes
- NUNCA misturar caixa PF (Família) com PJ (i2) — quebra Fator R / contabilidade
- Migrations SEMPRE reversíveis + validar com time-de-testes ANTES de aplicar
- Criar snapshot (backup) antes de qualquer mudança de schema/massa de dados
- Dark mode + cores de responsável (azul/rosa/âmbar/ciano) são identidade
- Mobile-first 375px
- Reaproveitar tabelas existentes antes de criar novas (anti-over-engineering)

## Estado atual relevante (jun/2026)
- recurring_commitments já tem coluna `variable(bool)` — pode ajudar folha variável
- monthly_obligations materializa status mensal (pago/pendente) com due_date real
- income_records existe mas só pra receita PF — empresa não usa
- accounts kind='investment' = cofre (Caixinha Nubank, NuInvest)
- entities: Família (personal), i2 Soluções Digitais (business)

## Lições herdadas
- Iremar valoriza "tudo num olhar" sem scroll (AnchorHero já implementado)
- Iremar Validator dos squads anteriores cortou ~60% das propostas como perfumaria
  → priorizar o que tira ele da planilha, não o que fica bonito
- Profile scope (Pessoal/Empresa/Tudo) já existe — as telas novas devem respeitar
