'use client'
import { useApp } from '../../context/AppContext'
import { CONTACT } from '../../data/brand'
import Reveal from '../Reveal'

export default function FinalCTA() {
  const { t } = useApp()
  const f = t.home.finalCta

  return (
    <section id="contato" style={{ position: 'relative', background: 'var(--color-black)', color: '#fff', padding: '130px 0', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(120deg, transparent 48%, rgba(169,15,22,0.35) 49%, transparent 51%)',
        opacity: 0.5, pointerEvents: 'none',
      }} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px', textAlign: 'center', position: 'relative' }}>
        <Reveal>
          <p style={{ color: 'var(--brand-accent)', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em' }}>{f.eyebrow}</p>
        </Reveal>
        <Reveal delay={70}>
          <h2 style={{ fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 800, fontSize: 'clamp(32px, 5vw, 64px)', lineHeight: 1.08, marginTop: 18 }}>
            {f.heading1} <span style={{ color: 'var(--brand-accent)' }}>{f.headingHighlight}</span>
          </h2>
        </Reveal>
        <Reveal delay={130}>
          <p style={{ marginTop: 22, fontSize: 17, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}>
            {f.text}
          </p>
        </Reveal>
        <Reveal delay={190}>
          <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 40, padding: '18px 38px',
              background: 'var(--brand-accent)', color: '#fff', fontWeight: 700, fontSize: 16,
              borderRadius: 999, textDecoration: 'none', transition: 'transform .2s',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {f.button}
          </a>
        </Reveal>
      </div>
    </section>
  )
}
