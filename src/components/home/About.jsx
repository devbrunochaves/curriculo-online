'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useApp } from '../../context/AppContext'
import { STATS } from '../../data/brand'
import Reveal from '../Reveal'

export default function About() {
  const { t, lang } = useApp()
  const a = t.home.about

  return (
    <section id="sobre" style={{ background: 'var(--brand-bg-alt)', padding: '110px 0' }}>
      <div style={{ maxWidth: 1480, margin: '0 auto', padding: '0 20px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: 56, alignItems: 'center' }}>
          <div className="lg:col-span-7">
            <Reveal>
              <p style={{ color: 'var(--brand-accent)', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em' }}>{a.label}</p>
            </Reveal>
            <Reveal delay={60}>
              <h2 style={{ fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 800, fontSize: 'clamp(30px, 3.6vw, 50px)', lineHeight: 1.08, marginTop: 16, color: 'var(--brand-fg)' }}>
                {a.heading1} <span style={{ color: 'var(--brand-accent)' }}>{a.headingHighlight}</span>
              </h2>
            </Reveal>
            <Reveal delay={110}>
              <div style={{ marginTop: 24, maxWidth: 560, color: 'var(--brand-fg-muted)', fontSize: 16, lineHeight: 1.7 }}>
                <p>{a.p1}</p>
                <p style={{ marginTop: 16 }}>{a.p2}</p>
                <p style={{ marginTop: 16 }}>{a.p3}</p>
              </div>
            </Reveal>
            <Reveal delay={170}>
              <Link href="/dominio" style={{ display: 'inline-block', marginTop: 28, color: 'var(--brand-fg)', fontWeight: 600, fontSize: 15, textDecoration: 'none', borderBottom: '1px solid var(--brand-accent)', paddingBottom: 2 }}>
                {a.cta}
              </Link>
            </Reveal>

            <Reveal delay={220}>
              <div style={{ display: 'flex', gap: 40, marginTop: 48, flexWrap: 'wrap' }}>
                {STATS.map(s => (
                  <div key={s.val}>
                    <div style={{ fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 800, fontSize: 30, color: 'var(--brand-fg)' }}>{s.val}</div>
                    <div style={{ fontSize: 13, color: 'var(--brand-fg-muted)', marginTop: 2 }}>{s.lbl[lang] || s.lbl.pt}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-5">
            <Reveal delay={120}>
              <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', aspectRatio: '4/5', width: '100%' }}>
                {/* TODO: substituir pela fotografia oficial de Bruno */}
                <Image
                  src="/images/home/about-placeholder.jpg"
                  alt="Bruno Chaves trabalhando"
                  fill
                  loading="lazy"
                  sizes="(max-width: 1024px) 90vw, 40vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
