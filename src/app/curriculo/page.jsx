'use client'

import { useEffect, useRef, useState } from 'react'
import { AppProvider, useApp } from '../../context/AppContext'
import styles from './curriculo.module.css'

const WHATSAPP_URL = 'https://wa.me/5527997341557'
const LINKEDIN_URL = 'https://linkedin.com/in/brunochavess'
const BEHANCE_URL = 'https://behance.net/brunochavesdsg'

const FLAGS = [
  { code: 'pt', label: 'PT', src: '/flag-br.svg' },
  { code: 'en', label: 'EN', src: '/flag-us.svg' },
  { code: 'es', label: 'ES', src: '/flag-es.svg' },
]

function Resume() {
  const { t, isDark, toggleDark, lang, setLang } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const [experienceProgress, setExperienceProgress] = useState(0)
  const experienceRef = useRef(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const nodes = document.querySelectorAll('[data-cv-reveal]')
    if (reduced) {
      nodes.forEach((node) => node.classList.add(styles.revealVisible))
      return
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.revealVisible)
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [lang])

  useEffect(() => {
    let raf = null
    const update = () => {
      if (!experienceRef.current) return
      const rect = experienceRef.current.getBoundingClientRect()
      const start = window.innerHeight * 0.78
      const end = -rect.height + window.innerHeight * 0.48
      const progress = Math.min(Math.max((start - rect.top) / (start - end), 0), 1)
      setExperienceProgress(progress)
    }
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => { update(); raf = null })
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const navItems = [
    [t.nav.about, '#sobre'],
    [t.nav.skills, '#habilidades'],
    [t.nav.experience, '#experiencia'],
    [t.nav.education, '#formacao'],
    [t.nav.contact, '#contato'],
  ]

  return (
    <div className={styles.page} data-theme={isDark ? 'dark' : 'light'}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a className={styles.logo} href="/">Bruno Chaves<span>•</span></a>
          <nav className={styles.nav} aria-label="Navegação do currículo">
            {navItems.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          </nav>
          <div className={styles.headerActions}>
            <a className={styles.portfolioLink} href="/">Portfólio ↗</a>
            <div className={styles.languages} aria-label="Idioma">
              {FLAGS.map((flag) => (
                <button key={flag.code} type="button" className={lang === flag.code ? styles.languageActive : ''} onClick={() => setLang(flag.code)} aria-label={flag.label}>
                  <img src={flag.src} alt="" />
                </button>
              ))}
            </div>
            <button className={styles.themeToggle} type="button" onClick={toggleDark} aria-label="Alternar tema">{isDark ? '☀' : '☾'}</button>
            <a className={styles.headerCta} href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"><span>{t.nav.contact} ↗</span></a>
          </div>
          <button className={styles.menuButton} type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label="Abrir menu"><span /><span /></button>
        </div>
        <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}>
          {navItems.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <a href="/">Portfólio ↗</a>
          <div className={styles.mobileControls}>
            {FLAGS.map((flag) => <button key={flag.code} type="button" onClick={() => setLang(flag.code)}>{flag.label}</button>)}
            <button type="button" onClick={toggleDark}>{isDark ? 'Light' : 'Dark'}</button>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.hero} id="top">
          <div className={styles.heroDots} aria-hidden="true" />
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.shell}>
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <div className={styles.kicker} data-cv-reveal>CURRÍCULO · DESIGN · CÓDIGO · IA</div>
                <div className={styles.availability} data-cv-reveal><span />{t.hero.available}</div>
                <h1 data-cv-reveal>Bruno<br />Chaves<span>.</span></h1>
                <div className={styles.heroRoles} data-cv-reveal>{t.hero.roles.slice(0, 3).map((role) => <span key={role}>{role}</span>)}</div>
                <p className={styles.heroTagline} data-cv-reveal>{t.hero.tagline}</p>
                <div className={styles.heroButtons} data-cv-reveal>
                  <a className={styles.primaryButton} href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"><span>{t.hero.emailBtn.replace('💬 ', '')} ↗</span></a>
                  <a className={styles.secondaryButton} href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer"><span>LinkedIn ↗</span></a>
                </div>
                <div className={styles.heroStats} data-cv-reveal>{t.hero.stats.map((stat) => <div key={stat.lbl}><strong>{stat.val}</strong><span>{stat.lbl}</span></div>)}</div>
              </div>
              <div className={styles.heroVisual} data-cv-reveal>
                <div className={styles.photoRings} aria-hidden="true"><span /><span /><span /></div>
                <div className={styles.heroPhoto}><img src="/avatar.jpg" alt="Bruno Chaves" /></div>
                <div className={styles.heroBadge}>DESIGN<br />+ DEV<br /><b>+ IA</b></div>
                <div className={styles.heroNote}>Do Brasil<br />para o mundo.</div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.aboutSection} id="sobre">
          <div className={styles.aboutPattern} aria-hidden="true" />
          <div className={styles.shell}>
            <div className={styles.sectionIntro} data-cv-reveal>
              <span>/ {t.about.label}</span>
              <h2>{t.about.heading1} <em>{t.about.heading2}</em></h2>
            </div>
            <div className={styles.aboutGrid}>
              <div className={styles.aboutCopy} data-cv-reveal>
                <p>{t.about.p1}</p>
                <p>{t.about.p2}</p>
                <div className={styles.tags}>{t.about.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </div>
              <div className={styles.highlights}>
                {t.about.highlights.map((item, index) => (
                  <article key={item.title} className={styles.highlightCard} data-cv-reveal>
                    <span className={styles.highlightNumber}>0{index + 1}</span>
                    <div className={styles.highlightIcon}>{item.icon}</div>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.skillsSection} id="habilidades">
          <div className={styles.shell}>
            <div className={styles.sectionIntro} data-cv-reveal>
              <span>/ {t.skills.label}</span>
              <h2>{t.skills.heading1} <em>{t.skills.heading2}</em></h2>
              <p>Design, desenvolvimento, marketing e inteligência artificial trabalhando no mesmo sistema.</p>
            </div>
            <div className={styles.skillsGrid}>
              {t.skills.categories.map((category, index) => (
                <article className={styles.skillGroup} key={category.cat} data-cv-reveal>
                  <div className={styles.skillHeader}>
                    <span>0{index + 1}</span>
                    <div>{category.icon}</div>
                  </div>
                  <h3>{category.cat}</h3>
                  <div className={styles.skillPills}>{category.items.map((item) => <span key={item}>{item}</span>)}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.experienceSection} id="experiencia">
          <div className={styles.shell}>
            <div className={styles.sectionIntro} data-cv-reveal>
              <span>/ {t.experience.label}</span>
              <h2>{t.experience.heading1} <em>{t.experience.heading2}</em></h2>
            </div>

            <div className={styles.experienceLayout} ref={experienceRef} style={{ '--experience-progress': experienceProgress }}>
              <aside className={styles.experienceAside} data-cv-reveal>
                <div className={styles.experienceSticky}>
                  <strong>20+</strong>
                  <span>anos entre criação, comunicação, tecnologia e negócios.</span>
                  <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">LinkedIn completo ↗</a>
                </div>
              </aside>

              <div className={styles.timeline}>
                <div className={styles.timelineBase} aria-hidden="true"><span /></div>
                {t.experience.experiences.map((job, index) => (
                  <details className={styles.job} key={`${job.company}-${index}`} open={index === 0} data-cv-reveal>
                    <summary>
                      <span className={styles.jobDot} />
                      <div className={styles.jobTopline}><span>{String(index + 1).padStart(2, '0')}</span><span>{job.period || '—'}</span></div>
                      <div className={styles.jobTitleRow}>
                        <div><h3>{job.company}</h3><p>{job.role}</p></div>
                        <span className={styles.jobToggle}>+</span>
                      </div>
                      <div className={styles.jobMeta}><span>{job.badge}</span><span>{job.location}</span></div>
                    </summary>
                    <div className={styles.jobBody}><ul>{job.items.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  </details>
                ))}

                <article className={`${styles.job} ${styles.internationalJob}`} data-cv-reveal>
                  <div className={styles.jobDot} />
                  <div className={styles.jobTopline}><span>{t.experience.intlBadge}</span><span>{t.experience.intlExp.period}</span></div>
                  <div className={styles.jobTitleRow}><div><h3>{t.experience.intlExp.company}</h3><p>{t.experience.intlExp.role}</p></div></div>
                  <div className={styles.jobMeta}><span>{t.experience.intlExp.location}</span></div>
                  <p className={styles.intlText}>{t.experience.intlExp.description}</p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.educationSection} id="formacao">
          <div className={styles.shell}>
            <div className={styles.sectionIntro} data-cv-reveal>
              <span>/ {t.education.label}</span>
              <h2>{t.education.heading1} <em>{t.education.heading2}</em></h2>
            </div>

            <div className={styles.educationGrid}>
              {t.education.items.map((item, index) => (
                <article className={styles.educationCard} key={item.degree} data-cv-reveal>
                  <span className={styles.educationNumber}>0{index + 1}</span>
                  <div><small>{item.type} · {item.year}</small><h3>{item.degree}</h3><p>{item.inst}</p></div>
                </article>
              ))}
            </div>

            <div className={styles.languagesBlock} data-cv-reveal>
              <div><span>/ {t.education.langHeading}</span><h3>{t.education.langHeading}</h3></div>
              <div className={styles.languageCards}>
                {t.education.languages.map((language) => (
                  <article key={language.lang}>
                    <div><span>{language.flag}</span><strong>{language.lang}</strong><small>{language.level}</small></div>
                    <div className={styles.languageTrack}><span style={{ width: `${language.pct}%` }} /></div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.contactSection} id="contato">
          <div className={styles.contactGlow} aria-hidden="true" />
          <div className={styles.shell}>
            <div className={styles.contactGrid} data-cv-reveal>
              <div>
                <span className={styles.contactKicker}>/ {t.contact.label}</span>
                <h2>{t.contact.heading1}<br /><em>{t.contact.heading2}</em></h2>
              </div>
              <div className={styles.contactContent}>
                <p>{t.contact.text}</p>
                <div className={styles.contactButtons}>
                  <a className={styles.primaryButton} href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"><span>WhatsApp ↗</span></a>
                  <a className={styles.secondaryButton} href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer"><span>LinkedIn ↗</span></a>
                  <a className={styles.secondaryButton} href={BEHANCE_URL} target="_blank" rel="noopener noreferrer"><span>Behance ↗</span></a>
                </div>
                <div className={styles.contactMeta}>
                  <span>brunochavesuk@icloud.com</span>
                  <span>Serra · ES · Brasil</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.shell}>
          <div className={styles.footerInner}>
            <a className={styles.logo} href="/">Bruno Chaves<span>•</span></a>
            <p>Design · Código · Estratégia · IA</p>
            <div><a href="/">Portfólio</a><a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">LinkedIn</a><a href="#top">Topo ↑</a></div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function CurriculoPage() {
  return <AppProvider><Resume /></AppProvider>
}
