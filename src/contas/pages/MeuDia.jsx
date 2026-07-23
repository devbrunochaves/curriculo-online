import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  BadgeCheck,
  Banknote,
  Building2,
  CalendarClock,
  CalendarDays,
  Car,
  ClipboardList,
  FileText,
  HeartPulse,
  Landmark,
  ListChecks,
  MessageCircle,
  PiggyBank,
  Plus,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  Wrench,
} from 'lucide-react'
import {
  format, parseISO, differenceInDays, addDays, getDayOfYear,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Button,
  EmptyState,
  MetricCard,
  SectionCard,
  Skeleton,
  StatusBadge,
} from '../components/ui'

/* ── Category colors (mirrors Agenda.jsx) ───────────────────────── */
const AGENDA_CATS = {
  medico:      '#ef4444',
  viagem:      '#3b82f6',
  aniversario: '#f59e0b',
  trabalho:    '#6366f1',
  casa:        '#10b981',
  financeiro:  '#8b5cf6',
  estudos:     '#06b6d4',
  veiculo:     '#f97316',
  familia:     '#ec4899',
  outros:      '#64748b',
}

/* ── Helpers ────────────────────────────────────────────────────── */
const fmtBRL = v =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function getGreeting(name) {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return `Bom dia, ${name}!`
  if (h >= 12 && h < 18) return `Boa tarde, ${name}!`
  return `Boa noite, ${name}!`
  if (h >= 5 && h < 12)  return `☀️ Bom dia, ${name}!`
  if (h >= 12 && h < 18) return `🌤️ Boa tarde, ${name}!`
  return `🌙 Boa noite, ${name}!`
}

const todayLabel = () =>
  format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    .replace(/^\w/, c => c.toUpperCase())

/* ── Urgency badge component ────────────────────────────────────── */
function UrgencyBadge({ urgency }) {
  const tones = { urgente: 'danger', hoje: 'info', breve: 'warning', ok: 'success' }
  const labels = { urgente: 'Urgente', hoje: 'Hoje', breve: 'Em breve', ok: 'Ok' }
  return <StatusBadge tone={tones[urgency] || 'warning'} size="sm">{labels[urgency] || urgency}</StatusBadge>
}

function StaticListItem({ icon: Icon, title, meta, value, tone = 'accent', badge }) {
  return (
    <div className="c-meudia-list-item">
      <span className={`c-meudia-item-icon c-meudia-item-icon--${tone}`} aria-hidden="true">
        <Icon />
      </span>
      <span className="c-meudia-item-copy">
        <span className="c-meudia-item-title">{title}</span>
        {meta && <span className="c-meudia-item-meta">{meta}</span>}
      </span>
      {value && <span className="c-meudia-item-value">{value}</span>}
      {badge}
    </div>
  )
}

function ListItem({ icon, title, meta, value, tone = 'accent', badge, onClick }) {
  return (
    <button type="button" className="c-meudia-list-button" onClick={onClick}>
      <StaticListItem icon={icon} title={title} meta={meta} value={value} tone={tone} badge={badge} />
    </button>
  )
}

/* ══ Main Component ══════════════════════════════════════════════ */
export default function MeuDia({ userName: userNameProp }) {
  const navigate = useNavigate()
  const [userName, setUserName] = useState(userNameProp || 'você')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    agendaHoje:    [],
    agendaProx:    [],
    boletos:       [],
    documentosVenc: [],
    manutAgendadas: [],
    garantiasVenc: [],
    frases:        [],
    gastosTotal:   0,
    contasFixas:   0,
    listaCompras:  [],
    boletosPendentes: 0,
    metas:          [],
    metasAlerta:    [],
    veiculosAlerta: [],
    saudeConsultas: [],
    saudeVacinas:   [],
  })

  /* ── Resolve display name ───────────────────────────────────── */
  useEffect(() => {
    if (userNameProp) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      if (user.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name)
      } else if (user.email) {
        const name = user.email.split('@')[0]
        setUserName(name.charAt(0).toUpperCase() + name.slice(1))
      }
    })
  }, [userNameProp])

  /* ── Fetch all data ─────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true)
    const today  = format(new Date(), 'yyyy-MM-dd')
    const plus3  = format(addDays(new Date(), 3),  'yyyy-MM-dd')
    const plus7  = format(addDays(new Date(), 7),  'yyyy-MM-dd')
    const plus30 = format(addDays(new Date(), 30), 'yyyy-MM-dd')
    const plus60 = format(addDays(new Date(), 60), 'yyyy-MM-dd')

    const [
      agendaHojeR,
      agendaProxR,
      boletosR,
      documentosVencR,
      documentos60R,
      manutAgendadasR,
      garantiasVencR,
      frasesR,
      gastosTotalR,
      contasFixasR,
      listaComprasR,
      boletosPendentesR,
      metasR,
      metasAlertaR,
      veiculosAlertaR,
      saudeConsultasR,
      saudeVacinasR,
    ] = await Promise.allSettled([
      supabase.from('agenda_eventos').select('*').eq('data_inicio', today).order('hora_inicio'),
      supabase.from('agenda_eventos').select('*').gt('data_inicio', today).lte('data_inicio', plus7).order('data_inicio').order('hora_inicio'),
      supabase.from('apartamento_boletos').select('*').neq('status', 'pago').lte('data_vencimento', plus3).order('data_vencimento'),
      supabase.from('documentos').select('id,nome,data_validade').not('data_validade', 'is', null).lte('data_validade', plus30).gte('data_validade', today).order('data_validade'),
      supabase.from('documentos').select('id,nome,data_validade').not('data_validade', 'is', null).lte('data_validade', plus60).gte('data_validade', today).order('data_validade'),
      supabase.from('apartamento_manutencoes').select('*').eq('status', 'agendado').lte('data_proxima', plus7).order('data_proxima'),
      supabase.from('apartamento_garantias').select('*').lte('fim_garantia', plus30).gte('fim_garantia', today).order('fim_garantia'),
      supabase.from('frases_motivacionais').select('id,texto').eq('ativo', true).order('id'),
      supabase.from('apartamento_gastos').select('valor'),
      supabase.from('contas_fixas').select('id').eq('is_active', true),
      supabase.from('lista_compras').select('id,nome').eq('checked', false).limit(5),
      supabase.from('apartamento_boletos').select('id').neq('status', 'pago'),
      supabase.from('metas').select('*').in('status', ['andamento', 'planejada']).order('data_limite', { ascending: true, nullsLast: true }).limit(3),
      supabase.from('metas').select('id,nome,data_limite,cor,icone,status').neq('status', 'concluida').neq('status', 'cancelada').not('data_limite', 'is', null).lte('data_limite', plus30).order('data_limite'),
      supabase.from('veiculos_documentos').select('id,nome,tipo,data_validade').not('data_validade','is',null).lte('data_validade', plus30).gte('data_validade', today).order('data_validade'),
      supabase.from('saude_consultas').select('id,especialidade,medico,data,hora').gte('data', today).lte('data', plus7).order('data').order('hora'),
      supabase.from('saude_vacinas').select('id,vacina,proxima_dose').not('proxima_dose','is',null).lte('proxima_dose', plus30).gte('proxima_dose', today).order('proxima_dose'),
    ])

    setData({
      agendaHoje:       agendaHojeR.value?.data        || [],
      agendaProx:       agendaProxR.value?.data        || [],
      boletos:          boletosR.value?.data            || [],
      documentosVenc:   documentosVencR.value?.data    || [],
      documentos60:     documentos60R.value?.data      || [],
      manutAgendadas:   manutAgendadasR.value?.data    || [],
      garantiasVenc:    garantiasVencR.value?.data     || [],
      frases:           frasesR.value?.data            || [],
      gastosTotal:      (gastosTotalR.value?.data || []).reduce((s, g) => s + Number(g.valor || 0), 0),
      contasFixas:      contasFixasR.value?.data?.length || 0,
      listaCompras:     listaComprasR.value?.data      || [],
      boletosPendentes: boletosPendentesR.value?.data?.length || 0,
      metas:            metasR.value?.data            || [],
      metasAlerta:      metasAlertaR.value?.data      || [],
      veiculosAlerta:   veiculosAlertaR.value?.data   || [],
      saudeConsultas:   saudeConsultasR.value?.data   || [],
      saudeVacinas:     saudeVacinasR.value?.data     || [],
    })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  /* ── Derived values ─────────────────────────────────────────── */
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const todayPhrase = data.frases.length > 0
    ? data.frases[getDayOfYear(new Date()) % data.frases.length].texto
    : 'Pequenos avanços diários geram grandes resultados.'

  /* Foco do Dia: aggregate up to 5 most urgent items */
  const focoItems = [
    ...data.agendaHoje.map(e => ({
      Icon: CalendarDays,
      tone: 'info',
      icon: '📅',
      text: `${e.titulo}${!e.dia_inteiro && e.hora_inicio ? ` às ${e.hora_inicio.slice(0, 5)}` : ''}`,
      urgency: 'hoje',
      color: AGENDA_CATS[e.categoria] || AGENDA_CATS.outros,
    })),
    ...data.boletos.map(b => ({
      Icon: Landmark,
      tone: b.data_vencimento <= todayStr ? 'danger' : 'warning',
      icon: '💳',
      text: `Boleto ${b.competencia || b.descricao || ''} vence ${b.data_vencimento <= todayStr ? 'HOJE' : 'em breve'}`,
      urgency: b.data_vencimento <= todayStr ? 'urgente' : 'breve',
      color: '#dc2626',
    })),
    ...data.documentosVenc.map(d => {
      const dias = differenceInDays(parseISO(d.data_validade), new Date())
      return {
        Icon: FileText,
        tone: dias <= 7 ? 'danger' : 'warning',
        icon: '📁',
        text: `${d.nome} vence em ${dias} dia${dias !== 1 ? 's' : ''}`,
        urgency: dias <= 7 ? 'urgente' : 'breve',
        color: '#3b82f6',
      }
    }),
    ...data.manutAgendadas.slice(0, 2).map(m => ({
      Icon: Wrench,
      tone: 'warning',
      icon: '🔧',
      text: `${m.titulo}${m.data_proxima ? ` em ${differenceInDays(parseISO(m.data_proxima), new Date())} dias` : ''}`,
      urgency: 'breve',
      color: '#f97316',
    })),
    ...data.garantiasVenc.slice(0, 2).map(g => {
      const dias = differenceInDays(parseISO(g.fim_garantia), new Date())
      return {
        Icon: ShieldCheck,
        tone: dias <= 7 ? 'danger' : 'warning',
        icon: '📑',
        text: `Garantia ${g.produto} expira em ${dias} dia${dias !== 1 ? 's' : ''}`,
        urgency: dias <= 7 ? 'urgente' : 'breve',
        color: '#f59e0b',
      }
    }),
    ...(data.metasAlerta || []).slice(0, 2).map(m => {
      const dias = differenceInDays(parseISO(m.data_limite), new Date())
      return {
        Icon: PiggyBank,
        tone: dias < 0 || dias <= 7 ? 'danger' : 'warning',
        icon: '🎯',
        text: `Meta "${m.nome}" ${dias < 0 ? `atrasada ${Math.abs(dias)}d` : `vence em ${dias} dia${dias !== 1 ? 's' : ''}`}`,
        urgency: dias < 0 ? 'urgente' : dias <= 7 ? 'urgente' : 'breve',
        color: m.cor || '#6366f1',
      }
    }),
    ...(data.veiculosAlerta || []).slice(0, 1).map(d => {
      const dias = differenceInDays(parseISO(d.data_validade), new Date())
      return {
        Icon: Car,
        tone: dias <= 7 ? 'danger' : 'warning',
        icon: '🚗',
        text: `Veículo — ${d.tipo || d.nome} vence em ${dias} dia${dias !== 1 ? 's' : ''}`,
        urgency: dias <= 7 ? 'urgente' : 'breve',
        color: '#f97316',
      }
    }),
    ...(data.saudeConsultas || []).slice(0, 1).map(c => {
      const dias = differenceInDays(parseISO(c.data), new Date())
      return {
        Icon: Stethoscope,
        tone: dias === 0 ? 'info' : dias <= 2 ? 'danger' : 'warning',
        icon: '🏥',
        text: `Consulta ${c.especialidade}${c.medico ? ` — Dr(a). ${c.medico}` : ''} ${dias === 0 ? 'hoje' : `em ${dias} dia${dias !== 1 ? 's' : ''}`}`,
        urgency: dias === 0 ? 'hoje' : dias <= 2 ? 'urgente' : 'breve',
        color: '#6366f1',
      }
    }),
    ...(data.saudeVacinas || []).slice(0, 1).map(v => {
      const dias = differenceInDays(parseISO(v.proxima_dose), new Date())
      return {
        Icon: Syringe,
        tone: dias <= 7 ? 'warning' : 'info',
        icon: '💉',
        text: `Vacina ${v.vacina} — próxima dose em ${dias} dia${dias !== 1 ? 's' : ''}`,
        urgency: dias <= 7 ? 'urgente' : 'breve',
        color: '#ec4899',
      }
    }),
  ].slice(0, 5)

  /* Próxima manutenção agendada (any date, not just +7) */
  const proximaManut = data.manutAgendadas.length > 0 ? data.manutAgendadas[0] : null
  /* ── Loading screen ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="c-meudia-page c-meudia-page--loading" aria-label="Carregando Meu Dia">
        <section className="c-meudia-hero">
          <div className="c-meudia-hero-copy">
            <Skeleton variant="text" width="160px" height="18px" />
            <Skeleton variant="text" width="min(420px, 80vw)" height="48px" />
            <Skeleton variant="text" width="min(520px, 88vw)" height="18px" />
            <div className="c-meudia-hero-actions">
              <Skeleton variant="custom" width="132px" height="42px" />
              <Skeleton variant="custom" width="132px" height="42px" />
            </div>
          </div>
          <Skeleton variant="card" height="156px" className="c-meudia-loading-card" />
        </section>
        <section className="c-meudia-metrics">
          {[0, 1, 2, 3].map(item => <Skeleton key={item} variant="card" height="132px" />)}
        </section>
      </div>
    )
  }

  if (data) {
    return (
      <div className="c-meudia-page">
        <section className="c-meudia-hero">
          <div className="c-meudia-hero-copy">
            <span className="c-meudia-eyebrow"><Sparkles aria-hidden="true" /> Home inteligente</span>
            <h1>{getGreeting(userName)}</h1>
            <p className="c-meudia-date">{todayLabel()}</p>
            <p className="c-meudia-intro">
              Uma leitura calma da sua rotina: compromissos, vencimentos, casa, saúde e pendências importantes em um só lugar.
            </p>
            <div className="c-meudia-hero-actions">
              <Button icon={<Plus />} onClick={() => navigate('/contas/nova')}>Nova Compra</Button>
              <Button variant="secondary" icon={<CalendarDays />} onClick={() => navigate('/contas/agenda')}>Abrir agenda</Button>
            </div>
          </div>
          <SectionCard className="c-meudia-phrase-card" padding="md">
            <MessageCircle aria-hidden="true" />
            <p>{todayPhrase}</p>
          </SectionCard>
        </section>

        <section className="c-meudia-metrics" aria-label="Resumo rápido">
          <MetricCard label="Eventos hoje" value={data.agendaHoje.length} tone="accent" icon={<CalendarDays />} description="Agenda do dia" />
          <MetricCard label="Próx. 7 dias" value={data.agendaProx.length} tone="accent" icon={<CalendarClock />} description="Compromissos futuros" />
          <MetricCard label="Contas pendentes" value={data.boletosPendentes} tone={data.boletosPendentes > 0 ? 'danger' : 'success'} icon={<Landmark />} description="Boletos em aberto" />
          <MetricCard label="Docs vencendo" value={(data.documentos60 || []).length} tone={(data.documentos60 || []).length > 0 ? 'warning' : 'success'} icon={<FileText />} description="Janela de 60 dias" />
        </section>

        <section className="c-meudia-quick-actions" aria-label="Atalhos rápidos">
          {[
            { label: 'Nova Compra', icon: Plus, to: '/contas/nova' },
            { label: 'Agenda', icon: CalendarDays, to: '/contas/agenda' },
            { label: 'Saúde', icon: HeartPulse, to: '/contas/saude' },
            { label: 'Veículos', icon: Car, to: '/contas/veiculos' },
            { label: 'Apartamento', icon: Building2, to: '/contas/apartamento' },
            { label: 'Documentos', icon: FileText, to: '/contas/documentos' },
            { label: 'Metas', icon: PiggyBank, to: '/contas/metas' },
            { label: 'Compras', icon: ListChecks, to: '/contas/cardapio' },
          ].map(action => {
            const Icon = action.icon
            return (
              <button key={action.to} type="button" className="c-meudia-shortcut" onClick={() => navigate(action.to)}>
                <Icon aria-hidden="true" />
                <span>{action.label}</span>
              </button>
            )
          })}
        </section>

        <div className="c-meudia-grid c-meudia-grid--hero">
          <SectionCard
            title="Alertas e prioridades"
            description="Os itens mais urgentes encontrados nas janelas atuais."
            actions={<StatusBadge tone={focoItems.length ? 'warning' : 'success'}>{focoItems.length || 'Tudo ok'}</StatusBadge>}
          >
            <div className="c-meudia-list">
              {focoItems.length === 0 ? (
                <EmptyState compact icon={<BadgeCheck />} title="Nenhum item urgente" description="Nada crítico para hoje nas consultas atuais." />
              ) : (
                focoItems.map((item, index) => (
                  <StaticListItem
                    key={`${item.text}-${index}`}
                    icon={item.Icon || CalendarClock}
                    title={item.text}
                    tone={item.tone || 'warning'}
                    badge={<UrgencyBadge urgency={item.urgency} />}
                  />
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Financeiro"
            description="Pendências e estrutura ativa do mês."
            actions={<Button variant="ghost" size="sm" onClick={() => navigate('/contas/dashboard')}>Dashboard</Button>}
          >
            <div className="c-meudia-list">
              <StaticListItem icon={Landmark} title="Boletos pendentes" value={String(data.boletosPendentes)} tone={data.boletosPendentes > 0 ? 'danger' : 'success'} />
              <StaticListItem icon={ClipboardList} title="Contas fixas ativas" value={String(data.contasFixas)} tone="accent" />
              <StaticListItem icon={Banknote} title="Total investido no apartamento" value={fmtBRL(data.gastosTotal)} tone="accent" />
            </div>
          </SectionCard>
        </div>

        <div className="c-meudia-grid">
          <SectionCard
            title="Agenda de hoje"
            description={`${data.agendaHoje.length} compromisso${data.agendaHoje.length !== 1 ? 's' : ''} para hoje.`}
            actions={<Button variant="ghost" size="sm" onClick={() => navigate('/contas/agenda')}>Agenda</Button>}
          >
            <div className="c-meudia-list">
              {data.agendaHoje.length === 0 ? (
                <EmptyState compact icon={<CalendarDays />} title="Dia livre" description="Nenhum compromisso cadastrado para hoje." />
              ) : (
                data.agendaHoje.slice(0, 5).map(ev => (
                  <ListItem
                    key={ev.id}
                    icon={CalendarDays}
                    title={ev.titulo}
                    meta={ev.local || 'Sem local informado'}
                    value={ev.dia_inteiro ? 'Dia inteiro' : ev.hora_inicio ? ev.hora_inicio.slice(0, 5) : ''}
                    tone="info"
                    onClick={() => navigate('/contas/agenda')}
                  />
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Próximos 7 dias"
            description={`${data.agendaProx.length} evento${data.agendaProx.length !== 1 ? 's' : ''} dentro da janela atual.`}
            actions={<Button variant="ghost" size="sm" onClick={() => navigate('/contas/agenda')}>Ver agenda</Button>}
          >
            <div className="c-meudia-list">
              {data.agendaProx.length === 0 ? (
                <EmptyState compact icon={<CalendarClock />} title="Sem próximos eventos" description="Nada agendado nos próximos 7 dias." />
              ) : (
                data.agendaProx.slice(0, 5).map(ev => (
                  <ListItem
                    key={ev.id}
                    icon={CalendarClock}
                    title={ev.titulo}
                    meta={ev.local || format(parseISO(ev.data_inicio), "EEEE, dd/MM", { locale: ptBR })}
                    value={ev.dia_inteiro ? 'Dia inteiro' : ev.hora_inicio ? ev.hora_inicio.slice(0, 5) : format(parseISO(ev.data_inicio), 'dd/MM')}
                    tone="accent"
                    onClick={() => navigate('/contas/agenda')}
                  />
                ))
              )}
            </div>
          </SectionCard>
        </div>

        <div className="c-meudia-grid">
          <SectionCard
            title="Saúde"
            description="Consultas em 7 dias e vacinas em 30 dias."
            actions={<Button variant="ghost" size="sm" onClick={() => navigate('/contas/saude')}>Saúde</Button>}
          >
            <div className="c-meudia-list">
              {data.saudeConsultas.length === 0 && data.saudeVacinas.length === 0 ? (
                <EmptyState compact icon={<HeartPulse />} title="Sem alertas de saúde" description="Nenhuma consulta ou vacina próxima nas janelas atuais." />
              ) : (
                <>
                  {data.saudeConsultas.slice(0, 3).map(c => (
                    <ListItem
                      key={`consulta-${c.id}`}
                      icon={Stethoscope}
                      title={`Consulta ${c.especialidade}`}
                      meta={c.medico ? `Dr(a). ${c.medico}` : 'Consulta agendada'}
                      value={`${format(parseISO(c.data), 'dd/MM')}${c.hora ? ` ${c.hora.slice(0, 5)}` : ''}`}
                      tone="info"
                      onClick={() => navigate('/contas/saude')}
                    />
                  ))}
                  {data.saudeVacinas.slice(0, 3).map(v => (
                    <ListItem key={`vacina-${v.id}`} icon={Syringe} title={`Vacina ${v.vacina}`} meta="Próxima dose" value={format(parseISO(v.proxima_dose), 'dd/MM')} tone="warning" onClick={() => navigate('/contas/saude')} />
                  ))}
                </>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Veículos"
            description="Documentos próximos do vencimento em 30 dias."
            actions={<Button variant="ghost" size="sm" onClick={() => navigate('/contas/veiculos')}>Veículos</Button>}
          >
            <div className="c-meudia-list">
              {data.veiculosAlerta.length === 0 ? (
                <EmptyState compact icon={<Car />} title="Veículos em dia" description="Nenhum documento vencendo na janela atual." />
              ) : (
                data.veiculosAlerta.slice(0, 4).map(doc => {
                  const dias = differenceInDays(parseISO(doc.data_validade), new Date())
                  return (
                    <ListItem key={doc.id} icon={Car} title={doc.tipo || doc.nome} meta={`${dias} dia${dias !== 1 ? 's' : ''} para vencer`} value={format(parseISO(doc.data_validade), 'dd/MM')} tone={dias <= 7 ? 'danger' : 'warning'} onClick={() => navigate('/contas/veiculos')} />
                  )
                })
              )}
            </div>
          </SectionCard>
        </div>

        <div className="c-meudia-grid">
          <SectionCard
            title="Apartamento"
            description="Gastos, manutenções e garantias acompanhados."
            actions={<Button variant="ghost" size="sm" onClick={() => navigate('/contas/apartamento')}>Abrir</Button>}
          >
            <div className="c-meudia-list">
              <StaticListItem icon={Building2} title="Total investido" value={fmtBRL(data.gastosTotal)} tone="accent" />
              <StaticListItem icon={Wrench} title="Próxima manutenção" meta={proximaManut?.titulo || 'Nenhuma agendada'} value={proximaManut?.data_proxima ? format(parseISO(proximaManut.data_proxima), 'dd/MM') : ''} tone={proximaManut ? 'warning' : 'success'} />
              <StaticListItem icon={ShieldCheck} title="Garantias vencendo" value={String(data.garantiasVenc.length)} tone={data.garantiasVenc.length ? 'warning' : 'success'} />
            </div>
          </SectionCard>

          <SectionCard
            title="Documentos"
            description="Documentos vencendo em até 60 dias."
            actions={<Button variant="ghost" size="sm" onClick={() => navigate('/contas/documentos')}>Documentos</Button>}
          >
            <div className="c-meudia-list">
              {(data.documentos60 || []).length === 0 ? (
                <EmptyState compact icon={<FileText />} title="Documentos em dia" description="Nenhum documento vencendo em breve." />
              ) : (
                (data.documentos60 || []).slice(0, 4).map(doc => {
                  const dias = differenceInDays(parseISO(doc.data_validade), new Date())
                  return (
                    <ListItem key={doc.id} icon={FileText} title={doc.nome} meta={`${dias} dia${dias !== 1 ? 's' : ''} para vencer`} value={format(parseISO(doc.data_validade), 'dd/MM')} tone={dias <= 7 ? 'danger' : dias <= 30 ? 'warning' : 'info'} onClick={() => navigate('/contas/documentos')} />
                  )
                })
              )}
            </div>
          </SectionCard>
        </div>

        <div className="c-meudia-grid">
          <SectionCard
            title="Metas"
            description={`${data.metas.length} meta${data.metas.length !== 1 ? 's' : ''} em destaque.`}
            actions={<Button variant="ghost" size="sm" onClick={() => navigate('/contas/metas')}>Cofrinhos</Button>}
          >
            <div className="c-meudia-list">
              {data.metas.length === 0 ? (
                <EmptyState compact icon={<PiggyBank />} title="Sem metas em destaque" description="Nenhuma meta ativa retornou na consulta atual." />
              ) : (
                data.metas.map(meta => {
                  const pct = meta.valor_objetivo > 0 ? Math.min(100, (meta.valor_atual / meta.valor_objetivo) * 100) : 0
                  return (
                    <button key={meta.id} type="button" className="c-meudia-goal" onClick={() => navigate('/contas/metas')}>
                      <span className="c-meudia-goal-top"><span>{meta.nome}</span><strong>{pct.toFixed(0)}%</strong></span>
                      <span className="c-meudia-progress"><span style={{ width: `${pct}%`, background: meta.cor || 'var(--v2-color-accent)' }} /></span>
                      {meta.data_limite && <span className="c-meudia-item-meta">Prazo: {format(parseISO(meta.data_limite), 'dd/MM/yyyy')}</span>}
                    </button>
                  )
                })
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Compras de casa"
            description={`${data.listaCompras.length} item${data.listaCompras.length !== 1 ? 's' : ''} pendente${data.listaCompras.length !== 1 ? 's' : ''}.`}
            actions={<Button variant="ghost" size="sm" onClick={() => navigate('/contas/cardapio')}>Lista</Button>}
          >
            <div className="c-meudia-list">
              {data.listaCompras.length === 0 ? (
                <EmptyState compact icon={<ListChecks />} title="Lista vazia" description="Nenhum item pendente na lista de compras." />
              ) : (
                data.listaCompras.slice(0, 5).map(item => (
                  <ListItem key={item.id} icon={ListChecks} title={item.nome} tone="success" onClick={() => navigate('/contas/cardapio')} />
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    )
  }

  /* ══ RENDER ════════════════════════════════════════════════════ */
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 48px' }}>

      {/* ── 1. GREETING HEADER ───────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        borderRadius: 16,
        padding: 24,
        color: '#fff',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>
          {getGreeting(userName)}
        </div>
        <div style={{ fontSize: 14, opacity: 0.85, textTransform: 'capitalize' }}>
          {todayLabel()}
        </div>
      </div>

      {/* ── 2. DAILY PHRASE ──────────────────────────────────── */}
      <div className="c-card" style={{ marginBottom: 24, padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>💬</span>
          <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--c-text-muted, #64748b)', lineHeight: 1.5 }}>
            {todayPhrase}
          </p>
        </div>
      </div>

      {/* ── 3. FOCO DO DIA ───────────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, margin: '0 0 12px' }}>
          🎯 Foco do Dia
        </h2>
        <div className="c-card" style={{ padding: '8px 0' }}>
          {focoItems.length === 0 ? (
            <div style={{ padding: '16px 18px', color: 'var(--c-text-muted, #64748b)' }}>
              ✅ Nenhum item urgente para hoje.
            </div>
          ) : (
            focoItems.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  borderBottom: i < focoItems.length - 1 ? '1px solid var(--c-border, #e2e8f0)' : 'none',
                }}
              >
                <span style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: item.color + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  flexShrink: 0,
                }}>
                  {item.icon}
                </span>
                <span style={{ flex: 1, fontSize: 14, lineHeight: 1.4 }}>{item.text}</span>
                <UrgencyBadge urgency={item.urgency} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── 4. SUMMARY CARDS ROW ─────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>
          📊 Resumo Rápido
        </h2>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { icon: '📅', count: data.agendaHoje.length,     label: 'Eventos Hoje',    color: '#6366f1' },
            { icon: '🔔', count: data.agendaProx.length,     label: 'Próx. 7 dias',    color: '#3b82f6' },
            { icon: '💳', count: data.boletosPendentes,      label: 'Contas',          color: '#dc2626' },
            { icon: '📁', count: (data.documentos60 || []).length, label: 'Docs venc.',color: '#f59e0b' },
            { icon: '🔧', count: data.manutAgendadas.length, label: 'Manutenções',     color: '#f97316' },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                background: 'var(--c-surface)',
                border: '1px solid var(--c-border, #e2e8f0)',
                borderRadius: 12,
                padding: '14px 16px',
                flexShrink: 0,
                minWidth: 110,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{c.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color, lineHeight: 1 }}>
                {c.count}
              </div>
              <div style={{ fontSize: 11, color: 'var(--c-text-muted, #64748b)', marginTop: 4 }}>
                {c.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. AGENDA DE HOJE ────────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>📅 Agenda de Hoje</h2>
          {data.agendaHoje.length > 5 && (
            <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => navigate('/contas/agenda')}>
              Ver todos →
            </button>
          )}
        </div>
        {data.agendaHoje.length === 0 ? (
          <div className="c-empty-state" style={{ padding: '20px 16px', textAlign: 'center' }}>
            Nenhum compromisso hoje. Aproveite! 🎉
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.agendaHoje.slice(0, 5).map(ev => {
              const catColor = AGENDA_CATS[ev.categoria] || AGENDA_CATS.outros
              return (
                <div
                  key={ev.id}
                  className="c-card"
                  style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}
                >
                  <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: catColor, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{ev.titulo}</div>
                    {ev.local && (
                      <div style={{ fontSize: 12, color: 'var(--c-text-muted, #64748b)', marginBottom: 2 }}>
                        📍 {ev.local}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--c-text-muted, #64748b)', flexShrink: 0 }}>
                    {ev.dia_inteiro ? 'Dia inteiro' : ev.hora_inicio ? ev.hora_inicio.slice(0, 5) : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {data.agendaHoje.length > 5 && (
          <div style={{ marginTop: 10, textAlign: 'right' }}>
            <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => navigate('/contas/agenda')}>
              Ver todos →
            </button>
          </div>
        )}
      </section>

      {/* ── 6. PRÓXIMOS 7 DIAS ───────────────────────────────── */}
      {data.agendaProx.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>📆 Próximos 7 Dias</h2>
            <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => navigate('/contas/agenda')}>
              Ver agenda →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.agendaProx.slice(0, 5).map(ev => {
              const catColor = AGENDA_CATS[ev.categoria] || AGENDA_CATS.outros
              const dateLabel = format(parseISO(ev.data_inicio), "EEE, dd/MM", { locale: ptBR })
                .replace(/^\w/, c => c.toUpperCase())
              return (
                <div
                  key={ev.id}
                  className="c-card"
                  style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}
                >
                  <div style={{
                    flexShrink: 0,
                    minWidth: 56,
                    textAlign: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: catColor,
                    lineHeight: 1.3,
                  }}>
                    {dateLabel}
                  </div>
                  <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--c-border, #e2e8f0)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{ev.titulo}</div>
                    {ev.local && (
                      <div style={{ fontSize: 12, color: 'var(--c-text-muted, #64748b)' }}>📍 {ev.local}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--c-text-muted, #64748b)', flexShrink: 0 }}>
                    {ev.dia_inteiro ? 'Dia inteiro' : ev.hora_inicio ? ev.hora_inicio.slice(0, 5) : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── 7. METAS EM DESTAQUE ─────────────────────────────── */}
      {data.metas.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>🎯 Metas em Destaque</h2>
            <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => navigate('/contas/metas')}>
              Ver todas →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.metas.map(meta => {
              const pct = meta.valor_objetivo > 0 ? Math.min(100, (meta.valor_atual / meta.valor_objetivo) * 100) : 0
              const color = meta.cor || '#6366f1'
              return (
                <div key={meta.id} className="c-card" style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => navigate('/contas/metas')}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{meta.icone || '🎯'}</span>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {meta.nome}
                    </span>
                    <span style={{ fontWeight: 800, color, fontSize: 15, flexShrink: 0 }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: color, transition: 'width .4s' }} />
                  </div>
                  {meta.data_limite && (
                    <div style={{ fontSize: 12, color: 'var(--c-text-muted,#64748b)', marginTop: 6 }}>
                      Prazo: {format(parseISO(meta.data_limite), 'dd/MM/yyyy')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── RESUMO FINANCEIRO ────────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>💰 Resumo Financeiro</h2>
        <div className="c-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>💳 Boletos Pendentes</span>
              <span style={{
                fontWeight: 700,
                fontSize: 15,
                color: data.boletosPendentes > 0 ? '#dc2626' : '#16a34a',
              }}>
                {data.boletosPendentes}
              </span>
            </div>
            <div style={{ height: 1, background: 'var(--c-border, #e2e8f0)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>📋 Contas Fixas Ativas</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#6366f1' }}>
                {data.contasFixas}
              </span>
            </div>
          </div>
          <button
            className="c-btn c-btn-primary c-btn-sm"
            style={{ width: '100%' }}
            onClick={() => navigate('/contas/dashboard')}
          >
            Abrir Dashboard →
          </button>
        </div>
      </section>

      {/* ── 8. COMPRAS DE CASA ───────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>🛒 Compras de Casa</h2>
          <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => navigate('/contas/cardapio')}>
            Ver lista →
          </button>
        </div>
        <div className="c-card" style={{ padding: '14px 18px' }}>
          {data.listaCompras.length === 0 ? (
            <div style={{ color: 'var(--c-text-muted, #64748b)', fontSize: 14 }}>
              Lista vazia ✅
            </div>
          ) : (
            <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.listaCompras.slice(0, 3).map(item => (
                <li key={item.id} style={{ fontSize: 14 }}>{item.nome}</li>
              ))}
            </ul>
          )}
          {data.listaCompras.length > 3 && (
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--c-text-muted, #64748b)' }}>
              +{data.listaCompras.length - 3} item{data.listaCompras.length - 3 !== 1 ? 's' : ''} na lista
            </div>
          )}
        </div>
      </section>

      {/* ── 9. RESUMO APARTAMENTO ────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>🏠 Apartamento</h2>
        <div className="c-card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>💰 Total Investido</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#6366f1' }}>
                {fmtBRL(data.gastosTotal)}
              </span>
            </div>
            <div style={{ height: 1, background: 'var(--c-border, #e2e8f0)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>🔧 Próxima Manutenção</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: proximaManut ? '#f97316' : '#16a34a' }}>
                {proximaManut
                  ? (proximaManut.data_proxima
                      ? format(parseISO(proximaManut.data_proxima), 'dd/MM/yyyy')
                      : proximaManut.titulo)
                  : 'Nenhuma agendada'}
              </span>
            </div>
            <div style={{ height: 1, background: 'var(--c-border, #e2e8f0)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>📑 Garantias vencendo (30d)</span>
              <span style={{
                fontWeight: 700,
                fontSize: 15,
                color: data.garantiasVenc.length > 0 ? '#f59e0b' : '#16a34a',
              }}>
                {data.garantiasVenc.length}
              </span>
            </div>
          </div>
          <button
            className="c-btn c-btn-secondary c-btn-sm"
            style={{ width: '100%' }}
            onClick={() => navigate('/contas/apartamento')}
          >
            Ver Apartamento →
          </button>
        </div>
      </section>

      {/* ── 10. RESUMO DOCUMENTOS ────────────────────────────── */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>📁 Documentos</h2>
        <div className="c-card" style={{ padding: '14px 18px' }}>
          {(data.documentos60 || []).length === 0 ? (
            <div style={{ fontSize: 14, color: 'var(--c-text-muted, #64748b)', marginBottom: 14 }}>
              ✅ Nenhum documento vencendo em breve.
            </div>
          ) : (
            <ul style={{ margin: '0 0 14px', padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(data.documentos60 || []).slice(0, 3).map(doc => {
                const dias = differenceInDays(parseISO(doc.data_validade), new Date())
                return (
                  <li key={doc.id} style={{ fontSize: 14 }}>
                    <span style={{ fontWeight: 500 }}>{doc.nome}</span>
                    <span style={{
                      marginLeft: 8,
                      fontSize: 12,
                      color: dias <= 7 ? '#dc2626' : dias <= 30 ? '#f59e0b' : '#64748b',
                      fontWeight: 600,
                    }}>
                      ({dias} dia{dias !== 1 ? 's' : ''})
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          <button
            className="c-btn c-btn-secondary c-btn-sm"
            style={{ width: '100%' }}
            onClick={() => navigate('/contas/documentos')}
          >
            Ver Documentos →
          </button>
        </div>
      </section>

    </div>
  )
}
