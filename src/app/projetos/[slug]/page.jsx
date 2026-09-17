'use client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AppProvider } from '../../../context/AppContext'
import Header from '../../../components/home/Header'
import Footer from '../../../components/home/Footer'
import { PROJECTS } from '../../../data/brand'

function Row({ label, children }) {
  return (
    <div style={{ borderTop: '1px solid var(--brand-border)', padding: '28px 0' }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--brand-accent)', textTransform: 'uppercase', margin: 0 }}>{label}</h2>
      <p style={{ marginTop: 10, fontSize: 16, color: 'var(--brand-fg)', lineHeight: 1.7, maxWidth: 700 }}>{children}</p>
    </div>
  )
}

export default function CasePage({ params }) {
  const project = PROJECTS.find(p => p.slug === params.slug)
  const idx = PROJECTS.findIndex(p => p.slug === params.slug)
  if (!project) return notFound()

  const next = PROJECTS[(idx + 1) % PROJECTS.length]

  return (
    <AppProvider>
      <Header />
      <main style={{ background: 'var(--brand-bg)', minHeight: '100vh', paddingTop: 140, paddingBottom: 100 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
          <p style={{ color: 'var(--brand-accent)', fontWeight: 700, fontSize: 13, letterSpacing: '0.06em' }}>{project.category.toUpperCase()}</p>
          <h1 style={{ fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 800, fontSize: 'clamp(32px, 5vw, 56px)', color: 'var(--brand-fg)', margin: '12px 0 0' }}>
            {project.title}
          </h1>
          <p style={{ marginTop: 16, fontSize: 17, color: 'var(--brand-fg-muted)', lineHeight: 1.6 }}>{project.summary}</p>

          <div style={{
            marginTop: 40, aspectRatio: '16/9', borderRadius: 16,
            background: 'linear-gradient(135deg, var(--brand-bg-alt), var(--brand-border))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* TODO: substituir pela galeria oficial do projeto */}
            <span style={{ color: 'var(--brand-fg-muted)', fontSize: 14 }}>Galeria — imagens do projeto a serem adicionadas</span>
          </div>

          <Row label="Problema">{project.problem}</Row>
          <Row label="Contexto">{project.context}</Row>
          <Row label="Estratégia">{project.strategy}</Row>
          <Row label="Processo">{project.process}</Row>
          <Row label="Solução">{project.solution}</Row>
          <Row label="Tecnologias">{project.tools.join(', ')}</Row>
          {project.result && <Row label="Resultado">{project.result}</Row>}

          <div style={{ borderTop: '1px solid var(--brand-border)', marginTop: 20, paddingTop: 40 }}>
            <span style={{ fontSize: 13, color: 'var(--brand-fg-muted)' }}>Próximo projeto</span>
            <Link href={`/projetos/${next.slug}`} style={{
              display: 'block', marginTop: 10, fontFamily: 'var(--font-display, "Inter Tight")',
              fontWeight: 800, fontSize: 'clamp(24px, 3.5vw, 40px)', color: 'var(--brand-fg)', textDecoration: 'none',
            }}>
              {next.title} →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </AppProvider>
  )
}
