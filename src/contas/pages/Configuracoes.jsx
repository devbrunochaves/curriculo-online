import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

const fmt = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'
const COLORS = ['#6366f1','#EC4899','#F97316','#10b981','#EAB308','#DC2626','#2563EB','#8B5CF6','#14B8A6','#059669','#00B4D8','#F43F5E','#64748b']
const ICONS  = ['🍽️','🛒','⛽','💊','🏠','🚗','🎬','📱','👕','📚','💳','💸','📦','✈️','🐾','🎮','🏋️','💇','🎁','🔧']

export default function Configuracoes() {
  const [tab, setTab] = useState('pessoas')
  return (
    <div>
      <div className="c-page-header">
        <h2>Configurações</h2>
        <p>Gerencie pessoas, categorias e entradas</p>
      </div>
      <div className="c-flex c-gap-2 c-mb-4">
        {[['pessoas','👥 Pessoas'],['categorias','🏷️ Categorias'],['entradas','💵 Entradas']].map(([key, label]) => (
          <button key={key} className={`c-btn ${tab === key ? 'c-btn-primary' : 'c-btn-secondary'}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>
      {tab === 'pessoas'    && <PessoasTab />}
      {tab === 'categorias' && <CategoriasTab />}
      {tab === 'entradas'   && <EntradasTab />}
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
