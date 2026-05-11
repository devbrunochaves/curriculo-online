import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { format, addMonths, subMonths, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const fmt = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'

export default function Previsao() {
  const [months, setMonths]     = useState(6) // quantos meses à frente mostrar
  const [data, setData]         = useState([])
  const [cards, setCards]       = useState([])
  const [income, setIncome]     = useState([])
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)

    // new Date() dentro do callback garante tempo do cliente, nunca SSR
    // Começa 1 mês atrás para mostrar a fatura atual que está sendo paga
    const today     = new Date()
    const start     = subMonths(startOfMonth(today), 1)
    const monthRefs = Array.from({ length: months + 2 }, (_, i) =>
      format(addMonths(start, i), 'yyyy-MM')
    )

    const [{ data: expenses }, { data: cardsData }, { data: incomeData }] = await Promise.all([
      supabase
        .from('expenses')
        .select('*, card:cards(*), category:categories(*), splits:expense_splits(*, person:people(*))')
        .in('month_ref', monthRefs)
        .order('month_ref'),
      supabase.from('cards').select('*').eq('is_active', true),
      supabase.from('income').select('*').in('month_ref', monthRefs),
    ])

    // Agrupar por mês
    const grouped = monthRefs.map(mRef => {
      const exps    = (expenses || []).filter(e => e.month_ref === mRef)
      const inc     = (incomeData || []).filter(r => r.month_ref === mRef)
      const total   = exps.reduce((s, e) => s + Number(e.total_amount), 0)
      const entrada = inc.reduce((s, r) => s + Number(r.amount), 0)

      // Por cartão
      const byCard = {}
      exps.forEach(e => {
        if (!e.card) return
        if (!byCard[e.card.id]) byCard[e.card.id] = { ...e.card, total: 0, items: [] }
        byCard[e.card.id].total += Number(e.total_amount)
        byCard[e.card.id].items.push(e)
      })

      // Por pessoa
      const byPerson = {}
      exps.forEach(e => {
        e.splits?.forEach(s => {
          if (!byPerson[s.person.id]) byPerson[s.person.id] = { ...s.person, total: 0 }
          byPerson[s.person.id].total += Number(s.amount)
        })
      })

      const currentRef  = format(today, 'yyyy-MM')
      const prevRef     = format(subMonths(today, 1), 'yyyy-MM')
      const isPast      = mRef < prevRef          // antes do mês anterior
      const isPrevious  = mRef === prevRef         // mês anterior = fatura em aberto
      const isCurrent   = mRef === currentRef      // mês atual do calendário

      return {
        mRef, total, entrada, exps, byCard: Object.values(byCard).sort((a, b) => b.total - a.total),
        byPerson: Object.values(byPerson).sort((a, b) => b.total - a.total),
        isPast, isCurrent, isPrevious
      }
    })

    setData(grouped)
    setCards(cardsData || [])
    setIncome(incomeData || [])
    setLoading(false)
  }, [months])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="c-loading-screen" style={{ height: '60vh' }}>
      <div className="c-loading-spinner" /><p>Carregando previsão...</p>
    </div>
  )

  const futureTotal = data.filter(m => !m.isPast).reduce((s, m) => s + m.total, 0)

  return (
    <div>
      <div className="c-flex c-items-center c-justify-between c-mb-4">
        <div className="c-page-header" style={{ margin: 0 }}>
          <h2>📆 Previsão</h2>
          <p>Visão dos próximos meses — total comprometido: {fmt(futureTotal)}</p>
        </div>
        <div className="c-flex c-items-center c-gap-2">
          <span className="c-text-muted c-text-sm">Mostrar</span>
          {[3, 6, 9].map(n => (
            <button key={n} className={`c-btn c-btn-sm ${months === n ? 'c-btn-primary' : 'c-btn-secondary'}`} onClick={() => setMonths(n)}>
              {n} meses
            </button>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="c-flex c-gap-3 c-mb-4" style={{ flexWrap: 'wrap' }}>
        <div className="c-flex c-items-center c-gap-2 c-text-sm c-text-muted">
          <div style={{ width: 12, height: 12, borderRadius: 2, background: '#e2e8f0' }} /> Passado
        </div>
        <div className="c-flex c-items-center c-gap-2 c-text-sm c-text-muted">
          <div style={{ width: 12, height: 12, borderRadius: 2, background: '#fed7aa' }} /> Fatura em aberto
        </div>
        <div className="c-flex c-items-center c-gap-2 c-text-sm c-text-muted">
          <div style={{ width: 12, height: 12, borderRadius: 2, background: '#dbeafe' }} /> Mês atual
        </div>
        <div className="c-flex c-items-center c-gap-2 c-text-sm c-text-muted">
          <div style={{ width: 12, height: 12, borderRadius: 2, background: '#f0fdf4' }} /> Futuro
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.map(m => {
          const bg     = m.isPast ? '#f8fafc' : m.isPrevious ? '#fff7ed' : m.isCurrent ? '#eff6ff' : '#f0fdf4'
          const border = m.isPast ? '#e2e8f0' : m.isPrevious ? '#fed7aa' : m.isCurrent ? '#bfdbfe' : '#bbf7d0'
          const saldo  = m.entrada - m.total

          return (
            <div key={m.mRef} style={{ border: `2px solid ${border}`, borderRadius: 12, background: bg, overflow: 'hidden' }}>
              {/* Header do mês */}
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, textTransform: 'capitalize', color: '#0f172a' }}>
                    {m.isPrevious && <span style={{ fontSize: 11, background: '#f97316', color: '#fff', padding: '2px 8px', borderRadius: 99, marginRight: 8, fontWeight: 600 }}>FATURA EM ABERTO</span>}
                    {m.isCurrent  && <span style={{ fontSize: 11, background: '#6366f1', color: '#fff', padding: '2px 8px', borderRadius: 99, marginRight: 8, fontWeight: 600 }}>MÊS ATUAL</span>}
                    {format(new Date(m.mRef + '-01'), "MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                  <div className="c-text-sm c-text-muted">{m.exps.length} lançamentos</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: m.total > 0 ? '#ef4444' : '#94a3b8' }}>{fmt(m.total)}</div>
                  {m.entrada > 0 && (
                    <div style={{ fontSize: 12, color: saldo >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      Entradas: {fmt(m.entrada)} · Saldo: {fmt(saldo)}
                    </div>
                  )}
                </div>
              </div>

              {m.total > 0 && (
                <div style={{ padding: '14px 20px' }}>
                  <div className="c-grid-2" style={{ gap: 20 }}>
                    {/* Por cartão */}
                    <div>
                      <div className="c-section-title">Por Cartão</div>
                      {m.byCard.map(c => (
                        <div key={c.id} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className="c-dot" style={{ background: c.color }} />
                              <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 700, fontSize: 13 }}>{fmt(c.total)}</span>
                              {c.limit_amount && (
                                <span className="c-text-muted c-text-sm"> / {fmt(c.limit_amount)}</span>
                              )}
                            </div>
                          </div>
                          {c.limit_amount && (
                            <div className="c-progress-bar">
                              <div className="c-progress-fill" style={{
                                width: `${Math.min((c.total / c.limit_amount) * 100, 100)}%`,
                                background: (c.total / c.limit_amount) >= 1 ? '#ef4444'
                                  : (c.total / c.limit_amount) >= 0.8 ? '#f59e0b' : c.color
                              }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Por pessoa */}
                    <div>
                      <div className="c-section-title">Por Pessoa</div>
                      {m.byPerson.length === 0
                        ? <div className="c-text-muted c-text-sm">Sem divisão registrada</div>
                        : m.byPerson.map(p => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className="c-dot" style={{ background: p.color }} />
                              <span style={{ fontSize: 13 }}>{p.name}</span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 13, color: p.color }}>{fmt(p.total)}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  {/* Parcelas futuras destacadas */}
                  {m.exps.some(e => /\d+\/\d+/.test(e.description)) && (
                    <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Parcelas neste mês</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {m.exps.filter(e => /\d+\/\d+/.test(e.description)).map(e => (
                          <div key={e.id} style={{ padding: '3px 10px', borderRadius: 6, background: '#e0e7ff', color: '#4338ca', fontSize: 12, fontWeight: 600 }}>
                            {e.description} · {fmt(e.total_amount)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {m.total === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  Nenhum lançamento para este mês ainda
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
