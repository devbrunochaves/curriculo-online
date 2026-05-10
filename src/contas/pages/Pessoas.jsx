import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { format, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const fmt = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'

export default function Pessoas() {
  const [currentDate, setCurrentDate] = useState(addMonths(new Date(), 1))
  const [data, setData]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState(null)

  const monthRef = format(currentDate, 'yyyy-MM')

  const load = useCallback(async () => {
    setLoading(true)
    const [
      { data: people },
      { data: expenses },
      { data: billEntries },
    ] = await Promise.all([
      supabase.from('people').select('*').eq('is_active', true).order('name'),
      supabase.from('expenses')
        .select('*, card:cards(*), category:categories(*), splits:expense_splits(*, person:people(*))')
        .eq('month_ref', monthRef),
      supabase.from('bill_entries')
        .select('*, bill:recurring_bills(*), splits:bill_entry_splits(*, person:people(*))')
        .eq('month_ref', monthRef),
    ])
    setData({ people: people || [], expenses: expenses || [], billEntries: billEntries || [] })
    setLoading(false)
  }, [monthRef])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="c-loading-screen" style={{ height: '40vh' }}><div className="c-loading-spinner" /></div>

  const { people, expenses, billEntries } = data

  const summaries = people.map(p => {
    // ── Cartões ──────────────────────────────────────────────────────────────
    const cardSplits = []
    expenses.forEach(e => {
      const s = e.splits?.find(s => s.person_id === p.id)
      if (s) cardSplits.push({ ...e, myAmount: Number(s.amount), sourceType: 'card' })
    })

    // ── Contas Fixas ─────────────────────────────────────────────────────────
    const fixedSplits = []
    billEntries.forEach(e => {
      const splitEntry = e.splits?.find(s => s.person_id === p.id)
      if (splitEntry) {
        // Tem divisão → usa o valor da divisão
        fixedSplits.push({ ...e, myAmount: Number(splitEntry.amount), sourceType: 'fixed' })
      } else if (!e.splits?.length && e.bill?.person_id === p.id) {
        // Sem divisão mas é o responsável → conta o total
        fixedSplits.push({ ...e, myAmount: Number(e.amount), sourceType: 'fixed' })
      }
    })

    const allSplits = [...cardSplits, ...fixedSplits]
    const total     = allSplits.reduce((acc, e) => acc + e.myAmount, 0)

    // Agrupamento por cartão
    const byCard = {}
    cardSplits.forEach(e => {
      const key   = e.card?.name || 'Sem cartão'
      const color = e.card?.color || '#94a3b8'
      if (!byCard[key]) byCard[key] = { name: key, color, amount: 0 }
      byCard[key].amount += e.myAmount
    })

    // Total de contas fixas agrupado
    const fixedTotal = fixedSplits.reduce((s, e) => s + e.myAmount, 0)

    return {
      ...p,
      total,
      cardSplits,
      fixedSplits,
      allSplits,
      byCard:     Object.values(byCard),
      fixedTotal,
    }
  }).filter(p => p.total > 0).sort((a, b) => b.total - a.total)

  const grandTotal = summaries.reduce((s, p) => s + p.total, 0)

  return (
    <div>
      <div className="c-flex c-items-center c-justify-between c-mb-4">
        <div className="c-page-header" style={{ margin: 0 }}>
          <h2>Pessoas</h2>
          <p>Quem deve quanto este mês — {fmt(grandTotal)} total</p>
        </div>
        <div className="c-month-nav">
          <button onClick={() => setCurrentDate(d => subMonths(d, 1))}>‹</button>
          <span style={{ textTransform: 'capitalize' }}>{format(currentDate, 'MMM yyyy', { locale: ptBR })}</span>
          <button onClick={() => setCurrentDate(d => addMonths(d, 1))}>›</button>
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="c-card"><div className="c-empty-state"><div className="c-empty-icon">👥</div><h3>Nenhum dado neste mês</h3></div></div>
      ) : (
        <>
          {/* ── Gráfico ── */}
          <div className="c-card c-mb-4">
            <div className="c-section-title">Resumo Geral</div>
            <ResponsiveContainer width="100%" height={Math.max(120, summaries.length * 60)}>
              <BarChart data={summaries} layout="vertical" margin={{ left: 10, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={v => fmt(v)} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {summaries.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Cards por pessoa ── */}
          <div className="c-grid-3">
            {summaries.map(p => (
              <div
                key={p.id}
                className="c-card"
                style={{ cursor: 'pointer', border: selected === p.id ? `2px solid ${p.color}` : '2px solid transparent', transition: 'border 0.15s' }}
                onClick={() => setSelected(selected === p.id ? null : p.id)}
              >
                <div className="c-flex c-items-center c-gap-2 c-mb-2">
                  <span className="c-dot" style={{ background: p.color, width: 12, height: 12 }} />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: p.color }}>{fmt(p.total)}</div>
                <div className="c-text-muted c-text-sm c-mt-1">
                  {p.cardSplits.length} lançamento{p.cardSplits.length !== 1 ? 's' : ''} em cartão
                  {p.fixedSplits.length > 0 && ` · ${p.fixedSplits.length} conta${p.fixedSplits.length !== 1 ? 's' : ''} fixa${p.fixedSplits.length !== 1 ? 's' : ''}`}
                </div>

                {/* Por cartão */}
                <div className="c-mt-2">
                  {p.byCard.map(c => (
                    <div key={c.name} className="c-flex c-items-center c-justify-between c-mt-1">
                      <div className="c-flex c-items-center c-gap-2">
                        <span className="c-dot" style={{ background: c.color, width: 8, height: 8 }} />
                        <span className="c-text-sm">{c.name}</span>
                      </div>
                      <span className="c-text-sm c-font-bold">{fmt(c.amount)}</span>
                    </div>
                  ))}
                  {/* Linha de contas fixas */}
                  {p.fixedTotal > 0 && (
                    <div className="c-flex c-items-center c-justify-between c-mt-1">
                      <div className="c-flex c-items-center c-gap-2">
                        <span style={{ fontSize: 12 }}>🏠</span>
                        <span className="c-text-sm">Contas Fixas</span>
                      </div>
                      <span className="c-text-sm c-font-bold">{fmt(p.fixedTotal)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Detalhe ao clicar na pessoa ── */}
          {selected && (() => {
            const p = summaries.find(p => p.id === selected)
            if (!p) return null
            return (
              <div className="c-card c-mt-4">
                <div className="c-section-title" style={{ color: p.color }}>Detalhe — {p.name}</div>

                {/* Lançamentos de cartão */}
                {p.cardSplits.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-muted)', marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      💳 Cartões
                    </div>
                    <div className="c-table-wrap" style={{ marginBottom: 20 }}>
                      <table>
                        <thead><tr><th>Data</th><th>Descrição</th><th>Cartão</th><th>Categoria</th><th style={{ textAlign: 'right' }}>Valor</th></tr></thead>
                        <tbody>
                          {p.cardSplits.map(e => (
                            <tr key={e.id}>
                              <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--c-text-muted)' }}>{format(new Date(e.date + 'T12:00:00'), 'dd/MM/yy')}</td>
                              <td style={{ fontWeight: 500 }}>{e.description}</td>
                              <td>{e.card && <span className="c-chip" style={{ background: e.card.color + '20', color: e.card.color }}>{e.card.name}</span>}</td>
                              <td>{e.category && <span className="c-text-sm">{e.category.icon} {e.category.name}</span>}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(e.myAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* Contas fixas */}
                {p.fixedSplits.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      🏠 Contas Fixas
                    </div>
                    <div className="c-table-wrap">
                      <table>
                        <thead><tr><th>Conta</th><th>Categoria</th><th>Vencimento</th><th style={{ textAlign: 'right' }}>Valor</th></tr></thead>
                        <tbody>
                          {p.fixedSplits.map(e => {
                            const cat = e.bill?.category_id
                            return (
                              <tr key={e.id}>
                                <td style={{ fontWeight: 500 }}>{e.bill?.name}</td>
                                <td><span className="c-text-sm c-text-muted">{cat ? '—' : '—'}</span></td>
                                <td style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
                                  {e.bill?.due_day ? `Dia ${e.bill.due_day}` : '—'}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(e.myAmount)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
