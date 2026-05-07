import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from '../../hooks/useRouter'
import { hc } from '../../data/homeColors'
import { WHATSAPP_URL } from '../../data/homeData'

const LINKS = [
  { label: 'Serviços',       href: '#servicos'       },
  { label: 'Como Funciona',  href: '#como-funciona'  },
  { label: 'Portfólio',      href: '#portfolio'      },
  { label: 'Sobre',          href: '#sobre'           },
]

export default function HomeNav() {
  const { navigate } = useRouter()
  const [solid,  setSolid]  = useState(false)
  const [open,   setOpen]   = useState(false)

  useEffect(() => {
    const fn = () => setSolid(window.scrollY > 60)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const s = {
    nav: {
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 70,
      background: solid ? 'rgba(245,241,234,0.92)' : 'transparent',
      backdropFilter: solid ? 'blur(20px)' : 'none',
      borderBottom: solid ? `1px solid ${hc.border}` : '1px solid transparent',
      boxShadow: solid ? '0 2px 24px rgba(8,74,138,0.07)' : 'none',
      transition: 'all 0.3s',
    },
    inner: {
      maxWidth: 1140, margin: '0 auto', height: '100%',
      padding: '0 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    logo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', cursor: 'pointer' },
    logoBox: {
      width: 38, height: 38, borderRadius: 10,
      background: `linear-gradient(135deg, ${hc.accent}, ${hc.blue})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 900, fontSize: 14,
    },
    logoText: { color: hc.blue, fontWeight: 700, fontSize: 15 },
    links: { display: 'flex', alignItems: 'center', gap: 28, listStyle: 'none' },
    link: { color: hc.dark, fontSize: 14, textDecoration: 'none', opacity: 0.65, transition: 'opacity 0.2s' },
    waBtnWrap: { display: 'flex', alignItems: 'center', gap: 12 },
    waBtn: {
      display: 'flex', alignItems: 'center', gap: 8,
      background: hc.green, color: '#fff',
      border: 'none', borderRadius: 10, padding: '10px 20px',
      fontSize: 13, fontWeight: 700, cursor: 'pointer', textDecoration: 'none',
    },
    briefingBtn: {
      background: `linear-gradient(135deg, ${hc.accent}, ${hc.blue})`,
      color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px',
      fontSize: 13, fontWeight: 700, cursor: 'pointer',
    },
    // Mobile
    hamburger: {
      display: 'none', background: 'none', border: 'none',
      color: hc.dark, fontSize: 24, cursor: 'pointer',
    },
    mobileMenu: {
      position: 'fixed', top: 70, left: 0, right: 0, zIndex: 99,
      background: 'rgba(245,241,234,0.98)',
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${hc.border}`,
      padding: '16px 32px 24px',
    },
    mobileLink: {
      display: 'block', padding: '13px 0',
      color: hc.dark, textDecoration: 'none', fontSize: 16,
      borderBottom: `1px solid ${hc.border}`,
    },
  }

  return (
    <>
      <nav style={s.nav}>
        <div style={s.inner}>
          {/* Logo */}
          <motion.div
            style={s.logo}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <div style={s.logoBox}>BC</div>
            <span style={s.logoText}>Bruno Chaves</span>
          </motion.div>

          {/* Desktop links */}
          <ul style={s.links} className="home-nav-links">
            {LINKS.map(l => (
              <li key={l.href}>
                <a
                  href={l.href} style={s.link}
                  onMouseOver={e => e.currentTarget.style.opacity = 1}
                  onMouseOut={e => e.currentTarget.style.opacity = 0.65}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div style={s.waBtnWrap} className="home-nav-ctas">
            <motion.button
              style={s.briefingBtn}
              onClick={() => navigate('/briefing')}
              whileHover={{ scale: 1.04, opacity: 0.9 }}
              whileTap={{ scale: 0.96 }}
            >
              Briefing grátis
            </motion.button>
            <motion.a
              href={WHATSAPP_URL} style={s.waBtn}
              target="_blank" rel="noreferrer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </motion.a>
          </div>

          {/* Hamburger mobile */}
          <button
            style={s.hamburger}
            className="home-hamburger"
            onClick={() => setOpen(!open)}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            style={s.mobileMenu}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
          >
            {LINKS.map(l => (
              <a
                key={l.href} href={l.href} style={s.mobileLink}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
              <button
                style={{ ...s.briefingBtn, flex: 1, padding: '13px 0', fontSize: 14 }}
                onClick={() => { setOpen(false); navigate('/briefing') }}
              >
                Preencher Briefing →
              </button>
              <a
                href={WHATSAPP_URL} style={{ ...s.waBtn, flex: 1, justifyContent: 'center', padding: '13px 0', fontSize: 14 }}
                target="_blank" rel="noreferrer"
                onClick={() => setOpen(false)}
              >
                WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 860px) {
          .home-nav-links, .home-nav-ctas { display: none !important; }
          .home-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  )
}
