'use client'
import { useState } from 'react'
import Link from 'next/link'
import { AppProvider, useApp } from '../../context/AppContext'
import Header from '../../components/home/Header'
import Footer from '../../components/home/Footer'
import { PROJECTS, PROJECT_CATEGORIES } from '../../data/brand'

function ProjectsPage() {
  const { t } = useApp()
  const [filter, setFilter] = useState('Todos')
  const p = t.home.projects

  const filtered = filter === 'Todos' ? PROJECTS : PROJECTS.filter(pr => pr.category === filter)

  return (
    <>
      <Header />
      <main style={{ background: 'var(--brand-bg)', minHeight: '100vh', paddingTop: 140, paddingBottom: 100 }}>
        <div style={{ maxWidth: 1480, margin: '0 auto', padding: '0 20px' }}>
          <h1 style={{ fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 800, fontSize: 'clamp(32px, 5vw, 56px)', color: 'var(--brand-fg)', margin: 0 }}>
            Projetos selecionados
          </h1>
          <p style={{ marginTop: 16, fontSize: 16, color: 'var(--brand-fg-muted)', maxWidth: 560, lineHeight: 1.6 }}>
            Uma seleção de trabalhos envolvendo design, marcas, interfaces e desenvolvimento.
          </p>

          <div role="group" aria-label="Filtrar projetos por categoria" style={{ display: 'flex', gap: 10, marginTop: 40, flexWrap: 'wrap' }}>
            {PROJECT_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                aria-pressed={filter === cat}
                style={{
                  padding: '9px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${filter === cat ? 'var(--brand-accent)' : 'var(--brand-border)'}`,
                  background: filter === cat ? 'var(--brand-accent)' : 'transparent',
                  color: filter === cat ? '#fff' : 'var(--brand-fg)',
                  transition: 'all .2s',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 24, marginTop: 48 }}>
            {filtered.map(proj => (
              <Link key={proj.slug} href={`/projetos/${proj.slug}`} style={{
                display: 'block', textDecoration: 'none', border: '1px solid var(--brand-border)',
                borderRadius: 16, overflow: 'hidden', transition: 'border-color .2s',
              }}>
                <div style={{
                  aspectRatio: '4/3', background: 'linear-gradient(135deg, var(--brand-bg-alt), var(--brand-border))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 800, fontSize: 32, color: 'var(--brand-fg-muted)' }}>{proj.title}</span>
                </div>
                <div style={{ padding: '18px 20px' }}>
                  <p style={{ fontSize: 12, color: 'var(--brand-accent)', fontWeight: 700, margin: 0 }}>{proj.category.toUpperCase()}</p>
                  <h2 style={{ fontSize: 17, fontWeight: 700, marginTop: 6, color: 'var(--brand-fg)' }}>{proj.title}</h2>
                  <p style={{ fontSize: 14, color: 'var(--brand-fg-muted)', marginTop: 8, lineHeight: 1.5 }}>{proj.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function Page() {
  return (
    <AppProvider>
      <ProjectsPage />
    </AppProvider>
  )
}
