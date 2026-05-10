import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { format, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const fmt      = v => v != null ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'
const parseBRL = str => { if (!str) return 0; return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0 }

export default function ContasFixas() {
  const [monthDate, setMonthDate]   = useState(new Date())
  const currentMonth                = format(monthDate, 'yyyy-MM')
  const monthLabel                  = format(monthDate, "MMMM 'de' yyyy", { locale: ptBR })
  const monthLabelCap               = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  const [bills, setBills]           = useState([])   // templates recurring_bills
  const [entries, setEntries]       = useState([])   // bill_entries do mês
  const [people, setPeople]         = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [showManage, setShowManage] = useState(false)

  // Edição inline de uma entrada
  const [editingId, setEditingId]   = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [editSplits, setEditSplits] = useState({})   // { personId: amountStr }
  const [saving, setSaving]         = useState(false)

  // Formulário nova conta fixa
  const [newBill, setNewBill]       = useState({ name: '', default_amount: '', due_day: '', category_id: '', notes: '' })
  const [savingBill, setSavingBill] = useState(false)
  const [billError, setBillError]   = useState('')
  const [editingBill, setEditingBill]     = useState(null)   // bill sendo editado no manage
  const [editBillForm, setEditBillForm]   = useState({})
  const [savingEditBill, setSavingEditBill] = useState(false)

  // ── Carregamento ────────────────────────────────────────────────────────────
  useEffect(() => { loadData() }, [currentMonth])

  async function loadData() {
    setLoading(true)

    const [{ data: b }, { data: p }, { data: cat }] = await Promise.all([
      supabase.from('recurring_bills').select('*').order('name'),
      supabase.from('people').select('*').eq('is_active', true).order('name'),
      supabase.from('categories').select('*').order('name'),
    ])

    const allBills = b || []
    setBills(allBills)
    setPeople(p || [])
    setCategories(cat || [])

    // Gera entradas faltando para o mês
    const activeBills = allBills.filter(x => x.is_active)
    await generateMissingEntries(activeBills)

    // Carrega entradas do mês com splits
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
    if (toCreate.length) await supabase.from('bill_entries').insert(toCreate)
  }

  // ── Edição de entrada ───────────────────────────────────────────────────────
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

  function togglePerson(id) {
    setEditSplits(prev => { const n = { ...prev }; if (n[id] !== undefined) delete n[id]; else n[id] = ''; return n })
  }

  // ── Gerenciar templates ─────────────────────────────────────────────────────
  async function addBill() {
    setBillError('')
    if (!newBill.name.trim()) { setBillError('Nome é obrigatório.'); return }
    setSavingBill(true)
    const { error } = await supabase.from('recurring_bills').insert({
      name:           newBill.name.trim(),
      default_amount: newBill.default_amount ? parseBRL(newBill.default_amount) : null,
      due_day:        newBill.due_day ? Number(newBill.due_day) : null,
      category_id:    newBill.category_id || null,
      notes:          newBill.notes || null,
    })
    if (error) { setBillError(error.message); setSavingBill(false); return }
    setNewBill({ name: '', default_amount: '', due_day: '', category_id: '', notes: '' })
    setSavingBill(false)
    loadData()
  }

  async function toggleBillActive(bill) {
    await supabase.from('recurring_bills').update({ is_active: !bill.is_active }).eq('id', bill.id)
    loadData()
  }

  function startEditBill(bill) {
    setEditingBill(bill.id)
    setEditBillForm({
      name:           bill.name,
      default_amount: bill.default_amount != null ? String(bill.default_amount).replace('.', ',') : '',
      due_day:        bill.due_day != null ? String(bill.due_day) : '',
      category_id:    bill.category_id || '',
    })
  }

  async function saveEditBill(billId) {
    setSavingEditBill(true)
    await supabase.from('recurring_bills').update({
      name:           editBillForm.name.trim(),
      default_amount: editBillForm.default_amount ? parseBRL(editBillForm.default_amount) : null,
      due_day:        editBillForm.due_day ? Number(editBillForm.due_day) : null,
      category_id:    editBillForm.category_id || null,
    }).eq('id', billId)
    setSavingEditBill(false)
    setEditingBill(null)
    loadData()
  }

  // ── Resumo ──────────────────────────────────────────────────────────────────
  const total = useMemo(() => entries.reduce((s, e) => s + Number(e.amount), 0), [entries])

  const totalByPerson = useMemo(() => {
    const map = {}
    entries.forEach(e => {
      e.splits?.forEach(s => {
        if (!map[s.person_id]) map[s.person_id] = { name: s.person?.name, color: s.person?.color, total: 0 }
        map[s.person_id].total += Number(s.amount)
      })
    })
    return Object.values(map)
  }, [entries])

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 720 }}>
      <div className="c-page-header">
        <h2>🏠 Contas Fixas</h2>
        <p>Despesas recorrentes fora do cartão de crédito</p>
      </div>

      {/* ── Navegação por mês ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => setMonthDate(d => subMonths(d, 1))}>◀</button>
        <span style={{ fontWeight: 700, fontSize: 16, minWidth: 180, textAlign: 'center' }}>
          {monthLabelCap}
        </span>
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
        <div className="c-card" style={{ textAlign: 'center', padding: 48, color: 'var(--c-text-muted)', marginBottom: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <p style={{ marginBottom: 12 }}>Nenhuma conta fixa cadastrada ainda.</p>
          <button className="c-btn c-btn-primary c-btn-sm" onClick={() => setShowManage(true)}>
            + Adicionar primeira conta
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {entries.map(entry => {
            const isEditing  = editingId === entry.id
            const editAmt    = parseBRL(editAmount)
            const splitTotal = Object.values(editSplits).reduce((s, v) => s + parseBRL(v), 0)
            const diff       = editAmt - splitTotal
            const cat        = categories.find(c => c.id === entry.bill?.category_id)

            return (
              <div key={entry.id} className="c-card" style={{ padding: '14px 18px', margin: 0 }}>
                {!isEditing ? (
                  /* ── Visualização ── */
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
                          <span style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>
                            📅 vence dia {entry.bill.due_day}
                          </span>
                        )}
                        {entry.bill?.default_amount === null && (
                          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>⚡ Variável</span>
                        )}
                      </div>
                      {entry.splits?.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                          {entry.splits.map(s => (
                            <span key={s.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${s.person?.color}20`, color: s.person?.color, fontWeight: 600 }}>
                              {s.person?.name} · {fmt(s.amount)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 800 }}>{fmt(entry.amount)}</div>
                      <button
                        className="c-btn c-btn-secondary c-btn-sm"
                        style={{ marginTop: 6, fontSize: 12 }}
                        onClick={() => startEdit(entry)}
                      >
                        ✏️ Editar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Edição inline ── */
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>
                      ✏️ {entry.bill?.name}
                    </div>

                    <div className="c-form-group" style={{ marginBottom: 14 }}>
                      <label className="c-form-label">Valor (R$)</label>
                      <input
                        type="text"
                        className="c-form-input"
                        value={editAmount}
                        onChange={e => setEditAmount(e.target.value)}
                        placeholder="0,00"
                        style={{ maxWidth: 180 }}
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
                            <input type="checkbox" checked={isSel} onChange={() => togglePerson(person.id)} style={{ width: 16, height: 16, accentColor: person.color, cursor: 'pointer' }} />
                            <span className="c-dot" style={{ background: person.color }} />
                            <span style={{ flex: 1, fontWeight: 500, fontSize: 13 }}>{person.name}</span>
                            {isSel && (
                              <input
                                type="text"
                                className="c-form-input"
                                placeholder="0,00"
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

      {/* ── Gerenciar templates ── */}
      <div className="c-card" style={{ margin: 0 }}>
        <button
          onClick={() => setShowManage(v => !v)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--c-text)', fontWeight: 700, fontSize: 15 }}
        >
          <span>⚙️ Gerenciar Contas Fixas</span>
          <span style={{ color: 'var(--c-text-muted)', fontSize: 12 }}>{showManage ? '▲ fechar' : '▼ abrir'}</span>
        </button>

        {showManage && (
          <div style={{ marginTop: 20 }}>

            {/* Formulário nova conta */}
            <div style={{ marginBottom: 20, padding: '16px', borderRadius: 10, background: 'var(--c-bg-alt)', border: '1px solid var(--c-border)' }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>➕ Nova Conta Fixa</div>
              {billError && <div className="c-alert c-alert-danger c-mb-2">{billError}</div>}

              <div className="c-grid-2" style={{ marginBottom: 10 }}>
                <div className="c-form-group" style={{ margin: 0 }}>
                  <label className="c-form-label">Nome *</label>
                  <input type="text" className="c-form-input" placeholder="Ex: Condomínio" value={newBill.name} onChange={e => setNewBill(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="c-form-group" style={{ margin: 0 }}>
                  <label className="c-form-label">Valor padrão <span style={{ color: 'var(--c-text-muted)', fontWeight: 400 }}>(vazio = variável)</span></label>
                  <input type="text" className="c-form-input" placeholder="0,00" value={newBill.default_amount} onChange={e => setNewBill(p => ({ ...p, default_amount: e.target.value }))} />
                </div>
              </div>

              <div className="c-grid-2" style={{ marginBottom: 14 }}>
                <div className="c-form-group" style={{ margin: 0 }}>
                  <label className="c-form-label">Dia do vencimento</label>
                  <input type="number" className="c-form-input" placeholder="Ex: 10" min={1} max={31} value={newBill.due_day} onChange={e => setNewBill(p => ({ ...p, due_day: e.target.value }))} />
                </div>
                <div className="c-form-group" style={{ margin: 0 }}>
                  <label className="c-form-label">Categoria</label>
                  <select className="c-form-select" value={newBill.category_id} onChange={e => setNewBill(p => ({ ...p, category_id: e.target.value }))}>
                    <option value="">Sem categoria</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              </div>

              <button className="c-btn c-btn-primary c-btn-sm" disabled={savingBill} onClick={addBill}>
                {savingBill ? 'Salvando...' : '+ Adicionar'}
              </button>
            </div>

            {/* Lista de templates */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bills.length === 0 && (
                <p style={{ color: 'var(--c-text-muted)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
                  Nenhuma conta cadastrada ainda.
                </p>
              )}
              {bills.map(bill => {
                const cat       = categories.find(c => c.id === bill.category_id)
                const isEditing = editingBill === bill.id
                return (
                  <div key={bill.id} style={{ borderRadius: 8, border: '1.5px solid var(--c-border)', overflow: 'hidden', opacity: bill.is_active ? 1 : 0.5 }}>
                    {!isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{bill.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>
                            {bill.default_amount != null ? fmt(bill.default_amount) : '⚡ Variável'}
                            {bill.due_day ? ` · vence dia ${bill.due_day}` : ''}
                            {cat ? ` · ${cat.icon} ${cat.name}` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="c-btn c-btn-secondary c-btn-sm" style={{ fontSize: 12 }} onClick={() => startEditBill(bill)}>✏️</button>
                          <button className={`c-btn c-btn-sm ${bill.is_active ? 'c-btn-secondary' : 'c-btn-primary'}`} style={{ fontSize: 12 }} onClick={() => toggleBillActive(bill)}>
                            {bill.is_active ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '12px 14px', background: 'var(--c-bg-alt)' }}>
                        <div className="c-grid-2" style={{ marginBottom: 8 }}>
                          <div className="c-form-group" style={{ margin: 0 }}>
                            <label className="c-form-label">Nome</label>
                            <input type="text" className="c-form-input" value={editBillForm.name} onChange={e => setEditBillForm(p => ({ ...p, name: e.target.value }))} />
                          </div>
                          <div className="c-form-group" style={{ margin: 0 }}>
                            <label className="c-form-label">Valor padrão</label>
                            <input type="text" className="c-form-input" placeholder="vazio = variável" value={editBillForm.default_amount} onChange={e => setEditBillForm(p => ({ ...p, default_amount: e.target.value }))} />
                          </div>
                        </div>
                        <div className="c-grid-2" style={{ marginBottom: 10 }}>
                          <div className="c-form-group" style={{ margin: 0 }}>
                            <label className="c-form-label">Dia vencimento</label>
                            <input type="number" className="c-form-input" min={1} max={31} value={editBillForm.due_day} onChange={e => setEditBillForm(p => ({ ...p, due_day: e.target.value }))} />
                          </div>
                          <div className="c-form-group" style={{ margin: 0 }}>
                            <label className="c-form-label">Categoria</label>
                            <select className="c-form-select" value={editBillForm.category_id} onChange={e => setEditBillForm(p => ({ ...p, category_id: e.target.value }))}>
                              <option value="">Sem categoria</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="c-btn c-btn-primary c-btn-sm" disabled={savingEditBill} onClick={() => saveEditBill(bill.id)}>
                            {savingEditBill ? 'Salvando...' : '✓ Salvar'}
                          </button>
                          <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => setEditingBill(null)}>Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
