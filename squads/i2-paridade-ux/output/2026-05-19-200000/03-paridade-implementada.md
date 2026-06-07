# 03 — Paridade Admin × Operator implementada

## P2/P3/P6/P7 — Resolvidos

### BottomNav (`components/BottomNav.tsx`)
- **Admin slot principal:** trocado `Contas` por `↑ Importar`. Iremar agora tem acesso direto a importar CSV em 1 toque.
- **Mais (admin):** adicionado `Contas` e `Compromissos` no drawer (antes só tinha empresa/relatórios/transferências/acerto/notas).
- **Operator slot principal:** trocado `Contas` por `Mais` (drawer).
- **Novo `MAIS_ITEMS_OPERATOR`:** Contas, Acerto Casal, Fechamento, Relatórios.

### Guards de rota removidos
- `app/acerto/page.tsx`: `if (!profile || profile.role !== 'admin') redirect('/dashboard')` → `if (!profile) redirect('/login')`.
- `app/mes/page.tsx`: removido `if (profile.role !== 'admin') redirect('/dashboard')`.
- Resultado: Juliana acessa `/acerto` e `/mes` (ela paga R$ 1.730 mensais do Iremar — precisa ver o saldo).

### DashboardAdmin — Card "Próximos vencimentos" (P7)
- `app/dashboard/page.tsx`: query server-side que busca `recurring_commitments` boleto/PIX ativos, filtra os não pagos no mês atual e que vencem em ±14 dias do dia de hoje. Top 5 ordenados por dia de vencimento.
- `components/DashboardAdmin.tsx`: nova prop `upcoming`; render de card glass com badge "dia X", label dinâmico (Atrasado / Hoje / Amanhã / Em N dias), valor formatado e link para `/compromissos`.
- Cores semânticas: vermelho (atrasado), amarelo (hoje/amanhã), índigo (futuro).

### DashboardOperator — Atalhos rápidos
- Grid 2 colunas com cards para `/categorizar` (amarelo, "Definir responsável") e `/acerto` (cyan, "Fechamento do mês"). Combinam com o destaque já existente no header.
- `BottomNav` passou a receber `name={profile.name}`.

## Sidebar (admin desktop)
- Já tinha `/importar` em `NAV_ITEMS`. Nenhuma mudança necessária.
