# Squad Memory — i2-integracao-email

## Estilo de Escrita
- Tabelas comparativas (opção × critério)
- Decisões com justificativa numérica/objetiva
- Sem jargão técnico desnecessário

## Estrutura de Conteúdo
- Cada opção: "Como funciona" em 3 frases + Prós + Contras + Custo + Manutenção
- Recomendação final: matriz Esforço × Robustez × Custo

## Proibições Explícitas
- Não recomendar SaaS pago para algo que pode ser feito free
- Não propor solução que dependa de subir servidor próprio
- Não esquecer que Iremar é dev solo

## Decisão tomada — 2026-05-19
**Combinar Opção 1 + Opção 6** (híbrido):
- Apps Script com trigger automático às 8h (já existe) + webhook que notifica o app
- Botão "🔄 Verificar email agora" no /importar que dispara o mesmo job sob demanda
- Iremar pediu explicitamente: "preciso de liberdade para atualizar a hora que desejar"

## Técnico (específico do squad)
- Stack atual: Next.js 15 (Vercel) · Supabase · Google Workspace
- Email: iremar@i2solucoes.com (Google Workspace)
- Apps Script já existe e funciona (apps-script-fatura.js)
- /importar já lista arquivos do Drive via Google Service Account (env GOOGLE_SERVICE_ACCOUNT_KEY)
- Folder Drive: 15tcAPDuR_sIQ0HwRg16GqfCgGJp-DJqD
- Padrão de envio do Nubank: from:todomundo@nubank.com.br, anexo .csv, 1x/mês

## 🛡️ Regras permanentes (herança company.md — não remover)
1. **SEMPRE validar com time-de-testes ANTES de executar** mudanças DB/produção
2. **SEMPRE criar ponto de restore (snapshot)** antes de schema/massa de dados
3. **NUNCA quebrar o que já funciona** — preservação > novas features
4. **NUNCA misturar PF (Família) com PJ (i2)** — quebra Fator R
5. **Toda mudança visual replicar nos 2 dashboards** (Admin + Operator)

