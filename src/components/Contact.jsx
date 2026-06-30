'use client'
import Reveal from './Reveal'
import { useApp } from '../context/AppContext'

const WHATSAPP_URL = 'https://wa.me/5527997341557'

export default function Contact() {
  const { c, t } = useApp()
  const ct = t.contact

  return (
    <section id="contact" style={{ padding: '96px 24px', background: c.bg2, position: 'relative', overflow: 'hidden', transition: 'background 0.3s' }}>
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
          <span className="section-label">{ct.label}</span>
          <h2 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, margin: '12px 0 14px', letterSpacing: -1, color: c.primary }}>
            {ct.heading1}<br />
            <span className="gradient-text">{ct.heading2}</span>
          </h2>
          <p style={{ color: c.muted2, fontSize: 15, lineHeight: 1.7, marginBottom: 44 }}>
            {ct.text}
          </p>
        </Reveal>

        {/* Contact cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 36 }}>
          {ct.contacts.map((contact, i) => (
            <Reveal key={contact.label} delay={i * 70}>
              <a
                href={contact.href}
                target="_blank"
                rel="noopener noreferrer"
                className="card"
                style={{ padding: '18px 14px', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
              >
                <span style={{ fontSize: 26 }}>{contact.icon}</span>
                <span style={{ color: c.dim, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{contact.label}</span>
                <span style={{ color: c.primary, fontSize: 12, wordBreak: 'break-all', textAlign: 'center', fontWeight: 500 }}>{contact.val}</span>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={280}>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: 15, padding: '14px 32px' }}>
            {ct.button}
          </a>
        </Reveal>

      </div>
    </section>
  )
}
