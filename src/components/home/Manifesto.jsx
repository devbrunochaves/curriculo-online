'use client'
import { useApp } from '../../context/AppContext'
import Reveal from '../Reveal'

export default function Manifesto() {
  const { t } = useApp()
  const m = t.home.manifesto

  const lineStyle = { fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 800, lineHeight: 1.05, fontSize: 'clamp(30px, 4.2vw, 60px)' }

  return (
    <section style={{ background: 'var(--color-black)', color: '#fff', padding: '120px 0' }}>
      <div style={{ maxWidth: 1480, margin: '0 auto', padding: '0 20px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: 40 }}>
          <div className="lg:col-span-8">
            <Reveal>
              <h2 style={{ margin: 0 }}>
                <span style={{ ...lineStyle, display: 'block', color: '#fff' }}>{m.line1}</span>
                <span style={{ ...lineStyle, display: 'block', color: 'rgba(255,255,255,0.4)' }}>{m.line1b}</span>
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <h2 style={{ margin: '18px 0 0' }}>
                <span style={{ ...lineStyle, display: 'block', color: '#fff' }}>{m.line2}</span>
                <span style={{ ...lineStyle, display: 'block', color: 'rgba(255,255,255,0.4)' }}>{m.line2b}</span>
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <h2 style={{ margin: '18px 0 0' }}>
                <span style={{ ...lineStyle, display: 'block', color: 'var(--brand-accent)' }}>{m.line3}</span>
                <span style={{ ...lineStyle, display: 'block', color: 'var(--brand-accent)' }}>{m.line3b}</span>
              </h2>
            </Reveal>
          </div>
          <div className="lg:col-span-4" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Reveal delay={220}>
              <p style={{ fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,0.65)', borderLeft: '2px solid var(--brand-accent)', paddingLeft: 20 }}>
                {m.text}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
