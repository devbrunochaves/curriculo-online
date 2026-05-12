import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export default function ListaCompras() {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [text, setText]         = useState('')
  const [qty, setQty]           = useState('')
  const [filter, setFilter]     = useState('pending') // 'all' | 'pending' | 'done'
  const [saving, setSaving]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('shopping_items')
      .select('*')
      .order('is_done', { ascending: true })
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function addItem(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    await supabase.from('shopping_items').insert({
      name: text.trim(),
      quantity: qty.trim() || null,
      is_done: false,
    })
    setText('')
    setQty('')
    setSaving(false)
    load()
  }

  async function toggleItem(item) {
    await supabase
      .from('shopping_items')
      .update({ is_done: !item.is_done })
      .eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_done: !i.is_done } : i))
  }

  async function deleteItem(id) {
    await supabase.from('shopping_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function clearDone() {
    const doneIds = items.filter(i => i.is_done).map(i => i.id)
    if (!doneIds.length) return
    await supabase.from('shopping_items').delete().in('id', doneIds)
    setItems(prev => prev.filter(i => !i.is_done))
  }

  const pending = items.filter(i => !i.is_done)
  const done    = items.filter(i =>  i.is_done)
  const visible = filter === 'all' ? items : filter === 'pending' ? pending : done

  return (
    <div>
      <div className="c-flex c-items-center c-justify-between c-mb-4">
        <div className="c-page-header" style={{ margin: 0 }}>
          <h2>🛒 Lista de Compras</h2>
          <p>{pending.length} item{pending.length !== 1 ? 's' : ''} pendente{pending.length !== 1 ? 's' : ''}{done.length > 0 ? ` · ${done.length} comprado${done.length !== 1 ? 's' : ''}` : ''}</p>
        </div>
        {done.length > 0 && (
          <button
            onClick={clearDone}
            className="c-btn c-btn-sm c-btn-secondary"
            style={{ color: '#ef4444', borderColor: '#fca5a5' }}
          >
            🗑️ Limpar comprados
          </button>
        )}
      </div>

      {/* Formulário de adição */}
      <form onSubmit={addItem} className="c-card" style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label className="c-label">Item</label>
          <input
            className="c-input"
            placeholder="Ex: Detergente, Arroz, Shampoo..."
            value={text}
            onChange={e => setText(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div style={{ flex: '0 0 100px' }}>
          <label className="c-label">Qtd / Obs</label>
          <input
            className="c-input"
            placeholder="Ex: 2kg, 3un"
            value={qty}
            onChange={e => setQty(e.target.value)}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          className="c-btn c-btn-primary"
          disabled={saving || !text.trim()}
          style={{ height: 42, padding: '0 20px', flexShrink: 0 }}
        >
          {saving ? '...' : '+ Adicionar'}
        </button>
      </form>

      {/* Filtros */}
      <div className="c-flex c-gap-2 c-mb-4">
        {[
          { key: 'pending', label: `Pendentes (${pending.length})` },
          { key: 'done',    label: `Comprados (${done.length})` },
          { key: 'all',     label: `Todos (${items.length})` },
        ].map(f => (
          <button
            key={f.key}
            className={`c-btn c-btn-sm ${filter === f.key ? 'c-btn-primary' : 'c-btn-secondary'}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="c-loading-screen" style={{ height: '30vh' }}>
          <div className="c-loading-spinner" />
        </div>
      ) : visible.length === 0 ? (
        <div className="c-card">
          <div className="c-empty-state">
            <div className="c-empty-icon">🛒</div>
            <h3>{filter === 'done' ? 'Nenhum item comprado' : 'Lista vazia'}</h3>
            <p className="c-text-muted" style={{ fontSize: 14 }}>
              {filter === 'pending' ? 'Adicione itens acima para começar.' : ''}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: item.is_done ? 'var(--c-surface)' : '#fff',
                border: `1.5px solid ${item.is_done ? 'var(--c-border)' : 'var(--c-border)'}`,
                borderRadius: 12,
                padding: '12px 16px',
                transition: 'all 0.2s',
                opacity: item.is_done ? 0.6 : 1,
              }}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleItem(item)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  border: `2px solid ${item.is_done ? '#10b981' : '#d1d5db'}`,
                  background: item.is_done ? '#10b981' : 'transparent',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                {item.is_done ? '✓' : ''}
              </button>

              {/* Nome + Qtd */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--c-text)',
                  textDecoration: item.is_done ? 'line-through' : 'none',
                }}>
                  {item.name}
                </span>
                {item.quantity && (
                  <span style={{
                    marginLeft: 8,
                    fontSize: 12,
                    background: 'var(--c-accent-soft, #ede9fe)',
                    color: 'var(--c-accent)',
                    padding: '1px 7px',
                    borderRadius: 99,
                    fontWeight: 600,
                  }}>
                    {item.quantity}
                  </span>
                )}
              </div>

              {/* Deletar */}
              <button
                onClick={() => deleteItem(item.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  fontSize: 16,
                  padding: '4px',
                  borderRadius: 6,
                  lineHeight: 1,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                title="Remover"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
