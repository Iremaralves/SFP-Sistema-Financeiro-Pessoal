# Direção Visual — i2 Financeiro

> Banking premium, não planilha. Mercury encontra Nubank num app que sabe a diferença
> entre o seu dinheiro e o da empresa — e nunca os confunde.

---

## A sensação

Quando o Iremar abre o app, ele não deve sentir que entrou numa ferramenta de
contabilidade. Deve sentir o mesmo que sente ao abrir o Mercury ou um extrato do
Nubank às 23h: **calma, controle e clareza**. Fundo OLED profundo, quase preto, que
some no escuro do quarto. Um único número grande respondendo à única pergunta que
importa naquela tela — "quanto falta?", "quanto sobra?", "dá pra pagar?". Tudo o mais
recua para um sussurro cinza. A interface não grita; ela orienta. A cor só aparece
quando significa algo: âmbar é a empresa, azul-índigo é o Iremar, verde é folga,
vermelho é atenção. Nada é decorativo. Cada glow tem motivo.

É um produto que transmite **confiança bancária**: superfícies de vidro sutis, sombras
suaves e longas, microcontraste nas bordas — o tipo de acabamento que faz o olho
acreditar que por trás daquele saldo existe rigor. Premium não é enfeite; é a ausência
de ruído.

---

## Três princípios

### 1. Hierarquia radical — um herói por tela
Toda tela tem **um número que importa**, e ele é gigante (`clamp(2.5–4rem)`, peso 700,
letter-spacing negativo, tabular-nums para não dançar). Esse é o âncora — o
`.anchor-hero`. Todo o resto — labels, datas, metadados — vive no registro do sussurro:
`white/40`, uppercase, tracking widíssimo, 10–11px. O contraste entre o gigante e o
sussurro é o que cria a sensação de produto caro. Se tudo tem o mesmo peso, vira
planilha. Decidimos a linguagem antes do pixel: **o que essa tela responde?** — e esse
é o número que cresce.

### 2. Escuro como base, cor como informação
Fundo OLED real: `#05050a` no centro, `#000` puro respirando nos cantos via radial.
Nunca light mode. Sobre esse breu, **glassmorphism com critério** — só nos cards de
destaque (`rgba(255,255,255,0.05)` + blur 22px + borda hairline). Listas longas usam
superfície sólida elevada, não vidro, para não virar sopa de blur. A cor é semântica e
disciplinada: azul-índigo do Iremar, rosa da Juliana, âmbar da i2, ciano do casal;
verde sucesso, amarelo alerta, vermelho perigo. Um gauge nunca é "bonitinho" — é um
semáforo que diz se o orçamento está saudável. Cor que não informa é deletada.

### 3. A regra sagrada: PF e PJ não se tocam
O Fator R é lei de produto, não detalhe de UX. O **Cofre PF** (Caixinha Nubank,
NuInvest) é da Família; o **Cofre PJ** (Reserva i2) é da empresa. Nunca, jamais, um
cofre PF aparece numa tela da empresa — nem o contrário. O `.scope-toggle`
(Pessoal / Empresa / Tudo) governa o que existe na tela, e o halo de cor do
`.anchor-hero` muda junto (âmbar na empresa, verde/azul no pessoal) para que o usuário
**sinta** em qual mundo está antes mesmo de ler. Separação não é uma checkbox; é a
arquitetura visual inteira respeitando a fronteira fiscal.

---

## Paleta

| Papel | Cor | Uso |
|---|---|---|
| Fundo base | `#05050a` → `#000` | OLED, radial nos cantos |
| Elevado | `#0c0c14` | cards sólidos, listas |
| Glass | `rgba(255,255,255,0.05)` + blur | só cards de destaque |
| Borda hairline | `rgba(255,255,255,0.06–0.12)` | microcontraste |
| Texto | `white/96 → /58 → /40 → /24` | hierarquia em 4 níveis |
| Iremar | `#3b82f6 → #6366f1` | azul-índigo |
| Juliana | `#ec4899 → #f472b6` | rosa |
| i2 (empresa) | `#f59e0b → #d97706` | âmbar |
| Casal | `#06b6d4` | ciano |
| Sucesso | `#34d399` | folga, saldo positivo |
| Alerta | `#fbbf24` | atenção, 70–90% do teto |
| Perigo | `#f87171` | déficit, estourou |

**Tipografia:** system-ui / Inter. Valores sempre em `tabular-nums`. Cantos
16–26px nos cards, 10–14px nos itens. Respiro de 20–28px nos heros. Sombras longas e
suaves — nunca duras. Esse é o north-star: se o pixel não cabe nessa linguagem, o pixel
está errado, não a linguagem.
