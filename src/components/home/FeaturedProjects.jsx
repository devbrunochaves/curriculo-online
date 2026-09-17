'use client'
import Link from 'next/link'
import { useApp } from '../../context/AppContext'
import { PROJECTS } from '../../data/brand'
import Reveal from '../Reveal'

export default function FeaturedProjects() {
  const { t } = useApp()
  const p = t.home.projects

  return (
    <section id="projetos" style={{ background: 'var(--color-black)', color: '#fff', padding: '110px 0' }}>
      <div style={{ maxWidth: 1480, margin: '0 auto', padding: '0 20px' }}>
        <Reveal>
          <p style={{ color: 'var(--brand-accent)', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em' }}>{p.label}</p>
        </Reveal>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between" style={{ gap: 24, marginTop: 16 }}>
          <Reveal delay={60}>
            <h2 style={{ fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 800, fontSize: 'clamp(32px, 4vw, 56px)', lineHeight: 1.05, maxWidth: 620, margin: 0 }}>
              {p.heading1} <span style={{ color: 'var(--brand-accent)' }}>{p.headingHighlight}</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 360, fontSize: 15, lineHeight: 1.6 }}>{p.text}</p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 24, marginTop: 56 }}>
          {PROJECTS.map((proj, i) => (
            <Reveal key={proj.slug} delay={120 + i * 60}>
              <Link href={`/projetos/${proj.slug}`} className="group" style={{
                display: 'block', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 16, overflow: 'hidden', transition: 'border-color .25s',
              }}>
                <div style={{
                  aspectRatio: '4/3', background: 'linear-gradient(135deg, #1a1a1d, #0B0B0D)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', position: 'relative',
                }}>
                  <span className="proj-scale" style={{
                    fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 800,
                    fontSize: 40, color: 'rgba(255,255,255,0.18)', transition: 'transform .3s',
                  }}>{proj.title}</span>
                </div>
                <div style={{ padding: '20px 22px' }}>
                  <p style={{ fontSize: 12, color: 'var(--brand-accent)', fontWeight: 700, letterSpacing: '0.06em', margin: 0 }}>{proj.category.toUpperCase()}</p>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 8, color: '#fff' }}>{proj.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 8, lineHeight: 1.5 }}>{proj.summary}</p>
                  <span style={{ display: 'inline-block', marginTop: 14, fontSize: 13, color: '#fff', fontWeight: 600 }}>
                    {p.viewCase} <span className="proj-arrow" style={{ display: 'inline-block', transition: 'transform .2s' }}>→</span>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={260}>
          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <Link href="/projetos" style={{ color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none', borderBottom: '1px solid var(--brand-accent)', paddingBottom: 2 }}>
              {p.viewAll}
            </Link>
          </div>
        </Reveal>
      </div>

      <style>{`
        .group:hover { border-color: var(--brand-accent) !important; }
        .group:hover .proj-scale { transform: scale(1.03); }
        .group:hover .proj-arrow { transform: translateX(4px); }
      `}</style>
    </section>
  )
}
