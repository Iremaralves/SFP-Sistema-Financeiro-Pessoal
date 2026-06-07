# 01 — Auditoria de Paridade (Clara, UX Ops)

## Estado encontrado

### Sidebar (admin desktop)
- `components/Sidebar.tsx` já tinha `/importar` em NAV_ITEMS — OK, nada a restaurar.
- Sidebar renderiza apenas para `role === 'admin'`. Operator não vê desktop sidebar (correto, é mobile-only).

### BottomNav admin (mobile)
- Slot principal anterior: `Início | Lançamentos | + | Contas | Mais`
- `↑ Importar` estava acessível apenas via drawer Mais (em parte alguma direta).
- **Ação:** trocar `Contas` por `↑ Importar` no slot principal. `Contas` migra para o drawer Mais (junto com `Compromissos`, que também não estava lá).

### BottomNav operator (mobile)
- Slot anterior: `Início | Lançamentos | + | Importar | Contas` (sem Mais).
- Operator não tinha como abrir Acerto Casal nem Fechamento.
- **Ação:** trocar `Contas` por `Mais` e criar `MAIS_ITEMS_OPERATOR` com Contas, Acerto Casal, Fechamento, Relatórios.

### Guards de rota
| Rota          | Guard atual            | Decisão squad   | Ação                       |
|---------------|------------------------|-----------------|----------------------------|
| `/acerto`     | `role !== 'admin'`     | ambos           | remover guard               |
| `/mes`        | `role !== 'admin'`     | ambos           | remover guard               |
| `/empresa`    | (admin)                | só admin        | manter                      |
| `/importar`   | sem guard de admin     | ambos           | já compatível               |

### Truncate de descrição (P1)
| Tela                | Local             | Problema                            |
|---------------------|-------------------|-------------------------------------|
| `/categorizar`      | CategorizarItem   | `truncate` no `<p>` da descrição    |
| `/lancamentos`      | TransactionList   | `truncate` no `<p>` da descrição    |
| `/dashboard`        | TransactionList   | mesmo componente                    |

### Paridade DashboardAdmin × DashboardOperator
| Feature                          | Admin | Operator | Decisão                |
|----------------------------------|-------|----------|------------------------|
| Hero total fatura + sparkline    | sim   | sim      | OK (paridade visual)   |
| Equação pessoal + casal÷2        | sim   | sim      | OK                     |
| Donut split (xl+)                | sim   | não      | não faz sentido op     |
| Card Casal + i2                  | sim   | não      | i2 é só admin          |
| Atalhos para Categorizar/Acerto  | não   | não      | adicionar em operator  |
| Próximos vencimentos             | não   | não      | adicionar em admin (P7)|

### Dialog ao dar baixa (P8)
- `DarBaixaButton` hoje chama `actionDarBaixa(id, amount, mes)` direto.
- Schema `monthly_obligations` já tem `paid_amount` e `paid_on` separados de `amount`.
- **Ação:** refatorar para abrir dialog (valor pago + data) antes de confirmar.

## Resumo das ações para Tito

1. `BottomNav.tsx` — `↑ Importar` no slot principal admin; criar Mais operator.
2. `CategorizarItem.tsx` + `TransactionList.tsx` — remover `truncate`, permitir wrap completo.
3. `/acerto/page.tsx` + `/mes/page.tsx` — remover guard `role !== 'admin'`.
4. `DashboardAdmin.tsx` — card "Próximos vencimentos" (via prop server-side).
5. `DashboardOperator.tsx` — grid de atalhos para `/categorizar` e `/acerto`.
6. `DarBaixaButton.tsx` + `actions.ts` — dialog inline com paidAmount + paidOn customizados.
