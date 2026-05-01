import Reveal from './Reveal'

const HIGHLIGHTS = [
  { icon: '✦',   title: 'Design Gráfico',   desc: '15+ anos criando identidades visuais e materiais de alto impacto para marcas e clubes.'          },
  { icon: '</>',  title: 'Front-end Dev',    desc: 'ReactJS, NextJS e Tailwind para interfaces modernas, responsivas e de alta performance.'          },
  { icon: '◈',   title: 'UI/UX Design',     desc: 'Interfaces centradas no usuário com foco em conversão, usabilidade e experiência.'                 },
  { icon: '▲',   title: 'Marketing Digital', desc: 'Criativos otimizados para Meta Ads, Google Ads e campanhas de tráfego pago.'                      },
]

const TAGS = ['Design Thinking', 'Branding', 'UI/UX', 'Front-end', 'Performance', 'Tráfego Pago']

export default function About() {
  return (
    <section id="about" style={{ padding: '96px 24px', background: '#EBE4D2' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 60, alignItems: 'center' }}>

          {/* ── Text ── */}
          <Reveal>
            <div>
              <span className="section-label">Sobre mim</span>
              <h2 style={{ fontSize: 'clamp(30px,5vw,44px)', fontWeight: 900, margin: '12px 0 18px', lineHeight: 1.1, letterSpacing: -1, color: '#084a8a' }}>
                Design & Código,<br />
                <span className="gradient-text">juntos.</span>
              </h2>
              <p style={{ color: 'rgba(8,74,138,0.7)', lineHeight: 1.8, marginBottom: 16, fontSize: 15 }}>
                Sou designer gráfico com mais de 20 anos de experiência, especializado em criar soluções
                visuais impactantes com Adobe Creative Suite, CorelDRAW e Figma. Nos últimos anos, ampliei
                minha atuação para o desenvolvimento front-end, dominando ReactJS e Tailwind.
              </p>
              <p style={{ color: 'rgba(8,74,138,0.55)', lineHeight: 1.8, marginBottom: 28, fontSize: 15 }}>
                Combino design e programação para entregar projetos que unem estética refinada, código
                limpo e alta performance. Minha paixão está em integrar o design visual à excelência técnica.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {TAGS.map(t => (
                  <span key={t} style={{
                    padding: '5px 14px',
                    background: 'rgba(55,168,222,0.1)',
                    border: '1px solid rgba(55,168,222,0.3)',
                    borderRadius: 999, color: '#37a8de', fontSize: 13,
                  }}>{t}</span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {HIGHLIGHTS.map((c, i) => (
              <Reveal key={c.title} delay={i * 80}>
                <div className="card" style={{ padding: 20 }}>
                  <span style={{ fontSize: 22, color: '#37a8de', fontWeight: 700, display: 'block', marginBottom: 10 }}>{c.icon}</span>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#084a8a', marginBottom: 6 }}>{c.title}</h3>
                  <p style={{ fontSize: 12, color: 'rgba(8,74,138,0.6)', lineHeight: 1.6, margin: 0 }}>{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
