import { skills } from '../data/resume'
import Reveal from './Reveal'

export default function Skills() {
  return (
    <section id="skills" style={{ padding: '96px 24px', background: '#F2EBDF' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span className="section-label">Habilidades</span>
            <h2 style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 900, margin: '12px 0 0', letterSpacing: -1, color: '#084a8a' }}>
              Stack <span className="gradient-text">completa</span>
            </h2>
          </div>
        </Reveal>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {skills.map((group, i) => (
            <Reveal key={group.cat} delay={i * 80}>
              <div
                className="card"
                style={{ padding: 24, border: `1px solid ${group.border}` }}
              >
                {/* Category header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: group.bg, border: `1px solid ${group.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: group.color, fontWeight: 800, fontSize: 15,
                  }}>
                    {group.icon}
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: 15, color: '#084a8a', margin: 0 }}>{group.cat}</h3>
                </div>

                {/* Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {group.items.map(skill => (
                    <span key={skill} className="skill-pill">{skill}</span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  )
}
