import { useState } from 'react'

// ── Dados do cardápio ────────────────────────────────────────────────────────
const REFEICOES = [
  { key: 'cafe',   icon: '☕', label: 'Café 08h'       },
  { key: 'almoco', icon: '🍽', label: 'Almoço 11h'     },
  { key: 'lanche', icon: '🍎', label: 'Lanche 16h'     },
  { key: 'jantar', icon: '🌙', label: 'Jantar 19h30'   },
  { key: 'ceia',   icon: '🌛', label: 'Ceia 21h30'     },
]

const SEMANAS = [
  // ── SEMANA 1 ──────────────────────────────────────────────────────────────
  [
    {
      dia: 'Segunda',
      cafe:   { g: '½ pão francês (25g) · 2 ovos mexidos · azeite · café',         b: 'Pão integral (80g) · 3 ovos mexidos · azeite · banana (100g) · café'           },
      almoco: { g: 'Frango (120g) · arroz branco+integral (90g) · legumes (100g) · azeite', b: 'Frango (220g) · arroz (160g) · feijão (120g) · legumes (200g) · azeite'     },
      lanche: { g: 'Iogurte natural (170g) · castanha de caju (15g)',               b: 'Iogurte (300g) · fruta (150g) · castanha (15g)'                                },
      jantar: { g: 'Frango (120g) · arroz (60g) · legumes (100g) · azeite',         b: 'Proteína (200g) · arroz ou batata (140g) · legumes (200g) · azeite'             },
      ceia:   { g: 'Iogurte pequeno · morango/kiwi (80g) · chá relaxante',          b: 'Leite morno (300ml) · pasta de amendoim (15g)'                                 },
    },
    {
      dia: 'Terça',
      cafe:   { g: 'Pão integral (30g) · 1 ovo mexido · queijo minas (30g) · café', b: 'Iogurte (300g) · aveia (50g) · whey (30g) · mamão (150g)'                      },
      almoco: { g: 'Carne magra (120g) · arroz (90g) · cenoura + vagem (100g) · azeite', b: 'Carne magra (220g) · arroz (160g) · feijão (120g) · legumes (200g) · azeite' },
      lanche: { g: '2 ovos cozidos · 1 maçã',                                       b: 'Pão integral (80g) · frango desfiado (150g) · azeite (5g)'                     },
      jantar: { g: 'Omelete 2 ovos · legumes refogados na manteiga',                 b: 'Omelete 3 ovos · pão integral'                                                 },
      ceia:   { g: 'Iogurte pequeno · kiwi (80g) · chá relaxante',                  b: 'Leite morno (300ml) · pasta de amendoim (15g)'                                 },
    },
    {
      dia: 'Quarta',
      cafe:   { g: '2 ovos mexidos · banana prata (80g) · chia (10g) · café',       b: 'Tapioca (80g) · frango desfiado (150g) · queijo minas (40g) · café'            },
      almoco: { g: 'Peixe (120g) · arroz (90g) · abobrinha + chuchu (100g) · azeite', b: 'Peixe (220g) · arroz (160g) · feijão (120g) · legumes (200g) · azeite'       },
      lanche: { g: 'Shake: leite sem lactose (200ml) · cacau (5g)',                  b: 'Shake: leite vegetal (300ml) · whey (30g) · aveia (40g)'                       },
      jantar: { g: 'Frango (120g) · arroz (60g) · brócolis + cenoura (100g) · azeite', b: 'Wrap integral + frango'                                                      },
      ceia:   { g: 'Iogurte pequeno · morango (80g) · chá relaxante',               b: 'Leite morno (300ml) · pasta de amendoim (15g)'                                 },
    },
    {
      dia: 'Quinta',
      cafe:   { g: '½ pão francês (25g) · 2 ovos mexidos · azeite · café',         b: 'Pão integral (80g) · 3 ovos mexidos · manteiga · banana (100g) · café'         },
      almoco: { g: 'Atum em água (1 lata) · arroz (90g) · abóbora + vagem (100g) · azeite', b: 'Frango (220g) · batata cozida (150g) · feijão (120g) · legumes (200g) · azeite' },
      lanche: { g: 'Iogurte natural (170g) · castanha de caju (15g)',               b: 'Iogurte (300g) · fruta (150g) · castanha (15g)'                                },
      jantar: { g: 'Omelete 2 ovos · legumes refogados na manteiga',                 b: 'Proteína (200g) · batata (140g) · legumes (200g) · azeite'                     },
      ceia:   { g: 'Iogurte pequeno · morango (80g) · chá relaxante',               b: 'Leite morno (300ml) · pasta de amendoim (15g)'                                 },
    },
    {
      dia: 'Sexta',
      cafe:   { g: 'Pão integral (30g) · 1 ovo mexido · queijo minas (30g) · café', b: 'Iogurte (300g) · aveia (50g) · whey (30g) · mamão (150g)'                      },
      almoco: { g: 'Frango (120g) · arroz (90g) · mandioquinha + cenoura (100g) · azeite', b: 'Carne magra (220g) · arroz (160g) · feijão (120g) · legumes (200g) · azeite' },
      lanche: { g: '2 ovos cozidos · 1 pera',                                       b: 'Pão integral (80g) · frango desfiado (150g) · azeite (5g)'                     },
      jantar: { g: 'Frango (120g) · arroz (60g) · legumes (100g) · azeite',         b: 'Sanduíche natural de frango (pão integral + frango + folhas)'                  },
      ceia:   { g: 'Iogurte pequeno · kiwi (80g) · chá relaxante',                  b: 'Leite morno (300ml) · pasta de amendoim (15g)'                                 },
    },
    {
      dia: 'Sábado',
      cafe:   { g: '2 ovos mexidos · banana prata (80g) · chia (10g) · café',       b: 'Tapioca (80g) · frango desfiado (150g) · queijo minas (40g) · café'            },
      almoco: { g: 'Peixe (120g) · batata cozida (100g) · inhame + abobrinha (100g) · azeite', b: 'Frango (220g) · arroz (160g) · feijão (120g) · legumes (200g) · azeite' },
      lanche: { g: 'Shake: leite sem lactose (200ml) · cacau (5g)',                  b: 'Shake: leite vegetal (300ml) · whey (30g) · aveia (40g)'                       },
      jantar: { g: 'Omelete 2 ovos · legumes refogados na manteiga',                 b: 'Proteína (200g) · arroz ou batata (140g) · legumes (200g) · azeite'            },
      ceia:   { g: 'Iogurte pequeno · morango (80g) · chá relaxante',               b: 'Leite morno (300ml) · pasta de amendoim (15g)'                                 },
    },
    {
      dia: 'Domingo',
      cafe:   { g: '½ pão francês (25g) · 2 ovos mexidos · azeite · café',         b: 'Pão integral (80g) · 3 ovos mexidos · azeite · banana (100g) · café'           },
      almoco: { g: 'Carne magra (120g) · arroz (90g) · couve-flor + cenoura (100g) · azeite', b: 'Peixe (220g) · arroz (160g) · feijão (120g) · legumes (200g) · azeite' },
      lanche: { g: 'Iogurte natural (170g) · castanha de caju (15g)',               b: 'Iogurte (300g) · fruta (150g) · castanha (15g)'                                },
      jantar: { g: 'Frango (120g) · mandioca (2 col.) · legumes (100g) · azeite',   b: 'Omelete 3 ovos · pão integral'                                                 },
      ceia:   { g: 'Iogurte pequeno · morango/kiwi (80g) · chá relaxante',          b: 'Leite morno (300ml) · pasta de amendoim (15g)'                                 },
    },
  ],
  // ── SEMANA 2 ──────────────────────────────────────────────────────────────
  [
    {
      dia: 'Segunda',
      cafe:   { g: 'Pão integral (30g) · 1 ovo mexido · queijo minas (30g) · café', b: 'Iogurte (300g) · aveia (50g) · whey (30g) · mamão (150g)'                      },
      almoco: { g: 'Frango (120g) · batata cozida (100g) · beterraba + vagem (100g) · azeite', b: 'Frango (220g) · arroz (160g) · feijão (120g) · legumes (200g) · azeite' },
      lanche: { g: '2 ovos cozidos · mamão médio',                                  b: 'Pão integral (80g) · frango desfiado (150g) · azeite (5g)'                     },
      jantar: { g: 'Frango (120g) · arroz (60g) · legumes (100g) · azeite',         b: 'Proteína (200g) · arroz (140g) · legumes (200g) · azeite'                      },
      ceia:   { g: 'Iogurte pequeno · morango (80g) · chá relaxante',               b: 'Leite morno (300ml) · pasta de amendoim (15g)'                                 },
    },
    {
      dia: 'Terça',
      cafe:   { g: '2 ovos mexidos · banana prata (80g) · chia (10g) · café',       b: 'Tapioca (80g) · frango desfiado (150g) · queijo minas (40g) · café'            },
      almoco: { g: 'Peixe (120g) · arroz (90g) · chuchu + cenoura (100g) · azeite', b: 'Peixe (220g) · mandioca (100g) · feijão (120g) · legumes (200g) · azeite'      },
      lanche: { g: 'Iogurte natural (170g) · castanha de caju (15g)',               b: 'Shake: leite vegetal (300ml) · whey (30g) · aveia (40g)'                       },
      jantar: { g: 'Omelete 2 ovos · legumes refogados na manteiga',                 b: 'Omelete 3 ovos · pão integral'                                                 },
      ceia:   { g: 'Iogurte pequeno · kiwi (80g) · chá relaxante',                  b: 'Leite morno (300ml) · pasta de amendoim (15g)'                                 },
    },
    {
      dia: 'Quarta',
      cafe:   { g: '½ pão francês (25g) · 2 ovos mexidos · azeite · café',         b: 'Pão integral (80g) · 3 ovos mexidos · manteiga · banana (100g) · café'         },
      almoco: { g: 'Atum em água (1 lata) · arroz (90g) · abóbora japonesa + vagem (100g) · azeite', b: 'Carne magra (220g) · arroz (160g) · feijão (120g) · legumes (200g) · azeite' },
      lanche: { g: 'Shake: leite sem lactose (200ml) · cacau (5g)',                  b: 'Iogurte (300g) · fruta (150g) · castanha (15g)'                                },
      jantar: { g: 'Frango (120g) · batata cozida (100g) · legumes (100g) · azeite', b: 'Wrap integral + frango'                                                        },
      ceia:   { g: 'Iogurte pequeno · morango (80g) · chá relaxante',               b: 'Leite morno (300ml) · pasta de amendoim (15g)'                                 },
    },
    {
      dia: 'Quinta',
      cafe:   { g: 'Pão integral (30g) · 1 ovo mexido · queijo minas (30g) · café', b: 'Iogurte (300g) · aveia (50g) · whey (30g) · mamão (150g)'                      },
      almoco: { g: 'Carne magra (120g) · arroz (90g) · inhame + brócolis (100g) · azeite', b: 'Frango (220g) · batata cozida (150g) · feijão (120g) · legumes (200g) · azeite' },
      lanche: { g: '2 ovos cozidos · 1 maçã',                                       b: 'Shake: leite vegetal (300ml) · whey (30g) · aveia (40g)'                       },
      jantar: { g: 'Omelete 2 ovos · legumes refogados na manteiga',                 b: 'Proteína (200g) · arroz (140g) · legumes (200g) · azeite'                      },
      ceia:   { g: 'Iogurte pequeno · kiwi (80g) · chá relaxante',                  b: 'Leite morno (300ml) · pasta de amendoim (15g)'                                 },
    },
    {
      dia: 'Sexta',
      cafe:   { g: '2 ovos mexidos · banana prata (80g) · chia (10g) · café',       b: 'Tapioca (80g) · frango desfiado (150g) · queijo minas (40g) · café'            },
      almoco: { g: 'Frango (120g) · mandioca (2 col.) · abobrinha + couve-flor (100g) · azeite', b: 'Peixe (220g) · arroz (160g) · feijão (120g) · legumes (200g) · azeite' },
      lanche: { g: 'Iogurte natural (170g) · castanha de caju (15g)',               b: 'Iogurte (300g) · fruta (150g) · castanha (15g)'                                },
      jantar: { g: 'Frango (120g) · arroz (60g) · legumes (100g) · azeite',         b: 'Sanduíche natural de frango (pão integral + frango + folhas)'                  },
      ceia:   { g: 'Iogurte pequeno · morango (80g) · chá relaxante',               b: 'Leite morno (300ml) · pasta de amendoim (15g)'                                 },
    },
    {
      dia: 'Sábado',
      cafe:   { g: '½ pão francês (25g) · 2 ovos mexidos · azeite · café',         b: 'Pão integral (80g) · 3 ovos mexidos · azeite · banana (100g) · café'           },
      almoco: { g: 'Peixe (120g) · arroz (90g) · beterraba + vagem (100g) · azeite', b: 'Carne magra (220g) · arroz (160g) · feijão (120g) · legumes (200g) · azeite'  },
      lanche: { g: '2 ovos cozidos · 1 morango (porção)',                            b: 'Pão integral (80g) · frango desfiado (150g) · azeite (5g)'                     },
      jantar: { g: 'Omelete 2 ovos · legumes refogados na manteiga',                 b: 'Proteína (200g) · batata (140g) · legumes (200g) · azeite'                     },
      ceia:   { g: 'Iogurte pequeno · kiwi (80g) · chá relaxante',                  b: 'Leite morno (300ml) · pasta de amendoim (15g)'                                 },
    },
    {
      dia: 'Domingo',
      cafe:   { g: 'Pão integral (30g) · 1 ovo mexido · queijo minas (30g) · café', b: 'Iogurte (300g) · aveia (50g) · whey (30g) · mamão (150g)'                      },
      almoco: { g: 'Frango (120g) · arroz (90g) · cenoura + mandioquinha (100g) · azeite', b: 'Frango (220g) · arroz (160g) · feijão (120g) · legumes (200g) · azeite'  },
      lanche: { g: 'Shake: leite sem lactose (200ml) · cacau (5g)',                  b: 'Shake: leite vegetal (300ml) · whey (30g) · aveia (40g)'                       },
      jantar: { g: 'Frango (120g) · arroz (60g) · legumes (100g) · azeite',         b: 'Wrap integral + frango'                                                        },
      ceia:   { g: 'Iogurte pequeno · morango/kiwi (80g) · chá relaxante',          b: 'Leite morno (300ml) · pasta de amendoim (15g)'                                 },
    },
  ],
]

const MEAL_COLORS = {
  cafe:   { bg: '#fef9c3', border: '#fde047', icon: '#a16207' },
  almoco: { bg: '#dcfce7', border: '#86efac', icon: '#15803d' },
  lanche: { bg: '#ffedd5', border: '#fdba74', icon: '#c2410c' },
  jantar: { bg: '#ede9fe', border: '#c4b5fd', icon: '#6d28d9' },
  ceia:   { bg: '#e0f2fe', border: '#7dd3fc', icon: '#0369a1' },
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Cardapio() {
  const [semana, setSemana] = useState(0)   // 0 = semana 1, 1 = semana 2
  const dias = SEMANAS[semana]

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              🥗 Cardápio
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--c-text-muted)' }}>
              Plano Bianca Calil · 2 semanas
            </p>
          </div>
          {/* Seletor de semana */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['Semana 1', 'Semana 2'].map((s, i) => (
              <button
                key={i}
                onClick={() => setSemana(i)}
                className={`c-btn c-btn-sm ${semana === i ? 'c-btn-primary' : 'c-btn-secondary'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Legenda pessoas */}
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '5px 12px', borderRadius: 99, background: '#fce7f3', color: '#9d174d', fontWeight: 700 }}>
            🌿 Gabriela · 1.400 kcal · 62,35 kg
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '5px 12px', borderRadius: 99, background: '#dbeafe', color: '#1e40af', fontWeight: 700 }}>
            💪 Bruno · 2.900 kcal · 110 kg
          </div>
        </div>
      </div>

      {/* ── Colunas Trello ── */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 16,
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          /* Esconde a scrollbar mas mantém o scroll */
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
        className="cardapio-board"
      >
        {dias.map((dia, idx) => (
          <div
            key={idx}
            style={{
              minWidth: 300,
              width: 300,
              flexShrink: 0,
              scrollSnapAlign: 'start',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {/* Cabeçalho do dia */}
            <div style={{
              background: 'var(--c-accent)',
              color: '#fff',
              borderRadius: 12,
              padding: '10px 16px',
              fontWeight: 800,
              fontSize: 15,
              textAlign: 'center',
              letterSpacing: '.02em',
              boxShadow: '0 2px 8px rgba(99,102,241,.3)',
            }}>
              {dia.dia}
            </div>

            {/* Refeições */}
            {REFEICOES.map(ref => {
              const meal = dia[ref.key]
              const colors = MEAL_COLORS[ref.key]
              return (
                <div
                  key={ref.key}
                  style={{
                    background: colors.bg,
                    border: `1.5px solid ${colors.border}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  {/* Label da refeição */}
                  <div style={{
                    padding: '7px 12px',
                    borderBottom: `1px solid ${colors.border}`,
                    fontWeight: 700,
                    fontSize: 12,
                    color: colors.icon,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '.04em',
                  }}>
                    <span>{ref.icon}</span>
                    {ref.label}
                  </div>

                  {/* Gabriela */}
                  <div style={{ padding: '8px 12px', borderBottom: `1px dashed ${colors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#9d174d', background: '#fce7f3', padding: '1px 7px', borderRadius: 99 }}>🌿 Gabi</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{meal.g}</p>
                  </div>

                  {/* Bruno */}
                  <div style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#1e40af', background: '#dbeafe', padding: '1px 7px', borderRadius: 99 }}>💪 Bruno</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{meal.b}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Hint de scroll */}
      <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color: 'var(--c-text-muted)' }}>
        ← arraste para ver os outros dias →
      </div>

      {/* ── Lembretes ── */}
      <div style={{ marginTop: 24, padding: '16px 20px', background: '#fef9c3', border: '1.5px solid #fde047', borderRadius: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: '#a16207' }}>💡 Lembretes importantes</div>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>As proteínas do almoço/jantar podem ser substituídas entre si conforme a lista de substituição dos planos</li>
          <li style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>🌿 Gabriela: café <strong>depois</strong> da refeição, não antes</li>
          <li style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>💪 Bruno: preferência por leite vegetal no shake</li>
          <li style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>Ambos: 1 fruta por refeição, sempre com proteína ou gordura</li>
          <li style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>Seguir sempre as orientações da Nutri Bianca!</li>
        </ul>
      </div>

      {/* Esconde a scrollbar via style global inline */}
      <style>{`.cardapio-board::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}
