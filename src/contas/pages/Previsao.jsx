'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { format, addMonths, startOfMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const fmt = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'

const AVATAR_COLORS = ['#6366f1','#ec4899','#f97316','#8b5cf6','#10b981','#3b82f6','#f59e0b','#06b6d4']

export default function Previsao() {
  const [months, setMonths]   = useState(6)
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [openKeys, setOpenKeys] = useState(new Set())
  const [currentRef, setCurrentRef] = useState('')

  useEffect(() => { setCurrentRef(format(new Date(), 'yyyy-MM')) }, [])

  const load = useCallback(async () => {
    const today = new Date(typeof window !== 'undefined' ? Date.now() : undefined)
    const start = startOfMonth(today)
    setCurrentRef(format(today, 'yyyy-MM'))
    setLoading(true)

    const monthRefs = Array.from({ length: months + 1 }, (_, i) =>
      format(addMonths(start, i), 'yyyy-MM')
    )

    const [{ data: expenses }, { data: billEntries }, { data: incomeData }] = await Promise.all([
      supabase
        .from('expenses')
        .select('*, card:cards(*), splits:expense_splits(*, person:people(*))')
        .in('month_ref', monthRefs)
        .order('month_ref'),
      supabase
        .from('bill_entries')
        .select('*, amount, bill:recurring_bills(name, person_id), splits:bill_entry_splits(*, person:people(*))')
        .in('month_ref', monthRefs),
      supabase.from('income').select('*').in('month_ref', monthRefs),
    ])

    const grouped = monthRefs.map(mRef => {
      const exps  = (expenses    || []).filter(e => e.month_ref === mRef)
      const bills = (billEntries || []).filter(b => b.month_ref === mRef)
      const inc   = (incomeData  || []).filter(r => r.month_ref === mRef)

      const totalExp   = exps.reduce((s, e)  => s + Number(e.total_amount), 0)
      const totalBills = bills.reduce((s, b) => s + Number(b.amount), 0)
      const total      = totalExp + totalBills
      const entrada    = inc.reduce((s, r)   => s + Number(r.amount), 0)

      // byPerson: { [id]: { ...person, total, fixasTotal, byCard: { [cardId]: {...card, total} } } }
      const byPerson = {}

      // 1. Despesas por cartão, via expense_splits
      exps.forEach(e => {
        e.splits?.forEach(s => {
          const pid = s.person.id
          if (!byPerson[pid]) byPerson[pid] = { ...s.person, total: 0, fixasTotal: 0, byCard: {} }
          byPerson[pid].total += Number(s.amount)
          if (e.card) {
            const cid = e.card.id
            if (!byPerson[pid].byCard[cid]) byPerson[pid].byCard[cid] = { ...e.card, total: 0 }
            byPerson[pid].byCard[cid].total += Number(s.amount)
          }
        })
      })

      // 2. Contas fixas via bill_entry_splits (ou person_id do template)
      bills.forEach(b => {
        const amt = Number(b.amount)
        if (b.splits?.length > 0) {
          b.splits.forEach(s => {
            const pid = s.person.id
            if (!byPerson[pid]) byPerson[pid] = { ...s.person, total: 0, fixasTotal: 0, byCard: {} }
            byPerson[pid].total      += Number(s.amount)
            byPerson[pid].fixasTotal += Number(s.amount)
          })
        } else if (b.bill?.person_id) {
          const pid = b.bill.person_id
          if (!byPerson[pid]) byPerson[pid] = { id: pid, name: '—', color: null, total: 0, fixasTotal: 0, byCard: {} }
          byPerson[pid].total      += amt
          byPerson[pid].fixasTotal += amt
        }
      })

      return {
        mRef, total, entrada, expsCount: exps.length,
        isCurrent: mRef === format(today, 'yyyy-MM'),
        byPerson: Object.values(byPerson).sort((a, b) => b.total - a.total),
      }
    })

    setData(grouped)
    setLoading(false)
  }, [months])

  useEffect(() => { load() }, [load])

  function toggleKey(key) {
    setOpenKeys(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  if (loading) return (
    <div className="c-loading-screen" style={{ height: '60vh' }}>
      <div className="c-loading-spinner" /><p>Carregando previsão...</p>
    </div>
  )

  const futureTotal = data.reduce((s, m) => s + m.total, 0)

  return (
    <div>
      {/* ── Header ── */}
      <div className="c-flex c-items-center c-justify-between c-mb-4">
        <div className="c-page-header" style={{ margin: 0 }}>
          <h2>📆 Previsão</h2>
          <p>Visão dos próximos meses — total comprometido: {fmt(futureTotal)}</p>
        </div>
        <div className="c-flex c-items-center c-gap-2">
          <span className="c-text-muted c-text-sm">Mostrar</span>
          {[3, 6, 9].map(n => (
            <button
              key={n}
              className={`c-btn c-btn-sm ${months === n ? 'c-btn-primary' : 'c-btn-secondary'}`}
              onClick={() => setMonths(n)}
            >
              {n} meses
            </button>
          ))}
        </div>
      </div>

      {/* ── Month cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.map(m => {
          const saldo = m.entrada - m.total

          return (
            <div
              key={m.mRef}
              style={{
                border: m.isCurrent ? '2px solid #6366f1' : '1px solid var(--c-border)',
                borderRadius: 14,
                background: 'var(--c-surface)',
                overflow: 'hidden',
                boxShadow: m.isCurrent ? '0 0 0 4px rgba(99,102,241,.07)' : 'none',
              }}
            >
              {/* Month header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--c-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {m.isCurrent && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '.7px',
                        textTransform: 'uppercase', color: '#6366f1',
                        background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.25)',
                        padding: '2px 8px', borderRadius: 99,
                      }}>
                        MÊS ATUAL
                      </span>
                    )}
                    <span style={{ fontSize: 16, fontWeight: 700, textTransform: 'capitalize' }}>
                      {format(parseISO(m.mRef + '-01'), "MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="c-text-sm c-text-muted" style={{ marginTop: 3 }}>
                    {m.expsCount} lançamento{m.expsCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: 20, fontWeight: 800, letterSpacing: '-.5px',
                    color: m.total > 0 ? '#ef4444' : 'var(--c-text-muted)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {fmt(m.total)}
                  </div>
                  {m.entrada > 0 && (
                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, color: saldo >= 0 ? '#10b981' : '#ef4444' }}>
                      saldo: {fmt(saldo)}
                    </div>
                  )}
                </div>
              </div>

              {/* Person accordions */}
              {m.byPerson.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--c-text-muted)', fontSize: 13 }}>
                  Nenhum lançamento para este mês
                </div>
              ) : (
                m.byPerson.map((p, idx) => {
                  const key       = `${m.mRef}-${p.id}`
                  const isOpen    = openKeys.has(key)
                  const cardList  = Object.values(p.byCard).sort((a, b) => b.total - a.total)
                  const hasFixas  = p.fixasTotal > 0
                  const hasCards  = cardList.length > 0
                  const color     = p.color || AVATAR_COLORS[idx % AVATAR_COLORS.length]
                  const isLast    = idx === m.byPerson.length - 1

                  const subtitle = [
                    hasCards && `${cardList.length} ${cardList.length !== 1 ? 'cartões' : 'cartão'}`,
                    hasFixas && 'contas fixas',
                  ].filter(Boolean).join(' · ') || 'sem detalhes'

                  return (
                    <div key={p.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--c-border)' }}>
                      {/* Accordion trigger */}
                      <button
                        onClick={() => toggleKey(key)}
                        style={{
                          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '13px 20px', color: 'var(--c-text)', textAlign: 'left',
                          transition: 'background .15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', background: color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 14, color: '#fff', flexShrink: 0,
                        }}>
                          {p.name?.[0]?.toUpperCase()}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 1 }}>{subtitle}</div>
                        </div>

                        {/* Amount */}
                        <span style={{
                          fontSize: 16, fontWeight: 700, color: '#10b981',
                          fontVariantNumeric: 'tabular-nums', marginRight: 6,
                        }}>
                          {fmt(p.total)}
                        </span>

                        {/* Chevron */}
                        <svg
                          width="18" height="18" viewBox="0 0 20 20" fill="currentColor"
                          style={{
                            color: 'var(--c-text-muted)', flexShrink: 0,
                            transition: 'transform .22s cubic-bezier(.4,0,.2,1)',
                            transform: isOpen ? 'rotate(180deg)' : 'none',
                          }}
                        >
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
                        </svg>
                      </button>

                      {/* Accordion body */}
                      {isOpen && (
                        <div style={{ padding: '2px 20px 14px 70px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {hasFixas && (
                            <>
                              <div style={{
                                fontSize: 10, fontWeight: 700, letterSpacing: '.7px',
                                textTransform: 'uppercase', color: 'var(--c-text-muted)',
                                marginTop: 8, marginBottom: 4,
                              }}>
                                Contas Fixas
                              </div>
                              <DetailRow icon="🏠" label="Contas fixas do mês" amount={fmt(p.fixasTotal)} muted />
                            </>
                          )}

                          {hasCards && (
                            <>
                              <div style={{
                                fontSize: 10, fontWeight: 700, letterSpacing: '.7px',
                                textTransform: 'uppercase', color: 'var(--c-text-muted)',
                                marginTop: hasFixas ? 8 : 6, marginBottom: 4,
                              }}>
                                Cartões
                              </div>
                              {cardList.map(c => (
                                <DetailRow
                                  key={c.id}
                                  icon="💳"
                                  label={c.name}
                                  dot={c.color}
                                  amount={fmt(c.total)}
                                />
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DetailRow({ icon, label, dot, amount, muted }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 9,
      background: 'var(--c-bg)', border: '1px solid var(--c-border)',
    }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
        {dot && <span className="c-dot" style={{ background: dot, flexShrink: 0 }} />}
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      </div>
      <span style={{
        fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
        color: muted ? 'var(--c-text-muted)' : 'var(--c-text)',
        flexShrink: 0,
      }}>
        {amount}
      </span>
    </div>
  )
}
