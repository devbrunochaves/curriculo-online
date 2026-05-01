import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'

const FLAGS = [
  { code: 'pt', src: '/flag-br.svg', label: 'Português' },
  { code: 'en', src: '/flag-us.svg', label: 'English'   },
  { code: 'es', src: '/flag-es.svg', label: 'Español'   },
]

export default function Navbar() {
  const { c, t, isDark, toggleDark, lang, setLang } = useApp()
  const [solid, setSolid] = useState(false)
  const [open,  setOpen]  = useState(false)

  const nav = t.nav

  const links = [
    { label: nav.about,      href: '#about'      },
    { label: nav.skills,     href: '#skills'     },
    { label: nav.experience, href: '#experience' },
    { label: nav.education,  href: '#education'  },
  ]

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'all 0.3s',
        background: solid ? c.navSolid : 'transparent',
        backdropFilter: solid ? 'blur(16px)' : 'none',
        borderBottom: solid ? `1px solid ${c.border}` : '1px solid transparent',
        boxShadow: solid ? `0 2px 20px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(8,74,138,0.06)'}` : 'none',
      }}
    >
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 24px',
        height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>

        {/* Logo */}
        <a href="#hero" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #37a8de, #084a8a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900, fontSize: 14,
          }}>BC</div>
          <span style={{ color: c.primary, fontWeight: 700, fontSize: 15 }}>Bruno Chaves</span>
        </a>

        {/* Desktop links — inline display NOT set, Tailwind controls show/hide */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 26 }}>
          {links.map(l => (
            <a
              key={l.href} href={l.href}
              style={{ color: c.primary, fontSize: 14, textDecoration: 'none', opacity: 0.7, transition: 'opacity 0.2s' }}
              onMouseOver={e => e.currentTarget.style.opacity = 1}
              onMouseOut={e => e.currentTarget.style.opacity = 0.7}
            >
              {l.label}
            </a>
          ))}

          {/* Contact CTA */}
          <a href="#contact" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
            {nav.contact}
          </a>

          {/* Separator */}
          <div style={{ width: 1, height: 22, background: c.border, flexShrink: 0 }} />

          {/* Language flags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {FLAGS.map(f => (
              <button
                key={f.code}
                onClick={() => setLang(f.code)}
                className={`flag-btn${lang === f.code ? ' active' : ''}`}
                title={f.label}
              >
                <img src={f.src} alt={f.label} width={22} height={16} style={{ display: 'block', borderRadius: 2 }} />
              </button>
            ))}
          </div>

          {/* Dark mode toggle */}
          <button onClick={toggleDark} className="theme-toggle" title={isDark ? 'Modo claro' : 'Modo escuro'}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Mobile: flags + dark + hamburger — inline display NOT set */}
        <div className="flex md:hidden" style={{ alignItems: 'center', gap: 5 }}>
          {FLAGS.map(f => (
            <button
              key={f.code}
              onClick={() => setLang(f.code)}
              className={`flag-btn${lang === f.code ? ' active' : ''}`}
              title={f.label}
            >
              <img src={f.src} alt={f.label} width={20} height={15} style={{ display: 'block', borderRadius: 2 }} />
            </button>
          ))}
          <button onClick={toggleDark} className="theme-toggle" style={{ width: 30, height: 30, fontSize: 14 }}>
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setOpen(!open)}
            style={{ background: 'none', border: 'none', color: c.primary, fontSize: 24, cursor: 'pointer', padding: 4 }}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{
          background: isDark ? 'rgba(15,23,42,0.98)' : 'rgba(242,235,223,0.97)',
          borderTop: `1px solid ${c.border}`,
          padding: '12px 24px 20px',
        }}>
          {links.map(l => (
            <a
              key={l.href} href={l.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'block', padding: '12px 0', color: c.primary,
                textDecoration: 'none', fontSize: 15,
                borderBottom: `1px solid ${c.borderLight}`,
              }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => setOpen(false)}
            style={{
              display: 'block', padding: '12px 0', color: c.primary,
              textDecoration: 'none', fontSize: 15,
            }}
          >
            {nav.contact}
          </a>
        </div>
      )}
    </nav>
  )
}
