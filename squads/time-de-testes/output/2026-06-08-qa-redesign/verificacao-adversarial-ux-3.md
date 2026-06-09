# Verificação adversarial — achado ux-3

**Veredito: REAL (confirmado). Severidade mantida: baixa.**

## Achado original
AnchorHero no escopo "empresa" rotula o cofre PJ (Inter Investimentos, R$ 4.503,
kind=investment) como "Conta empresa · disponível pra operação", fundindo cofre +
conta operacional num único número-âncora.

## Prova concreta

### Código
- `apps/web/src/components/AnchorHero.tsx` L49-57 (escopo empresa):
  - `label: 'Saldo i2 Soluções'`
  - `value: saldoContas`
  - `sublabel: 'Conta empresa · disponível pra operação'`
- `apps/web/src/app/dashboard/page.tsx` L144-153 — `filteredAccts`:
  - exclui apenas `kind === 'credit_card'`;
  - para `scope === 'empresa'`, filtra `entity_id === bizEntityId`;
  - **NÃO** exclui `kind === 'investment'`.
  - Logo, `saldoContas` (L150-153) soma Inter PJ (company) + Inter Investimentos
    (investment) quando o escopo é empresa.

### Dados (SQL, project jvfdzcouychlfxxnzams, household a1b2c3d4-...)
Replicando exatamente a lógica do dashboard para scope=empresa (active, !credit_card,
entity=business, saldo = opening_balance + Σtx):

| Conta               | kind       | saldo      |
|---------------------|------------|------------|
| Inter PJ            | company    | R$ 0,00    |
| Inter Investimentos | investment | R$ 4.503,00|
| **saldoContas**     |            | **R$ 4.503,00** |

Ou seja: o número-âncora exibe **R$ 4.503,00** rotulado como "disponível pra operação",
mas R$ 0,00 está de fato líquido na conta operacional (Inter PJ) e R$ 4.503 está no
cofre/investimento.

### Contraste com o CofrePlanner (mesma jornada)
`apps/web/src/app/empresa/pagamentos/page.tsx` L86-92 separa explicitamente:
- `interPJ = i2Accounts.find(a => a.kind === 'company')`
- `cofres  = i2Accounts.filter(a => a.kind === 'investment')`
- `saldoInterPJ = accountBalance(interPJ)` — **só** a conta company.

Toda a premissa do CofrePlanner ("Precisa resgatar do cofre" → transferir cofre → Inter PJ,
L80-94 do CofrePlanner.tsx) depende de o cofre NÃO ser líquido na conta operacional.
O AnchorHero diz o oposto na tela anterior: que os R$ 4.503 já estão disponíveis pra operação.

## Por que NÃO é ALTA (não é violação de Fator R)
A separação por entidade está correta: ambas as contas são da entidade i2/business
(SQL confirma entity_id=04e9ab59-...). Não há mistura PF/PJ. Nenhum saldo da Família
vaza pro número da empresa. É um problema de **rótulo/semântica** (sugere liquidez
operacional inexistente), não de cálculo errado nem de vazamento de dados — daí baixa.

## Fix sugerido (do revisor, válido)
No escopo empresa, separar liquidez operacional (kind=company) do cofre (kind=investment):
âncora = saldo Inter PJ; cofre como linha secundária — espelhando a lógica do CofrePlanner.
Alternativa mínima: ajustar o sublabel para "Conta empresa + cofre" para não dar a entender
que tudo está disponível pra operação.
