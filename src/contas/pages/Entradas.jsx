import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { format, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  LineChart,
  Plus,
  ReceiptText,
  Trash2,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  FormField,
  IconButton,
  MetricCard,
  PageHeader,
  SectionCard,
  Skeleton,
  StatusBadge,
} from '../components/ui'

const fmt  = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'
const fmtK = v => v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : fmt(v)

const INC     = '#10b981'
const INC_DIM = 'rgba(16,185,129,.10)'
const INC_BDR = 'rgba(16,185,129,.22)'

export default function Entradas() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [entries,     setEntries]     = useState([])
  const [chartData,   setChartData]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [desc,        setDesc]        = useState('')
  const [amount,      setAmount]      = useState('')
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(null)
  const canvasRef = useRef(null)
  const descRef   = useRef(null)

  const monthRef = format(currentDate, 'yyyy-MM')

  const loadChart = useCallback(async () => {
    const months = Array.from({ length: 7 }, (_, i) =>
      format(subMonths(currentDate, 6 - i), 'yyyy-MM')
    )
    const { data } = await supabase
      .from('income_entries')
      .select('month_ref, amount')
      .in('month_ref', months)
    setChartData(
      months.map(m => ({
        month: m,
        label: format(new Date(m + '-15'), 'MMM', { locale: ptBR }),
        total: (data || [])
          .filter(e => e.month_ref === m)
          .reduce((s, e) => s + Number(e.amount), 0),
      }))
    )
  }, [currentDate])

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('income_entries')
      .select('*')
      .eq('month_ref', monthRef)
      .order('date', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }, [monthRef])

  useEffect(() => { load() },      [load])
  useEffect(() => { loadChart() }, [loadChart])

  // Canvas chart
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || chartData.length === 0) return

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const W   = canvas.offsetWidth
      const H   = canvas.offsetHeight
      if (!W || !H) return
      canvas.width  = W * dpr
      canvas.height = H * dpr
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)

      const values = chartData.map(d => d.total)
      const maxV   = Math.max(...values, 500)
      const n      = values.length
      const pad    = { top: 24, right: 28, bottom: 32, left: 64 }
      const cW     = W - pad.left - pad.right
      const cH     = H - pad.top  - pad.bottom
      const xOf    = i => pad.left + (i / (n - 1)) * cW
      const yOf    = v => pad.top  + cH - (v / maxV) * cH

      // Grid lines
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth   = 1
      ctx.setLineDash([3, 4])
      for (let i = 1; i <= 3; i++) {
        const y = yOf((maxV / 3) * i)
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke()
      }
      ctx.setLineDash([])

      // Y labels
      ctx.fillStyle = '#94a3b8'
      ctx.font      = '11px system-ui, sans-serif'
      ctx.textAlign = 'right'
      for (let i = 1; i <= 3; i++) {
        ctx.fillText(fmtK((maxV / 3) * i), pad.left - 10, yOf((maxV / 3) * i) + 4)
      }

      // Area fill
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + cH)
      grad.addColorStop(0, 'rgba(16,185,129,.16)')
      grad.addColorStop(1, 'rgba(16,185,129,.01)')
      ctx.beginPath()
      ctx.moveTo(xOf(0), yOf(values[0]))
      for (let i = 1; i < n; i++) {
        const mx = (xOf(i - 1) + xOf(i)) / 2
        ctx.bezierCurveTo(mx, yOf(values[i-1]), mx, yOf(values[i]), xOf(i), yOf(values[i]))
      }
      ctx.lineTo(xOf(n - 1), pad.top + cH)
      ctx.lineTo(xOf(0),     pad.top + cH)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      // Line
      ctx.beginPath()
      ctx.moveTo(xOf(0), yOf(values[0]))
      for (let i = 1; i < n; i++) {
        const mx = (xOf(i - 1) + xOf(i)) / 2
        ctx.bezierCurveTo(mx, yOf(values[i-1]), mx, yOf(values[i]), xOf(i), yOf(values[i]))
      }
      ctx.strokeStyle = INC
      ctx.lineWidth   = 2.5
      ctx.lineJoin    = 'round'
      ctx.stroke()

      // Dots + last-point label
      values.forEach((v, i) => {
        const last = i === n - 1
        ctx.beginPath()
        ctx.arc(xOf(i), yOf(v), last ? 5 : 3.5, 0, Math.PI * 2)
        ctx.fillStyle = INC
        ctx.fill()
        if (last && v > 0) {
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()
          ctx.fillStyle = INC
          ctx.font      = 'bold 11px system-ui, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(fmtK(v), xOf(i), yOf(v) - 11)
        }
      })

      // X labels
      chartData.forEach((d, i) => {
        const last = i === n - 1
        ctx.font      = `${last ? 'bold' : 'normal'} 11px system-ui, sans-serif`
        ctx.fillStyle = last ? INC : '#94a3b8'
        ctx.textAlign = 'center'
        ctx.fillText(d.label, xOf(i), H - pad.bottom + 18)
      })
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [chartData])

  async function addEntry() {
    if (!desc.trim() || !amount) return
    const num = parseFloat(amount.replace(',', '.').replace(/[^\d.]/g, ''))
    if (isNaN(num) || num <= 0) return
    setSaving(true)
    const { data } = await supabase
      .from('income_entries')
      .insert({ month_ref: monthRef, description: desc.trim(), amount: num, date: format(new Date(), 'yyyy-MM-dd') })
      .select()
      .single()
    if (data) {
      setEntries(prev => [data, ...prev])
      setDesc(''); setAmount('')
      loadChart()
    }
    setSaving(false)
    descRef.current?.focus()
  }

  async function deleteEntry(id) {
    if (!confirm('Excluir esta entrada?')) return
    setDeleting(id)
    await supabase.from('income_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    setDeleting(null)
    loadChart()
  }

  const total          = entries.reduce((s, e) => s + Number(e.amount), 0)
  const prevRef        = format(subMonths(currentDate, 1), 'yyyy-MM')
  const prevTotal      = chartData.find(d => d.month === prevRef)?.total ?? 0
  const variation      = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null
  const accumulated    = chartData.reduce((s, d) => s + d.total, 0)
  const monthsWithData = Math.max(chartData.filter(d => d.total > 0).length, 1)

  return (
    <div className="c-entradas-v2-page">
      <PageHeader
        eyebrow="Receitas"
        title="Entradas"
        description="Recebimentos do mes, historico recente e registro rapido de novas receitas."
        meta={<StatusBadge tone="success" icon={<CalendarDays size={14} />}>{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</StatusBadge>}
        actions={(
          <div className="c-entradas-v2-header-actions">
            <div className="c-entradas-v2-month-nav" aria-label="Navegacao mensal">
              <IconButton icon={<ArrowLeft size={17} />} label="Mes anterior" variant="secondary" size="sm" onClick={() => setCurrentDate(d => subMonths(d, 1))} />
              <span>{format(currentDate, 'MMM yyyy', { locale: ptBR })}</span>
              <IconButton icon={<ArrowRight size={17} />} label="Proximo mes" variant="secondary" size="sm" onClick={() => setCurrentDate(d => addMonths(d, 1))} />
            </div>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => descRef.current?.focus()}
            >
              Nova Entrada
            </Button>
          </div>
        )}
      />

      <div className="c-entradas-v2-metrics">
        <MetricCard
          label="Este mes"
          value={loading ? <Skeleton variant="text" width="132px" /> : fmt(total)}
          description={loading ? 'Carregando receitas' : `${entries.length} recebimento${entries.length !== 1 ? 's' : ''}`}
          tone="success"
          icon={<CircleDollarSign size={18} />}
        />
        <MetricCard
          label="Mes anterior"
          value={fmt(prevTotal)}
          description={variation === null ? 'Sem registro anterior' : `${variation >= 0 ? '+' : '-'}${Math.abs(variation).toFixed(1)}% vs mes anterior`}
          tone={variation === null ? 'neutral' : variation >= 0 ? 'success' : 'danger'}
          icon={<TrendingUp size={18} />}
        />
        <MetricCard
          label="Acumulado 7 meses"
          value={fmt(accumulated)}
          description={`Media mensal ${fmt(accumulated / monthsWithData)}`}
          tone="neutral"
          icon={<LineChart size={18} />}
        />
      </div>

      <div className="c-entradas-v2-grid">
        <SectionCard
          title="Evolucao"
          description="Receita mensal dos ultimos sete meses."
          actions={<StatusBadge tone="success">Receita mensal</StatusBadge>}
          className="c-entradas-v2-chart-card"
        >
          <canvas ref={canvasRef} className="c-entradas-v2-chart" />
        </SectionCard>

        <SectionCard
          title="Nova entrada"
          description="Registro rapido para o mes selecionado."
          className="c-entradas-v2-form-card"
        >
          <div className="c-entradas-v2-form">
            <FormField label="Descricao / Cliente">
              <input
                ref={descRef}
                type="text"
                className="c-entradas-v2-input"
                placeholder="Ex: Projeto Website - Cliente..."
                value={desc}
                onChange={e => setDesc(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addEntry()}
              />
            </FormField>

            <FormField label="Valor">
              <input
                type="text"
                className="c-entradas-v2-input"
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addEntry()}
              />
            </FormField>

            <Button
              variant="primary"
              icon={<Plus size={16} />}
              loading={saving}
              disabled={saving || !desc.trim() || !amount}
              onClick={addEntry}
              className="c-entradas-v2-submit"
            >
              Adicionar
            </Button>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title={`Recebimentos de ${format(currentDate, 'MMMM yyyy', { locale: ptBR })}`}
        description="Lista ordenada por data, do mais recente para o mais antigo."
        actions={!loading && entries.length > 0 && <StatusBadge tone="info">{entries.length} registros</StatusBadge>}
        className="c-entradas-v2-list-card"
      >
        {loading ? (
          <div className="c-entradas-v2-loading">
            <Skeleton variant="table-row" />
            <Skeleton variant="table-row" />
            <Skeleton variant="table-row" />
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<WalletCards size={28} />}
            title="Nenhum recebimento registrado"
            description="Use o formulario acima para registrar suas entradas do mes."
            action={<Button size="sm" icon={<Plus size={15} />} onClick={() => descRef.current?.focus()}>Registrar entrada</Button>}
          />
        ) : (
          <>
            <div className="c-entradas-v2-table-wrap">
              <table className="c-entradas-v2-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descricao</th>
                    <th>Valor</th>
                    <th aria-label="Acoes"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => (
                    <tr key={entry.id}>
                      <td>
                        <span className="c-entradas-v2-date">
                          <CalendarDays size={13} />
                          {format(new Date(entry.date + 'T12:00:00'), 'dd/MM/yy')}
                        </span>
                      </td>
                      <td>
                        <div className="c-entradas-v2-description">
                          <ReceiptText size={15} />
                          <span>{entry.description}</span>
                        </div>
                      </td>
                      <td className="c-entradas-v2-value">{fmt(entry.amount)}</td>
                      <td>
                        <IconButton
                          icon={<Trash2 size={15} />}
                          label="Excluir entrada"
                          variant="danger"
                          size="sm"
                          disabled={deleting === entry.id}
                          onClick={() => deleteEntry(entry.id)}
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="c-entradas-v2-total-row">
                    <td colSpan={2}>Total do mes</td>
                    <td>{fmt(total)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="c-entradas-v2-mobile-list">
              {entries.map(entry => (
                <article key={entry.id} className="c-entradas-v2-mobile-card">
                  <div>
                    <h3>{entry.description}</h3>
                    <span>
                      <CalendarDays size={13} />
                      {format(new Date(entry.date + 'T12:00:00'), 'dd/MM/yy')}
                    </span>
                  </div>
                  <div className="c-entradas-v2-mobile-card__side">
                    <strong>{fmt(entry.amount)}</strong>
                    <IconButton
                      icon={<Trash2 size={15} />}
                      label="Excluir entrada"
                      variant="danger"
                      size="sm"
                      disabled={deleting === entry.id}
                      onClick={() => deleteEntry(entry.id)}
                    />
                  </div>
                </article>
              ))}
              <div className="c-entradas-v2-mobile-total">
                <span>Total do mes</span>
                <strong>{fmt(total)}</strong>
              </div>
            </div>
          </>
        )}
      </SectionCard>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="c-flex c-items-center c-justify-between c-mb-4">
        <div className="c-page-header" style={{ margin: 0 }}>
          <h2>Entradas</h2>
          <p>{entries.length} recebimento{entries.length !== 1 ? 's' : ''} — {fmt(total)}</p>
        </div>
        <div className="c-flex c-items-center c-gap-2">
          <div className="c-month-nav">
            <button onClick={() => setCurrentDate(d => subMonths(d, 1))}>‹</button>
            <span style={{ textTransform: 'capitalize' }}>
              {format(currentDate, 'MMM yyyy', { locale: ptBR })}
            </span>
            <button onClick={() => setCurrentDate(d => addMonths(d, 1))}>›</button>
          </div>
          <button
            className="c-btn c-btn-sm"
            style={{ background: INC, color: '#fff', border: 'none' }}
            onClick={() => descRef.current?.focus()}
          >
            + Nova Entrada
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
        <div className="c-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--c-text-muted)', marginBottom: 8 }}>Este mês</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.8px', color: INC, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{fmt(total)}</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 5 }}>{entries.length} recebimento{entries.length !== 1 ? 's' : ''}</div>
        </div>

        <div className="c-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--c-text-muted)', marginBottom: 8 }}>Mês anterior</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.8px', color: 'var(--c-text)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{fmt(prevTotal)}</div>
          {variation !== null && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 8,
              padding: '3px 9px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              background: variation >= 0 ? INC_DIM : 'rgba(239,68,68,.1)',
              color:      variation >= 0 ? INC     : '#ef4444',
              border:    `1px solid ${variation >= 0 ? INC_BDR : 'rgba(239,68,68,.2)'}`,
            }}>
              {variation >= 0 ? '▲' : '▼'} {Math.abs(variation).toFixed(1)}% vs mês anterior
            </div>
          )}
          {variation === null && <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 5 }}>Sem registro anterior</div>}
        </div>

        <div className="c-card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--c-text-muted)', marginBottom: 8 }}>Acumulado (7 meses)</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.8px', color: 'var(--c-text)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{fmt(accumulated)}</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 5 }}>Média mensal {fmt(accumulated / monthsWithData)}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="c-card c-mb-4" style={{ padding: '20px 24px 12px' }}>
        <div className="c-flex c-items-center c-justify-between" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Evolução — Últimos 7 meses</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--c-text-muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: INC }} />
            Receita mensal
          </div>
        </div>
        <canvas ref={canvasRef} style={{ width: '100%', height: 180, display: 'block' }} />
      </div>

      {/* Entry list */}
      <div className="c-card" style={{ padding: 0 }}>
        <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--c-border)', fontSize: 13, fontWeight: 700 }}>
          Recebimentos de {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </div>

        {/* Quick-add form */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--c-border)',
          background: 'var(--c-surface2)',
          display: 'grid', gridTemplateColumns: '1fr 180px auto', gap: 10, alignItems: 'flex-end',
        }}>
          <div>
            <label className="c-form-label">Descrição / Cliente</label>
            <input
              ref={descRef}
              type="text" className="c-form-input"
              placeholder="Ex: Projeto Website — Cliente..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEntry()}
            />
          </div>
          <div>
            <label className="c-form-label">Valor (R$)</label>
            <input
              type="text" className="c-form-input"
              placeholder="0,00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEntry()}
            />
          </div>
          <button
            onClick={addEntry}
            disabled={saving || !desc.trim() || !amount}
            style={{
              background: INC, color: '#fff', border: 'none',
              padding: '9px 18px', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              opacity: (saving || !desc.trim() || !amount) ? .5 : 1,
              whiteSpace: 'nowrap', transition: 'opacity .15s',
            }}
          >
            {saving ? 'Salvando...' : '+ Adicionar'}
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="c-loading-screen" style={{ height: '30vh' }}>
            <div className="c-loading-spinner" />
          </div>
        ) : entries.length === 0 ? (
          <div className="c-empty-state" style={{ padding: '48px 20px' }}>
            <div className="c-empty-icon">💵</div>
            <h3>Nenhum recebimento registrado</h3>
            <p>Use o formulário acima para registrar suas entradas do mês.</p>
          </div>
        ) : (
          <div className="c-table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 100 }}>Data</th>
                  <th>Descrição</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--c-text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {format(new Date(e.date + 'T12:00:00'), 'dd/MM/yy')}
                    </td>
                    <td style={{ fontWeight: 500 }}>{e.description}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: INC, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {fmt(e.amount)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          className="c-btn c-btn-danger c-btn-sm"
                          onClick={() => deleteEntry(e.id)}
                          disabled={deleting === e.id}
                        >
                          {deleting === e.id ? '...' : '🗑️'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr style={{ background: INC_DIM }}>
                  <td colSpan={2} style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--c-text-muted)' }}>
                    Total do mês
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: INC, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {fmt(total)}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
