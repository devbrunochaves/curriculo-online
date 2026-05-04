import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { useNavigate, useSearchParams } from 'react-router-dom'

const fmt = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'
const parseBRL = str => { if (!str) return 0; return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0 }

export default function NovaCompra() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const [cards, setCards]     = useState([])
  const [people, setPeople]   = useState([])
  const [categories, setCats] = useState([])

  const [date, setDate]       = useState(format(new Date(), 'yyyy-MM-dd'))
  const [description, setDesc]= useState('')
  const [cardId, setCardId]   = useState('')
  const [catId, setCatId]     = useState('')
  const [total, setTotal]     = useState('')
  const [isFixed, setIsFixed] = useState(false)
  const [notes, setNotes]     = useState('')
  const [splits, setSplits]   = useState({})
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

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

  const totalNum   = parseBRL(total)
  const splitTotal = Object.values(splits).reduce((s, v) => s + parseBRL(v), 0)
  const diff       = totalNum - splitTotal
  const isValid    = totalNum > 0 && Math.abs(diff) < 0.01 && splitTotal > 0

  function togglePerson(id) {
    setSplits(prev => { const n = { ...prev }; if (n[id] !== undefined) delete n[id]; else n[id] = ''; return n })
  }
  function splitEqually() {
    const sel = Object.keys(splits)
    if (!sel.length || !totalNum) return
    const each = (totalNum / sel.length).toFixed(2)
    const n = {}
    sel.forEach((id, i) => { n[id] = i === sel.length - 1 ? (totalNum - sel.slice(0,-1).reduce((s) => s + parseFloat(each), 0)).toFixed(2).replace('.', ',') : each.replace('.', ',') })
    setSplits(n)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isValid) { setError('A soma das divisões deve ser igual ao total.'); return }
    setSaving(true); setError('')
    const monthRef = date.slice(0, 7)

    if (editId) {
      await supabase.from('expenses').update({ date, description, card_id: cardId, category_id: catId || null, total_amount: totalNum, month_ref: monthRef, is_fixed: isFixed, notes }).eq('id', editId)
      await supabase.from('expense_splits').delete().eq('expense_id', editId)
      await supabase.from('expense_splits').insert(Object.entries(splits).map(([person_id, amt]) => ({ expense_id: editId, person_id, amount: parseBRL(amt) })))
    } else {
      const { data: exp } = await supabase.from('expenses').insert({ date, description, card_id: cardId, category_id: catId || null, total_amount: totalNum, month_ref: monthRef, is_fixed: isFixed, notes }).select().single()
      if (exp) await supabase.from('expense_splits').insert(Object.entries(splits).map(([person_id, amt]) => ({ expense_id: exp.id, person_id, amount: parseBRL(amt) })))
    }

    setSaving(false); setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      if (!editId) { setDesc(''); setTotal(''); setSplits({}); setNotes(''); setDate(format(new Date(), 'yyyy-MM-dd')) }
      else navigate('/contas/lancamentos')
    }, 1200)
  }

  return (
    <div style={{ maxWidth: 660 }}>
      <div className="c-page-header">
        <h2>{editId ? '✏️ Editar Lançamento' : '➕ Nova Compra'}</h2>
        <p>Registre uma despesa e divida entre as pessoas</p>
      </div>

      {success && <div className="c-alert c-alert-info c-mb-3">✅ Lançamento salvo com sucesso!</div>}
      {error   && <div className="c-alert c-alert-danger c-mb-3">⚠️ {error}</div>}

      <form onSubmit={handleSubmit} className="c-card">
        <div className="c-grid-2">
          <div className="c-form-group">
            <label className="c-form-label">Data</label>
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

        <div className="c-form-group">
          <label className="c-form-label">Descrição</label>
          <input type="text" className="c-form-input" placeholder="Ex: Supermercado Extra" value={description} onChange={e => setDesc(e.target.value)} required />
        </div>

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

        <div className="c-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" id="isFixed" checked={isFixed} onChange={e => setIsFixed(e.target.checked)} style={{ width: 16, height: 16 }} />
          <label htmlFor="isFixed" className="c-form-label" style={{ margin: 0, cursor: 'pointer' }}>Gasto fixo mensal</label>
        </div>

        <hr className="c-divider" />
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
            const isSelected = splits[person.id] !== undefined
            return (
              <div key={person.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${isSelected ? person.color : 'var(--c-border)'}`, background: isSelected ? `${person.color}10` : 'transparent', transition: 'all 0.15s' }}>
                <input type="checkbox" checked={isSelected} onChange={() => togglePerson(person.id)} style={{ width: 16, height: 16, accentColor: person.color, cursor: 'pointer' }} />
                <span className="c-dot" style={{ background: person.color }} />
                <span style={{ flex: 1, fontWeight: 500, fontSize: 13.5 }}>{person.name}</span>
                {isSelected && (
                  <input type="text" className="c-form-input" placeholder="0,00" value={splits[person.id]} onChange={e => setSplits(prev => ({ ...prev, [person.id]: e.target.value }))} style={{ width: 110, textAlign: 'right' }} />
                )}
              </div>
            )
          })}
        </div>

        <div className="c-form-group c-mt-3">
          <label className="c-form-label">Observações (opcional)</label>
          <textarea className="c-form-textarea" placeholder="Ex: 3/12 parcelas" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </div>

        <div className="c-flex c-gap-2 c-mt-4">
          <button type="submit" className="c-btn c-btn-primary" disabled={saving || !isValid}>
            {saving ? 'Salvando...' : editId ? 'Salvar Alterações' : 'Registrar Compra'}
          </button>
          <button type="button" className="c-btn c-btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
