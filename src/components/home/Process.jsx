'use client'
import { useApp } from '../../context/AppContext'
import Reveal from '../Reveal'

export default function Process() {
  const { t } = useApp()
  const p = t.home.process

  return (
    <section style={{ background: 'var(--brand-bg)', padding: '110px 0' }}>
      <div style={{ maxWidth: 1480, margin: '0 auto', padding: '0 20px' }}>
        <Reveal>
          <p style={{ color: 'var(--brand-accent)', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em' }}>{p.label}</p>
        </Reveal>
        <Reveal delay={60}>
          <h2 style={{ fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 800, fontSize: 'clamp(30px, 3.6vw, 50px)', lineHeight: 1.08, marginTop: 16, color: 'var(--brand-fg)' }}>
            {p.heading1} <span style={{ color: 'var(--brand-accent)' }}>{p.headingHighlight}</span>
          </h2>
        </Reveal>

        <ol className="flex flex-col md:flex-row" style={{ gap: 0, marginTop: 64, listStyle: 'none', padding: 0 }}>
          {p.steps.map((step, i) => (
            <li key={step.n} className="md:flex-1" style={{ position: 'relative', display: 'flex' }}>
              <Reveal delay={100 + i * 80} className="w-full">
                <div style={{
                  padding: '0 24px 0 0', borderTop: '2px solid var(--brand-border)', paddingTop: 20,
                  borderColor: i === 0 ? 'var(--brand-accent)' : 'var(--brand-border)',
                }}>
                  <span style={{ fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 800, fontSize: 15, color: 'var(--brand-accent)' }}>{step.n}</span>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 10, color: 'var(--brand-fg)' }}>{step.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--brand-fg-muted)', marginTop: 8, lineHeight: 1.55, maxWidth: 260 }}>{step.desc}</p>
                </div>
              </Reveal>
              {i < p.steps.length - 1 && (
                <span aria-hidden="true" className="hidden md:flex" style={{
                  position: 'absolute', top: 12, right: -6, color: 'var(--brand-fg-muted)', fontSize: 16, alignItems: 'center',
                }}>→</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
