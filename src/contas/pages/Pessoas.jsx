import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { format, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const fmt = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'

export default function Pessoas() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const monthRef = format(currentDate, 'yyyy-MM')

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: people }, { data: expenses }] = await Promise.all([
      supabase.from('people').select('*').eq('is_active', true).order('name'),
      supabase.from('expenses').select('*, card:cards(*), category:categories(*), splits:expense_splits(*, person:people(*))').eq('month_ref', monthRef),
    ])
    setData({ people: people || [], expenses: expenses || [] })
    setLoading(false)
  }, [monthRef])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="c-loading-screen" style={{ height: '40vh' }}><div className="c-loading-spinner" /></div>

  const { people, expenses } = data

  const summaries = people.map(p => {
    const splits = []
    expenses.forEach(e => {
      const s = e.splits?.find(s => s.person_id === p.id)
      if (s) splits.push({ ...e, myAmount: Number(s.amount) })
    })
    const total = splits.reduce((acc, e) => acc + e.myAmount, 0)
    const byCard = {}
    splits.forEach(e => {
      const key = e.card?.name || 'Sem cartão'; const color = e.card?.color || '#94a3b8'
      if (!byCard[key]) byCard[key] = { name: key, color, amount: 0 }
      byCard[key].amount += e.myAmount
    })
    return { ...p, total, splits, byCard: Object.values(byCard) }
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
          <div className="c-card c-mb-4">
            <div className="c-section-title">Resumo Geral</div>
            <ResponsiveContainer width="100%" height={200}>
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

          <div className="c-grid-3">
            {summaries.map(p => (
              <div key={p.id} className="c-card" style={{ cursor: 'pointer', border: selected === p.id ? `2px solid ${p.color}` : '2px solid transparent', transition: 'border 0.15s' }} onClick={() => setSelected(selected === p.id ? null : p.id)}>
                <div className="c-flex c-items-center c-gap-2 c-mb-2">
                  <span className="c-dot" style={{ background: p.color, width: 12, height: 12 }} />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: p.color }}>{fmt(p.total)}</div>
                <div className="c-text-muted c-text-sm c-mt-1">{p.splits.length} lançamentos</div>
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
                </div>
              </div>
            ))}
          </div>

          {selected && (() => {
            const p = summaries.find(p => p.id === selected)
            if (!p) return null
            return (
              <div className="c-card c-mt-4">
                <div className="c-section-title" style={{ color: p.color }}>Detalhe — {p.name}</div>
                <div className="c-table-wrap">
                  <table>
                    <thead><tr><th>Data</th><th>Descrição</th><th>Cartão</th><th>Categoria</th><th style={{ textAlign: 'right' }}>Valor</th></tr></thead>
                    <tbody>
                      {p.splits.map(e => (
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
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
