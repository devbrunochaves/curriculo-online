'use client'
import { useApp } from '../../context/AppContext'
import { TOOLS } from '../../data/brand'
import Reveal from '../Reveal'

export default function Tools() {
  const { t } = useApp()
  const tl = t.home.tools

  return (
    <section style={{ background: 'var(--brand-bg-alt)', padding: '100px 0' }}>
      <div style={{ maxWidth: 1480, margin: '0 auto', padding: '0 20px' }}>
        <Reveal>
          <p style={{ color: 'var(--brand-accent)', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em' }}>{tl.label}</p>
        </Reveal>
        <Reveal delay={60}>
          <h2 style={{ fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 800, fontSize: 'clamp(26px, 3.2vw, 44px)', lineHeight: 1.1, marginTop: 16, color: 'var(--brand-fg)' }}>
            {tl.heading1} <span style={{ color: 'var(--brand-accent)' }}>{tl.headingHighlight}</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5" style={{ gap: 32, marginTop: 56 }}>
          {TOOLS.map((group, i) => (
            <Reveal key={group.group} delay={100 + i * 50}>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--brand-fg)', textTransform: 'uppercase' }}>{group.group}</h3>
                <ul style={{ marginTop: 14, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.items.map(item => (
                    <li key={item} style={{ fontSize: 14, color: 'var(--brand-fg-muted)' }}>{item}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
