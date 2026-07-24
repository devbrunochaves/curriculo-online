import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { format, subMonths, addMonths, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Home,
  ReceiptText,
  UserRound,
  Users,
  WalletCards,
} from 'lucide-react'
import {
  EmptyState,
  IconButton,
  MetricCard,
  PageHeader,
  SectionCard,
  Skeleton,
  StatusBadge,
} from '../components/ui'

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
      { data: activeBills },
    ] = await Promise.all([
      supabase.from('people').select('*').eq('is_active', true).order('name'),
      supabase.from('expenses')
        .select('*, card:cards(*), category:categories(*), splits:expense_splits(*, person:people(*))')
        .eq('month_ref', monthRef),
      supabase.from('recurring_bills').select('*').eq('is_active', true),
    ])

    // Auto-gera entradas das contas fixas para o mês se ainda não existirem.
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
          const prevMonthRef = format(subMonths(parseISO(monthRef + '-01'), 1), 'yyyy-MM')
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

    const { data: billEntries } = await supabase
      .from('bill_entries')
      .select('*, bill:recurring_bills(*), splits:bill_entry_splits(*, person:people(*))')
      .eq('month_ref', monthRef)

    setData({ people: people || [], expenses: expenses || [], billEntries: billEntries || [] })
    setLoading(false)
  }, [monthRef])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="c-pessoas-v2-page" aria-busy="true">
        <PageHeader
          eyebrow="Financeiro"
          title="Pessoas"
          description="Carregando a divisão financeira do mês."
        />
        <div className="c-pessoas-v2-metrics">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
        <SectionCard className="c-pessoas-v2-section" padding="lg">
          <Skeleton variant="text" lines={6} />
        </SectionCard>
      </div>
    )
  }

  const { people, expenses, billEntries } = data

  const summaries = people.map(p => {
    // Cartões.
    const cardSplits = []
    expenses.forEach(e => {
      const s = e.splits?.find(s => s.person_id === p.id)
      if (s) cardSplits.push({ ...e, myAmount: Number(s.amount), sourceType: 'card' })
    })

    // Contas fixas.
    const fixedSplits = []
    billEntries.forEach(e => {
      const splitEntry = e.splits?.find(s => s.person_id === p.id)
      if (splitEntry) {
        fixedSplits.push({ ...e, myAmount: Number(splitEntry.amount), sourceType: 'fixed' })
      } else if (!e.splits?.length && e.bill?.person_id === p.id) {
        fixedSplits.push({ ...e, myAmount: Number(e.amount), sourceType: 'fixed' })
      }
    })

    const allSplits = [...cardSplits, ...fixedSplits]
    const total     = allSplits.reduce((acc, e) => acc + e.myAmount, 0)

    const byCard = {}
    cardSplits.forEach(e => {
      const key   = e.card?.name || 'Sem cartão'
      const color = e.card?.color || '#94a3b8'
      if (!byCard[key]) byCard[key] = { name: key, color, amount: 0 }
      byCard[key].amount += e.myAmount
    })

    const fixedTotal = fixedSplits.reduce((s, e) => s + e.myAmount, 0)

    return {
      ...p,
      total,
      cardSplits,
      fixedSplits,
      allSplits,
      byCard: Object.values(byCard),
      fixedTotal,
    }
  }).filter(p => p.total > 0).sort((a, b) => b.total - a.total)

  const grandTotal = summaries.reduce((s, p) => s + p.total, 0)
  const monthLabel = format(currentDate, 'MMMM yyyy', { locale: ptBR })
  const cardEntriesCount = summaries.reduce((sum, p) => sum + p.cardSplits.length, 0)
  const fixedEntriesCount = summaries.reduce((sum, p) => sum + p.fixedSplits.length, 0)
  const topPerson = summaries[0]

  return (
    <div className="c-pessoas-v2-page">
      <PageHeader
        eyebrow="Financeiro"
        title="Pessoas"
        description={`Quem participa das despesas em ${monthLabel}.`}
        meta={<StatusBadge tone="accent" icon={<CalendarDays size={14} />}>{monthLabel}</StatusBadge>}
        actions={
          <div className="c-pessoas-v2-month-nav" aria-label="Navegação de mês">
            <IconButton
              icon={<ChevronLeft size={18} />}
              label="Mês anterior"
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(d => subMonths(d, 1))}
            />
            <span>{format(currentDate, 'MMM yyyy', { locale: ptBR })}</span>
            <IconButton
              icon={<ChevronRight size={18} />}
              label="Próximo mês"
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(d => addMonths(d, 1))}
            />
          </div>
        }
      />

      <div className="c-pessoas-v2-metrics">
        <MetricCard
          label="Total dividido"
          value={fmt(grandTotal)}
          description="Despesas atribuídas às pessoas"
          tone="accent"
          icon={<Users size={18} />}
        />
        <MetricCard
          label="Pessoas com saldo"
          value={summaries.length}
          description={`${people.length} pessoa${people.length !== 1 ? 's' : ''} ativa${people.length !== 1 ? 's' : ''}`}
          icon={<UserRound size={18} />}
        />
        <MetricCard
          label="Lançamentos em cartão"
          value={cardEntriesCount}
          description="Itens com divisão no mês"
          icon={<CreditCard size={18} />}
        />
        <MetricCard
          label="Contas fixas"
          value={fixedEntriesCount}
          description={topPerson ? `Maior saldo: ${topPerson.name}` : 'Nenhuma conta no mês'}
          tone="success"
          icon={<Home size={18} />}
        />
      </div>

      {summaries.length === 0 ? (
        <SectionCard padding="lg">
          <EmptyState
            icon={<Users size={24} />}
            title="Nenhum dado neste mês"
            description="Não há despesas ou contas fixas divididas entre pessoas para o período selecionado."
          />
        </SectionCard>
      ) : (
        <>
          <div className="c-pessoas-v2-insights">
            <SectionCard
              title="Resumo geral"
              description="Distribuição do total por pessoa no mês selecionado."
              actions={<StatusBadge tone="info" icon={<BarChart3 size={14} />}>{summaries.length} pessoa{summaries.length !== 1 ? 's' : ''}</StatusBadge>}
              className="c-pessoas-v2-section"
            >
              <div className="c-pessoas-v2-chart">
                <ResponsiveContainer width="100%" height={Math.max(180, summaries.length * 58)}>
                  <BarChart data={summaries} layout="vertical" margin={{ left: 10, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--v2-color-border)" />
                    <XAxis type="number" tickFormatter={v => fmt(v)} tick={{ fontSize: 11, fill: 'var(--v2-color-text-muted)' }} />
                    <YAxis type="category" dataKey="name" width={86} tick={{ fontSize: 12, fill: 'var(--v2-color-text-muted)' }} />
                    <Tooltip formatter={v => fmt(v)} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                      {summaries.map((p, i) => <Cell key={i} fill={p.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard
              title="Ranking"
              description="Maiores participações no período."
              className="c-pessoas-v2-section"
            >
              <div className="c-pessoas-v2-ranking">
                {summaries.slice(0, 5).map((p, index) => (
                  <button
                    type="button"
                    key={p.id}
                    className={`c-pessoas-v2-ranking-row ${selected === p.id ? 'is-active' : ''}`}
                    onClick={() => setSelected(selected === p.id ? null : p.id)}
                  >
                    <span className="c-pessoas-v2-rank">{index + 1}</span>
                    <span className="c-pessoas-v2-avatar" style={{ '--person-color': p.color }}>{p.name?.slice(0, 1)}</span>
                    <span className="c-pessoas-v2-ranking-name">{p.name}</span>
                    <strong>{fmt(p.total)}</strong>
                  </button>
                ))}
              </div>
            </SectionCard>
          </div>

          <section className="c-pessoas-v2-grid" aria-label="Pessoas do mês">
            {summaries.map(p => (
              <button
                type="button"
                key={p.id}
                className={`c-pessoas-v2-person-card ${selected === p.id ? 'is-active' : ''}`}
                style={{ '--person-color': p.color }}
                onClick={() => setSelected(selected === p.id ? null : p.id)}
              >
                <div className="c-pessoas-v2-person-card__top">
                  <span className="c-pessoas-v2-avatar">{p.name?.slice(0, 1)}</span>
                  <span className="c-pessoas-v2-person-card__name">{p.name}</span>
                </div>
                <strong className="c-pessoas-v2-person-card__value">{fmt(p.total)}</strong>
                <p className="c-pessoas-v2-person-card__meta">
                  {p.cardSplits.length} lançamento{p.cardSplits.length !== 1 ? 's' : ''} em cartão
                  {p.fixedSplits.length > 0 && ` · ${p.fixedSplits.length} conta${p.fixedSplits.length !== 1 ? 's' : ''} fixa${p.fixedSplits.length !== 1 ? 's' : ''}`}
                </p>

                <div className="c-pessoas-v2-card-breakdown">
                  {p.byCard.map(c => (
                    <div key={c.name} className="c-pessoas-v2-breakdown-row">
                      <span><i style={{ background: c.color }} />{c.name}</span>
                      <strong>{fmt(c.amount)}</strong>
                    </div>
                  ))}
                  {p.fixedTotal > 0 && (
                    <div className="c-pessoas-v2-breakdown-row">
                      <span><i />Contas Fixas</span>
                      <strong>{fmt(p.fixedTotal)}</strong>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </section>

          {selected && (() => {
            const p = summaries.find(p => p.id === selected)
            if (!p) return null
            return (
              <SectionCard
                title={`Detalhe — ${p.name}`}
                description={`${fmt(p.total)} distribuídos no mês selecionado.`}
                actions={<StatusBadge tone="accent" icon={<WalletCards size={14} />}>{p.cardSplits.length + p.fixedSplits.length} item{p.cardSplits.length + p.fixedSplits.length !== 1 ? 's' : ''}</StatusBadge>}
                className="c-pessoas-v2-detail"
              >
                {p.cardSplits.length > 0 && (
                  <div className="c-pessoas-v2-detail-group">
                    <div className="c-pessoas-v2-detail-group__title">
                      <CreditCard size={16} />
                      <span>Cartões</span>
                    </div>
                    <div className="c-pessoas-v2-detail-list">
                      {p.cardSplits.map(e => (
                        <div className="c-pessoas-v2-detail-row" key={e.id}>
                          <div>
                            <strong>{e.description}</strong>
                            <span>{format(new Date(e.date + 'T12:00:00'), 'dd/MM/yy')} · {e.category?.name || 'Sem categoria'}</span>
                          </div>
                          <div className="c-pessoas-v2-detail-row__side">
                            {e.card && <StatusBadge tone="neutral" size="sm">{e.card.name}</StatusBadge>}
                            <strong>{fmt(e.myAmount)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {p.fixedSplits.length > 0 && (
                  <div className="c-pessoas-v2-detail-group">
                    <div className="c-pessoas-v2-detail-group__title">
                      <ReceiptText size={16} />
                      <span>Contas Fixas</span>
                    </div>
                    <div className="c-pessoas-v2-detail-list">
                      {p.fixedSplits.map(e => (
                        <div className="c-pessoas-v2-detail-row" key={e.id}>
                          <div>
                            <strong>{e.bill?.name}</strong>
                            <span>{e.bill?.due_day ? `Vencimento dia ${e.bill.due_day}` : 'Sem vencimento informado'}</span>
                          </div>
                          <div className="c-pessoas-v2-detail-row__side">
                            <StatusBadge tone="success" size="sm">Fixa</StatusBadge>
                            <strong>{fmt(e.myAmount)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>
            )
          })()}
        </>
      )}
    </div>
  )
}
