import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

const fmt = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'
const COLORS = ['#6366f1','#EC4899','#F97316','#10b981','#EAB308','#DC2626','#2563EB','#8B5CF6','#14B8A6','#059669','#00B4D8','#F43F5E','#64748b']
const ICONS  = ['🍽️','🛒','⛽','💊','🏠','🚗','🎬','📱','👕','📚','💳','💸','📦','✈️','🐾','🎮','🏋️','💇','🎁','🔧']
const CARD_COLORS = ['#6366f1','#EC4899','#F97316','#10b981','#EAB308','#DC2626','#2563EB','#8B5CF6','#14B8A6','#059669','#00B4D8','#F43F5E']

export default function Configuracoes() {
  const [tab, setTab] = useState('pessoas')
  return (
    <div>
      <div className="c-page-header">
        <h2>Configurações</h2>
        <p>Gerencie pessoas, cartões, categorias e entradas</p>
      </div>
      <div className="c-flex c-gap-2 c-mb-4" style={{ flexWrap: 'wrap' }}>
        {[['pessoas','👥 Pessoas'],['cartoes','💳 Cartões'],['categorias','🏷️ Categorias'],['entradas','💵 Entradas']].map(([key, label]) => (
          <button key={key} className={`c-btn ${tab === key ? 'c-btn-primary' : 'c-btn-secondary'}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>
      {tab === 'pessoas'    && <PessoasTab />}
      {tab === 'cartoes'    && <CartoesTab />}
      {tab === 'categorias' && <CategoriasTab />}
      {tab === 'entradas'   && <EntradasTab />}
    </div>
  )
}

/* ── Aba Cartões ─────────────────────────────────────────────────── */
function CardForm({ initial, onSave, onCancel }) {
  const [name, setName]       = useState(initial?.name || '')
  const [color, setColor]     = useState(initial?.color || CARD_COLORS[0])
  const [limit, setLimit]     = useState(initial?.limit_amount ? String(initial.limit_amount).replace('.', ',') : '')
  const [closing, setClosing] = useState(initial?.closing_day || '')
  const [due, setDue]         = useState(initial?.due_day || '')
  const [saving, setSaving]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true)
    const payload = { name, color, limit_amount: limit ? parseFloat(limit.replace(',', '.')) : null, closing_day: closing || null, due_day: due || null }
    if (initial?.id) await supabase.from('cards').update(payload).eq('id', initial.id)
    else             await supabase.from('cards').insert(payload)
    setSaving(false); onSave()
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
            {CARD_COLORS.map(c => (
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

function CartoesTab() {
  const [cards, setCards]     = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding]   = useState(false)
  const [editing, setEditing] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('cards').select('*').order('name')
    setCards(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function toggleActive(card) { await supabase.from('cards').update({ is_active: !card.is_active }).eq('id', card.id); load() }
  async function handleDelete(id) { if (!confirm('Excluir este cartão? Lançamentos vinculados perderão a referência.')) return; await supabase.from('cards').delete().eq('id', id); load() }

  return (
    <div style={{ maxWidth: 600 }}>
      {!adding && <button className="c-btn c-btn-primary c-mb-4" onClick={() => setAdding(true)}>+ Novo Cartão</button>}
      {adding && (
        <div className="c-card c-mb-4">
          <div className="c-section-title" style={{ marginBottom: 16 }}>Novo Cartão</div>
          <CardForm onSave={() => { setAdding(false); load() }} onCancel={() => setAdding(false)} />
        </div>
      )}
      {loading ? (
        <div className="c-loading-screen" style={{ height: '30vh' }}><div className="c-loading-spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

function PessoasTab() {
  const [people, setPeople] = useState([])
  const [name, setName]     = useState('')
  const [color, setColor]   = useState(COLORS[0])
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() { const { data } = await supabase.from('people').select('*').order('name'); setPeople(data || []) }
  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault(); setSaving(true)
    await supabase.from('people').insert({ name, color })
    setName(''); setColor(COLORS[0]); setAdding(false); setSaving(false); load()
  }

  async function toggleActive(p) { await supabase.from('people').update({ is_active: !p.is_active }).eq('id', p.id); load() }
  async function handleDelete(id) { if (!confirm('Excluir esta pessoa?')) return; await supabase.from('people').delete().eq('id', id); load() }

  return (
    <div style={{ maxWidth: 500 }}>
      {!adding && <button className="c-btn c-btn-primary c-mb-4" onClick={() => setAdding(true)}>+ Nova Pessoa</button>}
      {adding && (
        <div className="c-card c-mb-4">
          <form onSubmit={handleAdd}>
            <div className="c-form-group">
              <label className="c-form-label">Nome</label>
              <input type="text" className="c-form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Ivan" />
            </div>
            <div className="c-form-group">
              <label className="c-form-label">Cor</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {COLORS.map(c => <div key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '3px solid #0f172a' : '2px solid transparent' }} />)}
              </div>
            </div>
            <div className="c-flex c-gap-2">
              <button type="submit" className="c-btn c-btn-primary" disabled={saving}>Salvar</button>
              <button type="button" className="c-btn c-btn-secondary" onClick={() => setAdding(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {people.map(p => (
          <div key={p.id} className="c-card c-card-sm c-flex c-items-center c-gap-3" style={{ opacity: p.is_active ? 1 : 0.5 }}>
            <span className="c-dot" style={{ background: p.color, width: 14, height: 14 }} />
            <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
            {!p.is_active && <span className="c-chip c-badge-warning c-text-sm">Inativo</span>}
            <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => toggleActive(p)}>{p.is_active ? '⏸️' : '▶️'}</button>
            <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(p.id)}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function CategoriasTab() {
  const [cats, setCats]   = useState([])
  const [name, setName]   = useState('')
  const [icon, setIcon]   = useState(ICONS[0])
  const [color, setColor] = useState(COLORS[0])
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() { const { data } = await supabase.from('categories').select('*').order('name'); setCats(data || []) }
  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault(); setSaving(true)
    await supabase.from('categories').insert({ name, icon, color })
    setName(''); setIcon(ICONS[0]); setColor(COLORS[0]); setAdding(false); setSaving(false); load()
  }

  async function handleDelete(id) { if (!confirm('Excluir esta categoria?')) return; await supabase.from('categories').delete().eq('id', id); load() }

  return (
    <div style={{ maxWidth: 560 }}>
      {!adding && <button className="c-btn c-btn-primary c-mb-4" onClick={() => setAdding(true)}>+ Nova Categoria</button>}
      {adding && (
        <div className="c-card c-mb-4">
          <form onSubmit={handleAdd}>
            <div className="c-grid-2">
              <div className="c-form-group">
                <label className="c-form-label">Nome</label>
                <input type="text" className="c-form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Academia" />
              </div>
              <div>
                <label className="c-form-label">Ícone</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {ICONS.map(i => <span key={i} onClick={() => setIcon(i)} style={{ fontSize: 20, cursor: 'pointer', padding: 4, borderRadius: 6, background: icon === i ? '#f1f5f9' : 'transparent', border: icon === i ? '2px solid var(--c-accent)' : '2px solid transparent' }}>{i}</span>)}
                </div>
              </div>
            </div>
            <div className="c-form-group">
              <label className="c-form-label">Cor</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {COLORS.map(c => <div key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '3px solid #0f172a' : '2px solid transparent' }} />)}
              </div>
            </div>
            <div className="c-flex c-gap-2">
              <button type="submit" className="c-btn c-btn-primary" disabled={saving}>Salvar</button>
              <button type="button" className="c-btn c-btn-secondary" onClick={() => setAdding(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {cats.map(c => (
          <div key={c.id} className="c-card c-card-sm c-flex c-items-center c-gap-2">
            <span style={{ fontSize: 18 }}>{c.icon}</span>
            <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{c.name}</span>
            <span className="c-dot" style={{ background: c.color }} />
            <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(c.id)}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function EntradasTab() {
  const [income, setIncome] = useState([])
  const [desc, setDesc]     = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate]     = useState(format(new Date(), 'yyyy-MM-dd'))
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [monthRef, setMonthRef] = useState(format(new Date(), 'yyyy-MM'))

  async function load() { const { data } = await supabase.from('income').select('*').eq('month_ref', monthRef).order('date', { ascending: false }); setIncome(data || []) }
  useEffect(() => { load() }, [monthRef])

  async function handleAdd(e) {
    e.preventDefault(); setSaving(true)
    const mRef = date.slice(0, 7)
    await supabase.from('income').insert({ description: desc, amount: parseFloat(amount.replace(',', '.')), date, month_ref: mRef })
    setDesc(''); setAmount(''); setAdding(false); setSaving(false); setMonthRef(mRef); load()
  }

  async function handleDelete(id) { if (!confirm('Excluir esta entrada?')) return; await supabase.from('income').delete().eq('id', id); load() }

  const total = income.reduce((s, r) => s + Number(r.amount), 0)

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="c-flex c-items-center c-gap-3 c-mb-4">
        {!adding && <button className="c-btn c-btn-primary" onClick={() => setAdding(true)}>+ Nova Entrada</button>}
        <div>
          <label className="c-form-label c-text-sm">Mês</label>
          <input type="month" className="c-form-input" value={monthRef} onChange={e => setMonthRef(e.target.value)} style={{ width: 160 }} />
        </div>
        <div className="c-ml-auto">
          <span className="c-text-muted c-text-sm">Total: </span>
          <span style={{ fontWeight: 700, color: 'var(--c-success)' }}>{fmt(total)}</span>
        </div>
      </div>

      {adding && (
        <div className="c-card c-mb-4">
          <form onSubmit={handleAdd}>
            <div className="c-grid-2">
              <div className="c-form-group">
                <label className="c-form-label">Descrição</label>
                <input type="text" className="c-form-input" value={desc} onChange={e => setDesc(e.target.value)} required placeholder="Ex: Salário Scale" />
              </div>
              <div className="c-form-group">
                <label className="c-form-label">Valor (R$)</label>
                <input type="text" className="c-form-input" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="3.346,60" />
              </div>
            </div>
            <div className="c-form-group">
              <label className="c-form-label">Data</label>
              <input type="date" className="c-form-input" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="c-flex c-gap-2">
              <button type="submit" className="c-btn c-btn-primary" disabled={saving}>Salvar</button>
              <button type="button" className="c-btn c-btn-secondary" onClick={() => setAdding(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {income.length === 0 && <div className="c-empty-state"><div className="c-empty-icon">💵</div><h3>Nenhuma entrada neste mês</h3></div>}
        {income.map(r => (
          <div key={r.id} className="c-card c-card-sm c-flex c-items-center c-gap-3">
            <span style={{ fontSize: 20 }}>💵</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{r.description}</div>
              <div className="c-text-muted c-text-sm">{format(new Date(r.date + 'T12:00:00'), 'dd/MM/yyyy')}</div>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--c-success)', fontSize: 15 }}>{fmt(r.amount)}</span>
            <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(r.id)}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  )
}
