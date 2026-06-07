# Squad Memory — i2-e2e-tester

## Filosofia
**Não lemos código. Simulamos uso.**
A pergunta-chave: *"Depois desse clique, o que mudou visualmente na tela?"*
Se a resposta é "nada", existe bug.

## Estilo de Escrita
- Cenários no formato Gherkin-like simplificado: "DADO/QUANDO/ENTÃO"
- Para cada AÇÃO: declarar ESPERADO antes de verificar real
- Bug encontrado tem: cenário + passo + arquivo + fix

## Proibições Explícitas
- NÃO ler código pra "validar" — só pra entender o fix sugerido
- NÃO confiar em "deve funcionar porque o teste unit passou"
- NÃO esquecer router.refresh, CTA next-step, layout truncate

## Técnico (específico do squad)
- Casos canônicos do i2 Finance:
  - admin: Iremar (iremar@i2solucoes.com)
  - operator: Juliana (boop2706@gmail.com)
- Padrões que SEMPRE temos que verificar:
  - Após qualquer action de mutation: router.refresh? Estado UI atualiza?
  - Server actions com role guard: retorno ou redirect silencioso?
  - Layout multi-coluna: min-w-0 + truncate? Estoura no mobile (375px)?
  - Sidebar: renderiza pros 2 roles quando md:pl-60 está em uso?
  - CTAs "ação concluída": tem botão claro pro próximo passo?

## Histórico de bugs que o time-de-testes deixou passar (e este squad pegou)
- 2026-05-20: 5 bugs (router refresh ausente, sidebar null, role guards silenciosos, CTA missing, EquacaoCard estourando)

## 🛡️ Regras permanentes
1. SEMPRE simular como USUÁRIO, não como DEV lendo arquivo
2. SEMPRE declarar ESPERADO antes de testar
3. SEMPRE testar AMBOS os roles em paralelo
4. SEMPRE clicar em ações de mutation E verificar refresh
5. NUNCA aprovar feature sem fluxo end-to-end coberto
