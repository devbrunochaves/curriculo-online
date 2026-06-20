'use client'
import { useState, useEffect } from 'react'

const WA  = 'https://wa.me/5519997222986'
const ORC = 'https://wa.me/5519997222986?text=Ol%C3%A1%21%20Vim%20pela%20p%C3%A1gina%20de%20valores%20e%20gostaria%20de%20solicitar%20um%20or%C3%A7amento%20personalizado.'

/* ─── CSS escopado sob .vl ─────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,800&display=swap');

@keyframes vl-up  { from { opacity:0; transform:translateY(32px) } to { opacity:1; transform:none } }
@keyframes vl-in  { from { opacity:0 } to { opacity:1 } }
@keyframes vl-mq  { from { transform:translateX(0) } to { transform:translateX(-50%) } }

.vl {
  --gold:     #01aeff;
  --golddim:  #e8f4ff;
  --goldbdr:  rgba(1,174,255,.22);
  --bg:       #f8f8f6;
  --bg2:      #ffffff;
  --bg3:      #f0f0ee;
  --txt:      #0a0a0a;
  --muted:    #888888;
  --border:   #e8e8e8;
  --card:     #ffffff;
  --black:    #0a0a0a;
  --sans:     'Inter', sans-serif;
  --serif:    'Playfair Display', serif;
  font-family: var(--sans);
  background: var(--bg);
  color: var(--txt);
  overflow-x: hidden;
  min-height: 100vh;
}

/* ── REVEAL ── */
.vl .rv  { opacity:0; transform:translateY(34px);  transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1) }
.vl .rvl { opacity:0; transform:translateX(-34px); transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1) }
.vl .rvr { opacity:0; transform:translateX(34px);  transition:opacity .8s cubic-bezier(.22,1,.36,1),transform .8s cubic-bezier(.22,1,.36,1) }
.vl .rv.on, .vl .rvl.on, .vl .rvr.on { opacity:1; transform:none }
.vl .d1 { transition-delay:.10s } .vl .d2 { transition-delay:.20s }
.vl .d3 { transition-delay:.32s } .vl .d4 { transition-delay:.44s }

/* ── NAV ── */
.vl nav {
  position:fixed; top:0; left:0; right:0; z-index:200;
  height:68px; display:flex; align-items:center; justify-content:space-between;
  padding:0 60px;
  background:transparent; border-bottom:1px solid transparent;
  transition:all .4s;
}
.vl nav.solid {
  background:rgba(248,248,246,.94);
  backdrop-filter:blur(18px);
  border-color:var(--border);
}
.vl .vl-logo { font-family:var(--sans); font-weight:900; font-size:18px; letter-spacing:-.5px; color:var(--txt); text-decoration:none }
.vl .vl-logo span { color:var(--gold) }
.vl .vl-nav-links { display:flex; align-items:center; gap:36px; list-style:none; margin:0; padding:0 }
.vl .vl-nav-links a { font-size:13px; font-weight:500; color:var(--txt); opacity:.6; text-decoration:none; transition:opacity .2s; letter-spacing:.2px }
.vl .vl-nav-links a:hover { opacity:1 }
.vl .vl-nav-links a.cur { font-weight:700; color:var(--gold); opacity:1 }
.vl .vl-nav-cta {
  display:flex; align-items:center; gap:8px;
  background:transparent; color:var(--txt);
  border:1.5px solid rgba(10,10,10,.25);
  padding:9px 20px; font-size:13px; font-weight:700;
  cursor:pointer; text-decoration:none; transition:all .2s; letter-spacing:.2px;
}
.vl .vl-nav-cta:hover { border-color:var(--txt); background:rgba(10,10,10,.04); transform:translateY(-1px) }
.vl .vl-hamburger { display:none; background:none; border:none; font-size:22px; cursor:pointer; color:var(--txt); padding:4px 8px }

/* ── MOBILE MENU ── */
.vl .vl-mm {
  display:none; position:fixed; inset:0; z-index:199;
  background:var(--bg); flex-direction:column; align-items:center; justify-content:center;
  opacity:0; transform:translateY(-12px);
  transition:opacity .3s ease, transform .3s ease; pointer-events:none;
}
.vl .vl-mm.open { opacity:1; transform:translateY(0); pointer-events:all }
.vl .vl-mm a {
  display:block; font-size:26px; font-weight:800; letter-spacing:-1px;
  color:var(--txt); text-decoration:none; padding:16px 0;
  border-bottom:1px solid var(--border); width:80%; text-align:center; transition:color .2s;
}
.vl .vl-mm a:last-child { border-bottom:none }
.vl .vl-mm a:hover { color:var(--gold) }
.vl .vl-mm-btn {
  margin-top:28px; background:var(--gold); color:#fff;
  padding:15px 40px; font-size:15px; font-weight:800;
  border:none; cursor:pointer; text-decoration:none; letter-spacing:.3px;
}
.vl .vl-mm-btn:hover { background:#0089cc }

/* ── HERO ── */
.vl .vl-hero {
  min-height:100vh; display:flex; align-items:center;
  padding:120px 60px 80px; position:relative; overflow:hidden;
}
.vl .vl-hero::before {
  content:''; position:absolute; inset:0;
  background:radial-gradient(ellipse 80% 55% at 50% 0%, rgba(1,174,255,.06) 0%, transparent 58%);
  pointer-events:none;
}
.vl .vl-hero-lines {
  position:absolute; right:0; top:50%; transform:translateY(-50%);
  display:flex; flex-direction:column; gap:6px; padding-right:20px;
}
.vl .vl-hl { height:1.5px; background:var(--gold); opacity:.25 }
.vl .vl-hl:nth-child(1){width:40px} .vl .vl-hl:nth-child(2){width:24px}
.vl .vl-hl:nth-child(3){width:60px} .vl .vl-hl:nth-child(4){width:16px}
.vl .vl-hl:nth-child(5){width:48px}
.vl .vl-hero-inner {
  max-width:820px; margin:0 auto; width:100%;
  display:flex; flex-direction:column; align-items:center;
  text-align:center; position:relative; z-index:1;
}
.vl .vl-eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-size:11px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase;
  color:var(--gold); margin-bottom:24px;
}
.vl .vl-eyebrow::before { content:''; width:28px; height:1.5px; background:var(--gold) }
.vl .vl-hero h1 {
  font-size:clamp(44px,6vw,80px); font-weight:900; line-height:1.0;
  letter-spacing:-2.5px; color:var(--txt); margin-bottom:26px;
}
.vl .vl-hero h1 em { font-style:italic; font-family:var(--serif); font-weight:800; color:var(--txt) }
.vl .vl-hero-sub {
  font-size:17px; color:var(--muted); line-height:1.75;
  margin-bottom:44px; max-width:580px; font-weight:400;
}
.vl .vl-badge {
  display:inline-flex; align-items:center; gap:14px;
  background:var(--golddim); border:1px solid var(--goldbdr);
  padding:14px 28px; font-size:13px; font-weight:500; color:var(--txt);
}
.vl .vl-badge-icon { font-size:16px; flex-shrink:0; color:var(--gold) }
.vl .vl-badge strong { color:var(--gold); font-weight:800 }

/* ── MARQUEE ── */
.vl .vl-mq-wrap {
  background:var(--black); padding:16px 0; overflow:hidden;
}
.vl .vl-mq-track { display:flex; width:max-content; animation:vl-mq 28s linear infinite }
.vl .vl-mq-item {
  padding:0 40px; white-space:nowrap;
  font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase;
  color:rgba(255,255,255,.4); display:flex; align-items:center; gap:16px;
}
.vl .vl-mq-dot { color:var(--gold); font-size:7px }

/* ── SEÇÕES BASE ── */
.vl section { padding:100px 60px }
.vl .vl-wrap { max-width:1280px; margin:0 auto }
.vl .vl-sec-hd { margin-bottom:56px }
.vl .vl-title {
  font-size:clamp(26px,3.5vw,46px); font-weight:900;
  line-height:1.1; letter-spacing:-1.5px; color:var(--txt);
}
.vl .vl-title em { font-style:italic; font-family:var(--serif) }
.vl .vl-sub { font-size:15px; color:var(--muted); line-height:1.75; max-width:520px; margin-top:14px }

/* ── PRICE CARDS ── */
.vl .vl-g3 { display:grid; grid-template-columns:repeat(3,1fr); gap:20px }
.vl .vl-g2 { display:grid; grid-template-columns:repeat(2,1fr); gap:20px }

.vl .vl-card {
  background:var(--card); border:1px solid var(--border);
  padding:32px; position:relative; overflow:hidden;
  transition:border-color .3s, background .3s, transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s;
}
.vl .vl-card::after {
  content:''; position:absolute; top:0; left:0; right:0; height:2px;
  background:var(--gold); transform:scaleX(0); transform-origin:left;
  transition:transform .38s cubic-bezier(.22,1,.36,1);
}
.vl .vl-card:hover {
  border-color:rgba(1,174,255,.3); background:var(--golddim);
  transform:translateY(-5px);
  box-shadow:0 20px 56px rgba(1,174,255,.12), 0 4px 20px rgba(0,0,0,.06);
}
.vl .vl-card:hover::after { transform:scaleX(1) }
.vl .vl-ctag {
  display:inline-block; font-size:10px; font-weight:800;
  letter-spacing:2.5px; text-transform:uppercase;
  color:var(--gold); margin-bottom:22px;
}
.vl .vl-cname {
  font-size:19px; font-weight:800; color:var(--txt);
  margin-bottom:20px; line-height:1.2; letter-spacing:-.3px;
}
.vl .vl-cprice-label {
  font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
  color:var(--muted); margin-bottom:6px;
}
.vl .vl-cprice {
  font-size:clamp(26px,2.8vw,36px); font-weight:900; color:var(--txt);
  letter-spacing:-1px; line-height:1.1; margin-bottom:22px;
  display:flex; align-items:baseline; gap:6px;
}
.vl .vl-cprice-cur { font-size:.48em; color:var(--gold); font-weight:800; letter-spacing:.5px }
.vl .vl-cprice-suffix { font-size:.42em; color:var(--muted); font-weight:600; letter-spacing:.3px }
.vl .vl-cprice-alt {
  font-size:18px; font-weight:700; color:var(--muted);
  font-style:italic; font-family:var(--serif); margin-bottom:22px; line-height:1.2;
}
.vl .vl-cdesc {
  font-size:13px; color:var(--muted); line-height:1.65;
  border-top:1px solid var(--border); padding-top:18px;
}

/* ── FRONT-END ── */
.vl .vl-fe-layout { display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:start }
.vl .vl-rate {
  background:var(--card); border:1px solid var(--border);
  padding:26px 32px; display:flex; align-items:center; justify-content:space-between;
  margin-bottom:12px; transition:border-color .3s, background .3s, box-shadow .3s;
}
.vl .vl-rate:last-of-type { margin-bottom:0 }
.vl .vl-rate:hover { border-color:rgba(1,174,255,.3); background:var(--golddim); box-shadow:0 8px 24px rgba(1,174,255,.1) }
.vl .vl-rate-lbl { font-size:15px; font-weight:800; color:var(--txt); letter-spacing:-.2px }
.vl .vl-rate-val { font-size:22px; font-weight:900; color:var(--gold); letter-spacing:-.5px }
.vl .vl-tech-hd {
  font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase;
  color:var(--muted); margin:36px 0 14px;
}
.vl .vl-techs { display:flex; flex-wrap:wrap; gap:8px }
.vl .vl-tech {
  padding:7px 14px; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
  color:var(--muted); background:var(--bg3); border:1.5px solid var(--border);
  transition:all .22s; cursor:default;
}
.vl .vl-tech:hover { border-color:var(--gold); color:var(--gold); background:var(--golddim) }

/* ── FAQ ── */
.vl .vl-faq-layout { display:grid; grid-template-columns:1fr 1fr; gap:100px; align-items:start }
.vl .vl-faq-list { display:flex; flex-direction:column }
.vl .vl-faq-item { border-bottom:1px solid var(--border); overflow:hidden }
.vl .vl-faq-q {
  width:100%; background:none; border:none;
  display:flex; align-items:center; justify-content:space-between;
  padding:22px 0; font-family:var(--sans); font-size:15px; font-weight:700;
  color:var(--txt); cursor:pointer; text-align:left; gap:20px; transition:color .2s;
}
.vl .vl-faq-q:hover { color:var(--gold) }
.vl .vl-faq-ico {
  width:26px; height:26px; border:1.5px solid var(--border);
  display:flex; align-items:center; justify-content:center;
  font-size:16px; flex-shrink:0; transition:all .25s; color:var(--muted);
}
.vl .vl-faq-item.open .vl-faq-ico { background:var(--gold); border-color:var(--gold); color:#fff; transform:rotate(45deg) }
.vl .vl-faq-a {
  max-height:0; overflow:hidden; font-size:14px; color:var(--muted);
  line-height:1.75; transition:max-height .42s cubic-bezier(.22,1,.36,1), padding .42s;
}
.vl .vl-faq-item.open .vl-faq-a { max-height:220px; padding-bottom:22px }

/* ── BOTÕES ── */
.vl .vl-btn-gold {
  background:var(--gold); color:#fff; border:none;
  padding:15px 36px; font-size:14px; font-weight:800;
  cursor:pointer; text-decoration:none; display:inline-block;
  letter-spacing:.3px; transition:all .25s;
}
.vl .vl-btn-gold:hover { background:#0089cc; transform:translateY(-2px); box-shadow:0 12px 32px rgba(1,174,255,.3) }
.vl .vl-btn-wa {
  background:transparent; color:rgba(255,255,255,.7);
  border:1.5px solid rgba(255,255,255,.18);
  padding:14px 32px; font-size:14px; font-weight:600;
  cursor:pointer; text-decoration:none;
  display:inline-flex; align-items:center; gap:8px;
  letter-spacing:.3px; transition:all .25s;
}
.vl .vl-btn-wa:hover { border-color:#25D366; color:#25D366 }
.vl .vl-btn-outline {
  background:transparent; color:rgba(255,255,255,.6);
  border:1.5px solid rgba(255,255,255,.18);
  padding:14px 32px; font-size:14px; font-weight:600;
  cursor:pointer; text-decoration:none; display:inline-block;
  letter-spacing:.3px; transition:all .25s;
}
.vl .vl-btn-outline:hover { border-color:rgba(255,255,255,.5); color:#fff }

/* ── CTA ── */
.vl .vl-cta-sec {
  padding:120px 60px; text-align:center; background:var(--black);
  border-top:1px solid rgba(255,255,255,.06); position:relative; overflow:hidden;
}
.vl .vl-cta-sec::before {
  content:''; position:absolute; inset:0;
  background:radial-gradient(ellipse 70% 80% at 50% 120%, rgba(1,174,255,.08) 0%, transparent 55%);
  pointer-events:none;
}
.vl .vl-cta-inner { position:relative; z-index:1; max-width:680px; margin:0 auto }
.vl .vl-cta-sec h2 {
  font-size:clamp(28px,4vw,52px); font-weight:900; letter-spacing:-1.5px;
  color:#fff; margin-bottom:18px; line-height:1.1;
}
.vl .vl-cta-sec h2 em { font-style:italic; font-family:var(--serif); color:var(--gold) }
.vl .vl-cta-sec p { font-size:16px; color:var(--muted); line-height:1.75; margin-bottom:44px }
.vl .vl-cta-btns { display:flex; gap:14px; justify-content:center; flex-wrap:wrap }

/* ── FOOTER ── */
.vl footer { background:#030303; padding:80px 60px 40px }
.vl .vl-ft-top { display:grid; grid-template-columns:1.5fr 1fr 1fr 1fr; gap:60px; margin-bottom:60px }
.vl .vl-ft-brand p { font-size:13px; color:rgba(255,255,255,.3); line-height:1.75; margin-top:16px; max-width:260px }
.vl .vl-ft-col h4 { font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,.22); margin-bottom:20px }
.vl .vl-ft-col a { display:block; font-size:14px; color:rgba(255,255,255,.4); text-decoration:none; margin-bottom:12px; transition:color .2s }
.vl .vl-ft-col a:hover { color:#fff }
.vl .vl-ft-bot {
  border-top:1px solid rgba(255,255,255,.05); padding-top:32px;
  display:flex; justify-content:space-between; align-items:center;
  font-size:12px; color:rgba(255,255,255,.18);
}
.vl .vl-ft-socs { display:flex; gap:10px }
.vl .vl-ft-soc {
  width:38px; height:38px; border:1px solid rgba(255,255,255,.07);
  display:flex; align-items:center; justify-content:center;
  text-decoration:none; transition:all .2s;
}
.vl .vl-ft-soc:hover { border-color:var(--gold); background:rgba(1,174,255,.1) }
.vl .vl-ft-soc svg { width:16px; height:16px; fill:rgba(255,255,255,.35); transition:fill .2s }
.vl .vl-ft-soc:hover svg { fill:var(--gold) }

/* ── NOTA LEGAL ── */
.vl .vl-legal {
  background:#020202; border-top:1px solid rgba(255,255,255,.04);
  padding:24px 60px;
}
.vl .vl-legal p {
  font-size:12px; color:rgba(255,255,255,.16);
  max-width:780px; margin:0 auto; text-align:center; line-height:1.7;
}

/* ── RESPONSIVO ── */
@media(max-width:1024px) {
  .vl nav { padding:0 32px }
  .vl section { padding:80px 32px }
  .vl .vl-hero { padding:100px 32px 80px }
  .vl .vl-g3 { grid-template-columns:repeat(2,1fr) }
  .vl .vl-fe-layout { grid-template-columns:1fr; gap:48px }
  .vl .vl-faq-layout { grid-template-columns:1fr; gap:48px }
  .vl .vl-ft-top { grid-template-columns:1fr 1fr; gap:40px }
  .vl .vl-cta-sec { padding:80px 32px }
  .vl .vl-legal { padding:24px 32px }
}
@media(max-width:640px) {
  .vl nav { padding:0 20px }
  .vl .vl-nav-links, .vl .vl-nav-cta { display:none }
  .vl .vl-hamburger { display:block }
  .vl .vl-mm { display:flex }
  .vl .vl-hero { padding:90px 20px 60px }
  .vl .vl-hero h1 { letter-spacing:-1.5px }
  .vl section { padding:60px 20px }
  .vl .vl-g3, .vl .vl-g2 { grid-template-columns:1fr }
  .vl .vl-ft-top { grid-template-columns:1fr }
  .vl footer { padding:60px 20px 32px }
  .vl .vl-cta-sec { padding:60px 20px }
  .vl .vl-cta-btns { flex-direction:column; align-items:stretch }
  .vl .vl-btn-gold, .vl .vl-btn-wa { width:100%; justify-content:center; text-align:center }
  .vl .vl-legal { padding:20px }
}
`

/* ─── Dados ────────────────────────────────────────────────────── */
const MQ_ITEMS = ['Design Gráfico','Branding','Identidade Visual','Web Design','Desenvolvimento','Social Media','Landing Pages','UI/UX']

const SOCIAL = [
  { tag: 'Redes Sociais', name: 'Post Estático', price: '100', suffix: null, desc: 'Ideal para promoções, comunicados e conteúdos institucionais.' },
  { tag: 'Redes Sociais', name: 'Carrossel',      price: '150', suffix: null, desc: 'Conteúdo com narrativa visual para aumentar retenção e engajamento.' },
  { tag: 'Redes Sociais', name: 'Reels',           price: '150', suffix: null, desc: 'Edição e adaptação de vídeos para Instagram e outras plataformas.' },
]

const BRANDING = [
  { tag: 'Branding', name: 'Logotipo',                   price: '600',   suffix: null, desc: 'Criação de logotipo profissional com apresentação e arquivos finais.' },
  { tag: 'Branding', name: 'Identidade Visual Completa', price: '1.200', suffix: null, desc: 'Inclui logotipo, paleta de cores, tipografia, aplicações e manual básico da marca.' },
]

const WEB = [
  { tag: 'Web Design', name: 'Landing Page — Design',        price: '900', suffix: null, desc: 'Criação completa do layout no Figma, focada em conversão e experiência do usuário.' },
  { tag: 'Web Design', name: 'Landing Page — Implementação', price: '900', suffix: null, desc: 'Desenvolvimento da landing page responsiva com HTML, CSS, JavaScript, React ou Next.js.' },
  { tag: 'Web Design', name: 'Site Institucional',           price: null,  suffix: null, desc: 'Projetos personalizados conforme quantidade de páginas e funcionalidades.' },
]

const FAQS = [
  { q: 'Os valores são fixos?',                  a: 'Não. Os valores apresentados servem como referência inicial e podem variar conforme escopo, prazo e necessidades do projeto.' },
  { q: 'Você trabalha por demanda recorrente?',   a: 'Sim. Atendo empresas, agências e profissionais que necessitam de suporte contínuo em design e desenvolvimento.' },
  { q: 'Você também desenvolve o projeto?',       a: 'Sim. Além da criação visual, também atuo na implementação front-end de sites, landing pages e interfaces com React, Next.js e outras tecnologias modernas.' },
]

const TECHS = ['React','Next.js','JavaScript','TypeScript','HTML','CSS','Tailwind CSS','Supabase']

/* ─── Componentes ──────────────────────────────────────────────── */
function PriceCard({ card, delayClass = '' }) {
  return (
    <div className={`vl-card rv${delayClass}`}>
      <div className="vl-ctag">{card.tag}</div>
      <div className="vl-cname">{card.name}</div>
      {card.price ? (
        <>
          <div className="vl-cprice-label">A partir de</div>
          <div className="vl-cprice">
            <span className="vl-cprice-cur">R$</span>
            {card.price}
            {card.suffix && <span className="vl-cprice-suffix">{card.suffix}</span>}
          </div>
        </>
      ) : (
        <div className="vl-cprice-alt">Sob orçamento</div>
      )}
      <div className="vl-cdesc">{card.desc}</div>
    </div>
  )
}

const WA_SVG = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
)

/* ─── Página principal ─────────────────────────────────────────── */
export default function Valores() {
  const [solid,   setSolid]   = useState(false)
  const [openFaq, setOpenFaq] = useState(-1)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const el = document.createElement('style')
    el.id = 'vl-page-css'
    el.textContent = CSS
    document.head.appendChild(el)
    return () => document.getElementById('vl-page-css')?.remove()
  }, [])

  useEffect(() => {
    const h = () => setSolid(window.scrollY > 60)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    const ro = new IntersectionObserver(
      es => es.forEach(e => e.isIntersecting && e.target.classList.add('on')),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    const t = setTimeout(() => {
      document.querySelectorAll('.vl .rv,.vl .rvl,.vl .rvr').forEach(el => ro.observe(el))
    }, 80)
    return () => { clearTimeout(t); ro.disconnect() }
  }, [])

  const toggleFaq = i => setOpenFaq(openFaq === i ? -1 : i)

  return (
    <div className="vl">

      {/* ── NAV ───────────────────────────────────────────────── */}
      <nav className={solid ? 'solid' : ''}>
        <a href="/" className="vl-logo">BRUNO<span>.</span>CHAVES</a>
        <ul className="vl-nav-links">
          <li><a href="/#projetos">Projetos</a></li>
          <li><a href="/#servicos">Serviços</a></li>
          <li><a href="/#sobre">Sobre</a></li>
          <li><a href="/valores" className="cur">Valores</a></li>
          <li><a href="/blog">Blog</a></li>
        </ul>
        <a href={ORC} className="vl-nav-cta" target="_blank" rel="noreferrer">
          Solicitar Orçamento
        </a>
        <button className="vl-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* ── MOBILE MENU ───────────────────────────────────────── */}
      <div className={`vl-mm${menuOpen ? ' open' : ''}`}>
        <a href="/"          onClick={() => setMenuOpen(false)}>Início</a>
        <a href="/#projetos" onClick={() => setMenuOpen(false)}>Projetos</a>
        <a href="/#servicos" onClick={() => setMenuOpen(false)}>Serviços</a>
        <a href="/#sobre"    onClick={() => setMenuOpen(false)}>Sobre</a>
        <a href="/blog"      onClick={() => setMenuOpen(false)}>Blog</a>
        <a href={ORC} className="vl-mm-btn" target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>
          Solicitar Orçamento
        </a>
      </div>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="vl-hero" id="inicio">
        <div className="vl-hero-inner">
          <div className="vl-eyebrow" style={{ animation: 'vl-up .6s .10s both' }}>
            Transparência &amp; Posicionamento
          </div>
          <h1 style={{ animation: 'vl-up .7s .20s both' }}>
            Valores de<br/>
            <em>Referência</em>
          </h1>
          <p className="vl-hero-sub" style={{ animation: 'vl-up .7s .34s both' }}>
            Transparência faz parte do processo. Abaixo estão os valores iniciais dos principais serviços que ofereço. Cada projeto é analisado individualmente e pode variar conforme escopo, prazo e complexidade.
          </p>
          <div className="vl-badge" style={{ animation: 'vl-up .7s .48s both' }}>
            <span className="vl-badge-icon">✦</span>
            <span>Mais de <strong>15 anos de experiência</strong> em Design, Branding e Presença Digital.</span>
          </div>
        </div>
        <div className="vl-hero-lines">
          {[0,1,2,3,4].map(i => <div key={i} className="vl-hl"/>)}
        </div>
      </section>

      {/* ── MARQUEE ───────────────────────────────────────────── */}
      <div className="vl-mq-wrap">
        <div className="vl-mq-track">
          {[...MQ_ITEMS, ...MQ_ITEMS].map((item, i) => (
            <div key={i} className="vl-mq-item">
              {item} <span className="vl-mq-dot">●</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SEÇÃO 1 — REDES SOCIAIS ───────────────────────────── */}
      <section id="redes-sociais">
        <div className="vl-wrap">
          <div className="vl-sec-hd rv">
            <div className="vl-eyebrow">Serviços Digitais</div>
            <h2 className="vl-title">Conteúdo para<br/><em>Redes Sociais</em></h2>
            <p className="vl-sub">Peças desenvolvidas estrategicamente para fortalecer posicionamento, credibilidade e presença digital.</p>
          </div>
          <div className="vl-g3">
            {SOCIAL.map((card, i) => (
              <PriceCard key={i} card={card} delayClass={i > 0 ? ` d${i}` : ''} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 2 — BRANDING ────────────────────────────────── */}
      <section id="branding" style={{ background: 'var(--bg2)' }}>
        <div className="vl-wrap">
          <div className="vl-sec-hd rv">
            <div className="vl-eyebrow">Branding</div>
            <h2 className="vl-title">Identidade de<br/><em>Marca</em></h2>
            <p className="vl-sub">Projetos focados na construção de marcas profissionais, memoráveis e alinhadas ao posicionamento do negócio.</p>
          </div>
          <div className="vl-g2" style={{ maxWidth: 900 }}>
            {BRANDING.map((card, i) => (
              <PriceCard key={i} card={card} delayClass={i > 0 ? ` d${i}` : ''} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 3 — WEB DESIGN ──────────────────────────────── */}
      <section id="web-design">
        <div className="vl-wrap">
          <div className="vl-sec-hd rv">
            <div className="vl-eyebrow">Web Design</div>
            <h2 className="vl-title">Sites e<br/><em>Landing Pages</em></h2>
            <p className="vl-sub">Projetos desenvolvidos para transmitir confiança, autoridade e gerar oportunidades de negócio.</p>
          </div>
          <div className="vl-g3">
            {WEB.map((card, i) => (
              <PriceCard key={i} card={card} delayClass={i > 0 ? ` d${i}` : ''} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 4 — FRONT-END ───────────────────────────────── */}
      <section id="front-end" style={{ background: 'var(--bg2)' }}>
        <div className="vl-wrap">
          <div className="vl-sec-hd rv">
            <div className="vl-eyebrow">Desenvolvimento</div>
            <h2 className="vl-title">Desenvolvimento<br/><em>Front-End</em></h2>
            <p className="vl-sub">Transformação de layouts em interfaces modernas, responsivas e com foco em performance.</p>
          </div>
          <div className="vl-fe-layout">
            {/* Esquerda: taxas horárias */}
            <div className="rvl">
              <div className="vl-rate">
                <div>
                  <div className="vl-rate-lbl">Hora Técnica</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Projetos pontuais e manutenções</div>
                </div>
                <div className="vl-rate-val">R$ 80/h</div>
              </div>
              <div className="vl-rate">
                <div>
                  <div className="vl-rate-lbl">Diária Técnica</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Dedicação de um dia completo</div>
                </div>
                <div className="vl-rate-val">R$ 500/dia</div>
              </div>
              <div className="vl-tech-hd">Tecnologias</div>
              <div className="vl-techs">
                {TECHS.map((t, i) => (
                  <div key={i} className="vl-tech">{t}</div>
                ))}
              </div>
            </div>

            {/* Direita: texto de posicionamento */}
            <div className="rvr">
              <div style={{ borderLeft: '2px solid var(--goldbdr)', paddingLeft: 32 }}>
                <div className="vl-eyebrow" style={{ marginBottom: 18 }}>Por que contratar</div>
                <h3 style={{ fontSize: 'clamp(20px,2.5vw,30px)', fontWeight: 900, color: 'var(--txt)', letterSpacing: '-.8px', lineHeight: 1.15, marginBottom: 20 }}>
                  Código limpo.<br/>
                  <span style={{ fontStyle:'italic', fontFamily:'var(--serif)', color:'var(--gold)' }}>Performance real.</span>
                </h3>
                <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 20 }}>
                  Cada interface é desenvolvida com atenção a acessibilidade, SEO técnico e experiência do usuário — não apenas estética.
                </p>
                <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 32 }}>
                  Atendo projetos únicos (horas técnicas) ou de imersão completa (diária), com total alinhamento às suas necessidades e prazos.
                </p>
                <a href={ORC} className="vl-btn-gold" target="_blank" rel="noreferrer">
                  Solicitar proposta →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section id="faq" style={{ background: 'var(--bg3)' }}>
        <div className="vl-wrap">
          <div className="vl-faq-layout">
            {/* Esquerda: texto */}
            <div className="rvl">
              <div className="vl-eyebrow">Dúvidas</div>
              <h2 className="vl-title" style={{ marginBottom: 20 }}>Perguntas<br/><em>frequentes.</em></h2>
              <p className="vl-sub" style={{ marginTop: 0 }}>
                Tem alguma dúvida específica sobre o seu projeto?<br/>
                Fale diretamente pelo WhatsApp.
              </p>
              <a
                href={WA} className="vl-btn-gold"
                style={{ marginTop: 36, display: 'inline-block' }}
                target="_blank" rel="noreferrer"
              >
                Falar no WhatsApp
              </a>
            </div>
            {/* Direita: accordion */}
            <div className="vl-faq-list rvr">
              {FAQS.map((item, i) => (
                <div key={i} className={`vl-faq-item${openFaq === i ? ' open' : ''}`}>
                  <button className="vl-faq-q" onClick={() => toggleFaq(i)}>
                    {item.q}
                    <span className="vl-faq-ico">+</span>
                  </button>
                  <div className="vl-faq-a">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────── */}
      <section className="vl-cta-sec" id="contato">
        <div className="vl-cta-inner rv">
          <div className="vl-eyebrow" style={{ justifyContent: 'center' }}>Próximo passo</div>
          <h2>
            Vamos conversar sobre<br/>
            <em>seu projeto?</em>
          </h2>
          <p>
            Cada negócio possui necessidades diferentes. Solicite uma análise e receba uma proposta personalizada sem compromisso.
          </p>
          <div className="vl-cta-btns">
            <a href={ORC} className="vl-btn-gold" target="_blank" rel="noreferrer">
              Solicitar orçamento
            </a>
            <a href={WA} className="vl-btn-wa" target="_blank" rel="noreferrer">
              {WA_SVG} Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer>
        <div className="vl-wrap">
          <div className="vl-ft-top">
            <div className="vl-ft-brand">
              <a href="/" className="vl-logo" style={{ fontSize: 20, color: '#fff' }}>BRUNO<span>.</span>CHAVES</a>
              <p>Design que transforma marcas em experiências memoráveis. Identidade visual, sites e criativos para empresas que querem crescer.</p>
            </div>
            <div className="vl-ft-col">
              <h4>Serviços</h4>
              <a href="/#servicos">Identidade Visual</a>
              <a href="/#servicos">Web Design</a>
              <a href="/#servicos">Social Media</a>
              <a href="/#servicos">Landing Pages</a>
              <a href="/valores">Tabela de Valores</a>
            </div>
            <div className="vl-ft-col">
              <h4>Links</h4>
              <a href="/#projetos">Projetos</a>
              <a href="/#sobre">Sobre</a>
              <a href="/#processo">Processo</a>
              <a href="/#contato">Contato</a>
              <a href="/blog">Blog</a>
            </div>
            <div className="vl-ft-col">
              <h4>Contato</h4>
              <a href="mailto:brunochaves2102@gmail.com">brunochaves2102@gmail.com</a>
              <a href={WA} target="_blank" rel="noreferrer">WhatsApp</a>
              <a href="#" target="_blank" rel="noreferrer">Instagram</a>
              <a href="#" target="_blank" rel="noreferrer">Behance</a>
            </div>
          </div>
          <div className="vl-ft-bot">
            <span>© 2025 Bruno Chaves Studio. Todos os direitos reservados.</span>
            <div className="vl-ft-socs">
              <a href="#" className="vl-ft-soc" title="Instagram">
                <svg viewBox="0 0 24 24" strokeWidth="1.5" stroke="rgba(255,255,255,.35)" fill="none">
                  <rect x="2" y="2" width="20" height="20" rx="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="#" className="vl-ft-soc" title="Behance">
                <svg viewBox="0 0 24 24" fill="rgba(255,255,255,.35)">
                  <path d="M22 7h-7V5h7v2zM9.4 9.6C10.4 9 11 8 11 6.7 11 4.1 9.1 3 6.6 3H1v18h6.1c2.7 0 5.2-1.3 5.2-4.3 0-1.9-.9-3.3-2.9-4.1zM3.8 5.4h2.3c1.1 0 2.1.4 2.1 1.7S7.2 9 6.1 9H3.8V5.4zm2.8 11.2H3.8v-4.2h2.9c1.3 0 2.3.6 2.3 2-.1 1.6-1.1 2.2-2.4 2.2zm7.9-7.5c-3.1 0-5 2.2-5 5.3S11.4 20 14.5 20c2.5 0 4.1-1.4 4.8-3.6h-2.4c-.3.9-1.2 1.5-2.3 1.5-1.6 0-2.6-1-2.7-2.6H19.4c.1-3.2-1.5-6.2-5-6.2h.1zm-2.1 4.2c.2-1.3 1-2.2 2.3-2.2 1.2 0 2.1.9 2.2 2.2h-4.5z"/>
                </svg>
              </a>
              <a href={WA} className="vl-ft-soc" title="WhatsApp" target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" fill="rgba(255,255,255,.35)">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── NOTA LEGAL ────────────────────────────────────────── */}
      <div className="vl-legal">
        <p>
          Os valores apresentados são de referência e podem variar conforme escopo, prazo, complexidade e necessidades específicas de cada projeto.
          Para uma proposta personalizada, entre em contato.
        </p>
      </div>

    </div>
  )
}
