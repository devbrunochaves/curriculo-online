import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { format, addMonths, subMonths, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
  BarChart, Bar, Cell as BarCell
} from 'recharts'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Download,
  FileText,
  Home,
  PieChart as PieChartIcon,
  ReceiptText,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  Button,
  EmptyState,
  IconButton,
  MetricCard,
  PageHeader,
  SectionCard,
  Skeleton,
  StatusBadge,
} from '../components/ui'

const fmt = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'

// Converte cor hex para [r, g, b] para o jsPDF
function hexToRgb(hex) {
  const h = hex?.replace('#', '') || '6366f1'
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function gerarPDF(person, personExpenses, personBills, monthLabel) {
  const doc = new jsPDF()
  const rgb = hexToRgb(person.color)

  // Cabeçalho
  doc.setFillColor(...rgb)
  doc.rect(0, 0, 210, 36, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(`Relatório — ${person.name}`, 14, 16)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(monthLabel, 14, 24)
  doc.text(`Total: ${fmt(person.total)}`, 14, 31)

  let y = 46

  // ── Lançamentos em cartão ───────────────────────────────
  if (personExpenses.length > 0) {
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Lançamentos em Cartão', 14, y)
    doc.setFont('helvetica', 'normal')

    const subtotalCartoes = personExpenses.reduce((s, e) => s + Number(e.myAmount), 0)

    autoTable(doc, {
      startY: y + 4,
      head: [['Data', 'Descrição', 'Cartão', 'Meu valor']],
      body: personExpenses.map(e => {
        const [, mo, da] = (e.date || '').split('-')
        return [
          da ? `${da}/${mo}` : '—',
          e.description || '—',
          e.card?.name || '—',
          fmt(e.myAmount),
        ]
      }),
      foot: [['', '', 'Subtotal', fmt(subtotalCartoes)]],
      theme: 'striped',
      headStyles: { fillColor: rgb, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      footStyles: { fillColor: [241, 245, 249], textColor: [30, 30, 30], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 3: { halign: 'right' } },
    })
    y = doc.lastAutoTable.finalY + 12
  }

  // ── Contas fixas ────────────────────────────────────────
  if (personBills.length > 0) {
    if (y > 230) { doc.addPage(); y = 20 }
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Contas Fixas', 14, y)
    doc.setFont('helvetica', 'normal')

    const subtotalFixas = personBills.reduce((s, b) => s + Number(b.myAmount), 0)

    autoTable(doc, {
      startY: y + 4,
      head: [['Conta', 'Vencimento', 'Meu valor']],
      body: personBills.map(b => [
        b.bill?.name || '—',
        b.bill?.due_day ? `Dia ${b.bill.due_day}` : '—',
        fmt(b.myAmount),
      ]),
      foot: [['', 'Subtotal', fmt(subtotalFixas)]],
      theme: 'striped',
      headStyles: { fillColor: rgb, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      footStyles: { fillColor: [241, 245, 249], textColor: [30, 30, 30], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 2: { halign: 'right' } },
    })
    y = doc.lastAutoTable.finalY + 12
  }

  // Rodapé
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")} · Página ${i}/${pageCount}`, 14, 290)
  }

  doc.save(`despesas-${person.name.toLowerCase().replace(/\s+/g, '-')}-${monthLabel.replace(/\s/g, '-')}.pdf`)
}

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState(addMonths(new Date(), 1))
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [catModal, setCatModal]       = useState(null)
  const [personModal, setPersonModal] = useState(null)

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

    // Copia splits do mês anterior para entradas existentes sem splits (ex: splits adicionados depois da auto-geração do mês)
    {
      const { data: allCurrentEntries } = await supabase
        .from('bill_entries')
        .select('id, bill_id, splits:bill_entry_splits(id)')
        .eq('month_ref', monthRef)
      const noSplitEntries = (allCurrentEntries || []).filter(e => !e.splits?.length)
      if (noSplitEntries.length) {
        const prevMonthRef = format(subMonths(parseISO(monthRef + '-01'), 1), 'yyyy-MM')
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
    month: format(parseISO(m + '-01'), 'MMM', { locale: ptBR }),
    total: history.filter(h => h.month_ref === m).reduce((s, h) => s + Number(h.total_amount), 0)
  }))

  const alerts = cardTotals.filter(c => c.pct !== null && c.pct >= 80)
  const latestExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6)

  if (data) {
    return (
      <div className="c-dashboard-v2-page">
        <PageHeader
          eyebrow="Financeiro"
          title="Dashboard"
          description={`Narrativa financeira de ${monthLabel}.`}
          meta={<StatusBadge tone={alerts.length ? 'warning' : 'success'}>{alerts.length ? `${alerts.length} alerta${alerts.length !== 1 ? 's' : ''}` : 'Tudo ok'}</StatusBadge>}
          actions={(
            <div className="c-dashboard-v2-month-nav" aria-label="Navegação mensal">
              <IconButton icon={<ArrowLeft />} label="Mês anterior" variant="secondary" size="sm" onClick={() => setCurrentDate(d => subMonths(d, 1))} />
              <span>{format(currentDate, 'MMM yyyy', { locale: ptBR })}</span>
              <IconButton icon={<ArrowRight />} label="Mês seguinte" variant="secondary" size="sm" onClick={() => setCurrentDate(d => addMonths(d, 1))} />
            </div>
          )}
        />

        <section className="c-dashboard-v2-metrics" aria-label="Resumo financeiro do mês">
          <MetricCard label="Total geral" value={fmt(totalGasto)} tone="accent" icon={<WalletCards />} description={`${expenses.length} lançamentos em cartão`} />
          <MetricCard label="Cartões" value={fmt(totalCartoes)} tone="neutral" icon={<CreditCard />} description="Compras do mês selecionado" />
          <MetricCard label="Contas fixas" value={fmt(totalFixas)} tone="accent" icon={<Home />} description={`${billEntries.length} ocorrência${billEntries.length !== 1 ? 's' : ''} mensa${billEntries.length !== 1 ? 'is' : 'l'}`} />
          <MetricCard label="Variável" value={fmt(totalVariavel)} tone={totalVariavel > 0 ? 'warning' : 'success'} icon={<ArrowDownRight />} description={`Fixo em cartão: ${fmt(totalFixo)}`} />
        </section>

        {alerts.length > 0 && (
          <section className="c-dashboard-v2-alerts" aria-label="Alertas financeiros">
            {alerts.map(c => (
              <div key={c.id} className={`c-dashboard-v2-alert c-dashboard-v2-alert--${c.pct >= 100 ? 'danger' : 'warning'}`}>
                <span className="c-dashboard-v2-alert-icon" aria-hidden="true"><AlertTriangle /></span>
                <div>
                  <strong>{c.name}</strong>
                  <span>{fmt(c.spent)} de {fmt(c.limit_amount)} ({c.pct.toFixed(0)}%){c.pct >= 100 ? ' — LIMITE EXCEDIDO!' : ''}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        <div className="c-dashboard-v2-grid c-dashboard-v2-grid--people">
          <SectionCard
            title="Pessoas"
            description="Responsabilidade individual considerando cartões e contas fixas."
            actions={<StatusBadge tone="neutral">{personData.length} pessoa{personData.length !== 1 ? 's' : ''}</StatusBadge>}
          >
            {personData.length === 0 ? (
              <EmptyState compact icon={<UsersRound />} title="Nenhum gasto registrado" description="Ainda não há valores para dividir neste mês." />
            ) : (
              <div className="c-dashboard-v2-person-grid">
                {personData.map(p => (
                  <button key={p.id} type="button" className="c-dashboard-v2-person-card" onClick={() => setPersonModal(p)} style={{ '--person-color': p.color }}>
                    <span className="c-dashboard-v2-person-top">
                      <span className="c-dashboard-v2-avatar">{p.name?.[0]}</span>
                      <span>
                        <strong>{p.name}</strong>
                        <small>{totalGasto > 0 ? ((p.total / totalGasto) * 100).toFixed(0) : 0}% do total</small>
                      </span>
                    </span>
                    <span className="c-dashboard-v2-person-value">{fmt(p.total)}</span>
                    <span className="c-dashboard-v2-progress"><span style={{ width: `${totalGasto > 0 ? Math.min((p.total / totalGasto) * 100, 100) : 0}%`, background: p.color }} /></span>
                    {p.fixasTotal > 0 && (
                      <span className="c-dashboard-v2-breakdown">
                        <span><CreditCard aria-hidden="true" /> Cartões <strong>{fmt(p.total - p.fixasTotal)}</strong></span>
                        <span><Home aria-hidden="true" /> Contas fixas <strong>{fmt(p.fixasTotal)}</strong></span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Resumo do mês"
            description="Composição atual do gasto total."
            className="c-dashboard-v2-summary-card"
          >
            <div className="c-dashboard-v2-summary-list">
              <div><span>Total geral</span><strong>{fmt(totalGasto)}</strong></div>
              <div><span>Cartões</span><strong>{fmt(totalCartoes)}</strong></div>
              <div><span>Fixo em cartão</span><strong>{fmt(totalFixo)}</strong></div>
              <div><span>Variável</span><strong>{fmt(totalVariavel)}</strong></div>
              <div><span>Contas fixas</span><strong>{fmt(totalFixas)}</strong></div>
            </div>
          </SectionCard>
        </div>

        <div className="c-dashboard-v2-grid">
          <SectionCard title="Utilização dos cartões" description="Uso de limite e consumo por cartão.">
            {cardTotals.length === 0 ? (
              <EmptyState compact icon={<CreditCard />} title="Nenhum gasto no mês" description="Nenhum cartão possui consumo no mês selecionado." />
            ) : (
              <div className="c-dashboard-v2-card-list">
                {cardTotals.map(c => (
                  <div key={c.id} className="c-dashboard-v2-card-row">
                    <div className="c-dashboard-v2-row-head">
                      <span className="c-dashboard-v2-dot" style={{ background: c.color }} />
                      <strong>{c.name}</strong>
                      {c.pct !== null && <StatusBadge tone={c.pct >= 100 ? 'danger' : c.pct >= 80 ? 'warning' : 'success'} size="sm">{c.pct.toFixed(0)}%</StatusBadge>}
                    </div>
                    <div className="c-dashboard-v2-row-value">
                      <strong>{fmt(c.spent)}</strong>
                      {c.limit_amount && <span>/ {fmt(c.limit_amount)}</span>}
                    </div>
                    {c.limit_amount && (
                      <span className="c-dashboard-v2-progress">
                        <span style={{
                          width: `${Math.min(c.pct, 100)}%`,
                          background: c.pct >= 100 ? 'var(--v2-color-danger)' : c.pct >= 80 ? 'var(--v2-color-warning)' : c.color
                        }} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Gastos por pessoa" description="Totais agrupados pelas divisões atuais.">
            {personData.length === 0 ? (
              <EmptyState compact icon={<UserRound />} title="Nenhum dado" description="Sem divisão por pessoa neste mês." />
            ) : (
              <div className="c-dashboard-v2-chart">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={personData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--v2-chart-grid)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--v2-color-text-muted)' }} />
                    <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--v2-color-text-muted)' }} />
                    <Tooltip formatter={v => fmt(v)} />
                    <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                      {personData.map((p, i) => <BarCell key={i} fill={p.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="c-dashboard-v2-grid">
          <SectionCard title="Histórico de 6 meses" description="Mesma janela histórica do dashboard atual." actions={<StatusBadge tone="accent">6 meses</StatusBadge>}>
            <div className="c-dashboard-v2-chart">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={historyData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--v2-chart-grid)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--v2-color-text-muted)' }} />
                  <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--v2-color-text-muted)' }} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Line type="monotone" dataKey="total" stroke="var(--v2-color-accent)" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Por categoria" description="Clique em uma fatia para ver os lançamentos." actions={<StatusBadge tone="neutral">{catData.length} categoria{catData.length !== 1 ? 's' : ''}</StatusBadge>}>
            {catData.length === 0 ? (
              <EmptyState compact icon={<PieChartIcon />} title="Nenhum dado" description="Sem categorias para o mês selecionado." />
            ) : (
              <div className="c-dashboard-v2-category-wrap">
                <div className="c-dashboard-v2-chart c-dashboard-v2-chart--donut">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={catData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={86}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        fontSize={10}
                        onClick={(item) => setCatModal(item)}
                        style={{ cursor: 'pointer' }}
                      >
                        {catData.map((c, i) => <Cell key={i} fill={c.color} />)}
                      </Pie>
                      <Tooltip formatter={v => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="c-dashboard-v2-legend">
                  {catData.map(cat => (
                    <button key={cat.name} type="button" onClick={() => setCatModal(cat)} className="c-dashboard-v2-legend-row">
                      <span><span className="c-dashboard-v2-dot" style={{ background: cat.color }} />{cat.name}</span>
                      <strong>{fmt(cat.value)}</strong>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard title="Últimos lançamentos" description="Recorte dos lançamentos em cartão do mês selecionado." actions={<StatusBadge tone="neutral">{expenses.length} no mês</StatusBadge>}>
          {latestExpenses.length === 0 ? (
            <EmptyState compact icon={<ReceiptText />} title="Nenhum lançamento" description="Não há compras registradas neste mês." />
          ) : (
            <div className="c-dashboard-v2-transactions">
              {latestExpenses.map(e => {
                const [, mo, da] = (e.date || '').split('-')
                return (
                  <div key={e.id} className="c-dashboard-v2-transaction-row">
                    <span className="c-dashboard-v2-item-icon" aria-hidden="true"><ReceiptText /></span>
                    <span className="c-dashboard-v2-transaction-copy">
                      <strong>{e.description || 'Lançamento'}</strong>
                      <small>{da ? `${da}/${mo}` : 'Sem data'}{e.card?.name ? ` · ${e.card.name}` : ''}{e.category?.name ? ` · ${e.category.name}` : ''}</small>
                    </span>
                    <strong className="c-dashboard-v2-transaction-value">{fmt(e.total_amount)}</strong>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>

        {personModal && (() => {
          const p = personModal
          const personExpenses = expenses
            .filter(e => e.splits?.some(s => s.person?.id === p.id))
            .map(e => ({ ...e, myAmount: e.splits.find(s => s.person?.id === p.id)?.amount || 0 }))
            .sort((a, b) => new Date(b.date) - new Date(a.date))
          const personBills = billEntries
            .filter(e => e.splits?.some(s => s.person?.id === p.id) || e.bill?.person_id === p.id)
            .map(e => ({
              ...e,
              myAmount: e.splits?.find(s => s.person?.id === p.id)?.amount ??
                        (e.bill?.person_id === p.id ? Number(e.amount) : 0)
            }))
          const subtotalCartoes = personExpenses.reduce((s, e) => s + Number(e.myAmount), 0)
          const subtotalFixas   = personBills.reduce((s, b) => s + Number(b.myAmount), 0)

          return (
            <div className="c-dashboard-v2-modal" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setPersonModal(null) }}>
              <section className="c-dashboard-v2-modal-dialog c-dashboard-v2-modal-dialog--lg" role="dialog" aria-modal="true" aria-label={`Despesas de ${p.name}`}>
                <header className="c-dashboard-v2-modal-header" style={{ '--person-color': p.color }}>
                  <div className="c-dashboard-v2-modal-title-row">
                    <span className="c-dashboard-v2-modal-avatar">{p.name[0]}</span>
                    <div>
                      <h2>{p.name}</h2>
                      <p>Total: <strong>{fmt(p.total)}</strong> · {personExpenses.length} lançamentos · {personBills.length} contas fixas</p>
                    </div>
                  </div>
                  <div className="c-dashboard-v2-modal-actions">
                    <Button size="sm" icon={<Download />} onClick={() => gerarPDF(p, personExpenses, personBills, monthLabel)}>Baixar PDF</Button>
                    <IconButton icon={<X />} label="Fechar modal de pessoa" variant="ghost" size="sm" onClick={() => setPersonModal(null)} />
                  </div>
                </header>
                <div className="c-dashboard-v2-modal-body">
                  {personExpenses.length > 0 && (
                    <section className="c-dashboard-v2-modal-section">
                      <div className="c-dashboard-v2-modal-section-head"><strong><CreditCard aria-hidden="true" /> Lançamentos em cartão</strong><span>{fmt(subtotalCartoes)}</span></div>
                      {personExpenses.map(e => {
                        const [, mo, da] = (e.date || '').split('-')
                        return (
                          <div key={e.id} className="c-dashboard-v2-modal-row">
                            <span className="c-dashboard-v2-dot" style={{ background: e.card?.color || '#94a3b8' }} />
                            <span><strong>{e.description}</strong><small>{da && `${da}/${mo}`}{e.card && ` · ${e.card.name}`}</small></span>
                            <span><strong>{fmt(e.myAmount)}</strong>{Number(e.myAmount) !== Number(e.total_amount) && <small>total {fmt(e.total_amount)}</small>}</span>
                          </div>
                        )
                      })}
                    </section>
                  )}
                  {personBills.length > 0 && (
                    <section className="c-dashboard-v2-modal-section">
                      <div className="c-dashboard-v2-modal-section-head"><strong><Home aria-hidden="true" /> Contas fixas</strong><span>{fmt(subtotalFixas)}</span></div>
                      {personBills.map(b => (
                        <div key={b.id} className="c-dashboard-v2-modal-row">
                          <span className="c-dashboard-v2-dot" style={{ background: p.color }} />
                          <span><strong>{b.bill?.name || '—'}</strong>{b.bill?.due_day && <small>Vence dia {b.bill.due_day}</small>}</span>
                          <span><strong>{fmt(b.myAmount)}</strong></span>
                        </div>
                      ))}
                    </section>
                  )}
                  {personExpenses.length === 0 && personBills.length === 0 && (
                    <EmptyState compact icon={<FileText />} title="Nenhum lançamento encontrado" description="Não existem despesas para esta pessoa no mês selecionado." />
                  )}
                </div>
                <footer className="c-dashboard-v2-modal-footer" style={{ '--person-color': p.color }}>
                  <span>Total geral</span>
                  <strong>{fmt(p.total)}</strong>
                </footer>
              </section>
            </div>
          )
        })()}

        {catModal && (() => {
          const catExpenses = expenses
            .filter(e => e.category?.name === catModal.name)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
          const total = catExpenses.reduce((s, e) => s + Number(e.total_amount), 0)

          return (
            <div className="c-dashboard-v2-modal" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setCatModal(null) }}>
              <section className="c-dashboard-v2-modal-dialog" role="dialog" aria-modal="true" aria-label={`Lançamentos da categoria ${catModal.name}`}>
                <header className="c-dashboard-v2-modal-header">
                  <div className="c-dashboard-v2-modal-title-row">
                    <span className="c-dashboard-v2-category-mark" style={{ '--category-color': catModal.color }}>{catModal.icon}</span>
                    <div>
                      <h2>{catModal.name}</h2>
                      <p>{catExpenses.length} lançamento{catExpenses.length !== 1 ? 's' : ''} · <strong style={{ color: catModal.color }}>{fmt(total)}</strong></p>
                    </div>
                  </div>
                  <IconButton icon={<X />} label="Fechar modal de categoria" variant="ghost" size="sm" onClick={() => setCatModal(null)} />
                </header>
                <div className="c-dashboard-v2-modal-body">
                  {catExpenses.length === 0 ? (
                    <EmptyState compact icon={<PieChartIcon />} title="Nenhum lançamento encontrado" description="Não existem despesas nesta categoria para o mês selecionado." />
                  ) : catExpenses.map(e => {
                    const [, m, d] = (e.date || '').split('-')
                    const dateStr = d ? `${d}/${m}` : '—'
                    return (
                      <div key={e.id} className="c-dashboard-v2-modal-row">
                        <span className="c-dashboard-v2-dot" style={{ background: e.card?.color || '#94a3b8' }} />
                        <span>
                          <strong>{e.description}</strong>
                          <small>{dateStr}{e.card && ` · ${e.card.name}`}{e.splits?.length > 0 && ` · ${e.splits.map(s => s.person?.name).filter(Boolean).join(', ')}`}</small>
                        </span>
                        <span><strong>{fmt(e.total_amount)}</strong></span>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          )
        })()}
      </div>
    )
  }

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
          <div key={p.id} className="c-card c-person-card" onClick={() => setPersonModal(p)} style={{ borderTop: `4px solid ${p.color}`, padding: '14px 16px', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }} onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
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

      {/* ── Modal: despesas da pessoa ── */}
      {personModal && (() => {
        const p = personModal

        // Lançamentos em cartão desta pessoa
        const personExpenses = expenses
          .filter(e => e.splits?.some(s => s.person?.id === p.id))
          .map(e => ({ ...e, myAmount: e.splits.find(s => s.person?.id === p.id)?.amount || 0 }))
          .sort((a, b) => new Date(b.date) - new Date(a.date))

        // Contas fixas desta pessoa
        const personBills = billEntries
          .filter(e =>
            e.splits?.some(s => s.person?.id === p.id) ||
            e.bill?.person_id === p.id
          )
          .map(e => ({
            ...e,
            myAmount: e.splits?.find(s => s.person?.id === p.id)?.amount ??
                      (e.bill?.person_id === p.id ? Number(e.amount) : 0)
          }))

        const subtotalCartoes = personExpenses.reduce((s, e) => s + Number(e.myAmount), 0)
        const subtotalFixas   = personBills.reduce((s, b) => s + Number(b.myAmount), 0)

        return (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={e => { if (e.target === e.currentTarget) setPersonModal(null) }}
          >
            <div style={{ background: 'var(--c-surface)', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>

              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `${p.color}15` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>
                    {p.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17, color: p.color }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>
                      Total: <strong style={{ color: p.color }}>{fmt(p.total)}</strong>
                      {' · '}{personExpenses.length} lançamentos · {personBills.length} contas fixas
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => gerarPDF(p, personExpenses, personBills, monthLabel)}
                    style={{ background: p.color, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    ⬇️ Baixar PDF
                  </button>
                  <button onClick={() => setPersonModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--c-text-muted)', lineHeight: 1, padding: '2px 6px', borderRadius: 6 }}>✕</button>
                </div>
              </div>

              {/* Conteúdo com scroll */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '12px 20px 20px' }}>

                {/* Lançamentos em cartão */}
                {personExpenses.length > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 8px' }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>💳 Lançamentos em Cartão</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: p.color }}>{fmt(subtotalCartoes)}</span>
                    </div>
                    {personExpenses.map(e => {
                      const [, mo, da] = (e.date || '').split('-')
                      return (
                        <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--c-border)' }}>
                          <div style={{ width: 9, height: 9, borderRadius: '50%', background: e.card?.color || '#94a3b8', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.description}</div>
                            <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 2, display: 'flex', gap: 8 }}>
                              {da && <span>📅 {da}/{mo}</span>}
                              {e.card && <span>💳 {e.card.name}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{fmt(e.myAmount)}</div>
                            {Number(e.myAmount) !== Number(e.total_amount) && (
                              <div style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>total {fmt(e.total_amount)}</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}

                {/* Contas fixas */}
                {personBills.length > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 8px' }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>🏠 Contas Fixas</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: p.color }}>{fmt(subtotalFixas)}</span>
                    </div>
                    {personBills.map(b => (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--c-border)' }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{b.bill?.name || '—'}</div>
                          {b.bill?.due_day && <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 2 }}>📅 Vence dia {b.bill.due_day}</div>}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{fmt(b.myAmount)}</div>
                      </div>
                    ))}
                  </>
                )}

                {personExpenses.length === 0 && personBills.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--c-text-muted)', fontSize: 13 }}>Nenhum lançamento encontrado.</div>
                )}
              </div>

              {/* Footer com total */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${p.color}10` }}>
                <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>Total geral</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: p.color }}>{fmt(p.total)}</span>
              </div>

            </div>
          </div>
        )
      })()}

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
