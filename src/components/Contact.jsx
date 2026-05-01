import { personal } from '../data/resume'
import Reveal from './Reveal'

const CONTACTS = [
  { icon: '✉',  label: 'E-mail',   val: 'brunochavesuk@icloud.com',   href: 'mailto:brunochavesuk@icloud.com'         },
  { icon: '💼', label: 'LinkedIn', val: 'linkedin.com/in/brunochavess', href: 'https://linkedin.com/in/brunochavess'   },
  { icon: '🎨', label: 'Behance',  val: 'behance.net/brunochavesdsg',  href: 'https://behance.net/brunochavesdsg'      },
  { icon: '📞', label: 'Telefone', val: '(27) 9 9734-1557',            href: 'tel:+5527997341557'                     },
]

export default function Contact() {
  return (
    <section id="contact" style={{ padding: '96px 24px', background: '#EBE4D2', position: 'relative', overflow: 'hidden' }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(55,168,222,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>

        <Reveal>
          <span className="section-label">Contato</span>
          <h2 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, margin: '12px 0 14px', letterSpacing: -1, color: '#084a8a' }}>
            Vamos trabalhar<br />
            <span className="gradient-text">juntos?</span>
          </h2>
          <p style={{ color: 'rgba(8,74,138,0.6)', fontSize: 15, lineHeight: 1.7, marginBottom: 44 }}>
            Estou disponível para oportunidades CLT, PJ e freelas. Manda uma mensagem!
          </p>
        </Reveal>

        {/* Contact cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 36 }}>
          {CONTACTS.map((c, i) => (
            <Reveal key={c.label} delay={i * 70}>
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="card"
                style={{ padding: '18px 14px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
              >
                <span style={{ fontSize: 26 }}>{c.icon}</span>
                <span style={{ color: 'rgba(8,74,138,0.45)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{c.label}</span>
                <span style={{ color: '#084a8a', fontSize: 12, wordBreak: 'break-all', textAlign: 'center', fontWeight: 500 }}>{c.val}</span>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={280}>
          <a href={`mailto:${personal.email}`} className="btn-primary" style={{ fontSize: 15, padding: '14px 32px' }}>
            ✉ Enviar mensagem
          </a>
        </Reveal>

      </div>
    </section>
  )
}
