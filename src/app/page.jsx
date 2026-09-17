'use client'

import { useState } from 'react'
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
  ['+20', 'anos de experiência'],
  ['+8', 'empresas atendidas'],
  ['2', 'países de atuação'],
]

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className={styles.page}>
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
            <a style={{ borderRadius: 0 }} className={styles.ctaSmall} href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Falar comigo ↗</a>
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
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Falar comigo ↗</a>
        </div>
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>Design · Desenvolvimento · Resultados</div>

            <h1 className={styles.headline}>
              Design, código e estratégia para marcas que querem <span className={styles.red}>crescer.</span>
            </h1>

            <p className={styles.subhead}>
              Sou Bruno Chaves. Uno design, desenvolvimento e IA para criar sites, identidades e produtos digitais com foco em resultado.
            </p>

            <div className={styles.heroCtas}>
              <a style={{ borderRadius: 0 }} className={styles.ctaPrimary} href="#projetos">Ver projetos →</a>
              <a style={{ borderRadius: 0 }} className={styles.ctaSecondary} href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Falar comigo ↗</a>
            </div>

            <div className={styles.stats} aria-label="Números profissionais">
              {stats.map(([value, label]) => (
                <div className={styles.stat} key={label}>
                  <span className={styles.statValue}>{value}</span>
                  <span className={styles.statLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.photoColumn} aria-label="Retrato de Bruno Chaves">
            <div className={styles.photoFrame}>
              <img src="/avatar.jpg" alt="Bruno Chaves" />
              <div className={styles.photoAccent} />
              <div className={styles.photoCaption}>
                <strong>Mais que código, soluções reais.</strong>
                <span>Design + Web + IA</span>
              </div>
            </div>
          </div>

          <aside className={styles.rail} aria-label="Posicionamento profissional">
            <div>
              <div className={styles.railLabel}>Criando oportunidades através da tecnologia</div>
              <div className={styles.railLine} />
              <p className={styles.railQuote}>“Design bem pensado e tecnologia bem aplicada transformam negócios.”</p>
              <div className={styles.railSignature}>
                Bruno Chaves
                <span>Designer + Developer</span>
              </div>
            </div>

            <div className={styles.ghostWords} aria-hidden="true">
              Ideias<br />Design<br />Código<br />Resultados
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.blackBand} id="projetos">
        <div className={styles.blackBandInner}>
          <div className={styles.bandKicker}>Projetos em destaque</div>
          <div className={styles.bandTitle}>Ideias que ganham vida no mundo real.</div>
          <a className={styles.bandLink} href="#servicos">Explorar a próxima seção →</a>
        </div>
      </section>

      <section id="servicos" style={{ minHeight: 1 }} aria-hidden="true" />
      <section id="sobre" style={{ minHeight: 1 }} aria-hidden="true" />
      <section id="contato" style={{ minHeight: 1 }} aria-hidden="true" />
    </main>
  )
}
