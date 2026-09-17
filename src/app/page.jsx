'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './brand-home.module.css'

const WHATSAPP_URL = 'https://wa.me/5527997341557'

const navItems = [
  ['Projetos', '#projetos'],
  ['Serviços', '#servicos'],
  ['Sobre', '#sobre'],
  ['Currículo', '/dominio'],
  ['Contato', '#contato'],
]

const stats = [
  [20, 'anos de experiência', '+'],
  [8, 'empresas atendidas', '+'],
  [2, 'países de atuação', ''],
]

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState('light')
  const [animatedStats, setAnimatedStats] = useState([0, 0, 0])
  const photoRef = useRef(null)
  const ghostRef = useRef(null)

  useEffect(() => {
    const stored = window.localStorage.getItem('bruno-theme')
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    setTheme(stored || preferred)
  }, [])

  useEffect(() => {
    window.localStorage.setItem('bruno-theme', theme)
    document.documentElement.style.colorScheme = theme
  }, [theme])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const revealNodes = document.querySelectorAll('[data-reveal]')
    const heroRevealNodes = document.querySelectorAll('#top [data-reveal]')

    if (reduced) {
      revealNodes.forEach((node) => node.classList.add(styles.revealVisible))
      setAnimatedStats(stats.map(([value]) => value))
      return
    }

    // Hero is initially in the viewport. Reveal it explicitly so clip-path
    // animations never prevent IntersectionObserver from seeing the headline.
    requestAnimationFrame(() => {
      heroRevealNodes.forEach((node) => node.classList.add(styles.revealVisible))
    })

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.revealVisible)
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.18 })

    revealNodes.forEach((node) => {
      if (!node.closest('#top')) observer.observe(node)
    })

    const duration = 950
    const start = performance.now()
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedStats(stats.map(([value]) => Math.round(value * eased)))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)

    let raf = null
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        if (ghostRef.current) {
          const y = Math.min(window.scrollY * 0.08, 42)
          ghostRef.current.style.transform = `translate3d(0, ${y}px, 0)`
        }
        raf = null
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const handlePhotoMove = (event) => {
    if (!photoRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = photoRef.current.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    photoRef.current.style.setProperty('--rx', `${(-y * 3.5).toFixed(2)}deg`)
    photoRef.current.style.setProperty('--ry', `${(x * 4.5).toFixed(2)}deg`)
    photoRef.current.style.setProperty('--tx', `${(x * 8).toFixed(2)}px`)
    photoRef.current.style.setProperty('--ty', `${(y * 8).toFixed(2)}px`)
  }

  const resetPhoto = () => {
    if (!photoRef.current) return
    photoRef.current.style.setProperty('--rx', '0deg')
    photoRef.current.style.setProperty('--ry', '0deg')
    photoRef.current.style.setProperty('--tx', '0px')
    photoRef.current.style.setProperty('--ty', '0px')
  }

  return (
    <main className={styles.page} data-theme={theme}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a href="#top" className={styles.logo} aria-label="Bruno Chaves, início">
            Bruno Chaves<span className={styles.logoDot}>•</span>
          </a>

          <nav className={styles.nav} aria-label="Navegação principal">
            {navItems.map(([label, href]) => (
              <a key={label} href={href}>{label}</a>
            ))}
          </nav>

          <div className={styles.headerActions}>
            <a className={styles.textLink} href="https://linkedin.com/in/brunochavess" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <button
              type="button"
              className={styles.themeToggle}
              onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
              aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
              title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
            >
              <span className={styles.themeIcon}>{theme === 'light' ? '☾' : '☀'}</span>
            </button>
            <a className={styles.ctaSmall} href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Falar comigo ↗</a>
          </div>

          <button
            type="button"
            className={styles.menuButton}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span className={styles.menuIcon} />
          </button>
        </div>

        <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}>
          {navItems.map(([label, href]) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
          <button type="button" className={styles.mobileTheme} onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
          </button>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Falar comigo ↗</a>
        </div>
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow} data-reveal>Design · Desenvolvimento · Resultados</div>

            <h1 className={styles.headline} data-reveal>
              Design, código e estratégia para marcas que querem <span className={styles.red}>crescer.</span>
            </h1>

            <p className={styles.subhead} data-reveal>
              Sou Bruno Chaves. Uno design, desenvolvimento e IA para criar sites, identidades e produtos digitais com foco em resultado.
            </p>

            <div className={styles.heroCtas} data-reveal>
              <a className={styles.ctaPrimary} href="#projetos">Ver projetos →</a>
              <a className={styles.ctaSecondary} href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Falar comigo ↗</a>
            </div>

            <div className={styles.stats} aria-label="Números profissionais" data-reveal>
              {stats.map(([value, label, prefix], index) => (
                <div className={styles.stat} key={label}>
                  <span className={styles.statValue}>{prefix}{animatedStats[index]}</span>
                  <span className={styles.statLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.photoColumn} data-reveal>
            <div
              ref={photoRef}
              className={styles.photoFrame}
              onPointerMove={handlePhotoMove}
              onPointerLeave={resetPhoto}
              aria-label="Retrato de Bruno Chaves"
            >
              <img src="/avatar.jpg" alt="Bruno Chaves" />
              <div className={styles.photoAccent} />
              <div className={styles.photoCaption}>
                <strong>Mais que código, soluções reais.</strong>
                <span>Design + Web + IA</span>
              </div>
            </div>
          </div>

          <aside className={styles.rail} aria-label="Posicionamento profissional" data-reveal>
            <div>
              <div className={styles.railLabel}>Criando oportunidades através da tecnologia</div>
              <div className={styles.railLine} />
              <p className={styles.railQuote}>“Design bem pensado e tecnologia bem aplicada transformam negócios.”</p>
              <div className={styles.railSignature}>
                Bruno Chaves
                <span>Designer + Developer</span>
              </div>
            </div>

            <div ref={ghostRef} className={styles.ghostWords} aria-hidden="true">
              <span>Ideias</span><span>Design</span><span>Código</span><span>Resultados</span>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.blackBand} id="projetos">
        <div className={styles.blackBandInner}>
          <div className={styles.bandKicker}>Projetos em destaque</div>
          <div className={styles.marqueeViewport} aria-hidden="true">
            <div className={styles.marqueeTrack}>
              <span>DESIGN — WEB — IA — ESTRATÉGIA — PRODUTO —</span>
              <span>DESIGN — WEB — IA — ESTRATÉGIA — PRODUTO —</span>
            </div>
          </div>
          <a className={styles.bandLink} href="#servicos">Explorar projetos →</a>
        </div>
      </section>

      <section id="servicos" style={{ minHeight: 1 }} aria-hidden="true" />
      <section id="sobre" style={{ minHeight: 1 }} aria-hidden="true" />
      <section id="contato" style={{ minHeight: 1 }} aria-hidden="true" />
    </main>
  )
}
