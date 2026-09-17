'use client'
import Link from 'next/link'
import { useApp } from '../../context/AppContext'
import { SOCIALS } from '../../data/brand'

export default function Footer() {
  const { t } = useApp()
  const f = t.home.footer
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: 'var(--color-black)', color: 'rgba(255,255,255,0.6)', padding: '40px 0' }}>
      <div style={{
        maxWidth: 1480, margin: '0 auto', padding: '0 20px',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}
        className="md:flex-row md:items-center md:justify-between"
      >
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
          Bruno Chaves<span style={{ color: 'var(--brand-accent)' }}>•</span>
        </span>

        <span style={{ fontSize: 13 }}>{f.tagline}</span>

        <nav aria-label="Redes sociais" style={{ display: 'flex', gap: 18 }}>
          {SOCIALS.map(s => (
            <a key={s.icon} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
              style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textDecoration: 'none' }}>
              {s.label}
            </a>
          ))}
        </nav>
      </div>
      <div style={{ maxWidth: 1480, margin: '24px auto 0', padding: '20px 20px 0', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 12, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
        <span>© {year} Bruno Chaves. {f.rights}</span>
        <Link href="/dominio" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{f.resume}</Link>
      </div>
    </footer>
  )
}
