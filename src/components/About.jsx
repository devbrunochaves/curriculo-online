'use client'
import Reveal from './Reveal'
import { useApp } from '../context/AppContext'

export default function About() {
  const { c, t } = useApp()
  const a = t.about

  return (
    <section id="about" style={{ padding: '96px 24px', background: c.bg2, transition: 'background 0.3s' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 60, alignItems: 'center' }}>

          {/* ── Text ── */}
          <Reveal>
            <div>
              <span className="section-label">{a.label}</span>
              <h2 style={{ fontSize: 'clamp(30px,5vw,44px)', fontWeight: 900, margin: '12px 0 18px', lineHeight: 1.1, letterSpacing: -1, color: c.primary }}>
                {a.heading1}<br />
                <span className="gradient-text">{a.heading2}</span>
              </h2>
              <p style={{ color: c.muted, lineHeight: 1.8, marginBottom: 16, fontSize: 15 }}>
                {a.p1}
              </p>
              <p style={{ color: c.muted2, lineHeight: 1.8, marginBottom: 28, fontSize: 15 }}>
                {a.p2}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {a.tags.map(tag => (
                  <span key={tag} style={{
                    padding: '5px 14px',
                    background: 'rgba(55,168,222,0.1)',
                    border: '1px solid rgba(55,168,222,0.3)',
                    borderRadius: 999, color: c.accent, fontSize: 13,
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {a.highlights.map((card, i) => (
              <Reveal key={card.title} delay={i * 80}>
                <div className="card" style={{ padding: 20 }}>
                  <span style={{ fontSize: 22, color: c.accent, fontWeight: 700, display: 'block', marginBottom: 10 }}>{card.icon}</span>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: c.primary, marginBottom: 6 }}>{card.title}</h3>
                  <p style={{ fontSize: 12, color: c.muted2, lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
