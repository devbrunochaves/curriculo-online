import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { format, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const fmt      = v => v != null ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'
const parseBRL = str => { if (!str) return 0; return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0 }

const EMPTY_BILL = { name: '', default_amount: '', due_day: '', category_id: '', person_id: '', total_installments: '', start_month: '', notes: '' }

function getInstallmentNumber(startMonth, currentMonth) {
  if (!startMonth || !currentMonth) return null
  const [sy, sm] = startMonth.split('-').map(Number)
  const [cy, cm] = currentMonth.split('-').map(Number)
  const n = (cy - sy) * 12 + (cm - sm) + 1
  return n > 0 ? n : null
}

// ── Modal Nova / Editar Conta Fixa ────────────────────────────────────────────
function BillModal({ open, onClose, onSave, people, categories, initialData, initialSplits, title, showSplits }) {
  const [form, setForm]     = useState(EMPTY_BILL)
  const [splits, setSplits] = useState({})   // { personId: amountStr }
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(initialData || EMPTY_BILL)
      setSplits(initialSplits || {})
      setError('')
    }
  }, [open, initialData, initialSplits])

  if (!open) return null

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const editAmt    = parseBRL(form.default_amount)
  const splitTotal = Object.values(splits).reduce((s, v) => s + parseBRL(v), 0)
  const diff       = editAmt - splitTotal

  function togglePerson(id) {
    setSplits(prev => { const n = { ...prev }; if (n[id] !== undefined) delete n[id]; else n[id] = ''; return n })
  }

  function splitEqually() {
    const sel = Object.keys(splits)
    if (!sel.length || !editAmt) return
    const each = parseFloat((editAmt / sel.length).toFixed(2))
    const n = {}
    sel.forEach((id, i) => {
      n[id] = i === sel.length - 1
        ? (editAmt - each * (sel.length - 1)).toFixed(2).replace('.', ',')
        : each.toFixed(2).replace('.', ',')
    })
    setSplits(n)
  }

  async function handleSave() {
    setError('')
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return }
    setSaving(true)
    try { await onSave(form, splits) }
    catch (e) { setError(e.message); setSaving(false); return }
    setSaving(false)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--c-bg, #fff)', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 14px', borderBottom: '1px solid var(--c-border)', position: 'sticky', top: 0, background: 'var(--c-bg, #fff)', zIndex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{title || '➕ Nova Conta Fixa'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--c-text-muted)', lineHeight: 1, padding: '2px 6px' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 22px 22px' }}>
          {error && <div className="c-alert c-alert-danger" style={{ marginBottom: 14 }}>{error}</div>}

          <div className="c-grid-2" style={{ marginBottom: 12 }}>
            <div className="c-form-group" style={{ margin: 0 }}>
              <label className="c-form-label">Nome *</label>
              <input type="text" className="c-form-input" placeholder="Ex: Condomínio" value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
            </div>
            <div className="c-form-group" style={{ margin: 0 }}>
              <label className="c-form-label">Valor padrão <span style={{ color: 'var(--c-text-muted)', fontWeight: 400, fontSize: 11 }}>(vazio = variável)</span></label>
              <input type="text" className="c-form-input" placeholder="0,00" value={form.default_amount} onChange={e => set('default_amount', e.target.value)} />
            </div>
          </div>

          <div className="c-grid-2" style={{ marginBottom: 12 }}>
            <div className="c-form-group" style={{ margin: 0 }}>
              <label className="c-form-label">Dia do vencimento</label>
              <input type="number" className="c-form-input" placeholder="Ex: 10" min={1} max={31} value={form.due_day} onChange={e => set('due_day', e.target.value)} />
            </div>
            <div className="c-form-group" style={{ margin: 0 }}>
              <label className="c-form-label">Categoria</label>
              <select className="c-form-select" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                <option value="">Sem categoria</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="c-form-group" style={{ marginBottom: 12 }}>
            <label className="c-form-label">Observações</label>
            <input type="text" className="c-form-input" placeholder="Opcional" value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
          </div>

          {/* Parcelamento */}
          <div style={{ padding: '12px 14px', borderRadius: 10, background: form.total_installments ? '#f5f3ff' : 'var(--c-surface, #f8fafc)', border: `1.5px solid ${form.total_installments ? '#ddd6fe' : 'var(--c-border)'}`, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: form.total_installments ? 14 : 0 }}>
              <input
                type="checkbox" id="modalIsInst"
                checked={!!form.total_installments}
                onChange={e => {
                  set('total_installments', e.target.checked ? '12' : '')
                  if (e.target.checked) set('start_month', format(new Date(), 'yyyy-MM'))
                  else set('start_month', '')
                }}
                style={{ width: 16, height: 16, accentColor: '#7c3aed', cursor: 'pointer' }}
              />
              <label htmlFor="modalIsInst" style={{ fontWeight: 600, fontSize: 13, color: '#5b21b6', cursor: 'pointer' }}>📦 É parcelado?</label>
            </div>
            {!!form.total_installments && (
              <div className="c-grid-2">
                <div className="c-form-group" style={{ margin: 0 }}>
                  <label className="c-form-label">Total de parcelas</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button type="button" onClick={() => set('total_installments', String(Math.max(2, Number(form.total_installments) - 1)))} style={{ width: 32, height: 32, borderRadius: 6, border: '1.5px solid var(--c-border)', background: 'var(--c-bg)', fontWeight: 700, fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>−</button>
                    <input type="number" min={2} className="c-form-input" value={form.total_installments} onChange={e => set('total_installments', e.target.value)} style={{ textAlign: 'center', fontWeight: 700, color: '#7c3aed' }} />
                    <button type="button" onClick={() => set('total_installments', String(Number(form.total_installments) + 1))} style={{ width: 32, height: 32, borderRadius: 6, border: '1.5px solid var(--c-border)', background: 'var(--c-bg)', fontWeight: 700, fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>+</button>
                  </div>
                </div>
                <div className="c-form-group" style={{ margin: 0 }}>
                  <label className="c-form-label">Mês da 1ª parcela</label>
                  <input type="month" className="c-form-input" value={form.start_month || ''} onChange={e => set('start_month', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* ── Divisão entre pessoas ── */}
          {showSplits && people.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Divisão entre pessoas</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="c-btn c-btn-secondary c-btn-sm"
                    onClick={() => { const n = {}; people.forEach(p => { n[p.id] = '' }); setSplits(n) }}>
                    Todos
                  </button>
                  <button type="button" className="c-btn c-btn-secondary c-btn-sm" onClick={() => setSplits({})}>Limpar</button>
                  {Object.keys(splits).length > 0 && editAmt > 0 && (
                    <button type="button" className="c-btn c-btn-secondary c-btn-sm" onClick={splitEqually}>÷ Igual</button>
                  )}
                  {Object.keys(splits).length > 0 && (
                    <span className={`c-chip ${Math.abs(diff) < 0.01 ? 'c-badge-success' : 'c-badge-danger'}`}>
                      {Math.abs(diff) < 0.01 ? '✓ OK' : `Falta ${fmt(diff)}`}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {people.map(person => {
                  const isSel = splits[person.id] !== undefined
                  return (
                    <div
                      key={person.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${isSel ? person.color : 'var(--c-border)'}`, background: isSel ? `${person.color}12` : 'transparent', transition: 'all .15s', cursor: 'pointer' }}
                      onClick={() => togglePerson(person.id)}
                    >
                      <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isSel ? person.color : '#d1d5db'}`, background: isSel ? person.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                        {isSel && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span className="c-dot" style={{ background: person.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{person.name}</span>
                      {isSel && (
                        <input
                          type="text"
                          className="c-form-input"
                          placeholder="0,00"
                          value={splits[person.id]}
                          onClick={e => e.stopPropagation()}
                          onChange={e => setSplits(prev => ({ ...prev, [person.id]: e.target.value }))}
                          style={{ width: 110, textAlign: 'right', margin: 0 }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button className="c-btn c-btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="c-btn c-btn-primary" disabled={saving} onClick={handleSave}>
              {saving ? 'Salvando...' : '✓ Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ContasFixas() {
  const [monthDate, setMonthDate]   = useState(new Date())
  const currentMonth                = format(monthDate, 'yyyy-MM')
  const monthLabel                  = format(monthDate, "MMMM 'de' yyyy", { locale: ptBR })
  const monthLabelCap               = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  const [entries, setEntries]       = useState([])
  const [people, setPeople]         = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)

  // Modais
  const [showAddModal, setShowAddModal]   = useState(false)
  const [editModalBill, setEditModalBill] = useState(null)  // bill object

  // Edição inline
  const [editingId, setEditingId]   = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [editSplits, setEditSplits] = useState({})
  const [saving, setSaving]         = useState(false)

  // Confirmação exclusão
  const [confirmDelete, setConfirmDelete] = useState(null)

  // ── Carregamento ─────────────────────────────────────────────────────────────
  useEffect(() => { loadData() }, [currentMonth])

  async function loadData() {
    setLoading(true)
    const [{ data: b }, { data: p }, { data: cat }] = await Promise.all([
      supabase.from('recurring_bills').select('*').order('name'),
      supabase.from('people').select('*').eq('is_active', true).order('name'),
      supabase.from('categories').select('*').order('name'),
    ])

    const allBills = b || []
    setPeople(p || [])
    setCategories(cat || [])

    const activeBills = allBills.filter(x => x.is_active)
    await generateMissingEntries(activeBills)

    const { data: ents } = await supabase
      .from('bill_entries')
      .select('*, bill:recurring_bills(*), splits:bill_entry_splits(*, person:people(*))')
      .eq('month_ref', currentMonth)

    setEntries(ents || [])
    setLoading(false)
  }

  async function generateMissingEntries(activeBills) {
    if (!activeBills.length) return
    const { data: existing } = await supabase
      .from('bill_entries').select('bill_id').eq('month_ref', currentMonth)
    const existingIds = new Set((existing || []).map(e => e.bill_id))
    const toCreate = activeBills
      .filter(b => !existingIds.has(b.id))
      .map(b => ({ bill_id: b.id, month_ref: currentMonth, amount: b.default_amount ?? 0 }))
    if (toCreate.length) {
      const { data: created } = await supabase.from('bill_entries').insert(toCreate).select()
      if (created?.length) {
        const prevMonthRef = format(subMonths(new Date(currentMonth + '-01'), 1), 'yyyy-MM')
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

  // ── Adicionar nova conta ──────────────────────────────────────────────────────
  async function handleAddBill(form, splits) {
    // 1. Cria o template
    const { data: created, error } = await supabase.from('recurring_bills').insert({
      name:               form.name.trim(),
      default_amount:     form.default_amount ? parseBRL(form.default_amount) : null,
      due_day:            form.due_day ? Number(form.due_day) : null,
      category_id:        form.category_id || null,
      person_id:          form.person_id || null,
      total_installments: form.total_installments ? Number(form.total_installments) : null,
      start_month:        form.start_month || null,
      notes:              form.notes || null,
    }).select().single()
    if (error) throw new Error(error.message)

    // 2. Cria a entrada para o mês atual
    const { data: entry } = await supabase.from('bill_entries').insert({
      bill_id:   created.id,
      month_ref: currentMonth,
      amount:    parseBRL(form.default_amount) || 0,
    }).select().single()

    // 3. Salva divisões (se houver)
    const splitEntries = Object.entries(splits || {})
      .filter(([, v]) => parseBRL(v) > 0)
      .map(([person_id, amt]) => ({ entry_id: entry.id, person_id, amount: parseBRL(amt) }))
    if (splitEntries.length) await supabase.from('bill_entry_splits').insert(splitEntries)

    setShowAddModal(false)
    loadData()
  }

  // ── Editar template ────────────────────────────────────────────────────────
  async function handleEditBill(form) {
    await supabase.from('recurring_bills').update({
      name:               form.name.trim(),
      default_amount:     form.default_amount ? parseBRL(form.default_amount) : null,
      due_day:            form.due_day ? Number(form.due_day) : null,
      category_id:        form.category_id || null,
      person_id:          form.person_id || null,
      total_installments: form.total_installments ? Number(form.total_installments) : null,
      start_month:        form.start_month || null,
    }).eq('id', editModalBill.id)
    setEditModalBill(null)
    loadData()
  }

  // ── Excluir conta ──────────────────────────────────────────────────────────
  async function deleteBill(bill) {
    const { data: allEntries } = await supabase
      .from('bill_entries').select('id').eq('bill_id', bill.id)
    const entryIds = (allEntries || []).map(e => e.id)
    if (entryIds.length) {
      await supabase.from('bill_entry_splits').delete().in('entry_id', entryIds)
      await supabase.from('bill_entries').delete().in('id', entryIds)
    }
    await supabase.from('recurring_bills').delete().eq('id', bill.id)
    setConfirmDelete(null)
    loadData()
  }

  // ── Edição inline de entrada ───────────────────────────────────────────────
  function startEdit(entry) {
    setEditingId(entry.id)
    setEditAmount(String(entry.amount).replace('.', ','))
    const sp = {}
    entry.splits?.forEach(s => { sp[s.person_id] = String(s.amount).replace('.', ',') })
    setEditSplits(sp)
  }

  function cancelEdit() { setEditingId(null); setEditAmount(''); setEditSplits({}) }

  async function saveEntry(entryId) {
    setSaving(true)
    const amount = parseBRL(editAmount)
    await supabase.from('bill_entries').update({ amount }).eq('id', entryId)
    await supabase.from('bill_entry_splits').delete().eq('entry_id', entryId)
    const splits = Object.entries(editSplits)
      .filter(([, v]) => parseBRL(v) > 0)
      .map(([person_id, amt]) => ({ entry_id: entryId, person_id, amount: parseBRL(amt) }))
    if (splits.length) await supabase.from('bill_entry_splits').insert(splits)
    setSaving(false)
    setEditingId(null)
    loadData()
  }

  function splitEqually(amount) {
    const sel = Object.keys(editSplits)
    if (!sel.length || !amount) return
    const each = parseFloat((amount / sel.length).toFixed(2))
    const n = {}
    sel.forEach((id, i) => {
      n[id] = i === sel.length - 1
        ? (amount - each * (sel.length - 1)).toFixed(2).replace('.', ',')
        : each.toFixed(2).replace('.', ',')
    })
    setEditSplits(n)
  }

  function togglePersonEdit(id) {
    setEditSplits(prev => { const n = { ...prev }; if (n[id] !== undefined) delete n[id]; else n[id] = ''; return n })
  }

  // ── Resumo ─────────────────────────────────────────────────────────────────
  const total = useMemo(() => entries.reduce((s, e) => s + Number(e.amount), 0), [entries])

  const totalByPerson = useMemo(() => {
    const map = {}
    entries.forEach(e => {
      if (e.splits?.length > 0) {
        e.splits.forEach(s => {
          if (!map[s.person_id]) map[s.person_id] = { name: s.person?.name, color: s.person?.color, total: 0 }
          map[s.person_id].total += Number(s.amount)
        })
      } else if (e.bill?.person_id) {
        const pid = e.bill.person_id
        const person = people.find(p => p.id === pid)
        if (!map[pid]) map[pid] = { name: person?.name, color: person?.color, total: 0 }
        map[pid].total += Number(e.amount)
      }
    })
    return Object.values(map)
  }, [entries, people])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 720 }}>

      {/* Modal nova conta */}
      <BillModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddBill}
        people={people}
        categories={categories}
        title="➕ Nova Conta Fixa"
        showSplits
      />

      {/* Modal editar template */}
      <BillModal
        open={!!editModalBill}
        onClose={() => setEditModalBill(null)}
        onSave={handleEditBill}
        people={people}
        categories={categories}
        initialData={editModalBill ? {
          name:               editModalBill.name,
          default_amount:     editModalBill.default_amount != null ? String(editModalBill.default_amount).replace('.', ',') : '',
          due_day:            editModalBill.due_day != null ? String(editModalBill.due_day) : '',
          category_id:        editModalBill.category_id || '',
          person_id:          editModalBill.person_id || '',
          total_installments: editModalBill.total_installments != null ? String(editModalBill.total_installments) : '',
          start_month:        editModalBill.start_month || '',
          notes:              editModalBill.notes || '',
        } : null}
        title="⚙️ Editar Conta Fixa"
        showSplits={false}
      />

      {/* Modal confirmação de exclusão */}
      {confirmDelete && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null) }}
        >
          <div style={{ background: 'var(--c-bg, #fff)', borderRadius: 14, padding: '24px 28px', maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Excluir "{confirmDelete.name}"?</div>
            <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 20 }}>
              Isso vai remover a conta fixa e todos os lançamentos vinculados. Não pode ser desfeito.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="c-btn c-btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="c-btn" style={{ background: '#ef4444', color: '#fff', border: 'none' }} onClick={() => deleteBill(confirmDelete)}>
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>🏠 Contas Fixas</h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--c-text-muted)' }}>Despesas recorrentes fora do cartão de crédito</p>
        </div>
        <button
          className="c-btn c-btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
        >
          ➕ Nova Conta
        </button>
      </div>

      {/* ── Navegação por mês ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => setMonthDate(d => subMonths(d, 1))}>◀</button>
        <span style={{ fontWeight: 700, fontSize: 16, minWidth: 180, textAlign: 'center' }}>{monthLabelCap}</span>
        <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => setMonthDate(d => addMonths(d, 1))}>▶</button>
      </div>

      {/* ── Cards de resumo ── */}
      {!loading && entries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${1 + totalByPerson.length}, 1fr)`, gap: 12, marginBottom: 24 }}>
          <div className="c-card" style={{ padding: '14px 18px', margin: 0 }}>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 4 }}>Total do mês</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(total)}</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>{entries.length} conta{entries.length !== 1 ? 's' : ''}</div>
          </div>
          {totalByPerson.map(p => (
            <div key={p.name} className="c-card" style={{ padding: '14px 18px', margin: 0, borderLeft: `3px solid ${p.color}` }}>
              <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: p.color }}>{fmt(p.total)}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lista de contas ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--c-text-muted)' }}>Carregando...</div>
      ) : entries.length === 0 ? (
        <div className="c-card" style={{ textAlign: 'center', padding: 48, color: 'var(--c-text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <p style={{ marginBottom: 12 }}>Nenhuma conta fixa cadastrada ainda.</p>
          <button className="c-btn c-btn-primary c-btn-sm" onClick={() => setShowAddModal(true)}>+ Adicionar primeira conta</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map(entry => {
            const isEditing  = editingId === entry.id
            const editAmt    = parseBRL(editAmount)
            const splitTotal = Object.values(editSplits).reduce((s, v) => s + parseBRL(v), 0)
            const diff       = editAmt - splitTotal
            const cat        = categories.find(c => c.id === entry.bill?.category_id)

            return (
              <div key={entry.id} className="c-card" style={{ padding: '14px 18px', margin: 0 }}>
                {!isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{entry.bill?.name}</span>
                        {cat && (
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--c-bg-alt)', color: 'var(--c-text-muted)' }}>
                            {cat.icon} {cat.name}
                          </span>
                        )}
                        {entry.bill?.due_day && (
                          <span style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>📅 vence dia {entry.bill.due_day}</span>
                        )}
                        {entry.bill?.default_amount === null && (
                          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>⚡ Variável</span>
                        )}
                        {(() => {
                          const n   = getInstallmentNumber(entry.bill?.start_month, currentMonth)
                          const tot = entry.bill?.total_installments
                          if (!n || !tot) return null
                          const remaining = tot - n
                          return (
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#ede9fe', color: '#7c3aed', fontWeight: 700 }}>
                              📦 {n}/{tot}x{remaining >= 0 ? ` · ${remaining} restantes` : ''}
                            </span>
                          )
                        })()}
                      </div>
                      {entry.splits?.length > 0 ? (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                          {entry.splits.map(s => (
                            <span key={s.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${s.person?.color}20`, color: s.person?.color, fontWeight: 600 }}>
                              {s.person?.name} · {fmt(s.amount)}
                            </span>
                          ))}
                        </div>
                      ) : entry.bill?.person_id ? (() => {
                        const resp = people.find(p => p.id === entry.bill.person_id)
                        return resp ? (
                          <div style={{ marginTop: 4 }}>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${resp.color}20`, color: resp.color, fontWeight: 600 }}>
                              👤 {resp.name}
                            </span>
                          </div>
                        ) : null
                      })() : null}
                    </div>

                    {/* Ações */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 800 }}>{fmt(entry.amount)}</div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="c-btn c-btn-secondary c-btn-sm" style={{ fontSize: 12 }} onClick={() => startEdit(entry)} title="Editar valor e divisão deste mês">
                          ✏️ Editar
                        </button>
                        <button
                          className="c-btn c-btn-secondary c-btn-sm"
                          style={{ fontSize: 12 }}
                          onClick={() => setEditModalBill(entry.bill)}
                          title="Editar dados da conta"
                        >
                          ⚙️
                        </button>
                        <button
                          className="c-btn c-btn-sm"
                          style={{ fontSize: 12, background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5' }}
                          onClick={() => setConfirmDelete(entry.bill)}
                          title="Excluir conta fixa"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Edição inline ── */
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>✏️ {entry.bill?.name}</div>

                    <div className="c-form-group" style={{ marginBottom: 14 }}>
                      <label className="c-form-label">Valor (R$)</label>
                      <input
                        type="text" className="c-form-input"
                        value={editAmount}
                        onChange={e => setEditAmount(e.target.value)}
                        placeholder="0,00" style={{ maxWidth: 180 }}
                        autoFocus
                      />
                    </div>

                    <div className="c-section-title" style={{ marginBottom: 8 }}>Divisão entre pessoas</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      <button type="button" className="c-btn c-btn-secondary c-btn-sm" onClick={() => { const n = {}; people.forEach(p => { n[p.id] = '' }); setEditSplits(n) }}>Todos</button>
                      <button type="button" className="c-btn c-btn-secondary c-btn-sm" onClick={() => setEditSplits({})}>Limpar</button>
                      {Object.keys(editSplits).length > 0 && editAmt > 0 && (
                        <button type="button" className="c-btn c-btn-secondary c-btn-sm" onClick={() => splitEqually(editAmt)}>÷ Igualmente</button>
                      )}
                      {Object.keys(editSplits).length > 0 && (
                        <span className={`c-chip ${Math.abs(diff) < 0.01 ? 'c-badge-success' : 'c-badge-danger'}`} style={{ marginLeft: 'auto' }}>
                          {Math.abs(diff) < 0.01 ? '✓ Conferido' : `Falta: ${fmt(diff)}`}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                      {people.map(person => {
                        const isSel = editSplits[person.id] !== undefined
                        return (
                          <div key={person.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${isSel ? person.color : 'var(--c-border)'}`, background: isSel ? `${person.color}10` : 'transparent', transition: 'all .15s' }}>
                            <input type="checkbox" checked={isSel} onChange={() => togglePersonEdit(person.id)} style={{ width: 16, height: 16, accentColor: person.color, cursor: 'pointer' }} />
                            <span className="c-dot" style={{ background: person.color }} />
                            <span style={{ flex: 1, fontWeight: 500, fontSize: 13 }}>{person.name}</span>
                            {isSel && (
                              <input type="text" className="c-form-input" placeholder="0,00"
                                value={editSplits[person.id]}
                                onChange={e => setEditSplits(prev => ({ ...prev, [person.id]: e.target.value }))}
                                style={{ width: 110, textAlign: 'right' }}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="c-btn c-btn-primary c-btn-sm" disabled={saving || editAmt <= 0} onClick={() => saveEntry(entry.id)}>
                        {saving ? 'Salvando...' : '✓ Salvar'}
                      </button>
                      <button className="c-btn c-btn-secondary c-btn-sm" onClick={cancelEdit}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
