# 02 — Descrição completa (Tito, Frontend Dev)

## P1 — Resolvido

### CategorizarItem (`app/categorizar/CategorizarItem.tsx`)
Antes:
```tsx
<p className="text-white text-sm font-semibold truncate">{tx.description}</p>
```
Depois:
```tsx
<p className="text-white text-sm font-semibold leading-snug break-words">
  {tx.description}
</p>
```
- Removido `truncate`, adicionado `leading-snug break-words` para permitir wrap em múltiplas linhas mantendo legibilidade.

### TransactionList (`components/TransactionList.tsx`)
- Removido `truncate` + `leading-tight` → trocado por `leading-snug break-words`.
- Adicionado `title={tx.description}` (tooltip nativo em desktop para descrições longas).
- Container do Link mudou de `items-center` → `items-start` para alinhar bem quando descrição quebra em 2+ linhas.

## Resultado
- Iremar e Juliana agora veem a descrição completa em `/categorizar`, `/lancamentos` e no card de "Últimos lançamentos" do dashboard.
- Mantida hierarquia visual: badge, data, valor seguem alinhados ao topo.
