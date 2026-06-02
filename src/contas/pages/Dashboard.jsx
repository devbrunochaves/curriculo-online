import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { format, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
  BarChart, Bar, Cell as BarCell
} from 'recharts'

const fmt = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState(addMonths(new Date(), 1))
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [catModal, setCatModal] = useState(null) // categoria clicada no gráfico de pizza

  const monthRef   = format(currentDate, 'yyyy-MM')
  const monthLabel = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })

  const load = useCallback(async () => {
    setLoading(true)

    const [
      { data: expenses },
      { data: cards },
      { data: people },
      { data: activeBills },
    ] = await Promise.all([
      supabase.from('expenses')
        .select('*, card:cards(*), category:categories(*), splits:expense_splits(*, person:people(*))')
        .eq('month_ref', monthRef),
      supabase.from('cards').select('*').eq('is_active', true),
      supabase.from('people').select('*').eq('is_active', true),
      supabase.from('recurring_bills').select('*').eq('is_active', true),
    ])

    // Auto-gera entradas das contas fixas para o mês se ainda não existirem
    if (activeBills?.length) {
      const { data: existing } = await supabase
        .from('bill_entries').select('bill_id').eq('month_ref', monthRef)
      const existingIds = new Set((existing || []).map(e => e.bill_id))
      const toCreate = activeBills
        .filter(b => !existingIds.has(b.id))
        .map(b => ({ bill_id: b.id, month_ref: monthRef, amount: b.default_amount ?? 0 }))
      if (toCreate.length) {
        const { data: created } = await supabase.from('bill_entries').insert(toCreate).select()
        if (created?.length) {
          const prevMonthRef = format(subMonths(new Date(monthRef + '-01'), 1), 'yyyy-MM')
          const billIds = created.map(e => e.bill_id)
          const { data: prevEntries } = await supabase
            .from('bill_entries')
            .select('id, bill_id, splits:bill_entry_splits(person_id, amount)')
            .eq('month_ref', prevMonthRef)
            .in('bill_id', billIds)
          const splitsToCopy = []
          for (const newEntry of created) {
            const prev = prevEntries?.find(p => p.bill_id === newEntry.bill_id)
            if (prev?.splits?.length) {
              prev.splits.forEach(s => splitsToCopy.push({
                entry_id: newEntry.id,
                person_id: s.person_id,
                amount: s.amount
              }))
            }
          }
          if (splitsToCopy.length) await supabase.from('bill_entry_splits').insert(splitsToCopy)
        }
      }
    }

    // Copia splits do mês anterior para entradas existentes sem splits (ex: splits adicionados depois da auto-geração do mês)
    {
      const { data: allCurrentEntries } = await supabase
        .from('bill_entries')
        .select('id, bill_id, splits:bill_entry_splits(id)')
        .eq('month_ref', monthRef)
      const noSplitEntries = (allCurrentEntries || []).filter(e => !e.splits?.length)
      if (noSplitEntries.length) {
        const prevMonthRef = format(subMonths(new Date(monthRef + '-01'), 1), 'yyyy-MM')
        const { data: prevEntries } = await supabase
          .from('bill_entries')
          .select('bill_id, splits:bill_entry_splits(person_id, amount)')
          .eq('month_ref', prevMonthRef)
          .in('bill_id', noSplitEntries.map(e => e.bill_id))
        const splitsToInsert = []
        for (const entry of noSplitEntries) {
          const prev = prevEntries?.find(p => p.bill_id === entry.bill_id)
          if (prev?.splits?.length) {
            prev.splits.forEach(s => splitsToInsert.push({
              entry_id: entry.id,
              person_id: s.person_id,
              amount: s.amount
            }))
          }
        }
        if (splitsToInsert.length) await supabase.from('bill_entry_splits').insert(splitsToInsert)
      }
    }

    const [{ data: billEntries }] = await Promise.all([
      supabase.from('bill_entries')
        .select('*, bill:recurring_bills(*), splits:bill_entry_splits(*, person:people(*))')
        .eq('month_ref', monthRef),
    ])

    const months = []
    for (let i = 5; i >= 0; i--) months.push(format(subMonths(currentDate, i), 'yyyy-MM'))
    const { data: history } = await supabase.from('expenses').select('total_amount, month_ref').in('month_ref', months)

    setData({ expenses: expenses || [], cards: cards || [], history: history || [], months, billEntries: billEntries || [], people: people || [] })
    setLoading(false)
  }, [monthRef])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="c-loading-screen" style={{ height: '60vh' }}>
      <div className="c-loading-spinner" /><p>Carregando...</p>
    </div>
  )

  const { expenses, cards, history, months, billEntries, people } = data

  const totalCartoes  = expenses.reduce((s, e) => s + Number(e.total_amount), 0)
  const totalFixo     = expenses.filter(e => e.is_fixed).reduce((s, e) => s + Number(e.total_amount), 0)
  const totalVariavel = totalCartoes - totalFixo
  const totalFixas    = billEntries.reduce((s, e) => s + Number(e.amount), 0)
  const totalGasto    = totalCartoes + totalFixas

  const cardTotals = cards.map(c => {
    const spent = expenses.filter(e => e.card_id === c.id).reduce((s, e) => s + Number(e.total_amount), 0)
    const pct   = c.limit_amount ? (spent / c.limit_amount) * 100 : null
    return { ...c, spent, pct }
  }).filter(c => c.spent > 0 || c.limit_amount).sort((a, b) => b.spent - a.spent)

  // Gastos por pessoa: cartões + contas fixas
  const personMap = {}
  const initPerson = (person) => {
    if (!personMap[person.id]) personMap[person.id] = { id: person.id, name: person.name, color: person.color, total: 0, fixasTotal: 0 }
  }
  expenses.forEach(e => {
    e.splits?.forEach(s => {
      initPerson(s.person)
      personMap[s.person.id].total += Number(s.amount)
    })
  })
  billEntries.forEach(e => {
    if (e.splits?.length > 0) {
      e.splits.forEach(s => {
        initPerson(s.person)
        personMap[s.person.id].total      += Number(s.amount)
        personMap[s.person.id].fixasTotal += Number(s.amount)
      })
    } else if (e.bill?.person_id) {
      const person = people.find(p => p.id === e.bill.person_id)
      if (person) {
        initPerson(person)
        personMap[person.id].total      += Number(e.amount)
        personMap[person.id].fixasTotal += Number(e.amount)
      }
    }
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

      {/* ── Resumo compacto do mês ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12, padding: '10px 16px', background: 'var(--c-surface)', borderRadius: 10, boxShadow: 'var(--c-shadow)' }}>
        <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
          <strong style={{ color: 'var(--c-text)', fontSize: 15 }}>{fmt(totalGasto)}</strong>
          {' '}total · {expenses.length} lançamentos em cartão
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--c-text-muted)', flexWrap: 'wrap' }}>
          <span>Fixo: <strong>{fmt(totalFixo)}</strong></span>
          <span>Variável: <strong>{fmt(totalVariavel)}</strong></span>
          <span style={{ color: '#7c3aed' }}>🏠 Contas Fixas: <strong>{fmt(totalFixas)}</strong></span>
        </div>
      </div>

      {/* ── Cards por pessoa ── */}
      <div className="c-person-carousel">
        {personData.length === 0 ? (
          <div className="c-card c-text-muted c-text-sm" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 24 }}>
            Nenhum gasto registrado neste mês ainda.
          </div>
        ) : personData.map(p => (
          <div key={p.id} className="c-card c-person-card" style={{ borderTop: `4px solid ${p.color}`, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <span className="c-dot" style={{ background: p.color, width: 10, height: 10 }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)' }}>{p.name}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: p.color, letterSpacing: '-0.5px' }}>
              {fmt(p.total)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 4 }}>
              {totalGasto > 0 ? ((p.total / totalGasto) * 100).toFixed(0) : 0}% do total
            </div>
            {/* Mini barra proporcional */}
            <div style={{ marginTop: 8, height: 4, background: 'var(--c-border)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: p.color, width: `${totalGasto > 0 ? Math.min((p.total / totalGasto) * 100, 100) : 0}%`, transition: 'width 0.4s ease' }} />
            </div>
            {/* Breakdown: cartões vs fixas */}
            {p.fixasTotal > 0 && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--c-border)', fontSize: 11, color: 'var(--c-text-muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>💳 Cartões</span>
                  <strong>{fmt(p.total - p.fixasTotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7c3aed' }}>
                  <span>🏠 Contas Fixas</span>
                  <strong>{fmt(p.fixasTotal)}</strong>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>


      {/* ── Gastos por Pessoa (barra vertical) + Cartões lado a lado ── */}
      <div className="c-grid-2 c-mb-4">
        {/* Utilização dos Cartões — formato lista */}
        <div className="c-card">
          <div className="c-section-title">Utilização dos Cartões</div>
          {cardTotals.length === 0
            ? <div className="c-text-muted c-text-sm">Nenhum gasto neste mês.</div>
            : cardTotals.map(c => (
              <div key={c.id} style={{ marginBottom: 12 }}>
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

        {/* Gastos por Pessoa — gráfico de barras vertical */}
        <div className="c-card">
          <div className="c-section-title">Gastos por Pessoa</div>
          {personData.length === 0
            ? <div className="c-text-muted c-text-sm">Nenhum dado.</div>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={personData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {personData.map((p, i) => (
                      <BarCell key={i} fill={p.color} />
                    ))}
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
                  <Pie
                    data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                    label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                    labelLine={false} fontSize={10}
                    onClick={(data) => setCatModal(data)}
                    style={{ cursor: 'pointer' }}
                  >
                    {catData.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* ── Modal: lançamentos por categoria ── */}
      {catModal && (() => {
        const catExpenses = expenses
          .filter(e => e.category?.name === catModal.name)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
        const total = catExpenses.reduce((s, e) => s + Number(e.total_amount), 0)

        return (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={e => { if (e.target === e.currentTarget) setCatModal(null) }}
          >
            <div style={{ background: 'var(--c-surface)', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 26, lineHeight: 1 }}>{catModal.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--c-text)' }}>{catModal.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>
                      {catExpenses.length} lançamento{catExpenses.length !== 1 ? 's' : ''} · <strong style={{ color: catModal.color }}>{fmt(total)}</strong>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setCatModal(null)}
                  style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--c-text-muted)', lineHeight: 1, padding: '2px 6px', borderRadius: 6 }}
                >✕</button>
              </div>

              {/* Lista */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '8px 20px 16px' }}>
                {catExpenses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 32, color: 'var(--c-text-muted)', fontSize: 13 }}>
                    Nenhum lançamento encontrado.
                  </div>
                ) : catExpenses.map(e => {
                  const [y, m, d] = (e.date || '').split('-')
                  const dateStr = d ? `${d}/${m}` : '—'
                  return (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--c-border)' }}>
                      {/* Cor do cartão */}
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: e.card?.color || '#94a3b8', flexShrink: 0 }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--c-text)' }}>
                          {e.description}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span>📅 {dateStr}</span>
                          {e.card && <span>💳 {e.card.name}</span>}
                          {e.splits?.length > 0 && (
                            <span>👤 {e.splits.map(s => s.person?.name).filter(Boolean).join(', ')}</span>
                          )}
                        </div>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)', flexShrink: 0 }}>
                        {fmt(e.total_amount)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
