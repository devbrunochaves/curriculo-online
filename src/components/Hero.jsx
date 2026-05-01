import { useState, useEffect, useRef } from 'react'

/* ── Componente isolado para a foto (evita conflito com DOM do React) ── */
function ProfilePhoto() {
  const [imgError, setImgError] = useState(false)

  return (
    <div style={{
      width: 'clamp(240px, 28vw, 340px)',
      height: 'clamp(240px, 28vw, 340px)',
      borderRadius: '50%',
      overflow: 'hidden',
      border: '4px solid #ffffff',
      boxShadow: '0 24px 64px rgba(8,74,138,0.18)',
      background: '#f0f4f8',
      position: 'relative',
      flexShrink: 0,
    }}>
      {imgError ? (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: 'rgba(8,74,138,0.4)', fontSize: 13,
          textAlign: 'center', padding: 20, gap: 10,
        }}>
          <span style={{ fontSize: 48 }}>👤</span>
          <span>Adicione sua foto em<br /><strong>public/avatar.jpg</strong></span>
        </div>
      ) : (
        <img
          src="/avatar.jpg"
          alt="Bruno Chaves"
          onError={() => setImgError(true)}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
          }}
        />
      )}
    </div>
  )
}

const ROLES = [
  'Designer Gráfico',
  'Desenvolvedor Front-end',
  'UI Designer',
  'Especialista em Branding',
]

const STATS = [
  { val: '+20', lbl: 'Anos de experiência' },
  { val: '+8',  lbl: 'Empresas atendidas'  },
  { val: '2',   lbl: 'Países de atuação'   },
]

export default function Hero() {
  const [roleIdx,   setRoleIdx]   = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [typing,    setTyping]    = useState(true)
  const charIdx = useRef(0)

  /* ── Typewriter ── */
  useEffect(() => {
    const current = ROLES[roleIdx]
    let timeout
    if (typing) {
      if (charIdx.current < current.length) {
        timeout = setTimeout(() => {
          setDisplayed(current.slice(0, charIdx.current + 1))
          charIdx.current++
        }, 65)
      } else {
        timeout = setTimeout(() => setTyping(false), 1900)
      }
    } else {
      if (charIdx.current > 0) {
        timeout = setTimeout(() => {
          setDisplayed(current.slice(0, charIdx.current - 1))
          charIdx.current--
        }, 35)
      } else {
        setRoleIdx(i => (i + 1) % ROLES.length)
        setTyping(true)
      }
    }
    return () => clearTimeout(timeout)
  }, [displayed, typing, roleIdx])

  return (
    <section
      id="hero"
      style={{
        minHeight: '100vh',
        background: '#F2EBDF',
        display: 'flex',
        alignItems: 'center',
        padding: '88px 24px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Decorative blobs ── */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%',
        width: 480, height: 480, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(55,168,222,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} className="pulse-ring" />
      <div style={{
        position: 'absolute', bottom: '-8%', left: '-4%',
        width: 360, height: 360, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(8,74,138,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', animationDelay: '2s',
      }} className="pulse-ring" />

      {/* ── Grid ── */}
      <div style={{
        maxWidth: 1100, margin: '0 auto', width: '100%',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 48, alignItems: 'center',
      }} className="hero-grid">

        {/* ── LEFT — Text ── */}
        <div>
          {/* Badge */}
          <div
            className="fade-up"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', marginBottom: 24,
              background: 'rgba(55,168,222,0.1)',
              border: '1px solid rgba(55,168,222,0.3)',
              borderRadius: 999, fontSize: 13, color: '#37a8de',
            }}
          >
            <span style={{
              width: 7, height: 7, background: '#22c55e',
              borderRadius: '50%', display: 'inline-block',
              boxShadow: '0 0 6px #22c55e',
            }} />
            Disponível para oportunidades
          </div>

          {/* Name */}
          <h1
            className="fade-up"
            style={{
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: 900, lineHeight: 1.05,
              margin: '0 0 14px', letterSpacing: -2,
              color: '#084a8a',
              animationDelay: '0.1s',
            }}
          >
            Bruno{' '}
            <span className="gradient-text">Chaves</span>
          </h1>

          {/* Typewriter */}
          <div
            className="fade-up"
            style={{
              fontSize: 'clamp(16px, 2.5vw, 22px)',
              color: '#37a8de', fontWeight: 500,
              minHeight: 36, marginBottom: 18,
              animationDelay: '0.2s',
            }}
          >
            {displayed}
            <span className="blink" style={{ color: '#37a8de' }}>|</span>
          </div>

          {/* Tagline */}
          <p
            className="fade-up"
            style={{
              fontSize: 15, lineHeight: 1.75,
              color: 'rgba(8,74,138,0.65)',
              marginBottom: 32, maxWidth: 480,
              animationDelay: '0.3s',
            }}
          >
            +20 anos transformando ideias em experiências visuais impactantes.
            Do pixel ao código — design, desenvolvimento web e performance em um só profissional.
          </p>

          {/* CTAs */}
          <div
            className="fade-up"
            style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 44, animationDelay: '0.4s' }}
          >
            <a href="mailto:brunochavesuk@icloud.com" className="btn-primary">
              ✉ Enviar e-mail
            </a>
            <a href="https://linkedin.com/in/brunochavess" target="_blank" rel="noopener noreferrer" className="btn-ghost">
              💼 LinkedIn
            </a>
            <a href="https://behance.net/brunochavesdsg" target="_blank" rel="noopener noreferrer" className="btn-ghost">
              🎨 Behance
            </a>
          </div>

          {/* Stats */}
          <div
            className="fade-up"
            style={{ display: 'flex', gap: 40, animationDelay: '0.5s' }}
          >
            {STATS.map((s, i) => (
              <div key={s.lbl}>
                {i > 0 && (
                  <div style={{
                    position: 'absolute', left: 0, top: '15%', height: '70%',
                    width: 1, background: 'rgba(8,74,138,0.15)',
                  }} />
                )}
                <div style={{ position: 'relative' }}>
                  <div
                    className="gradient-text"
                    style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}
                  >
                    {s.val}
                  </div>
                  <div style={{ color: 'rgba(8,74,138,0.55)', fontSize: 12, marginTop: 5 }}>
                    {s.lbl}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT — Photo ── */}
        <div
          className="fade-up"
          style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            animationDelay: '0.3s',
          }}
        >
          <div className="float-photo" style={{ position: 'relative' }}>

            {/* Outer spinning ring */}
            <div
              className="spin-slow"
              style={{
                position: 'absolute',
                inset: -20,
                borderRadius: '50%',
                border: '2px dashed rgba(55,168,222,0.3)',
                pointerEvents: 'none',
              }}
            />

            {/* Inner glow ring */}
            <div style={{
              position: 'absolute', inset: -8,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(55,168,222,0.2), rgba(8,74,138,0.15))',
              pointerEvents: 'none',
            }} />

            {/* Photo — componente React com estado para fallback seguro */}
            <ProfilePhoto />

            {/* Dot decorations */}
            <div style={{
              position: 'absolute', top: 10, right: -16,
              width: 14, height: 14, borderRadius: '50%',
              background: '#37a8de',
              boxShadow: '0 0 0 4px rgba(55,168,222,0.2)',
            }} />
            <div style={{
              position: 'absolute', bottom: 24, left: -20,
              width: 10, height: 10, borderRadius: '50%',
              background: '#084a8a',
              boxShadow: '0 0 0 4px rgba(8,74,138,0.15)',
            }} />
          </div>
        </div>

      </div>

      {/* ── Scroll hint ── */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        <span style={{ color: 'rgba(8,74,138,0.35)', fontSize: 10, letterSpacing: 2 }}>SCROLL</span>
        <div style={{ width: 1, height: 30, background: 'linear-gradient(to bottom, #37a8de, transparent)' }} />
      </div>

      {/* Responsive: stack on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .hero-grid > div:last-child {
            order: -1;
          }
          .hero-grid a, .hero-grid div[style*="display: flex"] {
            justify-content: center;
          }
        }
      `}</style>
    </section>
  )
}
