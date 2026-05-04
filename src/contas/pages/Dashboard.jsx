import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { format, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'

const fmt = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)

  const monthRef   = format(currentDate, 'yyyy-MM')
  const monthLabel = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })

  const load = useCallback(async () => {
    setLoading(true)
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*, card:cards(*), category:categories(*), splits:expense_splits(*, person:people(*))')
      .eq('month_ref', monthRef)

    const { data: cards }      = await supabase.from('cards').select('*').eq('is_active', true)
    const { data: incomeRows } = await supabase.from('income').select('*').eq('month_ref', monthRef)

    const months = []
    for (let i = 5; i >= 0; i--) months.push(format(subMonths(currentDate, i), 'yyyy-MM'))
    const { data: history } = await supabase.from('expenses').select('total_amount, month_ref').in('month_ref', months)

    setData({ expenses: expenses || [], cards: cards || [], incomeRows: incomeRows || [], history: history || [], months })
    setLoading(false)
  }, [monthRef])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="c-loading-screen" style={{ height: '60vh' }}>
      <div className="c-loading-spinner" /><p>Carregando...</p>
    </div>
  )

  const { expenses, cards, incomeRows, history, months } = data

  const totalGasto    = expenses.reduce((s, e) => s + Number(e.total_amount), 0)
  const totalFixo     = expenses.filter(e => e.is_fixed).reduce((s, e) => s + Number(e.total_amount), 0)
  const totalVariavel = totalGasto - totalFixo
  const totalEntradas = incomeRows.reduce((s, r) => s + Number(r.amount), 0)
  const saldo         = totalEntradas - totalGasto

  const cardTotals = cards.map(c => {
    const spent = expenses.filter(e => e.card_id === c.id).reduce((s, e) => s + Number(e.total_amount), 0)
    const pct   = c.limit_amount ? (spent / c.limit_amount) * 100 : null
    return { ...c, spent, pct }
  }).filter(c => c.spent > 0 || c.limit_amount).sort((a, b) => b.spent - a.spent)

  const personMap = {}
  expenses.forEach(e => {
    e.splits?.forEach(s => {
      if (!personMap[s.person.id]) personMap[s.person.id] = { name: s.person.name, color: s.person.color, total: 0 }
      personMap[s.person.id].total += Number(s.amount)
    })
  })
  const personData = Object.values(personMap).sort((a, b) => b.total - a.total)

  const catMap = {}
  expenses.forEach(e => {
    const cat   = e.category?.name  || 'Outros'
    const icon  = e.category?.icon  || '📦'
    const color = e.category?.color || '#94a3b8'
    if (!catMap[cat]) catMap[cat] = { name: cat, icon, color, value: 0 }
    catMap[cat].value += Number(e.total_amount)
  })
  const catData = Object.values(catMap).sort((a, b) => b.value - a.value).slice(0, 6)

  const historyData = months.map(m => ({
    month: format(new Date(m + '-01'), 'MMM', { locale: ptBR }),
    total: history.filter(h => h.month_ref === m).reduce((s, h) => s + Number(h.total_amount), 0)
  }))

  const alerts = cardTotals.filter(c => c.pct !== null && c.pct >= 80)

  return (
    <div>
      <div className="c-flex c-items-center c-justify-between c-mb-4">
        <div className="c-page-header" style={{ margin: 0 }}>
          <h2>Dashboard</h2>
          <p style={{ textTransform: 'capitalize' }}>{monthLabel}</p>
        </div>
        <div className="c-month-nav">
          <button onClick={() => setCurrentDate(d => subMonths(d, 1))}>‹</button>
          <span style={{ textTransform: 'capitalize' }}>{format(currentDate, 'MMM yyyy', { locale: ptBR })}</span>
          <button onClick={() => setCurrentDate(d => addMonths(d, 1))}>›</button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="c-mb-4 c-flex-col c-gap-2 c-flex">
          {alerts.map(c => (
            <div key={c.id} className={`c-alert ${c.pct >= 100 ? 'c-alert-danger' : 'c-alert-warning'}`}>
              <span>⚠️</span>
              <span>
                <strong>{c.name}</strong> — {fmt(c.spent)} de {fmt(c.limit_amount)} ({c.pct.toFixed(0)}%)
                {c.pct >= 100 ? ' — LIMITE EXCEDIDO!' : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="c-grid-4 c-mb-4">
        <div className="c-card c-stat-card">
          <div className="c-stat-label">Total Gasto</div>
          <div className="c-stat-value" style={{ color: 'var(--c-danger)' }}>{fmt(totalGasto)}</div>
          <div className="c-stat-sub">{expenses.length} lançamentos</div>
        </div>
        <div className="c-card c-stat-card">
          <div className="c-stat-label">Entradas</div>
          <div className="c-stat-value" style={{ color: 'var(--c-success)' }}>{fmt(totalEntradas)}</div>
          <div className="c-stat-sub">{incomeRows.length} receitas</div>
        </div>
        <div className="c-card c-stat-card">
          <div className="c-stat-label">Saldo</div>
          <div className="c-stat-value" style={{ color: saldo >= 0 ? 'var(--c-success)' : 'var(--c-danger)' }}>
            {fmt(saldo)}
          </div>
          <div className="c-stat-sub">{saldo >= 0 ? 'Positivo ✓' : 'Negativo ⚠️'}</div>
        </div>
        <div className="c-card c-stat-card">
          <div className="c-stat-label">Gastos Fixos</div>
          <div className="c-stat-value">{fmt(totalFixo)}</div>
          <div className="c-stat-sub">Variável: {fmt(totalVariavel)}</div>
        </div>
      </div>

      <div className="c-grid-2 c-mb-4">
        <div className="c-card">
          <div className="c-section-title">Utilização dos Cartões</div>
          {cardTotals.length === 0
            ? <div className="c-text-muted c-text-sm">Nenhum gasto neste mês.</div>
            : cardTotals.map(c => (
              <div key={c.id} style={{ marginBottom: 14 }}>
                <div className="c-flex c-items-center c-justify-between c-mb-2">
                  <div className="c-flex c-items-center c-gap-2">
                    <span className="c-dot" style={{ background: c.color }} />
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</span>
                  </div>
                  <div className="c-text-right">
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{fmt(c.spent)}</span>
                    {c.limit_amount && <span className="c-text-muted c-text-sm"> / {fmt(c.limit_amount)}</span>}
                  </div>
                </div>
                {c.limit_amount && (
                  <div className="c-progress-bar">
                    <div className="c-progress-fill" style={{
                      width: `${Math.min(c.pct, 100)}%`,
                      background: c.pct >= 100 ? 'var(--c-danger)' : c.pct >= 80 ? 'var(--c-warning)' : c.color
                    }} />
                  </div>
                )}
              </div>
            ))
          }
        </div>

        <div className="c-card">
          <div className="c-section-title">Gastos por Pessoa</div>
          {personData.length === 0
            ? <div className="c-text-muted c-text-sm">Nenhum dado.</div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={personData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {personData.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      <div className="c-grid-2">
        <div className="c-card">
          <div className="c-section-title">Tendência — últimos 6 meses</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={historyData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => fmt(v)} />
              <Line type="monotone" dataKey="total" stroke="var(--c-accent)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="c-card">
          <div className="c-section-title">Por Categoria</div>
          {catData.length === 0
            ? <div className="c-text-muted c-text-sm">Nenhum dado.</div>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                    label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {catData.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>
    </div>
  )
}
