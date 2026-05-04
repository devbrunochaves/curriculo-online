import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const fmt = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '—'
const COLORS = ['#6366f1','#EC4899','#F97316','#10b981','#EAB308','#DC2626','#2563EB','#8B5CF6','#14B8A6','#059669','#00B4D8','#F43F5E']

function CardForm({ initial, onSave, onCancel }) {
  const [name, setName]       = useState(initial?.name || '')
  const [color, setColor]     = useState(initial?.color || COLORS[0])
  const [limit, setLimit]     = useState(initial?.limit_amount ? String(initial.limit_amount).replace('.', ',') : '')
  const [closing, setClosing] = useState(initial?.closing_day || '')
  const [due, setDue]         = useState(initial?.due_day || '')
  const [saving, setSaving]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = { name, color, limit_amount: limit ? parseFloat(limit.replace(',', '.')) : null, closing_day: closing || null, due_day: due || null }
    if (initial?.id) await supabase.from('cards').update(payload).eq('id', initial.id)
    else await supabase.from('cards').insert(payload)
    setSaving(false)
    onSave()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="c-form-group">
        <label className="c-form-label">Nome do Cartão</label>
        <input type="text" className="c-form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Nubank Bruno" />
      </div>
      <div className="c-grid-2">
        <div className="c-form-group">
          <label className="c-form-label">Limite (R$)</label>
          <input type="text" className="c-form-input" value={limit} onChange={e => setLimit(e.target.value)} placeholder="0,00" />
        </div>
        <div>
          <label className="c-form-label">Cor</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '3px solid #0f172a' : '2px solid transparent' }} />
            ))}
          </div>
        </div>
      </div>
      <div className="c-grid-2">
        <div className="c-form-group">
          <label className="c-form-label">Dia de fechamento</label>
          <input type="number" className="c-form-input" value={closing} onChange={e => setClosing(e.target.value)} placeholder="Ex: 11" min={1} max={31} />
        </div>
        <div className="c-form-group">
          <label className="c-form-label">Dia de vencimento</label>
          <input type="number" className="c-form-input" value={due} onChange={e => setDue(e.target.value)} placeholder="Ex: 18" min={1} max={31} />
        </div>
      </div>
      <div className="c-flex c-gap-2">
        <button type="submit" className="c-btn c-btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
        <button type="button" className="c-btn c-btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}

export default function Cartoes() {
  const [cards, setCards]   = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('cards').select('*').order('name')
    setCards(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleActive(card) {
    await supabase.from('cards').update({ is_active: !card.is_active }).eq('id', card.id)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este cartão? Lançamentos vinculados perderão a referência.')) return
    await supabase.from('cards').delete().eq('id', id)
    load()
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="c-flex c-items-center c-justify-between c-mb-4">
        <div className="c-page-header" style={{ margin: 0 }}>
          <h2>Cartões</h2>
          <p>Gerencie seus cartões de crédito</p>
        </div>
        {!adding && <button className="c-btn c-btn-primary" onClick={() => setAdding(true)}>+ Novo Cartão</button>}
      </div>

      {adding && (
        <div className="c-card c-mb-4">
          <div className="c-section-title" style={{ marginBottom: 16 }}>Novo Cartão</div>
          <CardForm onSave={() => { setAdding(false); load() }} onCancel={() => setAdding(false)} />
        </div>
      )}

      {loading ? (
        <div className="c-loading-screen" style={{ height: '40vh' }}><div className="c-loading-spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cards.map(c => (
            <div key={c.id} className="c-card" style={{ opacity: c.is_active ? 1 : 0.5 }}>
              {editing === c.id ? (
                <CardForm initial={c} onSave={() => { setEditing(null); load() }} onCancel={() => setEditing(null)} />
              ) : (
                <div className="c-flex c-items-center c-gap-3">
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: c.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💳</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                    <div className="c-flex c-gap-3 c-mt-1 c-text-muted c-text-sm">
                      {c.limit_amount && <span>Limite: {fmt(c.limit_amount)}</span>}
                      {c.closing_day  && <span>Fecha dia {c.closing_day}</span>}
                      {c.due_day      && <span>Vence dia {c.due_day}</span>}
                      {!c.is_active   && <span className="c-chip c-badge-warning">Inativo</span>}
                    </div>
                  </div>
                  <div className="c-flex c-gap-2">
                    <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => setEditing(c.id)}>✏️</button>
                    <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => toggleActive(c)} title={c.is_active ? 'Desativar' : 'Ativar'}>{c.is_active ? '⏸️' : '▶️'}</button>
                    <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(c.id)}>🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
