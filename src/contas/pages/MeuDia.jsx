import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  format, parseISO, differenceInDays, addDays, getDayOfYear,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
  if (h >= 5 && h < 12)  return `☀️ Bom dia, ${name}!`
  if (h >= 12 && h < 18) return `🌤️ Boa tarde, ${name}!`
  return `🌙 Boa noite, ${name}!`
}

const todayLabel = () =>
  format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    .replace(/^\w/, c => c.toUpperCase())

/* ── Urgency badge component ────────────────────────────────────── */
function UrgencyBadge({ urgency }) {
  const styles = {
    urgente: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
    hoje:    { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' },
    breve:   { background: '#fefce8', color: '#ca8a04', border: '1px solid #fef08a' },
    ok:      { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
  }
  const labels = { urgente: 'Urgente', hoje: 'Hoje', breve: 'Em breve', ok: 'Ok' }
  const s = styles[urgency] || styles.breve
  return (
    <span style={{ ...s, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {labels[urgency] || urgency}
    </span>
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
      icon: '📅',
      text: `${e.titulo}${!e.dia_inteiro && e.hora_inicio ? ` às ${e.hora_inicio.slice(0, 5)}` : ''}`,
      urgency: 'hoje',
      color: AGENDA_CATS[e.categoria] || AGENDA_CATS.outros,
    })),
    ...data.boletos.map(b => ({
      icon: '💳',
      text: `Boleto ${b.competencia || b.descricao || ''} vence ${b.data_vencimento <= todayStr ? 'HOJE' : 'em breve'}`,
      urgency: b.data_vencimento <= todayStr ? 'urgente' : 'breve',
      color: '#dc2626',
    })),
    ...data.documentosVenc.map(d => {
      const dias = differenceInDays(parseISO(d.data_validade), new Date())
      return {
        icon: '📁',
        text: `${d.nome} vence em ${dias} dia${dias !== 1 ? 's' : ''}`,
        urgency: dias <= 7 ? 'urgente' : 'breve',
        color: '#3b82f6',
      }
    }),
    ...data.manutAgendadas.slice(0, 2).map(m => ({
      icon: '🔧',
      text: `${m.titulo}${m.data_proxima ? ` em ${differenceInDays(parseISO(m.data_proxima), new Date())} dias` : ''}`,
      urgency: 'breve',
      color: '#f97316',
    })),
    ...data.garantiasVenc.slice(0, 2).map(g => {
      const dias = differenceInDays(parseISO(g.fim_garantia), new Date())
      return {
        icon: '📑',
        text: `Garantia ${g.produto} expira em ${dias} dia${dias !== 1 ? 's' : ''}`,
        urgency: dias <= 7 ? 'urgente' : 'breve',
        color: '#f59e0b',
      }
    }),
    ...(data.metasAlerta || []).slice(0, 2).map(m => {
      const dias = differenceInDays(parseISO(m.data_limite), new Date())
      return {
        icon: '🎯',
        text: `Meta "${m.nome}" ${dias < 0 ? `atrasada ${Math.abs(dias)}d` : `vence em ${dias} dia${dias !== 1 ? 's' : ''}`}`,
        urgency: dias < 0 ? 'urgente' : dias <= 7 ? 'urgente' : 'breve',
        color: m.cor || '#6366f1',
      }
    }),
    ...(data.veiculosAlerta || []).slice(0, 2).map(d => {
      const dias = differenceInDays(parseISO(d.data_validade), new Date())
      return {
        icon: '🚗',
        text: `Veículo — ${d.tipo || d.nome} vence em ${dias} dia${dias !== 1 ? 's' : ''}`,
        urgency: dias <= 7 ? 'urgente' : 'breve',
        color: '#f97316',
      }
    }),
  ].slice(0, 5)

  /* Próxima manutenção agendada (any date, not just +7) */
  const proximaManut = data.manutAgendadas.length > 0 ? data.manutAgendadas[0] : null

  /* ── Loading screen ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="c-loading-screen">
        <div className="c-loading-spinner" />
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
