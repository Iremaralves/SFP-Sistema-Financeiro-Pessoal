# Verificação adversarial — edge-3

**Achado original:** Planejador: se a i2 não tiver conta kind='company', o CofrePlanner some e o saldo PJ vira R$ 0 silenciosamente.
**Severidade reportada:** média
**Arquivo:** apps/web/src/app/empresa/pagamentos/page.tsx

## Veredito: REAL, mas severidade rebaixada para BAIXA

O padrão de código descrito existe exatamente como relatado. Porém **NÃO reproduz na produção atual** — é um gap de resiliência a configuração futura, não um defeito ativo. Severidade "média" está exagerada.

## Evidências de código (confirmadas)

`apps/web/src/app/empresa/pagamentos/page.tsx`:
- L88: `const interPJ = i2Accounts.find(a => a.kind === 'company');`
- L92: `const saldoInterPJ = interPJ ? accountBalance(interPJ) : 0;`
- L122: `const deficit = Math.max(0, totalAPagar - saldoInterPJ);`
- L191: `{interPJ && (<CofrePlanner .../>)}`  ← gate condicional

Se `interPJ` for `undefined`:
- saldoInterPJ = 0
- deficit = totalAPagar (assume saldo PJ zero)
- CofrePlanner **não renderiza** (gate L191) → o cofre i2 (R$4.503) fica inacessível pela tela
- "Total a desembolsar" (L180) continua **correto** (depende só de `totalAPagar`)

## Evidência de dados (SQL — household a1b2c3d4...)

Entidade i2 (`04e9ab59-1acb-4897-bfc7-e2b91d439655`) tem exatamente 2 contas:
- `Inter PJ` — kind=`company`, active=true  ← caminho feliz GARANTIDO hoje
- `Inter Investimentos` — kind=`investment`, opening_balance=4503, active=true (o cofre)

Existe **uma única** conta `company` na i2. O caminho feliz funciona em produção hoje. Confirma o que o próprio revisor admitiu.

## Por que rebaixar de média para baixa

1. **Não reproduz com os dados atuais.** Requer uma mudança futura deliberada (renomear/desativar/recriar a conta PJ com outro kind). O próprio achado diz: "é resiliência a configuração futura".
2. **Nenhum número errado é exibido.** O título sugere "saldo PJ vira R$ 0 silenciosamente", mas a tela não mostra um campo "Saldo PJ" incorreto — o número-âncora (Total a desembolsar) permanece correto. A degradação visível é apenas o card do cofre sumir.
3. **Não viola REGRAS SAGRADAS.** O filtro por entidade (`a.entity_id === i2Entity?.id`, L87) continua intacto; nenhuma mistura PF/PJ (Fator R). Não quebra fatura/acerto/compromissos/contas. Não quebra reconciliação da divisão por responsável.
4. **Impacto = UX degradada / feature oculta**, não integridade de dados.

## Recomendação (mantida do achado)

Fallback útil: se não houver conta `company` na i2, renderizar um aviso explícito ("Nenhuma conta empresa configurada — saldo PJ assumido R$0") em vez de ocultar o card. Vale como hardening, baixa prioridade.
