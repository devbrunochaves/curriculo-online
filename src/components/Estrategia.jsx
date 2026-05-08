'use client'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Navbar from './Navbar'
import { POSTS } from '../data/conteudos'

const WEEK_THEMES = {
  1: 'Reapresentação — quem é Bruno Chaves hoje',
  2: 'Tutorial — mostre o que você sabe fazer',
  3: 'Case + Conversão — resultado real gera confiança',
  4: 'Opinião forte — 20 anos te dão credibilidade pra isso',
}

/* ── helpers ── */
function SecLabel({ children }) {
  const { c } = useApp()
  return (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: c.accent, marginBottom: 10 }}>
      {children}
    </p>
  )
}

function Divider() {
  return (
    <div style={{
      width: 48, height: 3,
      background: 'linear-gradient(135deg,#37a8de,#084a8a)',
      borderRadius: 99, margin: '14px 0 32px',
    }} />
  )
}

function GradText({ children }) {
  return (
    <span style={{
      background: 'linear-gradient(135deg,#37a8de,#084a8a)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    }}>
      {children}
    </span>
  )
}

function Card({ children, hover = true, style = {} }) {
  const { c } = useApp()
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: c.card,
        border: `1px solid ${hovered ? 'rgba(55,168,222,0.35)' : c.border}`,
        borderRadius: 16,
        padding: 24,
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? `0 12px 32px rgba(8,74,138,0.09)` : 'none',
        transition: 'border-color 0.3s, transform 0.3s, box-shadow 0.3s',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function Pill({ children, color = 'blue' }) {
  const { c } = useApp()
  const styles = {
    blue:  { bg: 'rgba(8,74,138,0.08)',   bd: 'rgba(8,74,138,0.18)',   txt: '#084a8a' },
    cyan:  { bg: 'rgba(55,168,222,0.10)', bd: 'rgba(55,168,222,0.28)', txt: '#0884b4' },
    green: { bg: 'rgba(5,150,105,0.08)',  bd: 'rgba(5,150,105,0.20)',  txt: '#047857' },
    pink:  { bg: 'rgba(219,39,119,0.07)', bd: 'rgba(219,39,119,0.20)', txt: '#be185d' },
  }
  const s = styles[color]
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 12px', borderRadius: 999,
      fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
      background: s.bg, border: `1px solid ${s.bd}`, color: s.txt,
      marginBottom: 12,
    }}>
      {children}
    </span>
  )
}

function InfoBox({ children }) {
  const { c } = useApp()
  return (
    <div style={{
      background: 'rgba(55,168,222,0.07)',
      border: '1px solid rgba(55,168,222,0.22)',
      borderRadius: 12, padding: '18px 20px',
      fontSize: 13, color: c.primary, lineHeight: 1.65,
      marginTop: 20,
    }}>
      {children}
    </div>
  )
}

function HeroPhrase({ children, sub }) {
  const { c } = useApp()
  return (
    <div style={{
      background: c.card,
      border: `1px solid ${c.border}`,
      borderRadius: 20, padding: 36,
      textAlign: 'center', margin: '32px 0',
      boxShadow: `0 8px 32px rgba(8,74,138,0.07)`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(135deg,#37a8de,#084a8a)',
      }} />
      <div style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.35 }}>
        {children}
      </div>
      {sub && <p style={{ fontSize: 13, color: c.muted, marginTop: 12, marginBottom: 0 }}>{sub}</p>}
    </div>
  )
}

/* ── Post accordion ── */
const FMT = {
  'Reel':       { bg: 'rgba(219,39,119,0.08)', bd: 'rgba(219,39,119,0.20)', txt: '#be185d' },
  'Carrossel':  { bg: 'rgba(8,74,138,0.07)',   bd: 'rgba(8,74,138,0.18)',   txt: '#084a8a' },
  'Arte / Foto':{ bg: 'rgba(5,150,105,0.08)',  bd: 'rgba(5,150,105,0.20)',  txt: '#047857' },
}
const PILLAR_CLR = { Educação: '#0884b4', Autoridade: '#084a8a', Conversão: '#047857', Conexão: '#be185d' }

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
      fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
      padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
      background: copied ? 'rgba(5,150,105,0.12)' : 'rgba(55,168,222,0.08)',
      border: `1px solid ${copied ? 'rgba(5,150,105,0.3)' : 'rgba(55,168,222,0.25)'}`,
      color: copied ? '#047857' : '#0884b4',
      transition: 'all 0.2s', flexShrink: 0,
    }}>
      {copied ? '✓ Copiado!' : 'Copiar'}
    </button>
  )
}

function PostAccordion({ post }) {
  const { c } = useApp()
  const [open, setOpen] = useState(false)
  const f = FMT[post.format] || FMT['Reel']

  return (
    <div style={{
      background: c.card,
      border: `1px solid ${open ? 'rgba(55,168,222,0.35)' : c.border}`,
      borderRadius: 14,
      overflow: 'hidden',
      transition: 'border-color 0.25s, box-shadow 0.25s',
      boxShadow: open ? '0 8px 28px rgba(8,74,138,0.08)' : 'none',
    }}>

      {/* Header clicável */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'grid',
        gridTemplateColumns: '70px 95px 1fr 28px',
        gap: 14, alignItems: 'start',
        padding: '16px 20px', background: 'none', border: 'none',
        cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: c.muted, paddingTop: 3 }}>
          {post.day.replace('-feira', '')}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
          padding: '4px 8px', borderRadius: 7, textAlign: 'center',
          background: f.bg, border: `1px solid ${f.bd}`, color: f.txt, alignSelf: 'start',
        }}>{post.format}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: c.primary }}>
            {post.title}
          </div>
          <div style={{ fontSize: 12, color: c.muted, lineHeight: 1.5 }}>
            {post.objective}
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            color: PILLAR_CLR[post.pillar], display: 'block', marginTop: 6 }}>
            ● {post.pillar}
          </span>
        </div>
        <span style={{
          fontSize: 16, color: c.accent, paddingTop: 4, alignSelf: 'start',
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s',
          display: 'flex', justifyContent: 'center',
        }}>↓</span>
      </button>

      {/* Conteúdo expandido */}
      {open && (
        <div style={{ padding: '0 20px 24px', borderTop: `1px solid ${c.border}`, paddingTop: 20 }}>

          {/* Roteiro */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: c.accent, marginBottom: 10 }}>
            {post.format === 'Carrossel' ? 'Roteiro · Slide a slide' : post.format === 'Arte / Foto' ? 'Orientações visuais' : 'Roteiro · Bloco a bloco'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {post.script.map((item, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12,
                background: c.bg2, borderRadius: 9, padding: '12px 14px',
                border: `1px solid ${c.border}`,
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: c.accent, lineHeight: 1.5 }}>
                  {item.mark}
                </span>
                <p style={{ fontSize: 12, color: c.muted, margin: 0, lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          {/* Legenda */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: '#047857', marginBottom: 8 }}>
            Legenda completa
          </p>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <pre style={{
              fontFamily: 'inherit', fontSize: 12, color: c.muted,
              background: c.bg2, border: `1px solid ${c.border}`,
              borderRadius: 9, padding: '14px 14px 14px 14px',
              whiteSpace: 'pre-wrap', lineHeight: 1.7, margin: 0,
            }}>{post.caption}</pre>
            <div style={{ position: 'absolute', top: 10, right: 10 }}>
              <CopyBtn text={post.caption} />
            </div>
          </div>

          {/* Hashtags */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: '#be185d', marginBottom: 8 }}>
            Hashtags
          </p>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <pre style={{
              fontFamily: 'inherit', fontSize: 12, color: c.muted,
              background: c.bg2, border: `1px solid ${c.border}`,
              borderRadius: 9, padding: '12px 14px',
              whiteSpace: 'pre-wrap', lineHeight: 1.7, margin: 0,
            }}>{post.hashtags}</pre>
            <div style={{ position: 'absolute', top: 10, right: 10 }}>
              <CopyBtn text={post.hashtags} />
            </div>
          </div>

          {/* Dicas de produção */}
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase', color: '#7c3aed', marginBottom: 8 }}>
            Dicas de produção
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {post.tips.map((tip, i) => (
              <li key={i} style={{
                fontSize: 12, color: c.muted,
                padding: '8px 12px 8px 26px', position: 'relative',
                background: c.bg2, borderRadius: 8,
                border: `1px solid ${c.border}`, lineHeight: 1.55,
              }}>
                <span style={{ position: 'absolute', left: 10, color: c.accent }}>→</span>
                {tip}
              </li>
            ))}
          </ul>

        </div>
      )}
    </div>
  )
}

function WeekBlock({ weekNum }) {
  const { c } = useApp()
  const posts = POSTS.filter(p => p.week === weekNum)
  const theme = WEEK_THEMES[weekNum]
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: c.accent, whiteSpace: 'nowrap' }}>
          Semana {weekNum}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: c.primary }}>{theme}</span>
        <div style={{ flex: 1, height: 1, background: c.border }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {posts.map(post => <PostAccordion key={post.id} post={post} />)}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function Estrategia() {
  const { c } = useApp()

  const h2Style = {
    fontSize: 'clamp(26px,4vw,38px)',
    fontWeight: 800,
    letterSpacing: -1,
    lineHeight: 1.15,
    color: c.primary,
    marginBottom: 16,
  }

  const descStyle = {
    fontSize: 15,
    color: c.muted,
    lineHeight: 1.75,
    marginBottom: 32,
    maxWidth: 640,
  }

  const navLinks = [
    { href: '#posicionamento', label: 'Posicionamento' },
    { href: '#publico',        label: 'Público'        },
    { href: '#pilares',        label: 'Pilares'        },
    { href: '#plataformas',    label: 'Plataformas'    },
    { href: '#calendario',     label: '30 Dias'        },
    { href: '#producao',       label: 'Produção'       },
    { href: '#metricas',       label: 'Métricas'       },
  ]

  return (
    <div style={{ background: c.bg1, color: c.primary, minHeight: '100vh', transition: 'background 0.3s, color 0.3s' }}>
      <Navbar />

      {/* ── PAGE HEADER ── */}
      <div style={{
        background: c.card,
        borderBottom: `1px solid ${c.border}`,
        padding: '100px 24px 56px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* blob decorations */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(55,168,222,0.10) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(8,74,138,0.07) 0%,transparent 70%)', pointerEvents: 'none' }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '6px 16px', borderRadius: 999,
          background: 'rgba(55,168,222,0.10)', border: '1px solid rgba(55,168,222,0.28)',
          fontSize: 12, fontWeight: 600, color: c.accent, letterSpacing: 0.5,
          marginBottom: 24,
        }}>
          <span style={{ width: 7, height: 7, background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 6px #22c55e' }} />
          Estratégia Digital · Bruno Chaves · 2026
        </div>

        <h1 style={{ fontSize: 'clamp(36px,7vw,64px)', fontWeight: 900, letterSpacing: -2, lineHeight: 1.05, marginBottom: 16 }}>
          Meu plano de{' '}
          <GradText>crescimento digital</GradText>
        </h1>
        <p style={{ fontSize: 16, color: c.muted, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          Estratégia completa para construir autoridade, audiência qualificada e novos clientes — aproveitando 20 anos de experiência como principal diferencial.
        </p>
      </div>

      {/* ── SECTION NAV ── */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
        padding: '14px 24px',
        background: c.bg2,
        borderBottom: `1px solid ${c.border}`,
        position: 'sticky', top: 68, zIndex: 40,
      }}>
        {navLinks.map(l => (
          <a key={l.href} href={l.href} style={{
            fontSize: 12, fontWeight: 600, color: c.muted,
            textDecoration: 'none', padding: '6px 16px',
            borderRadius: 999, border: `1px solid ${c.border}`,
            background: c.card, transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.color = c.accent; e.currentTarget.style.borderColor = 'rgba(55,168,222,0.4)' }}
          onMouseOut={e => { e.currentTarget.style.color = c.muted; e.currentTarget.style.borderColor = c.border }}
          >
            {l.label}
          </a>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '72px 24px' }}>

        {/* 01 — POSICIONAMENTO */}
        <section id="posicionamento" style={{ marginBottom: 80 }}>
          <SecLabel>01 — Posicionamento</SecLabel>
          <h2 style={h2Style}>Quem é o <GradText>Bruno Chaves</GradText> para o mercado</h2>
          <Divider />
          <p style={descStyle}>
            Você não compete com outros designers. Você compete com agências inteiras — porque entrega o que normalmente exige uma equipe: estratégia, design e código. Em 20 anos, você viu o que funciona e o que quebra um projeto.{' '}
            <strong style={{ color: c.primary }}>Esse é o diferencial que precisa aparecer em cada post.</strong>
          </p>
          <HeroPhrase sub="Frase central de posicionamento — use na bio, stories, apresentações e pitches.">
            "Design que você vê.<br/>
            Código que você sente.<br/>
            <GradText>Resultado que aparece no caixa.</GradText>"
          </HeroPhrase>
          <p style={{ ...descStyle, marginTop: 24 }}>
            Seu concorrente é o freelancer genérico que "faz um logo no Canva". Seu cliente ideal percebe a diferença quando você mostra processo, profundidade e resultado real.{' '}
            <strong style={{ color: c.primary }}>O conteúdo é a prova de que você é diferente.</strong>
          </p>
        </section>

        {/* 02 — PÚBLICO */}
        <section id="publico" style={{ marginBottom: 80 }}>
          <SecLabel>02 — Público</SecLabel>
          <h2 style={h2Style}>Dois públicos, <GradText>uma estratégia</GradText></h2>
          <Divider />
          <p style={descStyle}>
            Você quer atrair designers E empresários — e isso tem uma lógica poderosa: os designers validam sua autoridade e recomendam você para os clientes deles. Os empresários chegam no seu perfil, veem uma comunidade te respeitando, e confiam mais.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 20 }}>
            <Card>
              <Pill color="blue">🎨 Designers</Pill>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Por que te seguem</h3>
              <p style={{ fontSize: 13, color: c.muted, margin: 0, lineHeight: 1.65 }}>
                Tutoriais, dicas de processo, ferramentas, como precificar, carreira. Consomem conteúdo educacional e de inspiração. São o público de <strong style={{ color: c.primary }}>crescimento de audiência</strong>.
              </p>
            </Card>
            <Card>
              <Pill color="cyan">💼 Empresários</Pill>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Por que te contratam</h3>
              <p style={{ fontSize: 13, color: c.muted, margin: 0, lineHeight: 1.65 }}>
                Não sabem de design — mas sabem de resultado. Fale em vendas, conversão, autoridade de marca. São o público de <strong style={{ color: c.primary }}>geração de receita</strong>.
              </p>
            </Card>
          </div>
          <InfoBox>
            💡 <strong>A chave:</strong> o mesmo post serve para os dois. Um tutorial de "como criar uma landing page que converte" educa o designer e convence o empresário de que você sabe o que está fazendo.
          </InfoBox>
        </section>

        {/* 03 — PILARES */}
        <section id="pilares" style={{ marginBottom: 80 }}>
          <SecLabel>03 — Pilares de Conteúdo</SecLabel>
          <h2 style={h2Style}>Os 4 pilares do seu <GradText>conteúdo</GradText></h2>
          <Divider />
          <p style={descStyle}>Cada post pertence a um desses pilares. Isso garante variedade sem perder foco — e elimina o bloqueio de "sobre o que vou postar hoje?"</p>

          {[
            {
              color: 'cyan', icon: '🎓', num: 'Pilar 1', title: 'Educação',
              sub: 'Para designers evoluírem — cresce a audiência',
              items: ['Tutoriais de Figma, CSS, design de UI','Erros que 90% dos designers cometem','Como montar um portfólio que vende','Ferramentas que uso no dia a dia','Como precificar seu trabalho','Design + código na prática'],
            },
            {
              color: 'blue', icon: '🏆', num: 'Pilar 2', title: 'Autoridade',
              sub: '20 anos de mercado em conteúdo — cria credibilidade',
              items: ['Bastidores de projetos reais','Cases com antes e depois','"O que 20 anos me ensinaram sobre X"','Opiniões fortes sobre o mercado','Desmistificando mitos do design','Processo criativo real, sem filtro'],
            },
            {
              color: 'green', icon: '💰', num: 'Pilar 3', title: 'Conversão',
              sub: 'Para empresários virarem clientes — gera receita',
              items: ['Por que seu site não está vendendo','O que separa uma marca que converte','Checklist: sua marca está pronta pro digital?','Quanto custa não investir em design','Cases de clientes com resultados','CTAs diretos para seu portfólio'],
            },
            {
              color: 'pink', icon: '🤝', num: 'Pilar 4', title: 'Conexão',
              sub: 'Humaniza e retém a audiência — cria confiança',
              items: ['Sua história: 20 anos de mercado','Dia a dia de designer + desenvolvedor','Setup, ferramentas, rotina criativa','Opiniões sobre o mercado criativo','Erros que você mesmo cometeu (e aprendeu)','Bastidores de projetos pessoais'],
            },
          ].map(p => (
            <Card key={p.num} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <Pill color={p.color}>{p.num}</Pill>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: c.primary }}>{p.title}</h3>
                  <p style={{ fontSize: 12, color: c.muted, marginBottom: 12 }}>{p.sub}</p>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {p.items.map((item, i) => (
                      <li key={i} style={{
                        fontSize: 13, color: c.muted, padding: '5px 0 5px 18px',
                        position: 'relative',
                        borderBottom: i < p.items.length - 1 ? `1px solid ${c.border}` : 'none',
                      }}>
                        <span style={{ position: 'absolute', left: 0, color: c.accent, fontSize: 11 }}>→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </section>

        {/* 04 — PLATAFORMAS */}
        <section id="plataformas" style={{ marginBottom: 80 }}>
          <SecLabel>04 — Plataformas</SecLabel>
          <h2 style={h2Style}>Onde e como <GradText>aparecer</GradText></h2>
          <Divider />
          <p style={descStyle}>Com 4–8 horas por semana, você não pode estar em todo lugar. Priorize onde o retorno é maior e escale conforme a consistência chegar.</p>

          {[
            { icon: '📸', name: 'Instagram', badge: 'Prioridade 1', badgeColor: 'rgba(55,168,222,0.12)', badgeTxt: '#0884b4', desc: 'Reels para crescer (algoritmo distribui para não-seguidores). Carrosséis para salvar e compartilhar — autoridade e educação. Stories diários de 3–5 min, sem roteiro — bastidores, opinião, processo. Meta: 4 posts/semana + stories todo dia.' },
            { icon: '▶️', name: 'YouTube', badge: 'A partir do mês 2', badgeColor: 'rgba(8,74,138,0.07)', badgeTxt: c.muted, desc: '1 vídeo a cada 2 semanas para começar. Tutoriais longos (10–20 min), cases completos, vlogs de processo. Os Reels do Instagram viram Shorts automaticamente — cria uma vez, distribui em dois canais. YouTube gera tráfego de longo prazo via SEO.' },
            { icon: '💼', name: 'LinkedIn', badge: 'Fase futura', badgeColor: 'rgba(8,74,138,0.07)', badgeTxt: c.muted, desc: 'Ideal para atrair empresários e clientes B2B. Reposte os cases e posts de conversão que já performaram no Instagram. Mínimo esforço extra, alcance em audiência totalmente diferente. Começar no mês 3 ou 4.' },
          ].map(p => (
            <Card key={p.name} style={{ marginBottom: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: 16, alignItems: 'start' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, background: c.bg2, border: `1px solid ${c.border}`, flexShrink: 0 }}>
                  {p.icon}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{p.name}</h3>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 6, background: p.badgeColor, color: p.badgeTxt }}>
                      {p.badge}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: c.muted, margin: 0, lineHeight: 1.6 }}>{p.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </section>

        {/* 05 — CALENDÁRIO */}
        <section id="calendario" style={{ marginBottom: 80 }}>
          <SecLabel>05 — Calendário Editorial</SecLabel>
          <h2 style={h2Style}>Seus primeiros <GradText>30 dias</GradText></h2>
          <Divider />
          <p style={descStyle}>
            Post planejado é post publicado. A meta não é perfeição — é presença consistente.{' '}
            <strong style={{ color: c.primary }}>Bom e publicado vale mais que perfeito na gaveta.</strong>
          </p>

          <WeekBlock weekNum={1} />
          <WeekBlock weekNum={2} />
          <WeekBlock weekNum={3} />
          <WeekBlock weekNum={4} />
        </section>

        {/* 06 — PRODUÇÃO */}
        <section id="producao" style={{ marginBottom: 80 }}>
          <SecLabel>06 — Dicas de Produção</SecLabel>
          <h2 style={h2Style}>Produzir <GradText>rápido</GradText> sem perder qualidade</h2>
          <Divider />
          <p style={descStyle}>Com 4–8 horas por semana, você precisa de um sistema. Aqui está o que funciona na prática:</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            {[
              { icon: '📅', title: 'Bloco semanal de gravação', desc: 'Reserve 1 dia (ex: segunda) para gravar tudo de uma vez. Mude só a camiseta entre os vídeos. Grave 3–4 Reels em 2 horas e agende para a semana toda.' },
              { icon: '✍️', title: 'Legenda antes do vídeo', desc: 'Escreva a legenda/roteiro antes de gravar. Com o texto na cabeça, o vídeo sai mais fluido. Legenda é o SEO do Instagram — capriche nas primeiras 3 linhas.' },
              { icon: '♻️', title: 'Reaproveitamento de conteúdo', desc: '1 tutorial longo no YouTube → corte em 3 Reels → carrossel com os pontos → Story de opinião. Um conteúdo bem feito vira 5 ou mais peças.' },
              { icon: '📱', title: 'Stories: sem pressão', desc: 'Stories todo dia não precisam ser produzidos. Abra a câmera, fale 30 segundos sobre o que você está trabalhando. Presença consistente bate perfeição isolada.' },
              { icon: '🎨', title: 'Template de carrossel', desc: 'Crie um template no Figma (você faz isso em 20 min) e reutilize sempre. Visual consistente = identidade forte. Só troque o conteúdo.' },
              { icon: '🏷️', title: 'Áudio e hashtags', desc: 'Use áudios em alta nos Reels — o algoritmo favorece. Hashtags: 3–5 específicas (#designerbrasileiro, #webdesign, #figma) + 1 ou 2 amplas.' },
            ].map(t => (
              <Card key={t.title}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>{t.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: c.primary }}>{t.title}</h3>
                <p style={{ fontSize: 13, color: c.muted, margin: 0, lineHeight: 1.6 }}>{t.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* 07 — MÉTRICAS */}
        <section id="metricas" style={{ marginBottom: 80 }}>
          <SecLabel>07 — Métricas</SecLabel>
          <h2 style={h2Style}>O que <GradText>medir</GradText> nos primeiros 90 dias</h2>
          <Divider />
          <p style={descStyle}>Não obsede com seguidores no começo. O que importa primeiro é entender o que ressoa com o seu público — e replicar o que funciona.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { val: '500', label: 'Seguidores ao fim do mês 1\n(meta inicial realista)' },
              { val: '5%',  label: 'Taxa de engajamento mínima\n(curtidas + saves + comentários)' },
              { val: '1k',  label: 'Seguidores em 90 dias\n(com 4 posts/semana consistentes)' },
            ].map(m => (
              <Card key={m.val} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: -2, lineHeight: 1, marginBottom: 10 }}>
                  <GradText>{m.val}</GradText>
                </div>
                <div style={{ fontSize: 12, color: c.muted, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{m.label}</div>
              </Card>
            ))}
          </div>

          <InfoBox>
            As métricas que importam <strong>mais que seguidores</strong>: <strong>salvamentos</strong> (indica conteúdo de valor real), <strong>compartilhamentos</strong> (alcance orgânico gratuito) e <strong>cliques no link da bio</strong> (intenção de contratar). Acompanhe semanalmente pelo Instagram Insights.
          </InfoBox>

          <HeroPhrase sub="Regra número 1 do crescimento orgânico. Publique. Aprenda. Ajuste. Repita.">
            "A consistência por 90 dias vale mais<br/>
            do que o post perfeito que você<br/>
            <GradText>nunca publicou.</GradText>"
          </HeroPhrase>
        </section>

      </div>

      {/* ── FOOTER ── */}
      <div style={{
        textAlign: 'center',
        padding: '56px 24px 40px',
        borderTop: `1px solid ${c.border}`,
        background: c.card,
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>
          <GradText>Bruno Chaves</GradText>
        </div>
        <p style={{ fontSize: 13, color: c.muted, marginBottom: 20 }}>Designer · Desenvolvedor Front-End · Serra, ES</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { href: 'mailto:brunochavesuk@icloud.com', label: '✉️ E-mail' },
            { href: 'https://linkedin.com/in/brunochavess', label: '💼 LinkedIn' },
            { href: 'https://behance.net/brunochavesdsg', label: '🎨 Behance' },
            { href: 'https://instagram.com/obrunochaves', label: '📸 @obrunochaves' },
            { href: '/', label: '← Voltar ao portfólio' },
          ].map(l => (
            <a key={l.href} href={l.href} style={{
              fontSize: 12, fontWeight: 600, color: c.muted,
              textDecoration: 'none', padding: '6px 16px',
              borderRadius: 999, border: `1px solid ${c.border}`,
              background: c.bg1, transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.color = c.accent; e.currentTarget.style.borderColor = 'rgba(55,168,222,0.4)' }}
            onMouseOut={e => { e.currentTarget.style.color = c.muted; e.currentTarget.style.borderColor = c.border }}
            >
              {l.label}
            </a>
          ))}
        </div>
        <p style={{ fontSize: 12, color: c.faint }}>Estratégia elaborada em Maio 2026 · Revisar a cada 30 dias com base nos dados do Instagram Insights</p>
      </div>
    </div>
  )
}
