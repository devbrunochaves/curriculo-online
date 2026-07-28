import { useState, useEffect, useCallback } from 'react'
import { Check, Circle, ListChecks, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  Button,
  EmptyState,
  IconButton,
  MetricCard,
  PageHeader,
  SectionCard,
  Skeleton,
  StatusBadge,
} from '../components/ui'

export default function ListaCompras({ embedded = false }) {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [text, setText]         = useState('')
  const [qty, setQty]           = useState('')
  const [filter, setFilter]     = useState('pending') // 'all' | 'pending' | 'done'
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('shopping_items')
      .select('*')
      .order('is_done', { ascending: true })
      .order('name', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function addItem(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('shopping_items').insert({
      name: text.trim(),
      quantity: qty.trim() || null,
      is_done: false,
    })
    if (err) {
      setError('Erro ao adicionar: ' + err.message)
    } else {
      setText('')
      setQty('')
      load()
    }
    setSaving(false)
  }

  async function toggleItem(item) {
    await supabase
      .from('shopping_items')
      .update({ is_done: !item.is_done })
      .eq('id', item.id)
    setItems(prev => {
      const updated = prev.map(i => i.id === item.id ? { ...i, is_done: !i.is_done } : i)
      return [...updated].sort((a, b) => {
        if (a.is_done !== b.is_done) return a.is_done ? 1 : -1
        return a.name.localeCompare(b.name, 'pt-BR')
      })
    })
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
  const progress = items.length ? Math.round((done.length / items.length) * 100) : 0
  const groups = [
    { key: 'pending', title: 'Pendentes', items: filter === 'done' ? [] : pending },
    { key: 'done', title: 'Comprados', items: filter === 'pending' ? [] : done },
  ].filter(group => group.items.length > 0)

  return (
    <div className={`c-compras-v2-page ${embedded ? 'c-compras-v2-page--embedded' : ''}`}>
      {!embedded && (
        <PageHeader
          eyebrow="Alimentação"
          title="Lista de Compras"
          description="Organize os itens da lista e acompanhe o que ainda precisa ser comprado."
          meta={<StatusBadge tone="accent" icon={<ListChecks size={14} />}>{items.length} item{items.length !== 1 ? 's' : ''}</StatusBadge>}
          actions={done.length > 0 ? (
            <Button variant="danger" size="sm" icon={<Trash2 size={16} />} onClick={clearDone}>
              Limpar comprados
            </Button>
          ) : null}
        />
      )}

      <div className="c-compras-v2-metrics">
        <MetricCard
          label="Pendentes"
          value={pending.length}
          description="Itens a comprar"
          tone="warning"
          icon={<Circle size={18} />}
        />
        <MetricCard
          label="Comprados"
          value={done.length}
          description="Itens concluidos"
          tone="success"
          icon={<Check size={18} />}
        />
        <MetricCard
          label="Total"
          value={items.length}
          description="Itens cadastrados"
          tone="neutral"
          icon={<ShoppingBag size={18} />}
        />
      </div>

      <SectionCard
        title="Progresso"
        description={`${progress}% concluído a partir dos itens já carregados.`}
        padding="md"
        className="c-compras-v2-progress-card"
        actions={done.length > 0 ? (
          <Button variant="danger" size="sm" icon={<Trash2 size={16} />} onClick={clearDone}>
            Limpar comprados
          </Button>
        ) : null}
      >
        <div className="c-compras-v2-progress" aria-label={`${progress}% dos itens comprados`}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </SectionCard>

      <SectionCard
        title="Novo item"
        description="Adicione nome e quantidade ou observacao, quando precisar."
        padding="lg"
        className="c-compras-v2-form-card"
      >
        <form onSubmit={addItem} className="c-compras-v2-form">
          <div className="c-compras-v2-field c-compras-v2-field--item">
            <label htmlFor="compras-item" className="c-compras-v2-label">Item</label>
            <input
              id="compras-item"
              className="c-compras-v2-input"
              placeholder="Ex: Detergente, Arroz, Shampoo..."
              value={text}
              onChange={e => setText(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="c-compras-v2-field">
            <label htmlFor="compras-quantity" className="c-compras-v2-label">Qtd / Obs</label>
            <input
              id="compras-quantity"
              className="c-compras-v2-input"
              placeholder="Ex: 2kg, 3un"
              value={qty}
              onChange={e => setQty(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Button
            type="submit"
            icon={<Plus size={16} />}
            loading={saving}
            disabled={saving || !text.trim()}
            className="c-compras-v2-submit"
          >
            Adicionar
          </Button>
        </form>
        {error && (
          <p className="c-compras-v2-error" role="alert">
            {error}
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="Lista"
        description={pending.length === 0 ? 'Nenhum item pendente no momento.' : `${pending.length} item${pending.length !== 1 ? 's' : ''} pendente${pending.length !== 1 ? 's' : ''}.`}
        actions={
          <div className="c-compras-v2-filter" aria-label="Filtrar lista de compras">
            {[
              { key: 'pending', label: `Pendentes (${pending.length})` },
              { key: 'done',    label: `Comprados (${done.length})` },
              { key: 'all',     label: `Todos (${items.length})` },
            ].map(f => (
              <button
                key={f.key}
                type="button"
                className={`c-compras-v2-filter-button ${filter === f.key ? 'is-active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
        padding="lg"
        className="c-compras-v2-list-card"
      >
        {loading ? (
          <div className="c-compras-v2-loading" aria-label="Carregando lista de compras">
            <Skeleton variant="text" lines={4} />
            <Skeleton variant="card" height={64} />
            <Skeleton variant="card" height={64} />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            compact
            icon={<ShoppingBag size={24} />}
            title={filter === 'done' ? 'Nenhum item comprado' : 'Lista vazia'}
            description={filter === 'pending' ? 'Adicione itens acima para comecar.' : 'Nao ha itens para este filtro.'}
          />
        ) : (
          <div className="c-compras-v2-groups">
            {groups.map(group => (
              <section key={group.key} className="c-compras-v2-group">
                <h3>{group.title}</h3>
                <ul className="c-compras-v2-list">
                  {group.items.map(item => (
                    <li key={item.id} className={`c-compras-v2-item ${item.is_done ? 'is-done' : ''}`}>
                      <button
                        type="button"
                        className="c-compras-v2-check"
                        onClick={() => toggleItem(item)}
                        aria-label={item.is_done ? `Marcar ${item.name} como pendente` : `Marcar ${item.name} como comprado`}
                        aria-pressed={item.is_done}
                      >
                        {item.is_done ? <Check size={16} /> : null}
                      </button>

                      <div className="c-compras-v2-item-content">
                        <span className="c-compras-v2-item-name">{item.name}</span>
                        {item.quantity && (
                          <StatusBadge tone="accent" size="sm">
                            {item.quantity}
                          </StatusBadge>
                        )}
                      </div>

                      <IconButton
                        icon={<Trash2 size={16} />}
                        label={`Remover ${item.name}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                        className="c-compras-v2-delete"
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}
