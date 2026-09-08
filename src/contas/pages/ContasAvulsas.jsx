import { useState, useEffect, useCallback } from 'react'
import { format, addMonths, subMonths, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, ArrowRight, Check, Pencil, Plus, Trash2,
} from 'lucide-react'
import {
  Button, FormField, IconButton, MetricCard, ModalShell, PageHeader,
  SectionCard, StatusBadge,
} from '../components/ui'
import '../styles/contas-avulsas-v2.css'

const fmt      = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'
const parseBRL = str => { if (!str) return 0; return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0 }
const formatBRLInput = str => {
  const digits = String(str || '').replace(/\D/g, '')
  if (!digits) return ''
  return (Number(digits) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const EMPTY_FORM = { name: '', amount: '', notes: '', paid: false }

export default function ContasAvulsas() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bills,   setBills]   = useState([])
  const [people,  setPeople]  = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)   // null | 'new' | { bill }
  const [saving,  setSaving]  = useState(false)
  const [deleting, setDeleting] = useState(null)

  // Form state
  const [form,   setForm]   = useState(EMPTY_FORM)
  const [splits, setSplits] = useState({})       // { [person_id]: amountStr }

  const monthRef   = format(currentDate, 'yyyy-MM')
  const monthLabel = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })

  const totalNum   = parseBRL(form.amount)
  const splitTotal = Object.values(splits).reduce((s, v) => s + parseBRL(v), 0)
  const diff       = totalNum - splitTotal
  const splitsOk   = totalNum > 0 && Math.abs(diff) < 0.01 && splitTotal > 0
  const hasSplits  = Object.keys(splits).length > 0

  // ── Data loading ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: bs }, { data: ps }] = await Promise.all([
      supabase
        .from('one_time_bills')
        .select('*, splits:one_time_bill_splits(*, person:people(*))')
        .eq('month_ref', monthRef)
        .order('created_at', { ascending: true }),
      supabase.from('people').select('*').eq('is_active', true).order('name'),
    ])
    setBills(bs || [])
    setPeople(ps || [])
    setLoading(false)
  }, [monthRef])

  useEffect(() => { load() }, [load])

  // ── Modal helpers ─────────────────────────────────────────────────────────
  function openNew() {
    setForm({ ...EMPTY_FORM })
    setSplits({})
    setModal('new')
  }

  function openEdit(bill) {
    setForm({ name: bill.name, amount: formatBRLInput(String(Math.round(bill.amount * 100))), notes: bill.notes || '', paid: bill.paid })
    const s = {}
    ;(bill.splits || []).forEach(sp => { s[sp.person_id] = formatBRLInput(String(Math.round(sp.amount * 100))) })
    setSplits(s)
    setModal({ bill })
  }

  const closeModal = useCallback(() => setModal(null), [])

  // ── Split helpers ─────────────────────────────────────────────────────────
  function togglePerson(id) {
    setSplits(prev => {
      const n = { ...prev }
      if (n[id] !== undefined) delete n[id]
      else n[id] = ''
      return n
    })
  }

  function splitEqually() {
    const sel = Object.keys(splits)
    if (!sel.length || !totalNum) return
    const each = parseFloat((totalNum / sel.length).toFixed(2))
    const n = {}
    sel.forEach((id, i) => {
      const v = i === sel.length - 1 ? totalNum - each * (sel.length - 1) : each
      n[id] = formatBRLInput(String(Math.round(v * 100)))
    })
    setSplits(n)
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.name.trim() || totalNum <= 0) return
    if (hasSplits && !splitsOk) return

    setSaving(true)
    try {
      const payload = {
        name:      form.name.trim(),
        amount:    totalNum,
        month_ref: monthRef,
        notes:     form.notes.trim() || null,
        paid:      form.paid,
      }

      let billId
      if (modal === 'new') {
        const { data, error } = await supabase.from('one_time_bills').insert(payload).select().single()
        if (error) throw error
        billId = data.id
      } else {
        const { error } = await supabase.from('one_time_bills').update(payload).eq('id', modal.bill.id)
        if (error) throw error
        billId = modal.bill.id
        await supabase.from('one_time_bill_splits').delete().eq('bill_id', billId)
      }

      if (hasSplits) {
        const sp = Object.entries(splits).map(([person_id, amt]) => ({
          bill_id: billId, person_id, amount: parseBRL(amt),
        }))
        await supabase.from('one_time_bill_splits').insert(sp)
      }

      closeModal()
      load()
    } finally {
      setSaving(false)
    }
  }

  // ── Mark paid ─────────────────────────────────────────────────────────────
  async function togglePaid(bill) {
    const paid = !bill.paid
    await supabase.from('one_time_bills').update({ paid, paid_at: paid ? new Date().toISOString().slice(0, 10) : null }).eq('id', bill.id)
    load()
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id) {
    setDeleting(id)
    await supabase.from('one_time_bills').delete().eq('id', id)
    setDeleting(null)
    load()
  }

  // ── Metrics ───────────────────────────────────────────────────────────────
  const totalMes    = bills.reduce((s, b) => s + Number(b.amount), 0)
  const totalPago   = bills.filter(b => b.paid).reduce((s, b) => s + Number(b.amount), 0)
  const totalPend   = totalMes - totalPago

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="c-avulsas-page">
      <PageHeader
        eyebrow="Financeiro"
        title="Contas Avulsas"
        description="Contas de valor variável cadastradas manualmente para um mês específico."
        actions={(
          <Button icon={<Plus />} onClick={openNew}>Adicionar</Button>
        )}
      />

      {/* Month nav */}
      <div className="c-avulsas-month-nav">
        <IconButton icon={<ArrowLeft />} label="Mês anterior" variant="secondary" size="sm" onClick={() => setCurrentDate(d => subMonths(d, 1))} />
        <span className="c-avulsas-month-label" style={{ textTransform: 'capitalize' }}>{monthLabel}</span>
        <IconButton icon={<ArrowRight />} label="Mês seguinte" variant="secondary" size="sm" onClick={() => setCurrentDate(d => addMonths(d, 1))} />
      </div>

      {/* Metrics */}
      <section className="c-v2-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--v2-space-3)' }}>
        <MetricCard label="Total do mês" value={fmt(totalMes)}  tone="accent"   />
        <MetricCard label="Pago"          value={fmt(totalPago)} tone="success"  />
        <MetricCard label="Pendente"      value={fmt(totalPend)} tone={totalPend > 0 ? 'warning' : 'success'} />
      </section>

      {/* List */}
      <SectionCard title={`${bills.length} conta${bills.length !== 1 ? 's' : ''} em ${format(currentDate, 'MMMM', { locale: ptBR })}`}>
        {loading ? (
          <div className="c-loading-screen" style={{ height: 160 }}><div className="c-loading-spinner" /></div>
        ) : bills.length === 0 ? (
          <div className="c-avulsas-empty">
            <div className="c-avulsas-empty-icon">⚡</div>
            <div className="c-avulsas-empty-title">Nenhuma conta avulsa</div>
            <div className="c-avulsas-empty-sub">Adicione contas de água, luz, internet e outras que variam mês a mês.</div>
          </div>
        ) : (
          <div className="c-avulsas-bill-list">
            {bills.map(bill => {
              const payers = (bill.splits || []).map(s => s.person?.name).filter(Boolean)
              return (
                <div key={bill.id} className="c-avulsas-bill-row">
                  <div className={`c-avulsas-bill-dot ${bill.paid ? 'paid' : 'pending'}`} />
                  <div className="c-avulsas-bill-info">
                    <div className="c-avulsas-bill-name">{bill.name}</div>
                    <div className="c-avulsas-bill-meta">
                      <StatusBadge tone={bill.paid ? 'success' : 'warning'}>
                        {bill.paid ? 'Pago' : 'Pendente'}
                      </StatusBadge>
                      {payers.length > 0 && <span>{payers.join(', ')}</span>}
                      {bill.notes && <span>· {bill.notes}</span>}
                    </div>
                  </div>
                  <div className={`c-avulsas-bill-amount ${bill.paid ? 'paid' : ''}`}>{fmt(bill.amount)}</div>
                  <div className="c-avulsas-bill-actions">
                    {!bill.paid && (
                      <IconButton icon={<Check />} label="Marcar como pago" size="sm" variant="ghost"
                        style={{ color: 'var(--v2-color-success)' }}
                        onClick={() => togglePaid(bill)} />
                    )}
                    {bill.paid && (
                      <IconButton icon={<Check />} label="Desmarcar pagamento" size="sm" variant="ghost"
                        style={{ color: 'var(--v2-color-text-muted)' }}
                        onClick={() => togglePaid(bill)} />
                    )}
                    <IconButton icon={<Pencil />} label="Editar" size="sm" variant="ghost" onClick={() => openEdit(bill)} />
                    <IconButton icon={<Trash2 />} label="Excluir" size="sm" variant="ghost"
                      style={{ color: 'var(--v2-color-danger)' }}
                      disabled={deleting === bill.id}
                      onClick={() => handleDelete(bill.id)} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      {/* ── Modal Nova / Editar ── */}
      <ModalShell
        open={modal !== null}
        title={modal === 'new' ? 'Nova Conta Avulsa' : 'Editar Conta Avulsa'}
        onClose={closeModal}
        actions={(
          <>
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!form.name.trim() || totalNum <= 0 || (hasSplits && !splitsOk)}
            >
              Salvar
            </Button>
          </>
        )}
      >
          {/* Nome */}
          <FormField label="Nome da conta" required>
            <input
              className="c-fixas-v2-input"
              type="text"
              placeholder="Ex: Conta de Água"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </FormField>

          {/* Valor */}
          <FormField label="Valor (R$)" required>
            <input
              className="c-fixas-v2-input"
              type="text"
              inputMode="numeric"
              placeholder="0,00"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: formatBRLInput(e.target.value) }))}
            />
          </FormField>

          {/* Observação */}
          <FormField label="Observação">
            <input
              className="c-fixas-v2-input"
              type="text"
              placeholder="Ex: veio mais cara esse mês"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </FormField>

          {/* Divisão entre pessoas */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--v2-space-2)', marginBottom: 'var(--v2-space-3)' }}>
              <span className="c-v2-label" style={{ margin: 0, flex: 1 }}>Divisão entre pessoas</span>
              {hasSplits && totalNum > 0 && (
                <button type="button" className="c-v2-btn-link" onClick={splitEqually} style={{ fontSize: 12, color: 'var(--v2-color-accent)', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  Dividir igualmente
                </button>
              )}
              {hasSplits && (
                <span className={`c-avulsas-diff-badge ${splitsOk ? 'ok' : 'err'}`}>
                  {splitsOk ? '✓ Conferido' : `Falta ${fmt(diff)}`}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--v2-space-2)' }}>
              {people.map(person => {
                const isSel = splits[person.id] !== undefined
                return (
                  <div
                    key={person.id}
                    className={`c-avulsas-split-item ${isSel ? 'selected' : ''}`}
                    style={{ '--person-color': person.color }}
                  >
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => togglePerson(person.id)}
                      style={{ width: 16, height: 16, accentColor: person.color, cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span className="c-avulsas-split-dot" style={{ background: person.color }} />
                    <span className="c-avulsas-split-name">{person.name}</span>
                    {isSel && (
                      <input
                        type="text"
                        inputMode="numeric"
                        className="c-avulsas-split-input"
                        placeholder="0,00"
                        value={splits[person.id]}
                        onChange={e => setSplits(prev => ({ ...prev, [person.id]: formatBRLInput(e.target.value) }))}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: 'var(--v2-color-text-subtle)', marginTop: 'var(--v2-space-2)' }}>
              Opcional — se não dividir, a conta entra sem vínculo de pessoa.
            </p>
          </div>
      </ModalShell>
    </div>
  )
}
