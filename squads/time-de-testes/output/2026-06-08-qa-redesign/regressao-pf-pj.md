# QA Regressão — PF/PJ por entidade + telas que já funcionavam (2026-06-08)

Persona: QA Sênior (ex-Nubank). Validação com SQL + leitura de código.
Foco: a mudança de filtro por ENTIDADE (commit de hoje) quebrou algo?

## Veredito: DIMENSÃO SÓLIDA — nenhum bug ALTA/MÉDIA de regressão

A separação PF/PJ migrou de filtro por `kind` para filtro por `entity_id`.
Validei que isso está correto e consistente em todas as superfícies, e que
o Fator R (cofre PJ nunca puxa cofre da Família) está garantido por dado real.

---

## Evidência por regra sagrada

### 1. /contas — escopo pessoal NÃO mostra Inter PJ nem Inter Investimentos ✅
`apps/web/src/app/contas/page.tsx:79-86`
- `businessEntityId` = entidade i2 (`04e9ab59-...`).
- pessoal: `a.entity_id !== businessEntityId` → exclui Inter PJ (company) E Inter
  Investimentos (investment, mas PJ). Comentário explícito no código avisa que a
  Reserva i2 é `kind='investment'` mas NÃO pode vazar pro Pessoal — e o filtro por
  entidade (não por kind) cobre exatamente esse caso.
- empresa: `a.entity_id === businessEntityId` → mostra Inter PJ + Inter Investimentos.
- SQL confirma: Inter Investimentos tem `entity_type='business'`, saldo R$4.503.

### 2. Dashboard saldoContas por entidade ✅
`apps/web/src/app/dashboard/page.tsx:130-153`
- Mesmo filtro por entidade + exclui `credit_card` (cartão é dívida, nunca soma).
- pessoal = Nubank PF (-9.913,67) + Nubank Juliana (0) + Caixinha (0) + NuInvest (0)
  = -R$9.913,67.
- empresa = Inter PJ (0) + Inter Investimentos (4.503) = R$4.503.
- Números batem com SQL (opening_balance + soma das transactions por conta).

### 3. Planejador da empresa puxa cofre SÓ da i2 (não a Caixinha da Família) ✅
`apps/web/src/app/empresa/pagamentos/page.tsx:86-90`
- `i2Accounts = accounts.filter(entity_id === i2Entity.id)`.
- `cofres = i2Accounts.filter(kind === 'investment')` → SÓ Inter Investimentos.
- Caixinha Nubank e NuInvest (Família) ficam de fora. Fator R respeitado.
- CofrePlanner (`CofrePlanner.tsx`) só recebe `resgates` derivados desses cofres,
  e a transferência vai de cofre i2 → Inter PJ (mesma entidade).

### 4. Transferências não cruzam PF/PJ ✅
`apps/web/src/app/transferencias/actions.ts:76,90`
- Cada perna da transferência (saída/entrada) grava o `entity_id` da SUA conta.
  Não há reescrita forçando uma entidade só. SQL confirma: a única transfer
  existente (pagamento de fatura Nubank PF → Cartão) tem as duas pernas em
  `entity_type='personal'`. Não existe transfer cruzando entidade no banco.

### 5. /acerto e fatura intactos ✅
- `/acerto` (`acerto/page.tsx`) usa settlement + `paid_by`/`responsible` de
  recurring_commitments; não toca em `entity_id`. Reconciliação Juliana intacta.
- Fatura (dashboard) filtra `account_id = cartão` + `is_transfer = false`
  (`dashboard/page.tsx:42-51`). A mudança de entidade não altera essa query.
- Settlement (`packages/core/src/settlement.ts`) inalterado:
  `totalFatura = iremarPart + julianaPart + i2Part`;
  `julianaOwn = max(0, julianaPart - casalTotal/2)`. Reconciliação holds.

### 6. /compromissos — escopo por entidade intacto ✅
`apps/web/src/app/compromissos/page.tsx:126-146`
- Cookie de scope (empresa/pessoal) tem prioridade sobre filtro de URL e mapeia
  pra `i2Entity.id` / `famEntity.id`. Consistente com /contas e dashboard.

---

## Observações menores (NÃO são regressão do commit de hoje)

### OBS-1 (baixa): saldoContas Pessoal aparece negativo (-R$9.913,67)
- Causa: Nubank PF tem `opening_balance=0` e a ÚNICA transaction é o pagamento da
  fatura (-9.913,67). Não há lançamento de receita (salário/pró-labore) caindo na
  conta PF, nem opening_balance configurado.
- Isso é estado de DADO (cadastro incompleto), não efeito do filtro por entidade.
  O filtro está correto; o número só reflete o que foi lançado. Vale alinhar com o
  Iremar se o opening_balance das contas PF deveria estar preenchido.

### OBS-2 (baixa, informativo): Planejador inclui Pró-labore + Retirada de lucros
- Os dois maiores itens "a pagar" da i2 são `Pró-labore Iremar` (5.000) e
  `Retirada de lucros` (3.000), ambos `responsible='i2'`, `payment_method='pix'`.
  São desembolsos reais da Inter PJ (folha + distribuição), então entram
  corretamente no "Total a desembolsar" e no cálculo do déficit do cofre.
  Não é bug — só registrar que o número-âncora da tela inclui retiradas pro sócio.
