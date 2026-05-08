'use client'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Navbar from './Navbar'
import { POSTS } from '../data/conteudos'

/* ── design tokens compartilhados ── */
const PILLAR_STYLE = {
  Educação:   { bg: 'rgba(55,168,222,0.10)',  bd: 'rgba(55,168,222,0.28)',  txt: '#0884b4' },
  Autoridade: { bg: 'rgba(8,74,138,0.08)',    bd: 'rgba(8,74,138,0.18)',    txt: '#084a8a' },
  Conversão:  { bg: 'rgba(5,150,105,0.08)',   bd: 'rgba(5,150,105,0.20)',   txt: '#047857' },
  Conexão:    { bg: 'rgba(219,39,119,0.07)',  bd: 'rgba(219,39,119,0.20)', txt: '#be185d' },
}
const FORMAT_STYLE = {
  Reel:       { bg: 'rgba(219,39,119,0.08)', bd: 'rgba(219,39,119,0.22)', txt: '#be185d' },
  Carrossel:  { bg: 'rgba(8,74,138,0.07)',   bd: 'rgba(8,74,138,0.18)',   txt: '#084a8a' },
  'Arte / Foto': { bg: 'rgba(5,150,105,0.08)', bd: 'rgba(5,150,105,0.20)', txt: '#047857' },
}

function GradText({ children }) {
  return (
    <span style={{
      background: 'linear-gradient(135deg,#37a8de,#084a8a)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    }}>{children}</span>
  )
}

function Tag({ label, type }) {
  const s = type === 'pillar' ? (PILLAR_STYLE[label] || {}) : (FORMAT_STYLE[label] || {})
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
      padding: '3px 10px', borderRadius: 999,
      background: s.bg || 'rgba(0,0,0,0.05)',
      border: `1px solid ${s.bd || 'rgba(0,0,0,0.1)'}`,
      color: s.txt || '#333',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

/* ── Botão de copiar ── */
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={handle} style={{
      fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
      padding: '5px 14px', borderRadius: 8, cursor: 'pointer',
      background: copied ? 'rgba(5,150,105,0.12)' : 'rgba(55,168,222,0.08)',
      border: `1px solid ${copied ? 'rgba(5,150,105,0.3)' : 'rgba(55,168,222,0.25)'}`,
      color: copied ? '#047857' : '#0884b4',
      transition: 'all 0.2s',
    }}>
      {copied ? '✓ Copiado!' : 'Copiar'}
    </button>
  )
}

/* ── Seção interna do accordion ── */
function Section({ title, children, accent }) {
  const { c } = useApp()
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase',
        color: accent || c.accent, marginBottom: 12,
      }}>{title}</p>
      {children}
    </div>
  )
}

function ScriptBlock({ items }) {
  const { c } = useApp()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '130px 1fr', gap: 14,
          background: c.bg2, borderRadius: 10, padding: '14px 16px',
          border: `1px solid ${c.border}`,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
            color: c.accent, paddingTop: 2, lineHeight: 1.4,
          }}>{item.mark}</span>
          <p style={{ fontSize: 13, color: c.muted, margin: 0, lineHeight: 1.65, whiteSpace: 'pre-line' }}>
            {item.text}
          </p>
        </div>
      ))}
    </div>
  )
}

function TextBlock({ text, copyable = false }) {
  const { c } = useApp()
  return (
    <div style={{ position: 'relative' }}>
      <pre style={{
        fontFamily: 'inherit', fontSize: 13, color: c.muted,
        background: c.bg2, border: `1px solid ${c.border}`,
        borderRadius: 10, padding: '16px 16px',
        whiteSpace: 'pre-wrap', lineHeight: 1.7,
        margin: 0,
      }}>{text}</pre>
      {copyable && (
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <CopyBtn text={text} />
        </div>
      )}
    </div>
  )
}

function TipsList({ tips }) {
  const { c } = useApp()
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {tips.map((tip, i) => (
        <li key={i} style={{
          fontSize: 13, color: c.muted,
          padding: '8px 12px 8px 28px', position: 'relative',
          background: c.bg2, borderRadius: 8,
          border: `1px solid ${c.border}`, lineHeight: 1.55,
        }}>
          <span style={{ position: 'absolute', left: 10, color: c.accent }}>→</span>
          {tip}
        </li>
      ))}
    </ul>
  )
}

/* ── Item do accordion ── */
function PostAccordion({ post }) {
  const { c } = useApp()
  const [open, setOpen] = useState(false)
  const pillarStyle = PILLAR_STYLE[post.pillar] || {}

  return (
    <div style={{
      background: c.card,
      border: `1px solid ${open ? 'rgba(55,168,222,0.35)' : c.border}`,
      borderRadius: 16,
      overflow: 'hidden',
      transition: 'border-color 0.25s, box-shadow 0.25s',
      boxShadow: open ? '0 8px 32px rgba(8,74,138,0.08)' : 'none',
    }}>

      {/* ── HEADER (clicável) ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'flex-start',
          gap: 16, padding: '20px 24px',
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Número */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg,#37a8de,#084a8a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: 14,
        }}>
          {post.id}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            <Tag label={post.format} type="format" />
            <Tag label={post.pillar} type="pillar" />
            <span style={{ fontSize: 11, fontWeight: 600, color: c.muted, paddingTop: 3 }}>
              Semana {post.week} · {post.day}
            </span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: c.primary, margin: 0, lineHeight: 1.4 }}>
            {post.title}
          </p>
          {post.objective && !open && (
            <p style={{ fontSize: 12, color: c.muted, margin: '6px 0 0', lineHeight: 1.5,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {post.objective}
            </p>
          )}
        </div>

        {/* Chevron */}
        <div style={{
          fontSize: 18, color: c.accent, flexShrink: 0, paddingTop: 6,
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.25s',
        }}>
          ↓
        </div>
      </button>

      {/* ── CONTEÚDO EXPANDIDO ── */}
      {open && (
        <div style={{ padding: '0 24px 28px', borderTop: `1px solid ${c.border}`, paddingTop: 24 }}>

          {/* Objetivo */}
          <div style={{
            background: 'rgba(55,168,222,0.07)', border: '1px solid rgba(55,168,222,0.20)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 28,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: c.accent, marginBottom: 4 }}>Objetivo do post</p>
            <p style={{ fontSize: 13, color: c.primary, margin: 0, lineHeight: 1.6 }}>{post.objective}</p>
          </div>

          {/* Detalhes rápidos */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
            {post.duration && (
              <div style={{ background: c.bg2, border: `1px solid ${c.border}`, borderRadius: 8, padding: '8px 14px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: c.muted, margin: '0 0 2px', letterSpacing: 1, textTransform: 'uppercase' }}>Duração</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: c.primary, margin: 0 }}>{post.duration}</p>
              </div>
            )}
            {post.slides && (
              <div style={{ background: c.bg2, border: `1px solid ${c.border}`, borderRadius: 8, padding: '8px 14px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: c.muted, margin: '0 0 2px', letterSpacing: 1, textTransform: 'uppercase' }}>Slides</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: c.primary, margin: 0 }}>{post.slides} slides</p>
              </div>
            )}
          </div>

          {/* Roteiro */}
          <Section title={post.format === 'Carrossel' ? 'Roteiro · Slide a slide' : post.format === 'Arte / Foto' ? 'Orientações visuais' : 'Roteiro · Bloco a bloco'}>
            <ScriptBlock items={post.script} />
          </Section>

          {/* Legenda */}
          <Section title="Legenda completa" accent="#047857">
            <div style={{ position: 'relative', paddingRight: 0 }}>
              <TextBlock text={post.caption} copyable={true} />
            </div>
          </Section>

          {/* Hashtags */}
          <Section title="Hashtags" accent="#be185d">
            <div style={{ position: 'relative' }}>
              <TextBlock text={post.hashtags} copyable={true} />
            </div>
          </Section>

          {/* Dicas de produção */}
          <Section title="Dicas de produção" accent="#7c3aed">
            <TipsList tips={post.tips} />
          </Section>

        </div>
      )}
    </div>
  )
}

/* ── Filtro por semana ── */
function WeekFilter({ active, onChange }) {
  const { c } = useApp()
  const weeks = [0, 1, 2, 3, 4]
  const labels = { 0: 'Todos', 1: 'Semana 1', 2: 'Semana 2', 3: 'Semana 3', 4: 'Semana 4' }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {weeks.map(w => (
        <button key={w} onClick={() => onChange(w)} style={{
          fontSize: 12, fontWeight: 700, padding: '7px 18px',
          borderRadius: 999, cursor: 'pointer', transition: 'all 0.2s',
          background: active === w ? 'linear-gradient(135deg,#37a8de,#084a8a)' : c.card,
          color: active === w ? '#fff' : c.muted,
          border: `1px solid ${active === w ? 'transparent' : c.border}`,
        }}>
          {labels[w]}
        </button>
      ))}
    </div>
  )
}

/* ── Filtro por pilar ── */
function PillarFilter({ active, onChange }) {
  const { c } = useApp()
  const pillars = ['Todos', 'Educação', 'Autoridade', 'Conversão', 'Conexão']

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {pillars.map(p => {
        const s = PILLAR_STYLE[p] || {}
        const isActive = active === p
        return (
          <button key={p} onClick={() => onChange(p)} style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 0.5, padding: '6px 16px',
            borderRadius: 999, cursor: 'pointer', transition: 'all 0.2s',
            background: isActive ? (s.bg || c.bg2) : c.card,
            color: isActive ? (s.txt || c.primary) : c.muted,
            border: `1px solid ${isActive ? (s.bd || c.border) : c.border}`,
          }}>
            {p}
          </button>
        )
      })}
    </div>
  )
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function Conteudos() {
  const { c } = useApp()
  const [weekFilter, setWeekFilter] = useState(0)
  const [pillarFilter, setPillarFilter] = useState('Todos')
  const [openAll, setOpenAll] = useState(false)

  const filtered = POSTS.filter(p => {
    const okWeek   = weekFilter === 0 || p.week === weekFilter
    const okPillar = pillarFilter === 'Todos' || p.pillar === pillarFilter
    return okWeek && okPillar
  })

  const stats = {
    reels:      POSTS.filter(p => p.format === 'Reel').length,
    carrosseis: POSTS.filter(p => p.format === 'Carrossel').length,
    artes:      POSTS.filter(p => p.format === 'Arte / Foto').length,
  }

  return (
    <div style={{ background: c.bg1, color: c.primary, minHeight: '100vh', transition: 'background 0.3s, color 0.3s' }}>
      <Navbar />

      {/* ── HEADER ── */}
      <div style={{
        background: c.card, borderBottom: `1px solid ${c.border}`,
        padding: '100px 24px 56px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(55,168,222,0.10) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(8,74,138,0.07) 0%,transparent 70%)', pointerEvents: 'none' }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '6px 16px', borderRadius: 999,
          background: 'rgba(55,168,222,0.10)', border: '1px solid rgba(55,168,222,0.28)',
          fontSize: 12, fontWeight: 600, color: c.accent, letterSpacing: 0.5, marginBottom: 24,
        }}>
          <span style={{ width: 7, height: 7, background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 6px #22c55e' }} />
          Calendário Editorial · 30 dias · @obrunochaves
        </div>

        <h1 style={{ fontSize: 'clamp(34px,6vw,60px)', fontWeight: 900, letterSpacing: -2, lineHeight: 1.05, marginBottom: 16 }}>
          Roteiros de <GradText>conteúdo</GradText>
        </h1>
        <p style={{ fontSize: 16, color: c.muted, maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Roteiros completos, legendas prontas e dicas de produção para os 12 posts dos seus primeiros 30 dias.
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
          {[
            { val: '12', label: 'Posts planejados' },
            { val: stats.reels,      label: 'Reels' },
            { val: stats.carrosseis, label: 'Carrosséis' },
            { val: stats.artes,      label: 'Artes' },
            { val: '4',  label: 'Semanas' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 32, fontWeight: 900, letterSpacing: -1, lineHeight: 1,
                background: 'linear-gradient(135deg,#37a8de,#084a8a)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{s.val}</div>
              <div style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONTEÚDO ── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Filtros */}
        <div style={{
          background: c.card, border: `1px solid ${c.border}`,
          borderRadius: 16, padding: '20px 24px', marginBottom: 32,
        }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: c.muted, marginBottom: 10 }}>Filtrar por semana</p>
            <WeekFilter active={weekFilter} onChange={setWeekFilter} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: c.muted, marginBottom: 10 }}>Filtrar por pilar</p>
            <PillarFilter active={pillarFilter} onChange={setPillarFilter} />
          </div>
        </div>

        {/* Header da lista */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 14, color: c.muted, margin: 0 }}>
            <strong style={{ color: c.primary }}>{filtered.length}</strong> {filtered.length === 1 ? 'post encontrado' : 'posts encontrados'}
          </p>
          <a
            href="/estrategia"
            style={{
              fontSize: 12, fontWeight: 600, color: c.accent,
              textDecoration: 'none', padding: '6px 14px',
              borderRadius: 999, border: `1px solid ${c.border}`,
              background: c.card, transition: 'all 0.2s',
            }}
          >
            ← Ver estratégia completa
          </a>
        </div>

        {/* Lista de posts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(post => (
            <PostAccordion key={post.id} post={post} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: c.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p>Nenhum post encontrado com esses filtros.</p>
          </div>
        )}

      </div>

      {/* ── FOOTER ── */}
      <div style={{
        textAlign: 'center', padding: '48px 24px 40px',
        borderTop: `1px solid ${c.border}`, background: c.card,
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>
          <GradText>Bruno Chaves</GradText>
        </div>
        <p style={{ fontSize: 13, color: c.muted, marginBottom: 20 }}>Designer · Desenvolvedor Front-End · Serra, ES</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          {[
            { href: '/',             label: '← Portfólio' },
            { href: '/estrategia',   label: '📋 Estratégia' },
            { href: 'https://instagram.com/obrunochaves', label: '📸 @obrunochaves' },
          ].map(l => (
            <a key={l.href} href={l.href} style={{
              fontSize: 12, fontWeight: 600, color: c.muted, textDecoration: 'none',
              padding: '6px 16px', borderRadius: 999,
              border: `1px solid ${c.border}`, background: c.bg1, transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.color = c.accent; e.currentTarget.style.borderColor = 'rgba(55,168,222,0.4)' }}
            onMouseOut={e => { e.currentTarget.style.color = c.muted; e.currentTarget.style.borderColor = c.border }}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
