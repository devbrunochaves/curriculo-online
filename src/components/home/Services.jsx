'use client'
import { useApp } from '../../context/AppContext'
import Reveal from '../Reveal'

export default function Services() {
  const { t } = useApp()
  const s = t.home.services

  return (
    <section id="servicos" style={{ background: 'var(--brand-bg)', padding: '110px 0' }}>
      <div style={{ maxWidth: 1480, margin: '0 auto', padding: '0 20px' }}>
        <Reveal>
          <p style={{ color: 'var(--brand-accent)', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em' }}>{s.label}</p>
        </Reveal>
        <Reveal delay={60}>
          <h2 style={{ fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 800, fontSize: 'clamp(32px, 4vw, 56px)', lineHeight: 1.05, marginTop: 16, color: 'var(--brand-fg)' }}>
            {s.heading1} <span style={{ color: 'var(--brand-accent)' }}>{s.headingHighlight}</span>
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p style={{ color: 'var(--brand-fg-muted)', maxWidth: 560, marginTop: 18, fontSize: 16, lineHeight: 1.6 }}>{s.text}</p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 1, marginTop: 64, borderTop: '1px solid var(--brand-border)' }}>
          {s.items.map((item, i) => (
            <Reveal key={item.n} delay={140 + i * 60}>
              <div style={{ padding: '36px 8px', borderBottom: '1px solid var(--brand-border)' }}>
                <span style={{ fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 800, fontSize: 15, color: 'var(--brand-accent)' }}>{item.n}</span>
                <h3 style={{ fontSize: 22, fontWeight: 700, marginTop: 10, color: 'var(--brand-fg)' }}>{item.title}</h3>
                <p style={{ fontSize: 15, color: 'var(--brand-fg-muted)', marginTop: 10, lineHeight: 1.6, maxWidth: 460 }}>{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <p style={{ marginTop: 40, fontSize: 14, color: 'var(--brand-fg-muted)', fontStyle: 'italic' }}>{s.aiNote}</p>
        </Reveal>
      </div>
    </section>
  )
}
