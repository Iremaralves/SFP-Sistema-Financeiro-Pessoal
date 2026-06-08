# Memória — Squad i2-redesign-completo

## Regras permanentes
- **Dark mode é identidade**, não trocar pra light por opção
- **Cores de responsável** já estão no DNA: azul=Iremar, rosa=Juliana, âmbar=i2, ciano=Casal — preservar
- **Mobile-first sempre** — qualquer tela deve funcionar em 375px de largura
- **Glassmorphism é ok**, mas usar com critério (não em TUDO)
- **Não inventar feature nova** — escopo é redesenho do que existe

## Princípios herdados de squads anteriores
- "Tudo em 1 olhada" — Iremar não quer scrollar pra ver o essencial
- "Defensive UI" — Juliana não pode quebrar dado clicando em qualquer canto
- "Paridade visual entre Admin e Operator" — Juliana não vê uma versão "rebaixada", vê versão filtrada
- "Cartão de crédito = fonte de verdade Nubank" — nunca editar dados financeiros sem aviso

## Lições aprendidas (do squad i2-design original)
- Layout estourava no desktop 1440+ — corrigir com max-w + grid responsivo
- Mobile não pode ter sidebar — usar BottomNav + Drawer
- Operator tinha layout quebrado (EquacaoCard) — replicar Admin com filtros, não fazer separado
