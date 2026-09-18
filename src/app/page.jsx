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

const floatingTools = [
  { name: 'Figma', icon: '/icons/tools/figma.svg', x: '7%', y: '16%', size: 86, delay: 0, duration: 7.4 },
  { name: 'Photoshop', icon: '/icons/tools/photoshop.svg', x: '23%', y: '54%', size: 92, delay: 1.1, duration: 8.6 },
  { name: 'Illustrator', icon: '/icons/tools/illustrator.svg', x: '36%', y: '19%', size: 84, delay: 2.2, duration: 7.8 },
  { name: 'InDesign', icon: '/icons/tools/indesign.svg', x: '45%', y: '70%', size: 82, delay: .7, duration: 9.1 },
  { name: 'React', icon: '/icons/tools/react.svg', x: '61%', y: '17%', size: 94, delay: 1.5, duration: 8.2 },
  { name: 'Next.js', icon: '/icons/tools/nextjs.svg', x: '76%', y: '58%', size: 90, delay: .4, duration: 7.7 },
  { name: 'JavaScript', icon: '/icons/tools/javascript.svg', x: '11%', y: '72%', size: 82, delay: 1.9, duration: 8.9 },
  { name: 'Supabase', icon: '/icons/tools/supabase.svg', x: '56%', y: '48%', size: 88, delay: 2.7, duration: 9.3 },
  { name: 'WordPress', icon: '/icons/tools/wordpress.svg', x: '83%', y: '20%', size: 86, delay: .9, duration: 8.4 },
  { name: 'Claude', icon: '/icons/tools/claude.svg', x: '88%', y: '75%', size: 84, delay: 1.3, duration: 7.9 },
  { name: 'Google AI', icon: '/icons/tools/googleai.svg', x: '67%', y: '78%', size: 86, delay: 2.4, duration: 9.5 },
  { name: 'Tailwind CSS', icon: '/icons/tools/tailwind.svg', x: '31%', y: '82%', size: 84, delay: .2, duration: 8.1 },
  { name: 'PHP', icon: '/icons/tools/php.svg', x: '48%', y: '29%', size: 82, delay: 1.8, duration: 8.8 },
  { name: 'Java', icon: '/icons/tools/java.svg', x: '18%', y: '30%', size: 82, delay: 2.9, duration: 9.2 },
  { name: 'GitHub', icon: '/icons/tools/github.svg', x: '91%', y: '43%', size: 80, delay: .6, duration: 8.3 },
]

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState('light')
  const [animatedStats, setAnimatedStats] = useState([0, 0, 0])
  const [processProgress, setProcessProgress] = useState(0)
  const photoRef = useRef(null)
  const ghostRef = useRef(null)
  const processRef = useRef(null)

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

  useEffect(() => {
    let raf = null

    const updateProcess = () => {
      if (!processRef.current) return
      const rect = processRef.current.getBoundingClientRect()
      const start = window.innerHeight * 0.82
      const end = window.innerHeight * 0.32
      const next = Math.min(Math.max((start - rect.top) / (start - end), 0), 1)
      setProcessProgress(next)
    }

    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        updateProcess()
        raf = null
      })
    }

    updateProcess()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
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

      <section className={styles.projectsSection} aria-labelledby="projects-title">
        <div className={styles.sectionShell}>
          <div className={styles.sectionHeader} data-reveal>
            <div>
              <span className={styles.sectionKicker}>/ Projetos selecionados</span>
              <h2 id="projects-title" className={styles.sectionTitle}>Trabalho que une <span className={styles.red}>forma</span> e função.</h2>
            </div>
            <p className={styles.sectionIntro}>Uma seleção visual de projetos onde design, estratégia e tecnologia trabalham juntos.</p>
          </div>
          <div className={styles.projectsGrid}>
            {[
              ['/ARTE-GREEN-STATION.jpg', 'Identidade visual', 'Marca & direção visual', '01'],
              ['/ARTE-ARTICULATO.jpg', 'Projeto digital', 'Design & experiência', '02'],
              ['/ARTE-HAMBURGUER.png', 'Campanha visual', 'Conteúdo & performance', '03'],
            ].map(([image, title, category, number]) => (
              <a className={styles.projectCard} href="/projetos" key={number} data-reveal>
                <div className={styles.projectImageWrap}>
                  <img src={image} alt="" className={styles.projectImage} />
                  <span className={styles.projectNumber}>{number}</span>
                  <span className={styles.projectView}>Ver case ↗</span>
                </div>
                <div className={styles.projectMeta}>
                  <div><strong>{title}</strong><span>{category}</span></div>
                  <span className={styles.projectArrow}>↗</span>
                </div>
              </a>
            ))}
          </div>
          <a href="/projetos" className={styles.textCta} data-reveal>Ver todos os projetos <span>→</span></a>
        </div>
      </section>

      <section className={styles.servicesSection} id="servicos">
        <div className={styles.sectionShell}>
          <div className={styles.sectionHeader} data-reveal>
            <div>
              <span className={styles.sectionKicker}>/ O que eu faço</span>
              <h2 className={styles.sectionTitle}>Do conceito ao <span className={styles.red}>resultado.</span></h2>
            </div>
            <p className={styles.sectionIntro}>Soluções para marcas que precisam parecer, funcionar e comunicar melhor.</p>
          </div>
          <div className={styles.servicesList}>
            {[
              ['01', 'Branding', 'Identidades visuais e sistemas de marca para posicionar empresas com clareza e personalidade.'],
              ['02', 'Sites & Landing Pages', 'Experiências digitais rápidas, responsivas e desenhadas para comunicar e converter.'],
              ['03', 'Produtos Digitais', 'Interfaces, dashboards e aplicações web construídas para resolver problemas reais.'],
              ['04', 'Conteúdo & Performance', 'Direção visual e conteúdo para transformar presença digital em oportunidade.'],
            ].map(([number, title, description]) => (
              <article className={styles.serviceRow} key={number} data-reveal>
                <span className={styles.serviceNumber}>{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className={styles.serviceArrow}>↗</span>
              </article>
            ))}
          </div>
          <p className={styles.aiNote} data-reveal>IA faz parte do processo. <strong>Estratégia continua sendo humana.</strong></p>
        </div>
      </section>

      <section className={styles.aboutSection} id="sobre">
        <div className={styles.aboutSectionEffects} aria-hidden="true">
          <div className={`${styles.aboutSectionOrbit} ${styles.aboutSectionOrbitOne}`}><span /></div>
          <div className={`${styles.aboutSectionOrbit} ${styles.aboutSectionOrbitTwo}`}><span /></div>
          <div className={`${styles.aboutSectionOrbit} ${styles.aboutSectionOrbitThree}`}><span /></div>
          <div className={styles.aboutSectionGlow} />
        </div>
        <div className={styles.sectionShell}>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutCopy} data-reveal>
              <span className={styles.sectionKicker}>/ Sobre</span>
              <h2 className={styles.sectionTitle}>Mais que um profissional, um parceiro no <span className={styles.red}>seu projeto.</span></h2>
              <p>Sou Bruno Chaves, designer e desenvolvedor com mais de 20 anos de experiência no universo criativo.</p>
              <p>Minha trajetória começou no design e evoluiu para desenvolvimento web, produtos digitais e tecnologia. Hoje consigo enxergar um projeto de ponta a ponta — da estratégia à implementação.</p>
              <a href="/dominio" className={styles.textCta}>Conheça minha trajetória <span>→</span></a>
              <div className={styles.aboutStats}>
                <div><strong>+20</strong><span>anos de experiência</span></div>
                <div><strong>+8</strong><span>empresas atendidas</span></div>
                <div><strong>2</strong><span>países de atuação</span></div>
              </div>
            </div>
            <div className={styles.aboutVisual} data-reveal>
              <div className={styles.aboutPhotoShell}>
                <img src="/foto-aside.jpg" alt="Bruno Chaves" />
              </div>
              <div className={styles.aboutStamp}><span>Design</span><span>Web</span><span>IA</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.manifestoSection} aria-label="Manifesto">
        <div className={styles.manifestoInner}>
          <div className={styles.manifestoWords} data-reveal>
            <span>DESIGN <em>NÃO É DECORAÇÃO.</em></span>
            <span>CÓDIGO <em>NÃO É O PRODUTO.</em></span>
            <span className={styles.manifestoRed}>O RESULTADO É O QUE IMPORTA.</span>
          </div>
          <p data-reveal>Meu trabalho está justamente na interseção entre estratégia, experiência, comunicação e tecnologia.</p>
        </div>
      </section>

      <section className={styles.processSection} id="processo">
        <div className={styles.sectionShell}>
          <span className={styles.sectionKicker} data-reveal>/ Processo</span>
          <h2 className={styles.sectionTitle} data-reveal>Do briefing ao <span className={styles.red}>resultado.</span></h2>
          <div className={styles.processLine} data-reveal ref={processRef} style={{ '--process-progress': processProgress }}>
            <div className={styles.processTrack} aria-hidden="true">
              <span className={styles.processProgress} />
            </div>
            {[
              ['01', 'Entendimento', 'Imersão no negócio, problema, público e objetivos.'],
              ['02', 'Estratégia', 'Definição da direção visual, técnica e comercial.'],
              ['03', 'Desenvolvimento', 'Design, prototipação, implementação e testes.'],
              ['04', 'Entrega', 'Publicação, documentação e acompanhamento.'],
            ].map(([number, title, text], index) => (
              <article className={`${styles.processStep} ${processProgress >= index / 3 ? styles.processStepActive : ''}`} key={number}>
                <span>{number}</span><h3>{title}</h3><p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.toolsSection} id="ferramentas">
        <div className={styles.sectionShell}>
          <span className={styles.sectionKicker} data-reveal>/ Ferramentas</span>
          <div className={styles.toolsHeading} data-reveal>
            <h2>DESIGN <span>+</span> CÓDIGO <span>+</span> IA</h2>
            <p>Ferramentas são extensões do processo. Eu combino design, desenvolvimento e inteligência artificial para transformar ideias em experiências digitais mais fortes.</p>
          </div>

          <div className={styles.toolsFloatField} data-reveal>
            <div className={styles.toolsFloatDots} aria-hidden="true" />
            <div className={styles.toolsFloatGlow} aria-hidden="true" />
            {floatingTools.map((tool) => (
              <div
                className={styles.floatingTool}
                key={tool.name}
                style={{
                  '--tool-x': tool.x,
                  '--tool-y': tool.y,
                  '--tool-size': `${tool.size}px`,
                  '--tool-delay': `${tool.delay}s`,
                  '--tool-duration': `${tool.duration}s`,
                }}
              >
                <div className={styles.floatingToolInner}>
                  <span
                    className={styles.floatingToolIcon}
                    style={{ '--tool-icon': `url("${tool.icon}")` }}
                    aria-hidden="true"
                  />
                  <span>{tool.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.contactSection} id="contato">
        <div className={styles.contactGlow} aria-hidden="true" />
        <div className={styles.contactInner} data-reveal>
          <span className={styles.sectionKicker}>Vamos conversar?</span>
          <h2>Tem um <span>projeto em mente?</span></h2>
          <p>Vamos transformar sua ideia em uma solução clara, bonita e funcional.</p>
          <a className={styles.contactButton} href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Falar comigo ↗</a>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div><strong>Bruno Chaves<span className={styles.logoDot}>•</span></strong><p>Design, código e estratégia.</p></div>
          <div className={styles.footerLinks}><a href="https://linkedin.com/in/brunochavess" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a><a href="/dominio">Currículo</a></div>
        </div>
        <div className={styles.footerBottom}><span>© {new Date().getFullYear()} Bruno Chaves.</span><span>Do Brasil para o mundo.</span></div>
      </footer>
    </main>
  )
}
