'use client'
import Image from 'next/image'
import { useApp } from '../../context/AppContext'
import { CONTACT, STATS } from '../../data/brand'
import Reveal from '../Reveal'

export default function Hero() {
  const { t, lang } = useApp()
  const h = t.home.hero

  return (
    <section id="hero" style={{ position: 'relative', background: 'var(--brand-bg)', overflow: 'hidden', paddingTop: 140, paddingBottom: 80 }}>
      {/* Giant faint background words */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'flex-end', pointerEvents: 'none',
        fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 900,
        fontSize: 'clamp(60px, 14vw, 220px)', lineHeight: 0.85, color: 'var(--brand-fg)',
        opacity: 0.035, letterSpacing: '-0.03em', textAlign: 'right', userSelect: 'none',
      }}>
        <span>IDEIAS</span>
        <span>DESIGN</span>
        <span>CÓDIGO</span>
        <span>RESULTADOS</span>
      </div>

      <div style={{ maxWidth: 1480, margin: '0 auto', padding: '0 20px', position: 'relative' }}>
        <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: 48, alignItems: 'center' }}>
          {/* LEFT 55% */}
          <div className="lg:col-span-7">
            <Reveal>
              <p style={{ color: 'var(--brand-accent)', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', marginBottom: 20 }}>
                {h.eyebrow}
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h1 style={{
                fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 800,
                fontSize: 'clamp(40px, 6vw, 92px)', lineHeight: 1.02, letterSpacing: '-0.02em',
                color: 'var(--brand-fg)', margin: 0,
              }}>
                {h.title1} <span style={{ color: 'var(--brand-accent)' }}>{h.titleHighlight}</span>
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <p style={{ marginTop: 28, fontSize: 'clamp(16px, 1.6vw, 19px)', color: 'var(--brand-fg-muted)', maxWidth: 540, lineHeight: 1.6 }}>
                {h.subtitle}
              </p>
            </Reveal>

            <Reveal delay={200}>
              <div style={{ display: 'flex', gap: 14, marginTop: 36, flexWrap: 'wrap' }}>
                <a href="#projetos"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 28px',
                    background: 'var(--brand-accent)', color: '#fff', fontWeight: 600, fontSize: 15,
                    borderRadius: 999, textDecoration: 'none', transition: 'transform .2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {h.ctaPrimary}
                </a>
                <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 28px',
                    border: '1.5px solid var(--brand-fg)', color: 'var(--brand-fg)', fontWeight: 600, fontSize: 15,
                    borderRadius: 999, textDecoration: 'none', transition: 'transform .2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {h.ctaSecondary}
                </a>
              </div>
            </Reveal>

            <Reveal delay={260}>
              <div style={{ display: 'flex', gap: 36, marginTop: 56, flexWrap: 'wrap' }}>
                {STATS.map(s => (
                  <div key={s.val}>
                    <div style={{ fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 800, fontSize: 32, color: 'var(--brand-fg)' }}>{s.val}</div>
                    <div style={{ fontSize: 13, color: 'var(--brand-fg-muted)', marginTop: 2 }}>{s.lbl[lang] || s.lbl.pt}</div>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 24, fontSize: 13, color: 'var(--brand-fg-muted)', fontStyle: 'italic' }}>{h.fromBrazil}</p>
            </Reveal>
          </div>

          {/* RIGHT 45% */}
          <div className="lg:col-span-5">
            <Reveal delay={120}>
              <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', aspectRatio: '4/5', width: '100%' }}>
                {/* TODO: substituir pela fotografia oficial de Bruno */}
                <Image
                  src="/images/home/hero-placeholder.jpg"
                  alt="Retrato de Bruno Chaves, designer e desenvolvedor"
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 40vw"
                  style={{ objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', left: 18, bottom: 18, right: 18,
                  background: 'rgba(11,11,13,0.72)', backdropFilter: 'blur(6px)',
                  color: '#fff', padding: '14px 18px', borderRadius: 12, fontSize: 14,
                  lineHeight: 1.4, whiteSpace: 'pre-line',
                }}>
                  {h.overImage}
                </div>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div style={{ marginTop: 28, borderLeft: '3px solid var(--brand-accent)', paddingLeft: 18 }}>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--brand-fg)' }}>{h.sideEyebrow}</p>
                <p style={{ fontSize: 14, color: 'var(--brand-fg-muted)', marginTop: 10, lineHeight: 1.5 }}>{h.sideText}</p>
                <p style={{ fontSize: 13, fontWeight: 700, marginTop: 12, color: 'var(--brand-fg)' }}>
                  {h.sideName} <span style={{ fontWeight: 400, color: 'var(--brand-fg-muted)' }}>— {h.sideRole}</span>
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
