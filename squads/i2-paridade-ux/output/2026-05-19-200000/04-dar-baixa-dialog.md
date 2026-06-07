# 04 — Editor inline ao dar baixa (P8)

## DarBaixaButton refatorado

### Antes
- Botão "Dar baixa" → chamava `actionDarBaixa(id, amount, mes)` imediatamente. Sem chance de ajustar valor real pago.

### Depois
- Botão "Dar baixa" → abre **dialog modal centralizado** com:
  - **Valor pago** (input numérico, default = `amount` cadastrado) — mostra cadastrado como hint abaixo.
  - **Data do pagamento** (input `type="date"`, default = hoje).
  - Botões: Cancelar / Confirmar (gradient verde).
- Validação client-side: valor > 0, formato decimal aceitando `,` ou `.`.
- Backdrop com blur, click outside fecha (exceto durante request).

## actions.ts
- `actionDarBaixa` agora aceita 4º parâmetro opcional:
  ```ts
  opts?: { paidOn?: string; paidAmount?: number }
  ```
- `paid_on` = `opts.paidOn` ou hoje.
- `paid_amount` = `opts.paidAmount` ou `amount` (default mantém compat).
- O `amount` cadastrado da obrigação **não muda** — apenas o `paid_amount` real.

## Observação opcional
- Schema `monthly_obligations` não tem coluna `notes`/`observation`. Para não bagunçar migrations no squad, o campo de observação foi **omitido** (manteria-se para um squad de dados futuro). Os 2 campos críticos (valor real + data real) cobrem o caso de uso descrito pelo Iremar (conta de luz que varia).

## Arquivos modificados
- `apps/web/src/app/compromissos/DarBaixaButton.tsx` (reescrito)
- `apps/web/src/app/compromissos/actions.ts` (assinatura + uso de `finalAmount`/`todayStr`)
