'use client'
import { useState, useEffect } from 'react'
import './logia.css'

const imgErr = e => { e.currentTarget.style.display = 'none' }

export default function LogIA() {
  const [activeDay, setActiveDay] = useState('d1')
  const [menuOpen, setMenuOpen]   = useState(false)

  /* ── Google Fonts ─────────────────────────────────────────────── */
  useEffect(() => {
    const pre1 = Object.assign(document.createElement('link'), { rel: 'preconnect', href: 'https://fonts.googleapis.com' })
    const pre2 = Object.assign(document.createElement('link'), { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' })
    const link = Object.assign(document.createElement('link'), {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Raleway:wght@300;400;500;600;800&display=swap',
    })
    document.head.append(pre1, pre2, link)
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      ;[pre1, pre2, link].forEach(el => el.parentNode?.removeChild(el))
      document.documentElement.style.scrollBehavior = ''
    }
  }, [])

  /* ── Countdown ────────────────────────────────────────────────── */
  useEffect(() => {
    const target = new Date('2026-10-14T09:00:00-03:00').getTime()
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v).padStart(2, '0') }
    function tick() {
      let d = target - Date.now()
      if (d < 0) d = 0
      set('cd-d', Math.floor(d / 86400000))
      set('cd-h', Math.floor(d % 86400000 / 3600000))
      set('cd-m', Math.floor(d % 3600000  / 60000))
      set('cd-s', Math.floor(d % 60000    / 1000))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  /* ── Scroll effects ───────────────────────────────────────────── */
  useEffect(() => {
    const header = document.querySelector('.logia header')
    const toTop  = document.getElementById('toTop')
    const onScroll = () => {
      const y = window.scrollY
      header?.classList.toggle('scrolled', y > 40)
      toTop?.classList.toggle('show', y > 600)
    }
    const handleToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
    window.addEventListener('scroll', onScroll, { passive: true })
    toTop?.addEventListener('click', handleToTop)
    return () => {
      window.removeEventListener('scroll', onScroll)
      toTop?.removeEventListener('click', handleToTop)
    }
  }, [])

  /* ── Number counter ───────────────────────────────────────────── */
  useEffect(() => {
    const nums = document.querySelectorAll('.logia .num-item .n')
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return
        const el = e.target
        const t = +el.dataset.target, suf = el.dataset.suffix || ''
        let c = 0; const step = t / 60
        const run = () => {
          c += step
          if (c < t) { el.textContent = Math.floor(c).toLocaleString('pt-BR') + suf; requestAnimationFrame(run) }
          else el.textContent = t.toLocaleString('pt-BR') + suf
        }
        run(); io.unobserve(el)
      })
    }, { threshold: 0.5 })
    nums.forEach(n => io.observe(n))
    return () => io.disconnect()
  }, [])

  /* ── Scroll reveal ────────────────────────────────────────────── */
  useEffect(() => {
    const els = document.querySelectorAll('.logia .reveal')
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) } })
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  /* ── Parallax hero ────────────────────────────────────────────── */
  useEffect(() => {
    const hero = document.querySelector('.logia .hero')
    const onScroll = () => {
      if (window.scrollY < window.innerHeight && hero)
        hero.style.backgroundPositionY = window.scrollY * 0.3 + 'px'
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── Close menu on nav link click ────────────────────────────── */
  function navClick() { setMenuOpen(false) }

  /* ════════════════ RENDER ════════════════════════════════════════ */
  return (
    <div className="logia">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header>
        <div className="container nav">
          <a href="#home" className="logo">
            <span className="b">LOG</span><span className="dot">.</span><span className="r">IA</span><span className="yr">2026</span>
          </a>
          <ul className={`nav-menu${menuOpen ? ' open' : ''}`} id="navMenu">
            <li><a href="#home"          onClick={navClick}>Home</a></li>
            <li><a href="#palestrantes"  onClick={navClick}>Palestrantes</a></li>
            <li><a href="#programacao"   onClick={navClick}>Programação</a></li>
            <li><a href="#experience"    onClick={navClick}>LogTech Experience</a></li>
            <li><a href="#conteudo"      onClick={navClick}>Conteúdo</a></li>
          </ul>
          <a href="#inscricao" className="btn btn-red nav-cta">Inscrição Gratuita</a>
          <button className="burger" aria-label="menu" onClick={() => setMenuOpen(o => !o)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="hero" id="home">
        <div className="hero-decor-chev chevrons"><span /><span /><span /></div>
        <div className="container">
          <div>
            <div className="hero-icons">
              <img src="/logia/img/icones.png" alt="" onError={imgErr} />
            </div>
            <img src="/logia/img/logo-evento.png" alt="LOG.IA 2026" onError={imgErr} />
            <p className="hero-tag">Inteligência que move o mundo.</p>
            <div className="hero-info">
              <div className="row"><span className="tag-shape ts-red">14 A 16 OUTUBRO 2026</span></div>
              <div className="row"><span className="tag-shape ts-blue">VIASOFT EXPERIENCE</span> <span>Curitiba — PR</span></div>
              <div className="row"><span className="tag-shape ts-lime">QUA E QUI: 13H–21H</span> <span>Sex: 09h–17h</span></div>
            </div>
            <a href="#inscricao" className="btn btn-red">Inscreva-se Gratuitamente</a>
          </div>

          <div className="countdown-card">
            <div className="cd-title">Contagem regressiva</div>
            <div className="countdown">
              <div><div className="cd-num" id="cd-d">00</div><div className="cd-lbl">Dias</div></div>
              <div><div className="cd-num" id="cd-h">00</div><div className="cd-lbl">Horas</div></div>
              <div><div className="cd-num" id="cd-m">00</div><div className="cd-lbl">Min</div></div>
              <div><div className="cd-num" id="cd-s">00</div><div className="cd-lbl">Seg</div></div>
            </div>
            <div className="dots-grid hero-dots" style={{ position: 'static', marginTop: 26, height: 70, opacity: .5 }} />
          </div>
        </div>
      </section>

      {/* ── ABOUT ───────────────────────────────────────────────── */}
      <section className="about" id="sobre">
        <div className="container">
          <div className="about-visual reveal">
            <img className="about-img" src="/logia/img/evento.png" alt="LOG.IA 2026" onError={imgErr} />
            <div className="big-logo"><span className="l">LOG</span><span className="p">.</span><span className="ia">IA</span></div>
          </div>
          <div>
            <div className="kicker reveal">O Evento</div>
            <h2 className="sec-title reveal">3 dias para conectar<br />a logística ao futuro</h2>
            <p className="sec-sub reveal">O LOG.IA 2026 é o principal encontro de inteligência artificial aplicada à logística do Brasil. Reunimos operadores, embarcadores, logtechs, investidores e lideranças para transformar dados em decisão e tecnologia em movimento.</p>
            <ul className="reveal">
              <li>Conteúdo de ponta sobre IA, automação e supply chain inteligente</li>
              <li>Networking qualificado com todo o ecossistema logtech</li>
              <li>Rodadas de negócios entre startups, indústria e investidores</li>
            </ul>
            <a href="#inscricao" className="btn btn-blue reveal">Garanta sua vaga</a>
          </div>
        </div>
      </section>

      {/* ── SPEAKERS ────────────────────────────────────────────── */}
      <section className="speakers" id="palestrantes">
        <div className="container">
          <div className="center">
            <div className="kicker reveal">Speakers</div>
            <h2 className="sec-title reveal">Palestrantes confirmados</h2>
            <p className="sec-sub center reveal">As vagas para cada palestra são limitadas e preenchidas por ordem de chegada.</p>
          </div>
          <div className="speaker-grid">
            {[
              { name: 'Ricardo Meireles',  initials: 'RM', role: 'CEO',                    org: 'FreteAI · Logística Preditiva', img: 'Ricardo-Meireles' },
              { name: 'Camila Andrade',    initials: 'CA', role: 'Head de Supply Chain',   org: 'Amazon Brasil',                 img: 'Camila-Andrade' },
              { name: 'Thiago Nakamura',   initials: 'TN', role: 'Diretor de Inovação',    org: 'Porto de Paranaguá',            img: 'Thiago-Nakamura' },
              { name: 'Juliana Sales',     initials: 'JS', role: 'Especialista em IA',     org: 'Autora de "Cadeias Inteligentes"', img: 'Juliana-Sales' },
              { name: 'Felipe Barros',     initials: 'FB', role: 'Fundador',               org: 'RotaZero · Last Mile',          img: 'Felipe-Barros' },
              { name: 'Marina Okamoto',    initials: 'MO', role: 'VP de Operações',        org: 'Loggi',                         img: 'Marina-Okamoto' },
              { name: 'Daniel Lima',       initials: 'DL', role: 'Pesquisador',            org: 'Robótica & Automação · USP',    img: 'Daniel-Lima' },
              { name: 'Ana Vasconcelos',   initials: 'AV', role: 'Sócia',                  org: 'Nexa Ventures · Investimentos', img: 'Ana-Vasconcelos' },
            ].map((s, i) => (
              <div key={i} className="speaker reveal">
                <div className="speaker-photo">
                  <img src={`/logia/img/${s.img}.png`} alt={s.name} onError={imgErr} />
                  {s.initials}
                </div>
                <div className="speaker-body">
                  <h3>{s.name}</h3>
                  <div className="role">{s.role}</div>
                  <div className="org">{s.org}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="speakers-note reveal">Palcos e Arena possuem capacidade definida conforme normas do Corpo de Bombeiros. As vagas serão preenchidas por ordem de chegada.</div>
          <div className="center" style={{ marginTop: 34 }}>
            <a href="#programacao" className="btn btn-lime reveal">Ver todos os palestrantes</a>
          </div>
        </div>
      </section>

      {/* ── FOTO EVENTO ─────────────────────────────────────────── */}
      <section className="evento">
        <img src="/logia/img/foto-evento.png" alt="" onError={imgErr} />
      </section>

      {/* ── TRACKS ──────────────────────────────────────────────── */}
      <section className="tracks">
        <div className="container">
          <div className="center">
            <div className="kicker reveal">Explore</div>
            <h2 className="sec-title reveal">Trilhas de conteúdo</h2>
            <p className="sec-sub center reveal">Dividimos o evento em 3 trilhas temáticas para você focar no que realmente move o seu negócio.</p>
          </div>
          <div className="track-grid">
            <div className="track reveal d1"><div className="num">01</div><h3>Automatizar</h3><p>IA, robótica e sistemas autônomos que aceleram armazéns, frotas e a operação de ponta a ponta.</p></div>
            <div className="track reveal d2"><div className="num">02</div><h3>Conectar</h3><p>Dados, integração e visibilidade em tempo real ligando toda a cadeia de suprimentos.</p></div>
            <div className="track reveal d3"><div className="num">03</div><h3>Otimizar</h3><p>Modelos preditivos, roteirização inteligente e eficiência para reduzir custo e emissões.</p></div>
          </div>
          <div className="center" style={{ marginTop: 40 }}>
            <a href="#programacao" className="btn btn-blue reveal">Programação Completa</a>
          </div>
        </div>
      </section>

      {/* ── NUMBERS ─────────────────────────────────────────────── */}
      <section className="numbers">
        <div className="container">
          <div className="num-grid">
            <div className="num-item reveal d1"><div className="n" data-target="60"   data-suffix="+">0</div><div className="lbl">Palestrantes</div></div>
            <div className="num-item reveal d2"><div className="n" data-target="8000" data-suffix="+">0</div><div className="lbl">Participantes</div></div>
            <div className="num-item reveal d3"><div className="n" data-target="120"  data-suffix="+">0</div><div className="lbl">Logtechs expositoras</div></div>
            <div className="num-item reveal d4"><div className="n" data-target="72"   data-suffix="h">0</div><div className="lbl">De conteúdo</div></div>
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE ──────────────────────────────────────────── */}
      <section className="experience" id="experience">
        <div className="container">
          <div className="exp-head">
            <div className="kicker reveal">2026</div>
            <h2 className="sec-title reveal">LogTech Experience</h2>
            <p className="sec-sub reveal">Sua startup em uma das maiores vitrines de inovação logística do Brasil. Uma jornada completa para preparar seu negócio a se destacar diante de investidores e grandes embarcadores.</p>
          </div>
          <div className="exp-grid">
            {[
              { title: 'Capacitação de Alto Impacto',  text: 'Trilhas online e presenciais focadas na evolução real do modelo de negócio logtech.' },
              { title: 'Networking Qualificado',        text: 'Conexão direta com os principais players do ecossistema de logística e supply chain.' },
              { title: 'Exposição em Grande Escala',    text: 'Até 120 logtechs selecionadas para estandes exclusivos durante os três dias do evento.' },
              { title: 'Rodadas de Negócios',           text: 'Apresente sua solução para investidores e empresas-âncora do setor logístico.' },
              { title: 'Aceleração Growth Lab',         text: 'Programa intensivo de crescimento para startups do Paraná, em parceria com a NEXA Logtech.' },
              { title: 'Workshops Práticos',            text: 'Imersões para resolver desafios reais de operação, roteirização e captação de recursos.' },
            ].map((c, i) => (
              <div key={i} className="exp-card reveal"><h4>{c.title}</h4><p>{c.text}</p></div>
            ))}
          </div>
          <div className="exp-actions reveal">
            <a href="#inscricao" className="btn btn-red">Inscreva sua logtech</a>
            <a href="#experience" className="btn btn-outline">Conheça a jornada</a>
          </div>
        </div>
      </section>

      {/* ── SCHEDULE ────────────────────────────────────────────── */}
      <section className="schedule" id="programacao">
        <div className="container">
          <div className="center">
            <div className="kicker reveal">Programação</div>
            <h2 className="sec-title reveal">O que rola nos 3 dias</h2>
          </div>
          <div className="days reveal">
            {[['d1','14 OUT — Qua'],['d2','15 OUT — Qui'],['d3','16 OUT — Sex']].map(([id, label]) => (
              <button key={id} className={`day-btn${activeDay === id ? ' active' : ''}`} onClick={() => setActiveDay(id)}>{label}</button>
            ))}
          </div>
          <div className="sched-list">

            {/* Dia 1 */}
            <div className={`sched-day${activeDay === 'd1' ? ' active' : ''}`}>
              {[
                { time:'13:00', title:'Abertura Oficial LOG.IA 2026',           sub:'Palco Principal · Ricardo Meireles', tag:'tag-b', label:'Conectar' },
                { time:'14:30', title:'IA preditiva na cadeia de suprimentos',  sub:'Arena Inovação · Juliana Sales',      tag:'tag-r', label:'Otimizar' },
                { time:'16:00', title:'Armazéns autônomos: o futuro chegou',    sub:'Palco Tech · Daniel Lima',           tag:'tag-l', label:'Automatizar' },
                { time:'18:30', title:'Rodada de investimentos logtech',        sub:'Sala de Negócios · Ana Vasconcelos',  tag:'tag-b', label:'Conectar' },
              ].map((r, i) => (
                <div key={i} className="sched-row reveal">
                  <div className="sched-time">{r.time}</div>
                  <div className="sched-info"><h4>{r.title}</h4><span>{r.sub}</span></div>
                  <span className={`sched-tag ${r.tag}`}>{r.label}</span>
                </div>
              ))}
            </div>

            {/* Dia 2 */}
            <div className={`sched-day${activeDay === 'd2' ? ' active' : ''}`}>
              {[
                { time:'13:30', title:'Last mile inteligente e sustentável',  sub:'Palco Principal · Felipe Barros',     tag:'tag-r', label:'Otimizar' },
                { time:'15:00', title:'Portos 4.0 e digitalização',           sub:'Arena Inovação · Thiago Nakamura',    tag:'tag-l', label:'Automatizar' },
                { time:'17:00', title:'Escalando operações com dados',        sub:'Palco Tech · Marina Okamoto',         tag:'tag-b', label:'Conectar' },
                { time:'19:00', title:'Pitch Day — Top 10 Logtechs',         sub:'Palco Principal',                     tag:'tag-r', label:'Otimizar' },
              ].map((r, i) => (
                <div key={i} className="sched-row reveal">
                  <div className="sched-time">{r.time}</div>
                  <div className="sched-info"><h4>{r.title}</h4><span>{r.sub}</span></div>
                  <span className={`sched-tag ${r.tag}`}>{r.label}</span>
                </div>
              ))}
            </div>

            {/* Dia 3 */}
            <div className={`sched-day${activeDay === 'd3' ? ' active' : ''}`}>
              {[
                { time:'09:00', title:'Supply chain global e IA generativa',              sub:'Palco Principal · Camila Andrade', tag:'tag-l', label:'Automatizar' },
                { time:'11:00', title:'Workshop: roteirização com machine learning',      sub:'Sala Workshop',                   tag:'tag-r', label:'Otimizar' },
                { time:'14:00', title:'O futuro do trabalho na logística',                sub:'Arena Inovação',                  tag:'tag-b', label:'Conectar' },
                { time:'16:00', title:'Premiação & Encerramento',                        sub:'Palco Principal',                 tag:'tag-l', label:'Automatizar' },
              ].map((r, i) => (
                <div key={i} className="sched-row reveal">
                  <div className="sched-time">{r.time}</div>
                  <div className="sched-info"><h4>{r.title}</h4><span>{r.sub}</span></div>
                  <span className={`sched-tag ${r.tag}`}>{r.label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── NEWS ────────────────────────────────────────────────── */}
      <section className="news" id="conteudo">
        <div className="container">
          <div className="center">
            <div className="kicker reveal">LOG.IA 2026</div>
            <h2 className="sec-title reveal">Conteúdo</h2>
          </div>
          <div className="news-grid">
            {[
              { img: 'automatizar', cat: 'cat-l', catLabel: 'Automatizar', title: 'Como a IA está redesenhando o centro de distribuição', text: 'Mais que apoiar tarefas, algoritmos passam a reorganizar fluxos inteiros dentro do armazém.' },
              { img: 'otimizar',    cat: 'cat-r', catLabel: 'Otimizar',    title: 'Roteirização preditiva pode cortar até 20% do custo de frete', text: 'Modelos que aprendem com o trânsito e a demanda transformam a operação de última milha.' },
              { img: 'conectar',    cat: 'cat-b', catLabel: 'Conectar',    title: 'Visibilidade em tempo real: o novo padrão da cadeia', text: 'Integrar dados de ponta a ponta deixou de ser diferencial e virou requisito competitivo.' },
            ].map((n, i) => (
              <div key={i} className="news-card reveal">
                <div className="news-thumb">
                  <img src={`/logia/img/${n.img}.png`} alt={n.title} onError={imgErr} />
                  <span className={`news-cat ${n.cat}`}>{n.catLabel}</span>
                </div>
                <div className="news-body">
                  <h4>{n.title}</h4>
                  <p>{n.text}</p>
                  <div className="date">03 de julho de 2026 · <a href="#conteudo" className="read">Ler mais</a></div>
                </div>
              </div>
            ))}
          </div>
          <div className="center" style={{ marginTop: 40 }}>
            <a href="#conteudo" className="btn btn-outline reveal">Veja todas</a>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="cta-banner" id="inscricao">
        <div className="container">
          <h2 className="reveal">Faça parte dessa conexão que move o mundo!</h2>
          <a href="#inscricao" className="btn btn-lime reveal">Inscrição Gratuita</a>
        </div>
      </section>

      {/* ── SPONSORS ────────────────────────────────────────────── */}
      <section className="sponsors">
        <div className="container">
          <div className="center">
            <div className="kicker reveal">Patrocinadores</div>
            <h2 className="sec-title reveal">Parceiros que movem a inovação</h2>
          </div>
          <div className="sponsor-grid">
            {[
              { file: 'viasoft.jpg',          label: 'VIASOFT'      },
              { file: 'nexa.jpg',             label: 'NEXA LOGTECH' },
              { file: 'freteai.jpg',          label: 'FRETEAI'      },
              { file: 'loggi.jpg',            label: 'LOGGI'        },
              { file: 'porto-do-parana.jpg',  label: 'PORTO PR'     },
              { file: 'rotazero.jpg',         label: 'ROTAZERO'     },
              { file: 'supplylog.jpg',        label: 'SUPPLY+'      },
              { file: 'cargotech.jpg',        label: 'CARGOTECH'    },
            ].map((s, i) => (
              <div key={i} className="sponsor reveal">
                <img src={`/logia/img/${s.file}`} alt={s.label} onError={imgErr} />
              </div>
            ))}
          </div>
          <div className="center">
            <a href="#inscricao" className="btn btn-red reveal">Quer ser patrocinador? Saiba como</a>
          </div>
        </div>
      </section>

      {/* ── BACK TO TOP ─────────────────────────────────────────── */}
      <button id="toTop" aria-label="Voltar ao topo">↑</button>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer>
        <div className="container">
          <div className="foot-grid">
            <div>
              <div className="foot-logo"><span className="l">LOG</span><span className="p">.</span><span className="ia">IA</span> <span style={{ fontSize: 14 }}>2026</span></div>
              <p>Inteligência que move o mundo. O maior encontro de IA aplicada à logística do Brasil.</p>
              <div className="realizacao">
                <small>Realização</small>
                <div className="nexa">
                  <img className="nexa-img" src="/logia/img/LOGO-NEXA.png" alt="NEXA Logtech" onError={imgErr} />
                </div>
              </div>
              <div className="socials">
                <a href="#" aria-label="Instagram">IG</a>
                <a href="#" aria-label="LinkedIn">in</a>
                <a href="#" aria-label="YouTube">YT</a>
              </div>
            </div>
            <div className="foot-col">
              <h5>Evento</h5>
              <a href="#sobre">Sobre o LOG.IA</a>
              <a href="#palestrantes">Palestrantes</a>
              <a href="#programacao">Programação</a>
              <a href="#experience">LogTech Experience</a>
            </div>
            <div className="foot-col">
              <h5>Participe</h5>
              <a href="#inscricao">Inscrição gratuita</a>
              <a href="#experience">Seja expositor</a>
              <a href="#inscricao">Seja patrocinador</a>
              <a href="#programacao">Programação</a>
            </div>
            <div className="foot-col">
              <h5>Local</h5>
              <a href="#">Viasoft Experience</a>
              <a href="#">Curitiba — PR</a>
              <a href="#">14 a 16 de Outubro</a>
              <a href="#">contato@logia.com.br</a>
            </div>
          </div>
          <div className="foot-bottom">
            <p>© 2026 LOG.IA. Todos os direitos reservados.</p>
            <p>Evento fictício criado para processo seletivo.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
