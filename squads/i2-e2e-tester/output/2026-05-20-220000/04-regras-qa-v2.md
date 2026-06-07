# Regras QA v2 — adicionadas ao squad time-de-testes
Run: 2026-05-20 · Squad: i2-e2e-tester

Editei `/Users/iremaralvesii/Financeiro/squads/time-de-testes/_memory/memories.md`
adicionando a seção `## ⚠️ Regras vindas do squad i2-e2e-tester (2026-05-20)`
antes das "Regras permanentes". 6 regras concretas:

1. **md:pl-60 obrigatório no desktop** — testar viewport ≥768px,
   confirmar Sidebar não cobre header. Pages flagradas: /mes,
   /lancamentos/[id].

2. **revalidatePath multi-rota** — pra cada mutation, listar TODAS as
   pages que consomem a tabela e revalidar cada uma. B-01 (dashboard
   stale após dar baixa em /compromissos) é exemplo canônico.

3. **Redirect com mensagem, nunca silencioso** — `?msg=acesso-restrito`
   + toast no destino. Auditar todo `role !== 'admin') redirect(...)`.

4. **Strings hardcoded envelhecem** — fazer grep de "CLI", "TODO",
   nomes de features antigas; conferir coerência com o estado atual.
   B-05 ("use o CLI para categorizar") é exemplo.

5. **Props opcionais com impacto UI** — inspecionar em runtime se TODA
   chamada passa valor real. Considerar tornar obrigatório.
   B-04 (BottomNav sem name= → Sidebar com firstName vazio).

6. **Paridade de tema entre roles** — qualquer cor "active/accent" em
   componente compartilhado deve derivar de `role`. Sidebar hoje hardcoda
   azul para os 2 roles.

## Por que essas 6 e não outras
Cada regra mapeia 1-para-1 com um bug concreto que esta run pegou e o
time-de-testes deixou passar. Não inventei generalidades — são padrões
de erro observados, com pages/arquivos específicos como prova.
