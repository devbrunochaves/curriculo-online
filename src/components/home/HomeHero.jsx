import { motion } from 'framer-motion'
import { useRouter } from '../../hooks/useRouter'
import { hc, ease, fadeUp, staggerChildren } from '../../data/homeColors'
import { WHATSAPP_URL, STATS } from '../../data/homeData'

const PILLS = [
  { icon: '🎨', label: 'Identidade Visual' },
  { icon: '🌐', label: 'Sites & Landing Pages' },
  { icon: '📍', label: 'Google Meu Negócio' },
  { icon: '📱', label: 'Posts para Social' },
]

export default function HomeHero() {
  const { navigate } = useRouter()

  const s = {
    section: {
      minHeight: '100vh',
      display: 'flex', alignItems: 'center',
      padding: '120px 32px 80px',
      background: hc.bg,
      position: 'relative', overflow: 'hidden',
    },
    blob1: {
      position: 'absolute', width: 700, height: 700, borderRadius: '50%',
      background: `radial-gradient(circle, rgba(55,168,222,0.13) 0%, transparent 70%)`,
      top: -100, right: -200, pointerEvents: 'none',
    },
    blob2: {
      position: 'absolute', width: 400, height: 400, borderRadius: '50%',
      background: `radial-gradient(circle, rgba(8,74,138,0.08) 0%, transparent 70%)`,
      bottom: 0, left: -100, pointerEvents: 'none',
    },
    grid: {
      maxWidth: 1140, margin: '0 auto', width: '100%',
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: 80, alignItems: 'center',
    },
    badge: {
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: 'rgba(55,168,222,0.12)',
      border: '1px solid rgba(55,168,222,0.25)',
      borderRadius: 100, padding: '6px 16px',
      fontSize: 12, fontWeight: 600, color: hc.accent,
      marginBottom: 24,
    },
    badgeDot: {
      width: 7, height: 7, borderRadius: '50%', background: hc.accent,
    },
    h1: {
      fontSize: 'clamp(38px, 5vw, 62px)',
      fontWeight: 900, lineHeight: 1.08,
      color: hc.dark, margin: '0 0 16px',
    },
    highlight: {
      background: `linear-gradient(135deg, ${hc.accent}, ${hc.blue})`,
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    sub: {
      fontSize: 18, color: hc.muted, lineHeight: 1.7,
      marginBottom: 40, maxWidth: 480,
    },
    ctas: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 52 },
    btnPrimary: {
      background: `linear-gradient(135deg, ${hc.accent}, ${hc.blue})`,
      color: '#fff', border: 'none', borderRadius: 14,
      padding: '15px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
      boxShadow: '0 8px 24px rgba(55,168,222,0.30)',
      textDecoration: 'none', display: 'inline-block',
    },
    btnSecondary: {
      background: 'transparent', color: hc.blue,
      border: `1.5px solid rgba(8,74,138,0.25)`, borderRadius: 14,
      padding: '14px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
      textDecoration: 'none', display: 'inline-block',
    },
    stats: { display: 'flex', gap: 32, alignItems: 'center' },
    divider: { width: 1, height: 36, background: hc.border },
    statVal: { fontSize: 28, fontWeight: 900, color: hc.blue },
    statLbl: { fontSize: 13, color: hc.muted, marginTop: 2 },
    // Card visual
    cardWrap: { position: 'relative', display: 'flex', justifyContent: 'center' },
    card: {
      background: hc.white, borderRadius: 24,
      padding: 32, width: '100%', maxWidth: 400,
      boxShadow: '0 32px 80px rgba(8,74,138,0.12)',
    },
    cardHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
    avatar: {
      width: 46, height: 46, borderRadius: 12,
      background: `linear-gradient(135deg, ${hc.accent}, ${hc.blue})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 900, fontSize: 16, flexShrink: 0,
    },
    cardName: { fontWeight: 700, fontSize: 15, color: hc.dark },
    cardRole: { fontSize: 12, color: hc.muted },
    pillsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 },
    pill: {
      background: hc.bg, borderRadius: 10, padding: '10px 12px',
      fontSize: 12, fontWeight: 600, color: hc.blue,
      display: 'flex', alignItems: 'center', gap: 7,
    },
    pillIcon: {
      width: 24, height: 24, borderRadius: 6,
      background: 'rgba(55,168,222,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13,
    },
    cardCta: {
      background: `linear-gradient(135deg, ${hc.accent}, ${hc.blue})`,
      color: '#fff', border: 'none', borderRadius: 12,
      padding: 13, width: '100%', fontSize: 14, fontWeight: 700,
      cursor: 'pointer',
    },
    badge1: {
      position: 'absolute', top: -16, right: -10,
      background: '#fff', borderRadius: 14, padding: '10px 16px',
      boxShadow: '0 8px 32px rgba(8,74,138,0.14)',
      fontSize: 12, fontWeight: 700, color: hc.blue,
      display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
    },
    badge2: {
      position: 'absolute', bottom: 24, left: -16,
      background: '#fff', borderRadius: 14, padding: '10px 16px',
      boxShadow: '0 8px 32px rgba(8,74,138,0.14)',
      fontSize: 12, fontWeight: 600, color: hc.muted,
      display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
    },
  }

  return (
    <section style={s.section} id="inicio">
      <div style={s.blob1} />
      <div style={s.blob2} />
      <div style={s.grid} className="home-hero-grid">

        {/* Left: copy */}
        <motion.div
          variants={staggerChildren(0.12)}
          initial="hidden"
          animate="visible"
        >
          <motion.div style={s.badge} variants={fadeUp}>
            <motion.div
              style={s.badgeDot}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            Disponível para novos projetos
          </motion.div>

          <motion.h1 style={s.h1} variants={fadeUp}>
            Design que<br />
            <span style={s.highlight}>gera resultado</span><br />
            de verdade.
          </motion.h1>

          <motion.p style={s.sub} variants={fadeUp}>
            Identidade visual, sites, Google Meu Negócio e muito mais —
            para pequenas e médias empresas que querem crescer online com profissionalismo.
          </motion.p>

          <motion.div style={s.ctas} variants={fadeUp}>
            <motion.button
              style={s.btnPrimary}
              onClick={() => navigate('/briefing')}
              whileHover={{ scale: 1.04, boxShadow: '0 12px 32px rgba(55,168,222,0.42)' }}
              whileTap={{ scale: 0.97 }}
            >
              Preencher briefing grátis →
            </motion.button>
            <motion.a
              href="#portfolio" style={s.btnSecondary}
              whileHover={{ borderColor: hc.blue, background: 'rgba(8,74,138,0.05)' }}
              whileTap={{ scale: 0.97 }}
            >
              Ver portfólio
            </motion.a>
          </motion.div>

          <motion.div style={s.stats} variants={fadeUp}>
            {STATS.map((st, i) => (
              <>
                {i > 0 && <div key={`div-${i}`} style={s.divider} />}
                <div key={st.val}>
                  <div style={s.statVal}>{st.val}</div>
                  <div style={s.statLbl}>{st.lbl}</div>
                </div>
              </>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: card */}
        <motion.div
          style={s.cardWrap}
          className="home-hero-visual"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3, ease }}
        >
          <motion.div
            style={s.card}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div style={s.cardHeader}>
              <div style={s.avatar}>BC</div>
              <div>
                <div style={s.cardName}>Bruno Chaves</div>
                <div style={s.cardRole}>Designer & Desenvolvedor</div>
              </div>
            </div>

            <div style={s.pillsGrid}>
              {PILLS.map(p => (
                <div key={p.label} style={s.pill}>
                  <div style={s.pillIcon}>{p.icon}</div>
                  {p.label}
                </div>
              ))}
            </div>

            <motion.button
              style={s.cardCta}
              onClick={() => navigate('/briefing')}
              whileHover={{ opacity: 0.88 }}
              whileTap={{ scale: 0.98 }}
            >
              Solicitar briefing grátis →
            </motion.button>
          </motion.div>

          {/* Floating badges */}
          <motion.div
            style={s.badge1}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.6, ease }}
          >
            ⭐ 5.0 · Avaliação dos clientes
          </motion.div>

          <motion.div
            style={s.badge2}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0, duration: 0.6, ease }}
          >
            ✅ Entrega em até 15 dias úteis
          </motion.div>
        </motion.div>

      </div>

      <style>{`
        @media (max-width: 860px) {
          .home-hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .home-hero-visual { order: -1; }
        }
      `}</style>
    </section>
  )
}
