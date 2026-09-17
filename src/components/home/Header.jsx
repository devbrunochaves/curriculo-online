'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useApp } from '../../context/AppContext'
import { CONTACT, SOCIALS } from '../../data/brand'

const FLAGS = [
  { code: 'pt', src: '/flag-br.svg', label: 'Português' },
  { code: 'en', src: '/flag-us.svg', label: 'English' },
  { code: 'es', src: '/flag-es.svg', label: 'Español' },
]

export default function Header() {
  const { t, isDark, toggleDark, lang, setLang } = useApp()
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  const h = t.home.nav

  const links = [
    { label: h.projects, href: '/projetos' },
    { label: h.services, href: '#servicos' },
    { label: h.about, href: '#sobre' },
    { label: h.resume, href: '/dominio' },
    { label: h.contact, href: '#contato' },
  ]

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'background 0.3s, border-color 0.3s, backdrop-filter 0.3s',
        background: solid ? 'var(--brand-bg-alt)' : 'transparent',
        backdropFilter: solid ? 'blur(14px)' : 'none',
        borderBottom: `1px solid ${solid ? 'var(--brand-border)' : 'transparent'}`,
      }}
    >
      <div style={{
        maxWidth: 1480, margin: '0 auto', padding: '0 20px',
        height: 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 2 }} aria-label="Bruno Chaves — início">
          <span style={{ fontFamily: 'var(--font-display, "Inter Tight")', fontWeight: 800, fontSize: 20, color: 'var(--brand-fg)' }}>
            Bruno Chaves<span style={{ color: 'var(--brand-accent)' }}>•</span>
          </span>
        </Link>

        <nav className="hidden md:flex" aria-label="Navegação principal" style={{ alignItems: 'center', gap: 28 }}>
          {links.map(l => (
            <a key={l.href} href={l.href} style={{ color: 'var(--brand-fg)', fontSize: 14, textDecoration: 'none', opacity: 0.75, transition: 'opacity .2s' }}
              onMouseOver={e => e.currentTarget.style.opacity = 1}
              onMouseOut={e => e.currentTarget.style.opacity = 0.75}
            >
              {l.label}
            </a>
          ))}
          <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px',
              background: 'var(--brand-accent)', color: '#fff', fontWeight: 600, fontSize: 13,
              borderRadius: 999, textDecoration: 'none', transition: 'transform .2s, opacity .2s',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {h.cta}
          </a>
          <div style={{ width: 1, height: 20, background: 'var(--brand-border)' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {SOCIALS.filter(s => s.icon === 'linkedin').map(s => (
              <a key={s.icon} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                style={{ color: 'var(--brand-fg)', opacity: 0.7, fontSize: 13, textDecoration: 'none' }}>
                {s.label}
              </a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {FLAGS.map(f => (
              <button key={f.code} onClick={() => setLang(f.code)} aria-label={`Mudar idioma para ${f.label}`}
                aria-pressed={lang === f.code}
                style={{ border: lang === f.code ? '1.5px solid var(--brand-accent)' : '1.5px solid transparent', borderRadius: 4, padding: 1, background: 'none', cursor: 'pointer' }}>
                <Image src={f.src} alt={f.label} width={20} height={14} style={{ display: "block" }} />
              </button>
            ))}
          </div>
          <button onClick={toggleDark} aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            style={{ background: 'none', border: '1px solid var(--brand-border)', borderRadius: 999, width: 34, height: 34, cursor: 'pointer', fontSize: 14 }}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </nav>

        <button
          className="flex md:hidden"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          style={{ background: 'none', border: 'none', color: 'var(--brand-fg)', fontSize: 24, cursor: 'pointer' }}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className="md:hidden" style={{ background: 'var(--brand-bg-alt)', borderTop: '1px solid var(--brand-border)', padding: '12px 20px 24px' }}>
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              style={{ display: 'block', padding: '14px 0', color: 'var(--brand-fg)', textDecoration: 'none', fontSize: 16, borderBottom: '1px solid var(--brand-border)' }}>
              {l.label}
            </a>
          ))}
          <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
            style={{ display: 'inline-block', marginTop: 16, padding: '12px 20px', background: 'var(--brand-accent)', color: '#fff', borderRadius: 999, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            {h.cta}
          </a>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {FLAGS.map(f => (
              <button key={f.code} onClick={() => setLang(f.code)} aria-label={`Mudar idioma para ${f.label}`} aria-pressed={lang === f.code}
                style={{ border: lang === f.code ? '1.5px solid var(--brand-accent)' : '1.5px solid var(--brand-border)', borderRadius: 4, padding: 2, background: 'none', cursor: 'pointer' }}>
                <Image src={f.src} alt={f.label} width={22} height={16} style={{ display: "block" }} />
              </button>
            ))}
            <button onClick={toggleDark} aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
              style={{ background: 'none', border: '1px solid var(--brand-border)', borderRadius: 999, width: 34, height: 34, cursor: 'pointer', fontSize: 14 }}>
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
