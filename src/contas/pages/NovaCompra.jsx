import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { format, addMonths, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate, useSearchParams } from 'react-router-dom'

const fmt      = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'
const parseBRL = str => { if (!str) return 0; return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0 }

/**
 * Determina o month_ref de um lançamento considerando o fechamento do cartão.
 *
 * Regra:
 *   - Se o dia da compra é ANTERIOR ao dia de fechamento → fatura do mês atual
 *   - Se o dia da compra é IGUAL OU POSTERIOR ao fechamento → fatura do próximo mês
 *
 * Exemplo: fechamento dia 7, compra dia 9 → próximo mês (o cartão já fechou)
 *          fechamento dia 7, compra dia 5 → mês atual  (o cartão ainda não fechou)
 */
function getMonthRef(dateStr, closingDay) {
  if (!dateStr) return format(new Date(), 'yyyy-MM')
  const d   = parseISO(dateStr)
  const day = d.getDate()
  // Sem fechamento cadastrado → usa o mês da compra
  if (!closingDay) return format(d, 'yyyy-MM')
  // Cartão já fechou neste mês → lançamento vai para o próximo mês
  if (day >= Number(closingDay)) return format(addMonths(d, 1), 'yyyy-MM')
  // Cartão ainda não fechou → lançamento fica no mês atual
  return format(d, 'yyyy-MM')
}

export default function NovaCompra() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const [cards, setCards]     = useState([])
  const [people, setPeople]   = useState([])
  const [categories, setCats] = useState([])

  const [date, setDate]             = useState(format(new Date(), 'yyyy-MM-dd'))
  const [description, setDesc]      = useState('')
  const [cardId, setCardId]         = useState('')
  const [catId, setCatId]           = useState('')
  const [total, setTotal]           = useState('')
  const [isFixed, setIsFixed]       = useState(false)
  const [notes, setNotes]           = useState('')
  const [splits, setSplits]         = useState({})   // { personId: amountStr }
  const [isInstallment, setIsInst]  = useState(false)
  const [installments, setInst]     = useState(2)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)
  const [receipt, setReceipt]       = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: p }, { data: cat }] = await Promise.all([
        supabase.from('cards').select('*').eq('is_active', true).order('name'),
        supabase.from('people').select('*').eq('is_active', true).order('name'),
        supabase.from('categories').select('*').order('name'),
      ])
      setCards(c || []); setPeople(p || []); setCats(cat || [])
      if (c?.length) setCardId(c[0].id)
      if (cat?.length) setCatId(cat[0].id)

      if (editId) {
        const { data: exp } = await supabase.from('expenses').select('*, splits:expense_splits(*)').eq('id', editId).single()
        if (exp) {
          setDate(exp.date); setDesc(exp.description); setCardId(exp.card_id)
          setCatId(exp.category_id || ''); setTotal(String(exp.total_amount).replace('.', ','))
          setIsFixed(exp.is_fixed); setNotes(exp.notes || '')
          const sp = {}
          exp.splits?.forEach(s => { sp[s.person_id] = String(s.amount).replace('.', ',') })
          setSplits(sp)
        }
      }
    }
    load()
  }, [editId])

  // ── Cartão selecionado e cálculo de mês ──────────────────────────────────
  const selectedCard = useMemo(() => cards.find(c => c.id === cardId), [cards, cardId])
  const baseMonthRef = useMemo(() => getMonthRef(date, selectedCard?.closing_day), [date, selectedCard])
  const baseMonthLabel = useMemo(() => {
    try { return format(new Date(baseMonthRef + '-01'), "MMMM 'de' yyyy", { locale: ptBR }) }
    catch { return '' }
  }, [baseMonthRef])

  // Lista de parcelas com mês correspondente
  const installmentPreview = useMemo(() => {
    if (!isInstallment || !baseMonthRef) return []
    const totalNum = parseBRL(total)
    const n = Math.max(1, installments)
    const each = parseFloat((totalNum / n).toFixed(2))
    return Array.from({ length: n }, (_, i) => {
      const mRef  = format(addMonths(new Date(baseMonthRef + '-01'), i), 'yyyy-MM')
      const mLabel = format(addMonths(new Date(baseMonthRef + '-01'), i), "MMM/yy", { locale: ptBR })
      const amount = i === n - 1 ? parseFloat((totalNum - each * (n - 1)).toFixed(2)) : each
      return { index: i + 1, mRef, mLabel, amount }
    })
  }, [isInstallment, installments, baseMonthRef, total])

  // ── Validação ────────────────────────────────────────────────────────────
  const totalNum   = parseBRL(total)
  const splitTotal = Object.values(splits).reduce((s, v) => s + parseBRL(v), 0)
  const diff       = totalNum - splitTotal
  const isValid    = totalNum > 0 && Math.abs(diff) < 0.01 && splitTotal > 0

  function handleReceiptChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setReceipt(file)
    if (file.type.startsWith('image/')) {
      setReceiptPreview(URL.createObjectURL(file))
    } else {
      setReceiptPreview(null)
    }
  }

  function removeReceipt() {
    setReceipt(null)
    setReceiptPreview(null)
  }

  async function uploadReceipt(expenseId, file) {
    try {
      const ext  = file.name.split('.').pop()
      const path = `${expenseId}/comprovante.${ext}`
      const { error: upErr } = await supabase.storage.from('receipts').upload(path, file, { upsert: true })
      if (upErr) return null
      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(path)
      return publicUrl
    } catch { return null }
  }

  function togglePerson(id) {
    setSplits(prev => { const n = { ...prev }; if (n[id] !== undefined) delete n[id]; else n[id] = ''; return n })
  }
  function splitEqually() {
    const sel = Object.keys(splits)
    if (!sel.length || !totalNum) return
    const each = parseFloat((totalNum / sel.length).toFixed(2))
    const n = {}
    sel.forEach((id, i) => {
      n[id] = i === sel.length - 1
        ? (totalNum - each * (sel.length - 1)).toFixed(2).replace('.', ',')
        : each.toFixed(2).replace('.', ',')
    })
    setSplits(n)
  }

  // ── Salvar ───────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    if (!isValid) { setError('A soma das divisões deve ser igual ao total.'); return }
    setSaving(true); setError('')

    try {
      if (editId) {
        // Edição simples (sem parcelamento)
        const updatePayload = { date, description, card_id: cardId, category_id: catId || null, total_amount: totalNum, month_ref: baseMonthRef, is_fixed: isFixed, notes }
        if (receipt) {
          const url = await uploadReceipt(editId, receipt)
          if (url) updatePayload.receipt_url = url
        }
        await supabase.from('expenses').update(updatePayload).eq('id', editId)
        await supabase.from('expense_splits').delete().eq('expense_id', editId)
        const sp = Object.entries(splits).map(([person_id, amt]) => ({ expense_id: editId, person_id, amount: parseBRL(amt) }))
        if (sp.length) await supabase.from('expense_splits').insert(sp)
      } else if (isInstallment && installments > 1) {
        // Criar N parcelas — comprovante vai na 1ª parcela
        let firstExpId = null
        for (const p of installmentPreview) {
          const desc = `${description} ${p.index}/${installments}`
          const { data: exp } = await supabase.from('expenses').insert({
            date, description: desc, card_id: cardId, category_id: catId || null,
            total_amount: p.amount, month_ref: p.mRef, is_fixed: false,
            notes: notes || null
          }).select().single()
          if (exp) {
            if (p.index === 1) firstExpId = exp.id
            const sp = Object.entries(splits).map(([person_id, amt]) => ({
              expense_id: exp.id, person_id,
              amount: parseFloat((parseBRL(amt) * p.amount / totalNum).toFixed(2))
            }))
            if (sp.length) await supabase.from('expense_splits').insert(sp)
          }
        }
        // Upload do comprovante na 1ª parcela
        if (receipt && firstExpId) {
          const url = await uploadReceipt(firstExpId, receipt)
          if (url) await supabase.from('expenses').update({ receipt_url: url }).eq('id', firstExpId)
        }
      } else {
        // Lançamento único
        const { data: exp } = await supabase.from('expenses').insert({
          date, description, card_id: cardId, category_id: catId || null,
          total_amount: totalNum, month_ref: baseMonthRef, is_fixed: isFixed, notes: notes || null
        }).select().single()
        if (exp) {
          const sp = Object.entries(splits).map(([person_id, amt]) => ({ expense_id: exp.id, person_id, amount: parseBRL(amt) }))
          if (sp.length) await supabase.from('expense_splits').insert(sp)
          if (receipt) {
            const url = await uploadReceipt(exp.id, receipt)
            if (url) await supabase.from('expenses').update({ receipt_url: url }).eq('id', exp.id)
          }
        }
      }

      setSaving(false); setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        if (editId) navigate('/contas/lancamentos')
        else navigate('/contas/')
      }, 1400)
    } catch (err) {
      setError(err.message || 'Erro ao salvar.')
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="c-page-header">
        <h2>{editId ? '✏️ Editar Lançamento' : '➕ Nova Compra'}</h2>
        <p>Registre uma despesa e divida entre as pessoas</p>
      </div>

      {success && <div className="c-alert c-alert-info c-mb-3">✅ {isInstallment ? `${installments} parcelas registradas com sucesso!` : 'Lançamento salvo com sucesso!'}</div>}
      {error   && <div className="c-alert c-alert-danger c-mb-3">⚠️ {error}</div>}

      <form onSubmit={handleSubmit} className="c-card">

        {/* DATA + CARTÃO */}
        <div className="c-grid-2">
          <div className="c-form-group">
            <label className="c-form-label">Data da compra</label>
            <input type="date" className="c-form-input" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="c-form-group">
            <label className="c-form-label">Cartão</label>
            <select className="c-form-select" value={cardId} onChange={e => setCardId(e.target.value)} required>
              <option value="">Selecione...</option>
              {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* INDICADOR DE FATURA */}
        {selectedCard && date && (
          <div style={{ marginTop: -8, marginBottom: 16, padding: '8px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 13, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📅</span>
            <span>
              Esta compra entrará na fatura de <strong style={{ textTransform: 'capitalize' }}>{baseMonthLabel}</strong>
              {selectedCard.closing_day && (
                <span style={{ color: '#64748b' }}> — cartão fecha dia {selectedCard.closing_day}</span>
              )}
            </span>
          </div>
        )}

        {/* DESCRIÇÃO */}
        <div className="c-form-group">
          <label className="c-form-label">Descrição</label>
          <input type="text" className="c-form-input" placeholder="Ex: Renner" value={description} onChange={e => setDesc(e.target.value)} required />
        </div>

        {/* CATEGORIA + VALOR */}
        <div className="c-grid-2">
          <div className="c-form-group">
            <label className="c-form-label">Categoria</label>
            <select className="c-form-select" value={catId} onChange={e => setCatId(e.target.value)}>
              <option value="">Sem categoria</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="c-form-group">
            <label className="c-form-label">Valor Total (R$)</label>
            <input type="text" className="c-form-input" placeholder="0,00" value={total} onChange={e => setTotal(e.target.value)} required />
          </div>
        </div>

        {/* GASTO FIXO */}
        {!isInstallment && (
          <div className="c-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input type="checkbox" id="isFixed" checked={isFixed} onChange={e => setIsFixed(e.target.checked)} style={{ width: 16, height: 16 }} />
            <label htmlFor="isFixed" className="c-form-label" style={{ margin: 0, cursor: 'pointer' }}>Gasto fixo mensal</label>
          </div>
        )}

        {/* PARCELAMENTO */}
        {!isFixed && (
          <div style={{ padding: '12px 14px', borderRadius: 8, background: isInstallment ? '#eff6ff' : '#f8fafc', border: `1.5px solid ${isInstallment ? '#bfdbfe' : '#e2e8f0'}`, marginBottom: 16 }}>
            <div className="c-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: isInstallment ? 12 : 0 }}>
              <input type="checkbox" id="isInst" checked={isInstallment} onChange={e => { setIsInst(e.target.checked); setIsFixed(false) }} style={{ width: 16, height: 16, accentColor: '#6366f1' }} />
              <label htmlFor="isInst" className="c-form-label" style={{ margin: 0, cursor: 'pointer', color: '#1e40af' }}>💳 Compra parcelada</label>
            </div>

            {isInstallment && (
              <>
                <div className="c-form-group" style={{ marginBottom: 12 }}>
                  <label className="c-form-label">Número de parcelas</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setInst(v => Math.max(2, v - 1))}
                      style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid var(--c-border)', background: 'var(--c-bg)', color: 'var(--c-text)', fontSize: 18, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                    >−</button>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="number"
                        min={2}
                        max={999}
                        value={installments}
                        onChange={e => {
                          const v = parseInt(e.target.value)
                          if (!isNaN(v) && v >= 1) setInst(v)
                        }}
                        className="c-form-input"
                        style={{ textAlign: 'center', fontWeight: 700, fontSize: 16, color: '#6366f1', paddingRight: 28 }}
                      />
                      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: 14, color: '#6366f1', pointerEvents: 'none' }}>x</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInst(v => v + 1)}
                      style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid var(--c-border)', background: 'var(--c-bg)', color: 'var(--c-text)', fontSize: 18, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                    >+</button>
                  </div>
                </div>

                {/* Preview das parcelas */}
                {installmentPreview.length > 0 && totalNum > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {installmentPreview.map(p => (
                      <div key={p.index} style={{ padding: '4px 10px', borderRadius: 6, background: '#dbeafe', color: '#1e40af', fontSize: 12, fontWeight: 600 }}>
                        {p.index}/{installments} → <span style={{ textTransform: 'capitalize' }}>{p.mLabel}</span> · {fmt(p.amount)}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <hr className="c-divider" />

        {/* DIVISÃO */}
        <div className="c-section-title">Divisão entre pessoas</div>
        <div className="c-flex c-items-center c-gap-2 c-mb-3">
          <button type="button" className="c-btn c-btn-secondary c-btn-sm" onClick={() => { const n = {}; people.forEach(p => { n[p.id] = '' }); setSplits(n) }}>Todos</button>
          <button type="button" className="c-btn c-btn-secondary c-btn-sm" onClick={() => setSplits({})}>Limpar</button>
          {Object.keys(splits).length > 0 && totalNum > 0 && (
            <button type="button" className="c-btn c-btn-secondary c-btn-sm" onClick={splitEqually}>÷ Dividir igualmente</button>
          )}
          {Object.keys(splits).length > 0 && (
            <span className={`c-chip ${Math.abs(diff) < 0.01 ? 'c-badge-success' : 'c-badge-danger'}`} style={{ marginLeft: 'auto' }}>
              {Math.abs(diff) < 0.01 ? '✓ Conferido' : `Falta: ${fmt(diff)}`}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {people.map(person => {
            const isSel = splits[person.id] !== undefined
            return (
              <div key={person.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${isSel ? person.color : 'var(--c-border)'}`, background: isSel ? `${person.color}10` : 'transparent', transition: 'all 0.15s' }}>
                <input type="checkbox" checked={isSel} onChange={() => togglePerson(person.id)} style={{ width: 16, height: 16, accentColor: person.color, cursor: 'pointer' }} />
                <span className="c-dot" style={{ background: person.color }} />
                <span style={{ flex: 1, fontWeight: 500, fontSize: 13.5 }}>{person.name}</span>
                {isSel && (
                  <input type="text" className="c-form-input" placeholder="0,00" value={splits[person.id]}
                    onChange={e => setSplits(prev => ({ ...prev, [person.id]: e.target.value }))}
                    style={{ width: 110, textAlign: 'right' }} />
                )}
              </div>
            )
          })}
        </div>

        <div className="c-form-group c-mt-3">
          <label className="c-form-label">Observações (opcional)</label>
          <textarea className="c-form-textarea" placeholder="Ex: Presente aniversário..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>

        {/* ── Comprovante ── */}
        <div className="c-form-group c-mt-3">
          <label className="c-form-label">Comprovante (opcional)</label>
          {!receipt ? (
            <label htmlFor="receipt-upload" style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: '2px dashed var(--c-border)', borderRadius: 12, padding: '22px 16px',
              cursor: 'pointer', background: 'var(--c-bg)', gap: 8, transition: 'border-color 0.2s',
              userSelect: 'none'
            }}>
              <span style={{ fontSize: 36 }}>📎</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)' }}>Adicionar comprovante</span>
              <span style={{ fontSize: 12, color: 'var(--c-text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                Toque para tirar foto ou escolher da galeria<br/>
                <span style={{ opacity: 0.7 }}>JPG, PNG ou PDF</span>
              </span>
            </label>
          ) : (
            <div style={{ border: '2px solid #bbf7d0', borderRadius: 12, overflow: 'hidden', background: '#f0fdf4' }}>
              {receiptPreview && (
                <img src={receiptPreview} alt="Comprovante" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 18 }}>{receiptPreview ? '🖼️' : '📄'}</span>
                  <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {receipt.name}
                  </span>
                </div>
                <button type="button" onClick={removeReceipt} style={{
                  flexShrink: 0, background: 'none', border: '1px solid #fca5a5', borderRadius: 6,
                  color: '#ef4444', fontSize: 12, padding: '3px 10px', cursor: 'pointer', fontWeight: 600
                }}>
                  Remover
                </button>
              </div>
            </div>
          )}
          <input
            id="receipt-upload"
            type="file"
            accept="image/*,application/pdf"
            style={{ display: 'none' }}
            onChange={handleReceiptChange}
          />
        </div>

        <div className="c-flex c-gap-2 c-mt-4">
          <button type="submit" className="c-btn c-btn-primary" disabled={saving || !isValid}>
            {saving ? 'Salvando...' : isInstallment ? `Registrar ${installments}x parcelas` : editId ? 'Salvar Alterações' : 'Registrar Compra'}
          </button>
          <button type="button" className="c-btn c-btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
