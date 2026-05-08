'use client'
import Reveal from './Reveal'
import { useApp } from '../context/AppContext'

export default function Education() {
  const { c, t } = useApp()
  const ed = t.education

  return (
    <section id="education" style={{ padding: '96px 24px', background: c.bg1, transition: 'background 0.3s' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span className="section-label">{ed.label}</span>
            <h2 style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 900, margin: '12px 0 0', letterSpacing: -1, color: c.primary }}>
              {ed.heading1} <span className="gradient-text">{ed.heading2}</span>
            </h2>
          </div>
        </Reveal>

        {/* Education cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 56 }}>
          {ed.items.map((e, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(55,168,222,0.1)', border: '1px solid rgba(55,168,222,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>🎓</div>
                <div>
                  <h3 style={{ color: c.primary, fontWeight: 600, fontSize: 14, lineHeight: 1.4, marginBottom: 4 }}>{e.degree}</h3>
                  <div style={{ color: c.accent, fontSize: 13, marginBottom: 8 }}>{e.inst}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', background: c.border, border: `1px solid ${c.borderLight}`, borderRadius: 999, color: c.dim, fontSize: 11 }}>{e.type}</span>
                    <span style={{ padding: '2px 8px', background: 'rgba(55,168,222,0.1)', border: '1px solid rgba(55,168,222,0.25)', borderRadius: 999, color: c.accent, fontSize: 11 }}>✓ {e.year}</span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Languages */}
        <Reveal>
          <div>
            <h3 style={{ textAlign: 'center', color: c.dim, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>
              {ed.langHeading}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, maxWidth: 700, margin: '0 auto' }}>
              {ed.languages.map(l => (
                <div key={l.lang} className="card" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{l.flag}</span>
                      <span style={{ color: c.primary, fontWeight: 600, fontSize: 14 }}>{l.lang}</span>
                    </div>
                    <span style={{ color: c.accent, fontSize: 12 }}>{l.level}</span>
                  </div>
                  <div style={{ width: '100%', height: 4, background: c.border, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${l.pct}%`,
                      background: 'linear-gradient(90deg, #37a8de, #084a8a)',
                      borderRadius: 99,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  )
}
