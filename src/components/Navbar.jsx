import { useState, useEffect } from 'react'

const links = [
  { label: 'Sobre',       href: '#about'     },
  { label: 'Habilidades', href: '#skills'    },
  { label: 'Experiência', href: '#experience'},
  { label: 'Formação',    href: '#education' },
  { label: 'Contato',     href: '#contact'   },
]

export default function Navbar() {
  const [solid, setSolid] = useState(false)
  const [open,  setOpen]  = useState(false)

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
        background: solid ? 'rgba(242,235,223,0.92)' : 'transparent',
        backdropFilter: solid ? 'blur(16px)' : 'none',
        borderBottom: solid ? '1px solid rgba(8,74,138,0.1)' : '1px solid transparent',
        boxShadow: solid ? '0 2px 20px rgba(8,74,138,0.06)' : 'none',
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
          <span style={{ color: '#084a8a', fontWeight: 700, fontSize: 15 }}>Bruno Chaves</span>
        </a>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden md:flex">
          {links.map(l => (
            <a
              key={l.href} href={l.href}
              style={{ color: '#084a8a', fontSize: 14, textDecoration: 'none', opacity: 0.7, transition: 'opacity 0.2s' }}
              onMouseOver={e => e.target.style.opacity = 1}
              onMouseOut={e => e.target.style.opacity = 0.7}
            >
              {l.label}
            </a>
          ))}
          <a href="mailto:brunochavesuk@icloud.com" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
            Contato
          </a>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden"
          style={{ background: 'none', border: 'none', color: '#084a8a', fontSize: 24, cursor: 'pointer', padding: 4 }}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{
          background: 'rgba(242,235,223,0.97)', borderTop: '1px solid rgba(8,74,138,0.08)',
          padding: '12px 24px 20px',
        }}>
          {links.map(l => (
            <a
              key={l.href} href={l.href}
              onClick={() => setOpen(false)}
              style={{
                display: 'block', padding: '12px 0', color: '#084a8a',
                textDecoration: 'none', fontSize: 15,
                borderBottom: '1px solid rgba(8,74,138,0.07)',
              }}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
