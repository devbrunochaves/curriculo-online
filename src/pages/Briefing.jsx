'use client'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useRouter } from 'next/navigation'

/* ── EmailJS config — preencha após criar conta em emailjs.com ─────────
   SERVICE_ID  → Aba "Email Services" no painel EmailJS
   TEMPLATE_ID → Aba "Email Templates" no painel EmailJS
   PUBLIC_KEY  → Aba "Account" > API Keys                              */
const EMAILJS_SERVICE_ID  = 'service_ty1xjdj'
const EMAILJS_TEMPLATE_ID = 'template_4q6yl3d'
const EMAILJS_PUBLIC_KEY  = 'VcTdeR1dJd4pwu4VX'

/* ── Dados do formulário ─────────────────────────────────────────────── */
const SERVICOS = [
  'Identidade Visual Completa','Criação de Logo','Redesign de Logo',
  'Social Media (Posts/Stories)','Design de Site / Landing Page',
  'Material Impresso','Embalagem / Rótulo','UI/UX para App/Plataforma','Outro',
]
const FAIXA_ETARIA = ['Menos de 18','18 – 25 anos','25 – 35 anos','35 – 50 anos','Acima de 50']
const PERSONALIDADE = [
  'Moderna','Clássica','Minimalista','Luxuosa/Premium','Jovem / Descolada',
  'Séria / Formal','Divertida','Criativa','Tecnológica','Natural / Orgânica',
  'Sustentável','Feminina','Masculina','Neutra','Sofisticada','Acessível / Popular',
]
const TOM = ['Formal','Informal / Amigável','Técnico','Descontraído','Inspirador','Autoritário / Líder']
const TIPOGRAFIA = ['Serifada / Clássica','Sem Serifa / Moderna','Manuscrita / Humanizada','Geométrica','Display / Impactante']
const ESTILO_VISUAL = [
  'Minimalista','Bold / Impactante','Flat / Plano','Ilustrativo','Fotográfico',
  'Geométrico','Orgânico / Fluido','Vintage / Retrô','Futurista',
]
const APLICACOES = [
  'Instagram','Facebook','TikTok','YouTube','LinkedIn','Pinterest','Twitter / X',
  'Site / Blog','Cartão de Visita','Papelaria','Embalagem','Outdoor / Banner',
  'Uniforme / Camiseta','PDV / Loja Física',
]
const PRAZOS = ['Urgente (até 7 dias)','Até 15 dias','Até 30 dias','45 dias ou mais','Flexível']
const ORCAMENTOS = [
  'Até R$ 500','R$ 500 – R$ 1.000','R$ 1.000 – R$ 2.000',
  'R$ 2.000 – R$ 5.000','Acima de R$ 5.000','A combinar',
]
const COMO_CONHECEU = ['Instagram','LinkedIn','Indicação de amigo','Behance','Google','Outros']

/* ── Componentes reutilizáveis ───────────────────────────────────────── */
function SectionTitle({ number, title, c }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '40px 0 20px' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg, #37a8de, #084a8a)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 900, fontSize: 14,
      }}>{number}</div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: c.primary, margin: 0, letterSpacing: -0.5 }}>
        {title}
      </h2>
    </div>
  )
}

function Field({ label, required, children, c }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.muted2, marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, c, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '10px 14px', borderRadius: 10,
        border: `1.5px solid ${c.border}`, background: c.card,
        color: c.primary, fontSize: 14, outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
      }}
      onFocus={e => e.target.style.borderColor = '#37a8de'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 4, c }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%', padding: '10px 14px', borderRadius: 10,
        border: `1.5px solid ${c.border}`, background: c.card,
        color: c.primary, fontSize: 14, outline: 'none', resize: 'vertical',
        transition: 'border-color 0.2s', fontFamily: 'inherit',
        boxSizing: 'border-box',
      }}
      onFocus={e => e.target.style.borderColor = '#37a8de'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
    />
  )
}

function CheckGroup({ options, selected, onChange, c }) {
  const toggle = (opt) => {
    onChange(selected.includes(opt)
      ? selected.filter(s => s !== opt)
      : [...selected, opt])
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            style={{
              padding: '7px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
              border: `1.5px solid ${active ? '#37a8de' : c.border}`,
              background: active ? 'rgba(55,168,222,0.12)' : c.card,
              color: active ? '#37a8de' : c.muted2,
              fontWeight: active ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >{opt}</button>
        )
      })}
    </div>
  )
}

function RadioGroup({ options, selected, onChange, c }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const active = selected === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: '7px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
              border: `1.5px solid ${active ? '#37a8de' : c.border}`,
              background: active ? 'rgba(55,168,222,0.12)' : c.card,
              color: active ? '#37a8de' : c.muted2,
              fontWeight: active ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >{opt}</button>
        )
      })}
    </div>
  )
}

function YesNo({ value, onChange, c }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {['Sim', 'Não', 'Em desenvolvimento'].map(opt => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: '7px 18px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
              border: `1.5px solid ${active ? '#37a8de' : c.border}`,
              background: active ? 'rgba(55,168,222,0.12)' : c.card,
              color: active ? '#37a8de' : c.muted2,
              fontWeight: active ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >{opt}</button>
        )
      })}
    </div>
  )
}

function Divider({ c }) {
  return <div style={{ height: 1, background: c.border, margin: '8px 0' }} />
}

/* ── Página principal ────────────────────────────────────────────────── */
export default function Briefing() {
  const { c, isDark } = useApp()
  const router = useRouter()

  const [status, setStatus] = useState('idle') // idle | sending | success | error

  /* Estado do formulário */
  const [form, setForm] = useState({
    /* Seção 1 */
    nome: '', empresa: '', email: '', whatsapp: '', cidade: '',
    /* Seção 2 */
    servicos: [], temMarca: '', descricaoNegocio: '', segmento: '',
    /* Seção 3 */
    publicoAlvo: '', faixaEtaria: [], concorrentes: '', diferencial: '',
    /* Seção 4 */
    personalidade: [], tomComunicacao: [],
    /* Seção 5 */
    temPaleta: '', cores: '', coresNao: '', tipografia: [], estiloVisual: [],
    /* Seção 6 */
    aplicacoes: [],
    /* Seção 7 */
    referencias: '', linkReferencias: '', oQueAdmira: '',
    /* Seção 8 */
    prazo: '', orcamento: '',
    /* Seção 9 */
    observacoes: '', comoConheceu: [],
  })

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }))
  const setInput = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  /* ── Submissão ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nome || !form.email || !form.whatsapp) {
      alert('Preencha pelo menos: Nome, E-mail e WhatsApp.')
      return
    }

    setStatus('sending')

    const body = `
BRIEFING — NOVO CLIENTE

━━━ SOBRE O CLIENTE ━━━
Nome: ${form.nome}
Empresa: ${form.empresa}
E-mail: ${form.email}
WhatsApp: ${form.whatsapp}
Cidade: ${form.cidade}

━━━ O PROJETO ━━━
Serviços: ${form.servicos.join(', ') || '—'}
Já tem marca: ${form.temMarca || '—'}
Descrição do negócio: ${form.descricaoNegocio || '—'}
Segmento: ${form.segmento || '—'}

━━━ PÚBLICO E MERCADO ━━━
Público-alvo: ${form.publicoAlvo || '—'}
Faixa etária: ${form.faixaEtaria.join(', ') || '—'}
Concorrentes: ${form.concorrentes || '—'}
Diferencial: ${form.diferencial || '—'}

━━━ PERSONALIDADE DA MARCA ━━━
Personalidade: ${form.personalidade.join(', ') || '—'}
Tom de comunicação: ${form.tomComunicacao.join(', ') || '—'}

━━━ IDENTIDADE VISUAL ━━━
Tem paleta: ${form.temPaleta || '—'}
Cores desejadas: ${form.cores || '—'}
Cores que não quer: ${form.coresNao || '—'}
Tipografia: ${form.tipografia.join(', ') || '—'}
Estilo visual: ${form.estiloVisual.join(', ') || '—'}

━━━ APLICAÇÕES ━━━
Plataformas: ${form.aplicacoes.join(', ') || '—'}

━━━ REFERÊNCIAS ━━━
Marcas referência: ${form.referencias || '—'}
Links: ${form.linkReferencias || '—'}
O que admira: ${form.oQueAdmira || '—'}

━━━ PRAZO E ORÇAMENTO ━━━
Prazo: ${form.prazo || '—'}
Orçamento: ${form.orcamento || '—'}

━━━ INFORMAÇÕES ADICIONAIS ━━━
Observações: ${form.observacoes || '—'}
Como conheceu: ${form.comoConheceu.join(', ') || '—'}
`

    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id:  EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id:     EMAILJS_PUBLIC_KEY,
          template_params: {
            from_name:  form.nome,
            from_email: form.email,
            to_email:   'brunochavesuk@icloud.com',
            subject:    `Briefing — ${form.nome} | ${form.empresa || 'Sem empresa'}`,
            message:    body,
          },
        }),
      })

      if (res.ok) { setStatus('success') }
      else        { setStatus('error') }
    } catch {
      setStatus('error')
    }
  }

  /* ── Tela de sucesso ── */
  if (status === 'success') {
    return (
      <div style={{
        minHeight: '100vh', background: c.bg1, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 24,
        transition: 'background 0.3s',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <h2 style={{ color: c.primary, fontWeight: 900, fontSize: 28, marginBottom: 12 }}>
            Briefing enviado com sucesso!
          </h2>
          <p style={{ color: c.muted, fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            Obrigado! Recebi seu briefing e entrarei em contato em breve pelo e-mail ou WhatsApp informado.
          </p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary"
            style={{ fontSize: 14, padding: '12px 28px' }}
          >
            ← Voltar ao portfólio
          </button>
        </div>
      </div>
    )
  }

  /* ── Formulário ── */
  return (
    <div style={{ background: c.bg1, minHeight: '100vh', transition: 'background 0.3s' }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #37a8de 0%, #084a8a 100%)',
        padding: '60px 24px 48px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 280, height: 280,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
              color: '#fff', borderRadius: 10, padding: '6px 14px', cursor: 'pointer',
              fontSize: 13, marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            ← Voltar ao portfólio
          </button>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 999, padding: '4px 14px', fontSize: 12, color: '#fff',
            marginBottom: 16, marginLeft: 12,
          }}>
            ✦ Briefing gratuito
          </div>
          <h1 style={{
            color: '#fff', fontWeight: 900, fontSize: 'clamp(28px,5vw,42px)',
            margin: '0 0 12px', letterSpacing: -1,
          }}>
            Briefing de Projeto
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 1.7, maxWidth: 560, margin: 0 }}>
            Quanto mais detalhes você preencher, mais assertiva será a minha proposta.
            Leva menos de 5 minutos e é totalmente gratuito.
          </p>
        </div>
      </div>

      {/* ── Formulário ── */}
      <form onSubmit={handleSubmit} style={{ maxWidth: 760, margin: '0 auto', padding: '8px 24px 60px' }}>

        {/* ── 1. Sobre você ── */}
        <SectionTitle number={1} title="Sobre você" c={c} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <Field label="Nome completo" required c={c}>
            <Input value={form.nome} onChange={setInput('nome')} placeholder="Seu nome completo" c={c} />
          </Field>
          <Field label="Nome da empresa / negócio" c={c}>
            <Input value={form.empresa} onChange={setInput('empresa')} placeholder="Ex: Studio Criativo" c={c} />
          </Field>
          <Field label="E-mail" required c={c}>
            <Input value={form.email} onChange={setInput('email')} placeholder="seu@email.com" type="email" c={c} />
          </Field>
          <Field label="WhatsApp" required c={c}>
            <Input value={form.whatsapp} onChange={setInput('whatsapp')} placeholder="(27) 9 9999-9999" c={c} />
          </Field>
          <Field label="Cidade / Estado" c={c}>
            <Input value={form.cidade} onChange={setInput('cidade')} placeholder="Ex: Serra, ES" c={c} />
          </Field>
        </div>

        <Divider c={c} />

        {/* ── 2. O Projeto ── */}
        <SectionTitle number={2} title="O Projeto" c={c} />
        <Field label="Qual serviço você precisa? (pode marcar mais de um)" c={c}>
          <CheckGroup options={SERVICOS} selected={form.servicos} onChange={set('servicos')} c={c} />
        </Field>
        <Field label="Você já possui marca / logo?" c={c}>
          <YesNo value={form.temMarca} onChange={set('temMarca')} c={c} />
        </Field>
        <Field label="Descreva seu negócio com suas palavras" c={c}>
          <Textarea value={form.descricaoNegocio} onChange={setInput('descricaoNegocio')}
            placeholder="O que você faz, como funciona, há quanto tempo existe..." c={c} rows={4} />
        </Field>
        <Field label="Segmento de atuação" c={c}>
          <Input value={form.segmento} onChange={setInput('segmento')}
            placeholder="Ex: Gastronomia, Moda, Tecnologia, Saúde..." c={c} />
        </Field>

        <Divider c={c} />

        {/* ── 3. Público e Mercado ── */}
        <SectionTitle number={3} title="Público e Mercado" c={c} />
        <Field label="Quem é o seu público-alvo?" c={c}>
          <Textarea value={form.publicoAlvo} onChange={setInput('publicoAlvo')}
            placeholder="Gênero, interesses, estilo de vida, profissão..." c={c} rows={3} />
        </Field>
        <Field label="Faixa etária predominante" c={c}>
          <CheckGroup options={FAIXA_ETARIA} selected={form.faixaEtaria} onChange={set('faixaEtaria')} c={c} />
        </Field>
        <Field label="Cite concorrentes ou marcas do mesmo segmento" c={c}>
          <Textarea value={form.concorrentes} onChange={setInput('concorrentes')}
            placeholder="Nomes de empresas, sites ou perfis similares ao seu..." c={c} rows={2} />
        </Field>
        <Field label="Qual o seu diferencial em relação aos concorrentes?" c={c}>
          <Textarea value={form.diferencial} onChange={setInput('diferencial')}
            placeholder="O que te faz único? Por que os clientes escolhem você?" c={c} rows={3} />
        </Field>

        <Divider c={c} />

        {/* ── 4. Personalidade da Marca ── */}
        <SectionTitle number={4} title="Personalidade da Marca" c={c} />
        <Field label="Como você quer que sua marca seja percebida?" c={c}>
          <CheckGroup options={PERSONALIDADE} selected={form.personalidade} onChange={set('personalidade')} c={c} />
        </Field>
        <Field label="Tom de comunicação da marca" c={c}>
          <CheckGroup options={TOM} selected={form.tomComunicacao} onChange={set('tomComunicacao')} c={c} />
        </Field>

        <Divider c={c} />

        {/* ── 5. Identidade Visual ── */}
        <SectionTitle number={5} title="Identidade Visual" c={c} />
        <Field label="Você já tem uma paleta de cores definida?" c={c}>
          <YesNo value={form.temPaleta} onChange={set('temPaleta')} c={c} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <Field label="Cores que representam sua marca" c={c}>
            <Input value={form.cores} onChange={setInput('cores')}
              placeholder="Ex: azul marinho, dourado, branco..." c={c} />
          </Field>
          <Field label="Cores que você NÃO quer usar" c={c}>
            <Input value={form.coresNao} onChange={setInput('coresNao')}
              placeholder="Ex: vermelho, amarelo forte..." c={c} />
          </Field>
        </div>
        <Field label="Preferência de tipografia" c={c}>
          <CheckGroup options={TIPOGRAFIA} selected={form.tipografia} onChange={set('tipografia')} c={c} />
        </Field>
        <Field label="Estilo visual preferido" c={c}>
          <CheckGroup options={ESTILO_VISUAL} selected={form.estiloVisual} onChange={set('estiloVisual')} c={c} />
        </Field>

        <Divider c={c} />

        {/* ── 6. Aplicações ── */}
        <SectionTitle number={6} title="Onde será aplicada a identidade?" c={c} />
        <Field label="Selecione todos os canais e materiais que serão usados" c={c}>
          <CheckGroup options={APLICACOES} selected={form.aplicacoes} onChange={set('aplicacoes')} c={c} />
        </Field>

        <Divider c={c} />

        {/* ── 7. Referências ── */}
        <SectionTitle number={7} title="Referências Visuais" c={c} />
        <Field label="Marcas ou logos que você admira (podem ser do mesmo segmento ou não)" c={c}>
          <Textarea value={form.referencias} onChange={setInput('referencias')}
            placeholder="Ex: Apple, Nubank, Starbucks..." c={c} rows={2} />
        </Field>
        <Field label="Links de referência (Pinterest, sites, perfis)" c={c}>
          <Input value={form.linkReferencias} onChange={setInput('linkReferencias')}
            placeholder="https://..." c={c} />
        </Field>
        <Field label="O que você admira nessas referências?" c={c}>
          <Textarea value={form.oQueAdmira} onChange={setInput('oQueAdmira')}
            placeholder="As cores, a simplicidade, a tipografia, a sensação que transmite..." c={c} rows={3} />
        </Field>

        <Divider c={c} />

        {/* ── 8. Prazo e Orçamento ── */}
        <SectionTitle number={8} title="Prazo e Investimento" c={c} />
        <Field label="Qual o prazo desejado para entrega?" c={c}>
          <RadioGroup options={PRAZOS} selected={form.prazo} onChange={set('prazo')} c={c} />
        </Field>
        <Field label="Qual o seu investimento disponível para este projeto?" c={c}>
          <RadioGroup options={ORCAMENTOS} selected={form.orcamento} onChange={set('orcamento')} c={c} />
        </Field>

        <Divider c={c} />

        {/* ── 9. Informações adicionais ── */}
        <SectionTitle number={9} title="Informações Adicionais" c={c} />
        <Field label="Tem alguma observação, detalhe ou dúvida que queira compartilhar?" c={c}>
          <Textarea value={form.observacoes} onChange={setInput('observacoes')}
            placeholder="Fique à vontade para escrever qualquer informação que considere importante..." c={c} rows={4} />
        </Field>
        <Field label="Como conheceu meu trabalho?" c={c}>
          <CheckGroup options={COMO_CONHECEU} selected={form.comoConheceu} onChange={set('comoConheceu')} c={c} />
        </Field>

        {/* ── Erro ── */}
        {status === 'error' && (
          <div style={{
            margin: '16px 0', padding: '14px 18px', borderRadius: 12,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444', fontSize: 14,
          }}>
            ⚠️ Erro ao enviar. Verifique as configurações do EmailJS ou tente novamente.
          </div>
        )}

        {/* ── Submit ── */}
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="btn-primary"
            style={{ fontSize: 15, padding: '14px 40px', opacity: status === 'sending' ? 0.7 : 1 }}
          >
            {status === 'sending' ? '⏳ Enviando...' : '✉ Enviar Briefing'}
          </button>
          <p style={{ color: c.dim, fontSize: 12, marginTop: 12 }}>
            Responderei em até 24 horas úteis pelo e-mail ou WhatsApp informado.
          </p>
        </div>

      </form>
    </div>
  )
}
