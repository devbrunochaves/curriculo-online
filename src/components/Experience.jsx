import { useState } from 'react'
import Reveal from './Reveal'
import { useApp } from '../context/AppContext'

/* ── Card com acordeão suave ── */
function ExpCard({ exp, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const { c } = useApp()

  return (
    <div style={{ position: 'relative', paddingLeft: 32, paddingBottom: 24 }}>
      {/* Dot */}
      <div style={{
        position: 'absolute', left: 0, top: 6,
        width: 16, height: 16, borderRadius: '50%', zIndex: 1,
        background: exp.color, boxShadow: `0 0 0 4px ${exp.color}22`,
      }} />
      {/* Vertical line */}
      <div style={{
        position: 'absolute', left: 7, top: 22, bottom: 0, width: 2,
        background: `linear-gradient(to bottom, ${exp.color} 60%, transparent)`,
      }} />

      {/* Card */}
      <div style={{
        background: c.card,
        border: `1px solid ${open ? exp.color + '55' : c.border}`,
        borderRadius: 16, overflow: 'hidden',
        transition: 'border-color 0.3s, box-shadow 0.3s, background 0.3s',
        boxShadow: open ? `0 4px 20px ${exp.color}18` : `0 2px 8px ${c.border}`,
      }}>
        {/* Header */}
        <button
          onClick={() => setOpen(!open)}
          style={{
            width: '100%', background: 'none', border: 'none',
            padding: '18px 20px', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            textAlign: 'left', gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ color: c.primary, fontWeight: 700, fontSize: 15 }}>{exp.company}</span>
              <span style={{
                padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                background: exp.color + '14', border: `1px solid ${exp.color}38`, color: exp.color,
              }}>{exp.badge}</span>
            </div>
            <div style={{ color: exp.color, fontSize: 13, marginBottom: 6 }}>{exp.role}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {exp.location && <span style={{ color: c.dim, fontSize: 12 }}>📍 {exp.location}</span>}
              {exp.period   && <span style={{ color: c.dim, fontSize: 12 }}>📅 {exp.period}</span>}
            </div>
          </div>
          <span style={{
            color: c.dim, fontSize: 11, marginTop: 4, flexShrink: 0,
            transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            display: 'inline-block',
          }}>▼</span>
        </button>

        {/* Accordion body */}
        <div className={`accordion-body ${open ? 'open' : ''}`}>
          <div className="accordion-inner">
            <div style={{ borderTop: `1px solid ${c.borderLight}`, padding: '16px 20px 20px' }}>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {exp.items.map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: exp.color, fontSize: 11, marginTop: 3, flexShrink: 0 }}>▸</span>
                    <span style={{ color: c.muted, fontSize: 14, lineHeight: 1.65 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Seção principal ── */
export default function Experience() {
  const { c, t } = useApp()
  const e = t.experience

  return (
    <section id="experience" style={{ padding: '96px 24px', background: c.bg2, transition: 'background 0.3s' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span className="section-label">{e.label}</span>
            <h2 style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 900, margin: '12px 0 0', letterSpacing: -1, color: c.primary }}>
              {e.heading1} <span className="gradient-text">{e.heading2}</span>
            </h2>
          </div>
        </Reveal>

        {/* Timeline */}
        <div>
          {e.experiences.map((exp, i) => (
            <Reveal key={exp.company} delay={i * 60}>
              <ExpCard exp={exp} defaultOpen={i === 0} />
            </Reveal>
          ))}

          {/* Internacional */}
          <Reveal delay={e.experiences.length * 60}>
            <div style={{ position: 'relative', paddingLeft: 32 }}>
              <div style={{
                position: 'absolute', left: 0, top: 6,
                width: 16, height: 16, borderRadius: '50%',
                background: '#059669', boxShadow: '0 0 0 4px rgba(5,150,105,0.18)',
              }} />
              <div style={{
                background: c.card,
                border: '1px solid rgba(5,150,105,0.2)',
                borderRadius: 16, padding: '18px 20px',
                boxShadow: '0 2px 8px rgba(5,150,105,0.06)',
                transition: 'background 0.3s',
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: c.primary, fontWeight: 700, fontSize: 15 }}>{e.intlExp.company}</span>
                  <span style={{
                    padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                    background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.28)', color: '#059669',
                  }}>{e.intlBadge}</span>
                </div>
                <div style={{ color: '#059669', fontSize: 13, marginBottom: 8 }}>{e.intlExp.role}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
                  <span style={{ color: c.dim, fontSize: 12 }}>📍 {e.intlExp.location}</span>
                  <span style={{ color: c.dim, fontSize: 12 }}>📅 {e.intlExp.period}</span>
                </div>
                <p style={{ color: c.muted, fontSize: 14, lineHeight: 1.65, margin: 0 }}>
                  {e.intlExp.description}
                </p>
              </div>
            </div>
          </Reveal>
        </div>

      </div>
    </section>
  )
}
