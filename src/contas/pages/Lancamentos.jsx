import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { format, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import NovaCompra from './NovaCompra'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  FileText,
  Filter,
  GripVertical,
  Inbox,
  Minus,
  Paperclip,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  IconButton,
  MetricCard,
  PageHeader,
  SectionCard,
  SelectField,
  Skeleton,
  StatusBadge,
} from '../components/ui'

const fmt = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'
const ORDER_STORAGE_PREFIX = 'contas:lancamentos-order'

function normalizeOrder(ids, items) {
  const itemIds = items.map(item => item.id)
  const current = new Set(itemIds)
  const ordered = ids.filter(id => current.has(id))
  const missing = itemIds.filter(id => !ordered.includes(id))
  return [...ordered, ...missing]
}

function applyManualOrder(items, orderIds) {
  if (!orderIds.length) return items
  const positions = new Map(orderIds.map((id, index) => [id, index]))
  return [...items].sort((a, b) => {
    const aPos = positions.has(a.id) ? positions.get(a.id) : Number.MAX_SAFE_INTEGER
    const bPos = positions.has(b.id) ? positions.get(b.id) : Number.MAX_SAFE_INTEGER
    return aPos - bPos
  })
}

function applySortMode(items, sortMode) {
  if (!sortMode) return items
  return [...items].sort((a, b) => {
    if (sortMode === 'date-asc') return String(a.date || '').localeCompare(String(b.date || ''))
    if (sortMode === 'date-desc') return String(b.date || '').localeCompare(String(a.date || ''))
    if (sortMode === 'az') return String(a.description || '').localeCompare(String(b.description || ''), 'pt-BR', { sensitivity: 'base' })
    if (sortMode === 'za') return String(b.description || '').localeCompare(String(a.description || ''), 'pt-BR', { sensitivity: 'base' })
    return 0
  })
}

function moveId(ids, activeId, overId) {
  if (!activeId || !overId || activeId === overId) return ids
  const from = ids.indexOf(activeId)
  const to = ids.indexOf(overId)
  if (from < 0 || to < 0) return ids
  const next = [...ids]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

function createDragPreview(source) {
  const row = source.closest('tr')
  const card = source.closest('.c-lanc-v2-mobile-card')
  const sourceEl = row || card
  if (!sourceEl) return null

  const rect = sourceEl.getBoundingClientRect()
  const shell = document.createElement('div')
  shell.className = 'contas-root c-lanc-v2-drag-preview'
  shell.style.width = `${rect.width}px`

  if (row) {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    table.className = 'c-lanc-v2-table c-lanc-v2-drag-preview-table'
    table.style.width = `${rect.width}px`
    tbody.appendChild(row.cloneNode(true))
    table.appendChild(tbody)
    shell.appendChild(table)
  } else {
    shell.appendChild(card.cloneNode(true))
  }

  document.body.appendChild(shell)
  return { element: shell, x: Math.min(48, rect.width / 2), y: Math.min(28, rect.height / 2) }
}

/* ── Modal de detalhes ─────────────────────────────────────────── */
function ExpenseModal({ expense: e, onClose, onEdit, onDelete, deleting }) {
  // Fecha ao pressionar Escape
  useEffect(() => {
    function onKey(ev) { if (ev.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!e) return null

  const isImage = e.receipt_url && !e.receipt_url.toLowerCase().endsWith('.pdf')
  const isPdf   = e.receipt_url && e.receipt_url.toLowerCase().endsWith('.pdf')

  return (
    <div className="c-lanc-v2-modal" role="presentation" onMouseDown={ev => { if (ev.target === ev.currentTarget) onClose() }}>
      <section className="c-lanc-v2-modal-dialog" role="dialog" aria-modal="true" aria-label={`Detalhes de ${e.description}`}>
        <header className="c-lanc-v2-modal-header">
          <div className="c-lanc-v2-modal-title">
            <span className="c-lanc-v2-modal-icon" aria-hidden="true"><ReceiptText /></span>
            <div>
              <h2>{e.description}</h2>
              <p>{format(new Date(e.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            </div>
          </div>
          <div className="c-lanc-v2-modal-total">
            <strong>{fmt(e.total_amount)}</strong>
            {e.is_fixed && <StatusBadge tone="info" size="sm">Fixo</StatusBadge>}
          </div>
          <IconButton icon={<X />} label="Fechar detalhes" variant="ghost" size="sm" onClick={onClose} />
        </header>

        <div className="c-lanc-v2-modal-body">
          <div className="c-lanc-v2-detail-grid">
            <div className="c-lanc-v2-detail-box">
              <span>Cartão</span>
              {e.card
                ? <strong style={{ color: e.card.color }}><span className="c-lanc-v2-dot" style={{ background: e.card.color }} />{e.card.name}</strong>
                : <strong>—</strong>
              }
            </div>
            <div className="c-lanc-v2-detail-box">
              <span>Categoria</span>
              {e.category ? <strong>{e.category.icon} {e.category.name}</strong> : <strong>—</strong>}
            </div>
          </div>

          {e.splits?.length > 0 && (
            <section className="c-lanc-v2-detail-section">
              <h3>Divisão</h3>
              <div className="c-lanc-v2-splits">
                {e.splits.map(s => (
                  <div key={s.id} className="c-lanc-v2-split-row" style={{ '--split-color': s.person.color }}>
                    <span><span className="c-lanc-v2-dot" style={{ background: s.person.color }} />{s.person.name}</span>
                    <strong>{fmt(s.amount)}</strong>
                  </div>
                ))}
              </div>
            </section>
          )}

          {e.notes && (
            <section className="c-lanc-v2-detail-section">
              <h3>Observações</h3>
              <p className="c-lanc-v2-note">{e.notes}</p>
            </section>
          )}

          <section className="c-lanc-v2-detail-section">
            <h3>Comprovante</h3>
            {e.receipt_url ? (
              <>
                {isImage && (
                  <a href={e.receipt_url} target="_blank" rel="noopener noreferrer" className="c-lanc-v2-receipt-image">
                    <img src={e.receipt_url} alt="Comprovante" />
                    <span>Toque para ver em tamanho completo</span>
                  </a>
                )}
                {isPdf && (
                  <a href={e.receipt_url} target="_blank" rel="noopener noreferrer" className="c-lanc-v2-receipt-link">
                    <FileText aria-hidden="true" />
                    <span><strong>Abrir comprovante PDF</strong><small>Abre em nova aba</small></span>
                    <ExternalLink aria-hidden="true" />
                  </a>
                )}
              </>
            ) : (
              <div className="c-lanc-v2-empty-receipt">
                <Paperclip aria-hidden="true" />
                <span>Nenhum comprovante anexado</span>
              </div>
            )}
          </section>
        </div>

        <footer className="c-lanc-v2-modal-footer">
          <Button variant="secondary" icon={<Pencil />} onClick={() => { onClose(); onEdit(e.id) }}>Editar</Button>
          <Button variant="danger" icon={<Trash2 />} onClick={() => onDelete(e.id)} loading={deleting === e.id}>
            {deleting === e.id ? 'Excluindo...' : 'Excluir'}
          </Button>
        </footer>
      </section>
    </div>
  )

  return (
    <div className="c-modal-overlay" onClick={onClose}>
      <div className="c-modal-sheet" onClick={ev => ev.stopPropagation()}>
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--c-border)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '8px 20px 16px', borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 19, color: 'var(--c-text)', lineHeight: 1.2 }}>
                {e.description}
              </div>
              <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 4 }}>
                {format(new Date(e.date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.5px' }}>
                {fmt(e.total_amount)}
              </div>
              {e.is_fixed && (
                <span className="c-chip c-badge-info" style={{ fontSize: 10 }}>FIXO</span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Cartão + Categoria */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Cartão</div>
              {e.card
                ? <span className="c-chip" style={{ background: e.card.color + '20', color: e.card.color, fontSize: 13 }}>{e.card.name}</span>
                : <span className="c-text-muted c-text-sm">—</span>
              }
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Categoria</div>
              {e.category
                ? <span className="c-text-sm">{e.category.icon} {e.category.name}</span>
                : <span className="c-text-muted c-text-sm">—</span>
              }
            </div>
          </div>

          {/* Pessoas */}
          {e.splits?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Divisão</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {e.splits.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderRadius: 8, background: s.person.color + '12', border: `1px solid ${s.person.color}30` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="c-dot" style={{ background: s.person.color }} />
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-text)' }}>{s.person.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: s.person.color }}>{fmt(s.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          {e.notes && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Observações</div>
              <div style={{ fontSize: 13, color: 'var(--c-text)', background: 'var(--c-bg)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--c-border)' }}>
                {e.notes}
              </div>
            </div>
          )}

          {/* Comprovante */}
          {e.receipt_url ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Comprovante</div>
              {isImage && (
                <a href={e.receipt_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                  <img
                    src={e.receipt_url}
                    alt="Comprovante"
                    style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--c-border)', cursor: 'zoom-in' }}
                  />
                  <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--c-text-muted)', marginTop: 5 }}>
                    Toque para ver em tamanho completo
                  </div>
                </a>
              )}
              {isPdf && (
                <a href={e.receipt_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', textDecoration: 'none', color: '#1e40af' }}>
                  <span style={{ fontSize: 28 }}>📄</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>Abrir comprovante PDF</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>Toque para abrir em nova aba</div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 18 }}>↗</span>
                </a>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px', borderRadius: 10, border: '1.5px dashed var(--c-border)', color: 'var(--c-text-muted)', fontSize: 13 }}>
              📎 Nenhum comprovante anexado
            </div>
          )}
        </div>

        {/* Footer — ações */}
        <div style={{ padding: '12px 20px 24px', borderTop: '1px solid var(--c-border)', display: 'flex', gap: 10 }}>
          <button
            className="c-btn c-btn-secondary"
            style={{ flex: 1 }}
            onClick={() => { onClose(); onEdit(e.id) }}
          >
            ✏️ Editar
          </button>
          <button
            className="c-btn c-btn-danger"
            style={{ flex: 1 }}
            onClick={() => onDelete(e.id)}
            disabled={deleting === e.id}
          >
            {deleting === e.id ? 'Excluindo...' : '🗑️ Excluir'}
          </button>
        </div>
      </div>

    </div>
  )
}

/* ── Página principal ──────────────────────────────────────────── */
export default function Lancamentos() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(addMonths(new Date(), 1))
  const [expenses, setExpenses] = useState([])
  const [cards, setCards]       = useState([])
  const [people, setPeople]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [filterCard, setFilterCard]     = useState('')
  const [filterPerson, setFilterPerson] = useState('')
  const [filterFixed, setFilterFixed]   = useState('')
  const [sortMode, setSortMode]         = useState('')
  const [search, setSearch]             = useState('')
  const [deleting, setDeleting]         = useState(null)
  const [selected, setSelected]         = useState(null)  // expense aberta no modal de detalhes
  const [showForm, setShowForm]         = useState(false)
  const [editingId, setEditingId]       = useState(null)
  const [orderIds, setOrderIds]         = useState([])
  const [draggingId, setDraggingId]     = useState(null)
  const [dragOverId, setDragOverId]     = useState(null)

  const monthRef = format(currentDate, 'yyyy-MM')
  const orderStorageKey = `${ORDER_STORAGE_PREFIX}:${monthRef}`

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: exp }, { data: c }, { data: p }] = await Promise.all([
      supabase.from('expenses')
        .select('*, card:cards(*), category:categories(*), splits:expense_splits(*, person:people(*))')
        .eq('month_ref', monthRef)
        .order('date', { ascending: false }),
      supabase.from('cards').select('*').eq('is_active', true),
      supabase.from('people').select('*').eq('is_active', true),
    ])
    setExpenses(exp || []); setCards(c || []); setPeople(p || [])
    setLoading(false)
  }, [monthRef])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(orderStorageKey)
      setOrderIds(saved ? JSON.parse(saved) : [])
    } catch {
      setOrderIds([])
    }
  }, [orderStorageKey])

  useEffect(() => {
    function openNovaCompraModal() {
      setSelected(null)
      setEditingId(null)
      setShowForm(true)
    }
    window.addEventListener('contas:open-nova-compra', openNovaCompraModal)
    return () => window.removeEventListener('contas:open-nova-compra', openNovaCompraModal)
  }, [])

  async function toggleReconciled(id, current) {
    const next = !current
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, reconciled: next } : e))
    await supabase.from('expenses').update({ reconciled: next }).eq('id', id)
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este lançamento?')) return
    setDeleting(id)
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
    setDeleting(null)
    setSelected(null)
  }

  let filtered = expenses
  if (filterCard)   filtered = filtered.filter(e => e.card_id === filterCard)
  if (filterFixed)  filtered = filtered.filter(e => filterFixed === 'fixed' ? e.is_fixed : !e.is_fixed)
  if (filterPerson) filtered = filtered.filter(e => e.splits?.some(s => s.person_id === filterPerson))
  if (search)       filtered = filtered.filter(e => e.description.toLowerCase().includes(search.toLowerCase()))
  filtered = applyManualOrder(filtered, orderIds)
  filtered = applySortMode(filtered, sortMode)

  const total    = filtered.reduce((s, e) => s + Number(e.total_amount), 0)
  const totalMes = expenses.reduce((s, e) => s + Number(e.total_amount), 0)

  // Totais por cartão (para os mini cards)
  const totalPorCartao = cards.map(c => ({
    ...c,
    total: expenses.filter(e => e.card_id === c.id).reduce((s, e) => s + Number(e.total_amount), 0),
  })).filter(c => c.total > 0)

  const allReconciled  = filtered.length > 0 && filtered.every(e => e.reconciled)
  const someReconciled = filtered.some(e => e.reconciled)

  async function toggleAll() {
    const next = !allReconciled
    const ids = filtered.map(e => e.id)
    setExpenses(prev => prev.map(e => ids.includes(e.id) ? { ...e, reconciled: next } : e))
    await supabase.from('expenses').update({ reconciled: next }).in('id', ids)
  }

  function saveManualOrder(nextOrder) {
    setOrderIds(nextOrder)
    try {
      window.localStorage.setItem(orderStorageKey, JSON.stringify(nextOrder))
    } catch {
      // A ordenação manual continua válida na sessão atual mesmo sem persistência local.
    }
  }

  function reorderExpense(activeId, overId) {
    if (!activeId || !overId || activeId === overId) return
    const visibleIds = filtered.map(e => e.id)
    const nextVisibleIds = moveId(visibleIds, activeId, overId)
    if (nextVisibleIds === visibleIds) return
    const visibleSet = new Set(visibleIds)
    const baseOrder = normalizeOrder(orderIds, expenses)
    let visibleIndex = 0
    const nextOrder = baseOrder.map(id => {
      if (!visibleSet.has(id)) return id
      const nextId = nextVisibleIds[visibleIndex]
      visibleIndex += 1
      return nextId
    })
    saveManualOrder(nextOrder)
  }

  function handleDragStart(ev, id) {
    ev.stopPropagation()
    setDraggingId(id)
    setDragOverId(null)
    ev.dataTransfer.effectAllowed = 'move'
    ev.dataTransfer.setData('text/plain', id)
    const preview = createDragPreview(ev.currentTarget)
    if (preview) {
      ev.dataTransfer.setDragImage(preview.element, preview.x, preview.y)
      window.setTimeout(() => preview.element.remove(), 0)
    }
  }

  function handleDragOver(ev, overId) {
    if (!draggingId || draggingId === overId) return
    ev.preventDefault()
    setDragOverId(overId)
  }

  function handleDrop(ev, overId) {
    ev.preventDefault()
    ev.stopPropagation()
    const activeId = ev.dataTransfer.getData('text/plain') || draggingId
    reorderExpense(activeId, overId)
    setDraggingId(null)
    setDragOverId(null)
  }

  function handleDragKeyDown(ev, id) {
    if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') return
    const visibleIds = filtered.map(e => e.id)
    const index = visibleIds.indexOf(id)
    const nextIndex = ev.key === 'ArrowUp' ? index - 1 : index + 1
    if (index < 0 || nextIndex < 0 || nextIndex >= visibleIds.length) return
    ev.preventDefault()
    reorderExpense(id, visibleIds[nextIndex])
  }

  const cartaoSelecionado = filterCard ? cards.find(c => c.id === filterCard) : null
  const totalCartaoSelecionado = filterCard
    ? expenses.filter(e => e.card_id === filterCard).reduce((s, e) => s + Number(e.total_amount), 0)
    : 0

  const pessoaSelecionada = filterPerson ? people.find(p => p.id === filterPerson) : null
  const baseParaPessoa = filterCard ? expenses.filter(e => e.card_id === filterCard) : expenses
  const totalPessoa = filterPerson
    ? baseParaPessoa
        .flatMap(e => (e.splits || []))
        .filter(s => s.person_id === filterPerson)
        .reduce((sum, s) => sum + Number(s.amount || 0), 0)
    : 0
  const lancamentosPessoa = filterPerson
    ? baseParaPessoa.filter(e => e.splits?.some(s => s.person_id === filterPerson)).length
    : 0
  const reconciledCount = filtered.filter(e => e.reconciled).length
  const pendingCount = filtered.length - reconciledCount
  const activeFilters = [filterCard, filterPerson, filterFixed, sortMode, search].filter(Boolean).length

  return (
    <div className="c-lanc-v2-page">
      <PageHeader
        eyebrow="Financeiro"
        title="Lançamentos"
        description={`${filtered.length} registros — ${fmt(total)}`}
        meta={<StatusBadge tone={allReconciled ? 'success' : someReconciled ? 'warning' : 'neutral'}>{allReconciled ? 'Conciliado' : someReconciled ? 'Parcial' : 'Pendente'}</StatusBadge>}
        actions={(
          <div className="c-lanc-v2-header-actions">
            <div className="c-dashboard-v2-month-nav" aria-label="Navegação mensal">
              <IconButton icon={<ArrowLeft />} label="Mês anterior" variant="secondary" size="sm" onClick={() => setCurrentDate(d => subMonths(d, 1))} />
              <span>{format(currentDate, 'MMM yyyy', { locale: ptBR })}</span>
              <IconButton icon={<ArrowRight />} label="Mês seguinte" variant="secondary" size="sm" onClick={() => setCurrentDate(d => addMonths(d, 1))} />
            </div>
            <Button icon={<Plus />} onClick={() => { setEditingId(null); setShowForm(true) }}>Nova compra</Button>
          </div>
        )}
      />

      <section className="c-lanc-v2-metrics" aria-label="Resumo dos lançamentos">
        <MetricCard label="Total do mês" value={fmt(totalMes)} tone="accent" icon={<WalletCards />} description={`${expenses.length} lançamento${expenses.length !== 1 ? 's' : ''}`} />
        <MetricCard label="Total filtrado" value={fmt(total)} tone="neutral" icon={<Filter />} description={`${filtered.length} registro${filtered.length !== 1 ? 's' : ''} visível${filtered.length !== 1 ? 'is' : ''}`} />
        <MetricCard label="Conciliados" value={String(reconciledCount)} tone={reconciledCount ? 'success' : 'neutral'} icon={<Check />} description={`${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}`} />
        <MetricCard label="Filtros ativos" value={String(activeFilters)} tone={activeFilters ? 'warning' : 'neutral'} icon={<Search />} description="Busca, cartão, pessoa, tipo e classificação" />
      </section>

      {(totalPorCartao.length > 0 || cartaoSelecionado || pessoaSelecionada) && (
        <section className="c-lanc-v2-context">
          {!filterCard && totalPorCartao.length > 0 && totalPorCartao.map(c => (
            <button key={c.id} type="button" className="c-lanc-v2-context-card" onClick={() => setFilterCard(c.id)} style={{ '--context-color': c.color }}>
              <span><span className="c-lanc-v2-dot" style={{ background: c.color }} />{c.name}</span>
              <strong>{fmt(c.total)}</strong>
              <small>{totalMes > 0 ? ((c.total / totalMes) * 100).toFixed(0) : 0}% do total</small>
            </button>
          ))}

          {cartaoSelecionado && (
            <div className="c-lanc-v2-context-card is-selected" style={{ '--context-color': cartaoSelecionado.color }}>
              <span><span className="c-lanc-v2-dot" style={{ background: cartaoSelecionado.color }} />{cartaoSelecionado.name}</span>
              <strong>{fmt(totalCartaoSelecionado)}</strong>
              <small>{expenses.filter(e => e.card_id === filterCard).length} lançamento{expenses.filter(e => e.card_id === filterCard).length !== 1 ? 's' : ''}</small>
            </div>
          )}

          {pessoaSelecionada && (
            <div className="c-lanc-v2-context-card is-selected" style={{ '--context-color': pessoaSelecionada.color }}>
              <span><span className="c-lanc-v2-dot" style={{ background: pessoaSelecionada.color }} />{pessoaSelecionada.name}{cartaoSelecionado ? ` · ${cartaoSelecionado.name}` : ''}</span>
              <strong>{fmt(totalPessoa)}</strong>
              <small>{lancamentosPessoa} lançamento{lancamentosPessoa !== 1 ? 's' : ''}{totalCartaoSelecionado > 0 ? ` · ${((totalPessoa / totalCartaoSelecionado) * 100).toFixed(0)}% do cartão` : ''}</small>
            </div>
          )}
        </section>
      )}

      <SectionCard title="Filtros" description="Combine os filtros atuais sem alterar a lógica da lista." actions={<StatusBadge tone={activeFilters ? 'warning' : 'neutral'}>{activeFilters} ativo{activeFilters !== 1 ? 's' : ''}</StatusBadge>}>
        <div className="c-lanc-v2-filter-grid">
          <label className="c-lanc-v2-field">
            <span>Buscar</span>
            <div className="c-lanc-v2-search">
              <Search aria-hidden="true" />
              <input type="text" placeholder="Descrição..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </label>
          <SelectField label="Cartão" value={filterCard} onChange={e => setFilterCard(e.target.value)} options={[{ value: '', label: 'Todos' }, ...cards.map(c => ({ value: c.id, label: c.name }))]} />
          <SelectField label="Pessoa" value={filterPerson} onChange={e => setFilterPerson(e.target.value)} options={[{ value: '', label: 'Todas' }, ...people.map(p => ({ value: p.id, label: p.name }))]} />
          <SelectField label="Tipo" value={filterFixed} onChange={e => setFilterFixed(e.target.value)} options={[{ value: '', label: 'Todos' }, { value: 'fixed', label: 'Fixos' }, { value: 'variable', label: 'Variáveis' }]} />
          <SelectField label="Classificar" value={sortMode} onChange={e => setSortMode(e.target.value)} options={[{ value: '', label: 'Classificar' }, { value: 'date-asc', label: 'Data crescente' }, { value: 'date-desc', label: 'Data decrescente' }, { value: 'az', label: 'A-Z' }, { value: 'za', label: 'Z-A' }]} />
        </div>
      </SectionCard>

      <SectionCard
        title="Lista de lançamentos"
        description={loading ? 'Carregando dados reais do mês selecionado.' : `${filtered.length} lançamento${filtered.length !== 1 ? 's' : ''} na visualização atual.`}
        actions={!loading && filtered.length > 0 ? (
          <Button variant="secondary" size="sm" icon={allReconciled ? <Minus /> : <Check />} onClick={toggleAll}>
            {allReconciled ? 'Desmarcar todos' : someReconciled ? 'Conciliação parcial' : 'Conciliar todos'}
          </Button>
        ) : null}
      >
        {loading ? (
          <div className="c-lanc-v2-loading">
            {[0, 1, 2, 3, 4].map(item => <Skeleton key={item} variant="table-row" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Inbox />}
            title="Nenhum lançamento encontrado"
            description="Tente ajustar os filtros ou adicione uma nova compra."
            action={<Button icon={<Plus />} onClick={() => { setEditingId(null); setShowForm(true) }}>Nova compra</Button>}
          />
        ) : (
          <>
            <div className="c-lanc-v2-table-wrap">
              <table className="c-lanc-v2-table">
                <thead>
                  <tr>
                    <th className="is-check">
                      <div className="c-lanc-v2-check-cell">
                        <span className="c-lanc-v2-drag-spacer" aria-hidden="true" />
                        <button className={`c-lanc-v2-check ${allReconciled ? 'is-checked' : someReconciled ? 'is-partial' : ''}`} onClick={toggleAll} title={allReconciled ? 'Desmarcar todos' : 'Marcar todos como conciliados'} aria-label={allReconciled ? 'Desmarcar todos' : 'Marcar todos como conciliados'}>
                          {allReconciled ? <Check /> : someReconciled ? <Minus /> : null}
                        </button>
                      </div>
                    </th>
                    <th>Data</th>
                    <th>Lançamento</th>
                    <th>Cartão</th>
                    <th>Categoria</th>
                    <th>Pessoas</th>
                    <th className="is-money">Total</th>
                    <th className="is-actions">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr
                      key={e.id}
                      onClick={() => setSelected(e)}
                      className={`${e.reconciled ? 'is-reconciled' : ''}${draggingId === e.id ? ' is-dragging' : ''}${dragOverId === e.id ? ' is-drag-over' : ''}`}
                      onDragOver={ev => handleDragOver(ev, e.id)}
                      onDrop={ev => handleDrop(ev, e.id)}
                    >
                      <td onClick={ev => ev.stopPropagation()} className="is-check">
                        <div className="c-lanc-v2-check-cell">
                          <button
                            type="button"
                            className="c-lanc-v2-drag-handle"
                            draggable
                            aria-label={`Reordenar ${e.description}`}
                            title="Arrastar para reordenar"
                            onClick={ev => ev.stopPropagation()}
                            onDragStart={ev => handleDragStart(ev, e.id)}
                            onDragEnd={() => { setDraggingId(null); setDragOverId(null) }}
                            onKeyDown={ev => handleDragKeyDown(ev, e.id)}
                          >
                            <GripVertical aria-hidden="true" />
                          </button>
                          <button className={`c-lanc-v2-check ${e.reconciled ? 'is-checked' : ''}`} onClick={() => toggleReconciled(e.id, e.reconciled)} title={e.reconciled ? 'Desmarcar conciliacao' : 'Marcar como conciliado'} aria-label={e.reconciled ? 'Desmarcar conciliacao' : 'Marcar como conciliado'} style={{ '--row-color': e.card?.color || 'var(--v2-color-success)' }}>
                            {e.reconciled ? <Check /> : null}
                          </button>
                        </div>
                      </td>
                      <td className="c-lanc-v2-date">{format(new Date(e.date + 'T12:00:00'), 'dd/MM/yy')}</td>
                      <td>
                        <div className="c-lanc-v2-title-cell">
                          <strong>{e.description}</strong>
                          {e.notes && <small>{e.notes}</small>}
                          <span>
                            {e.is_fixed && <StatusBadge tone="info" size="sm">Fixo</StatusBadge>}
                            {e.receipt_url && <StatusBadge tone="success" size="sm" icon={<Paperclip />}>Comprovante</StatusBadge>}
                            {e.reconciled && <StatusBadge tone="success" size="sm">Conciliado</StatusBadge>}
                          </span>
                        </div>
                      </td>
                      <td>{e.card && <span className="c-lanc-v2-pill" style={{ '--pill-color': e.card.color }}>{e.card.name}</span>}</td>
                      <td>{e.category && <span className="c-lanc-v2-category">{e.category.icon} {e.category.name}</span>}</td>
                      <td>
                        <div className="c-lanc-v2-split-pills">
                          {e.splits?.map(s => (
                            <span key={s.id} className="c-lanc-v2-pill" style={{ '--pill-color': s.person.color }}>{s.person.name} {fmt(s.amount)}</span>
                          ))}
                        </div>
                      </td>
                      <td className="is-money">{fmt(e.total_amount)}</td>
                      <td onClick={ev => ev.stopPropagation()} className="is-actions">
                        <IconButton icon={<Pencil />} label={`Editar ${e.description}`} variant="secondary" size="sm" onClick={() => { setEditingId(e.id); setShowForm(true) }} />
                        <IconButton icon={<Trash2 />} label={`Excluir ${e.description}`} variant="danger" size="sm" onClick={() => handleDelete(e.id)} disabled={deleting === e.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="c-lanc-v2-mobile-list">
              {filtered.map(e => (
                <article
                  key={e.id}
                  className={`c-lanc-v2-mobile-card ${e.reconciled ? 'is-reconciled' : ''}${draggingId === e.id ? ' is-dragging' : ''}${dragOverId === e.id ? ' is-drag-over' : ''}`}
                  role="button"
                  tabIndex={0}
                  onDragOver={ev => handleDragOver(ev, e.id)}
                  onDrop={ev => handleDrop(ev, e.id)}
                  onClick={() => setSelected(e)}
                  onKeyDown={ev => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault()
                      setSelected(e)
                    }
                  }}
                >
                  <div className="c-lanc-v2-mobile-top">
                    <button
                      type="button"
                      className="c-lanc-v2-drag-handle"
                      draggable
                      aria-label={`Reordenar ${e.description}`}
                      title="Arrastar para reordenar"
                      onClick={ev => ev.stopPropagation()}
                      onDragStart={ev => handleDragStart(ev, e.id)}
                      onDragEnd={() => { setDraggingId(null); setDragOverId(null) }}
                      onKeyDown={ev => handleDragKeyDown(ev, e.id)}
                    >
                      <GripVertical aria-hidden="true" />
                    </button>
                    <button className={`c-lanc-v2-check ${e.reconciled ? 'is-checked' : ''}`} onClick={ev => { ev.stopPropagation(); toggleReconciled(e.id, e.reconciled) }} aria-label={e.reconciled ? 'Desmarcar conciliacao' : 'Marcar como conciliado'} style={{ '--row-color': e.card?.color || 'var(--v2-color-success)' }}>
                      {e.reconciled ? <Check /> : null}
                    </button>
                    <div>
                      <strong>{e.description}</strong>
                      <small>{format(new Date(e.date + 'T12:00:00'), 'dd/MM/yyyy')}{e.card?.name ? ` · ${e.card.name}` : ''}</small>
                    </div>
                    <span>{fmt(e.total_amount)}</span>
                  </div>
                  <div className="c-lanc-v2-mobile-meta">
                    {e.is_fixed && <StatusBadge tone="info" size="sm">Fixo</StatusBadge>}
                    {e.category && <span>{e.category.icon} {e.category.name}</span>}
                    {e.receipt_url && (
                      <a
                        href={e.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="c-lanc-v2-mobile-receipt"
                        onClick={ev => ev.stopPropagation()}
                      >
                        <StatusBadge tone="success" size="sm" icon={<Paperclip />}>Comprovante</StatusBadge>
                      </a>
                    )}
                  </div>
                  {e.splits?.length > 0 && (
                    <div className="c-lanc-v2-split-pills">
                      {e.splits.map(s => <span key={s.id} className="c-lanc-v2-pill" style={{ '--pill-color': s.person.color }}>{s.person.name} {fmt(s.amount)}</span>)}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      {showForm && (
        <div className="c-lanc-v2-modal" role="presentation" onMouseDown={ev => { if (ev.target === ev.currentTarget) setShowForm(false) }}>
          <section className="c-lanc-v2-modal-dialog c-lanc-v2-form-dialog" role="dialog" aria-modal="true" aria-label={editingId ? 'Editar lançamento' : 'Nova compra'}>
            <IconButton className="c-lanc-v2-form-close" icon={<X />} label="Fechar formulário" variant="ghost" size="sm" onClick={() => setShowForm(false)} />
            <NovaCompra
              editId={editingId}
              onSuccess={() => { setShowForm(false); load() }}
              onCancel={() => setShowForm(false)}
            />
          </section>
        </div>
      )}

      {selected && (
        <ExpenseModal
          expense={selected}
          onClose={() => setSelected(null)}
          onEdit={id => { setSelected(null); setEditingId(id); setShowForm(true) }}
          onDelete={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  )

  return (
    <div>
      <div className="c-flex c-items-center c-justify-between c-mb-4">
        <div className="c-page-header" style={{ margin: 0 }}>
          <h2>Lançamentos</h2>
          <p>{filtered.length} registros — {fmt(total)}</p>
        </div>
        <div className="c-flex c-items-center c-gap-2">
          <div className="c-month-nav">
            <button onClick={() => setCurrentDate(d => subMonths(d, 1))}>‹</button>
            <span style={{ textTransform: 'capitalize' }}>{format(currentDate, 'MMM yyyy', { locale: ptBR })}</span>
            <button onClick={() => setCurrentDate(d => addMonths(d, 1))}>›</button>
          </div>
          <button className="c-btn c-btn-primary c-btn-sm" onClick={() => { setEditingId(null); setShowForm(true) }}>+ Nova</button>
        </div>
      </div>

      {/* ── Mini dashboard ─────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>

        {/* Total do mês — sempre fixo */}
        <div style={{
          padding: '16px 20px', borderRadius: 12, marginBottom: 12,
          background: 'var(--c-surface)', border: '1px solid var(--c-border)',
          boxShadow: 'var(--c-shadow)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--c-text-muted)', marginBottom: 6 }}>
            Total do mês
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.5px' }}>
            {fmt(totalMes)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 4 }}>
            {expenses.length} lançamento{expenses.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Carrossel de cartões — aparece quando nenhum filtro está ativo */}
        {!filterCard && totalPorCartao.length > 0 && (
          <div className="c-cards-carousel">
            {totalPorCartao.map(c => (
              <div
                key={c.id}
                className="c-cards-carousel-item"
                onClick={() => setFilterCard(c.id)}
                style={{
                  padding: '16px 20px', borderRadius: 12,
                  background: c.color + '10', border: `1.5px solid ${c.color}30`,
                  boxShadow: 'var(--c-shadow)', cursor: 'pointer',
                  transition: 'transform .15s, box-shadow .15s',
                }}
                onMouseEnter={ev => { ev.currentTarget.style.transform = 'translateY(-2px)'; ev.currentTarget.style.boxShadow = `0 4px 16px ${c.color}30` }}
                onMouseLeave={ev => { ev.currentTarget.style.transform = 'none'; ev.currentTarget.style.boxShadow = 'var(--c-shadow)' }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: c.color, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
                  {c.name}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: c.color, letterSpacing: '-0.5px' }}>
                  {fmt(c.total)}
                </div>
                <div style={{ fontSize: 11, color: c.color, opacity: 0.6, marginTop: 3 }}>
                  {((c.total / totalMes) * 100).toFixed(0)}% do total
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cartão selecionado — só aparece quando um cartão está filtrado */}
        {cartaoSelecionado && (
          <div style={{
            padding: '16px 20px', borderRadius: 12,
            background: cartaoSelecionado.color + '12',
            border: `1.5px solid ${cartaoSelecionado.color}40`,
            boxShadow: 'var(--c-shadow)',
            marginBottom: pessoaSelecionada ? 10 : 0,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: cartaoSelecionado.color, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cartaoSelecionado.color, display: 'inline-block' }} />
              {cartaoSelecionado.name}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: cartaoSelecionado.color, letterSpacing: '-0.5px' }}>
              {fmt(totalCartaoSelecionado)}
            </div>
            <div style={{ fontSize: 12, color: cartaoSelecionado.color, opacity: 0.7, marginTop: 4 }}>
              {expenses.filter(e => e.card_id === filterCard).length} lançamento{expenses.filter(e => e.card_id === filterCard).length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Total da pessoa selecionada */}
        {pessoaSelecionada && (
          <div style={{
            padding: '16px 20px', borderRadius: 12,
            background: pessoaSelecionada.color + '12',
            border: `1.5px solid ${pessoaSelecionada.color}40`,
            boxShadow: 'var(--c-shadow)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: pessoaSelecionada.color, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: pessoaSelecionada.color, display: 'inline-block' }} />
              {pessoaSelecionada.name}{cartaoSelecionado ? ` · ${cartaoSelecionado.name}` : ''}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: pessoaSelecionada.color, letterSpacing: '-0.5px' }}>
              {fmt(totalPessoa)}
            </div>
            <div style={{ fontSize: 12, color: pessoaSelecionada.color, opacity: 0.7, marginTop: 4 }}>
              {lancamentosPessoa} lançamento{lancamentosPessoa !== 1 ? 's' : ''}
              {totalCartaoSelecionado > 0 && (
                <span style={{ marginLeft: 8 }}>
                  · {((totalPessoa / totalCartaoSelecionado) * 100).toFixed(0)}% do cartão
                </span>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Filtros */}
      <div className="c-card c-mb-4">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label className="c-form-label">Buscar</label>
            <input type="text" className="c-form-input" placeholder="Descrição..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="c-form-label">Cartão</label>
            <select className="c-form-select" value={filterCard} onChange={e => setFilterCard(e.target.value)}>
              <option value="">Todos</option>
              {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="c-form-label">Pessoa</label>
            <select className="c-form-select" value={filterPerson} onChange={e => setFilterPerson(e.target.value)}>
              <option value="">Todas</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="c-form-label">Tipo</label>
            <select className="c-form-select" value={filterFixed} onChange={e => setFilterFixed(e.target.value)}>
              <option value="">Todos</option>
              <option value="fixed">Fixos</option>
              <option value="variable">Variáveis</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="c-loading-screen" style={{ height: '40vh' }}><div className="c-loading-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="c-card">
          <div className="c-empty-state">
            <div className="c-empty-icon">📋</div>
            <h3>Nenhum lançamento encontrado</h3>
            <p>Tente ajustar os filtros ou adicione uma nova compra.</p>
          </div>
        </div>
      ) : (
        <div className="c-card" style={{ padding: 0 }}>
          <div className="c-table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 36, textAlign: 'center' }}>
                    <button
                      onClick={toggleAll}
                      title={allReconciled ? 'Desmarcar todos' : 'Marcar todos como conciliados'}
                      style={{
                        width: 22, height: 22, borderRadius: 6,
                        border: `2px solid ${allReconciled || someReconciled ? '#10b981' : '#d1d5db'}`,
                        background: allReconciled ? '#10b981' : 'transparent',
                        color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s', flexShrink: 0,
                      }}
                    >
                      {allReconciled ? '✓' : someReconciled ? '−' : ''}
                    </button>
                  </th>
                  <th>Data</th><th>Descrição</th><th>Cartão</th><th>Categoria</th><th>Pessoas</th>
                  <th style={{ textAlign: 'right' }}>Total</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr
                    key={e.id}
                    onClick={() => setSelected(e)}
                    style={{
                      cursor: 'pointer',
                      background: e.reconciled ? ((e.card?.color ?? '#10b981') + '18') : undefined,
                      transition: 'background 0.2s',
                    }}
                    className="c-table-row-hover"
                  >
                    <td onClick={ev => ev.stopPropagation()} style={{ textAlign: 'center', paddingRight: 0 }}>
                      <button
                        onClick={() => toggleReconciled(e.id, e.reconciled)}
                        title={e.reconciled ? 'Desmarcar conciliacao' : 'Marcar como conciliado'}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          border: `2px solid ${e.reconciled ? (e.card?.color ?? '#10b981') : '#d1d5db'}`,
                          background: e.reconciled ? (e.card?.color ?? '#10b981') : 'transparent',
                          color: '#fff',
                          fontWeight: 900,
                          fontSize: 13,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s',
                          flexShrink: 0,
                        }}
                      >
                        {e.reconciled ? '✓' : ''}
                      </button>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--c-text-muted)', fontSize: 12 }}>
                      {format(new Date(e.date + 'T12:00:00'), 'dd/MM/yy')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{e.description}</div>
                      {e.notes && <div className="c-text-muted c-text-sm">{e.notes}</div>}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                        {e.is_fixed && <span className="c-chip c-badge-info" style={{ fontSize: 10 }}>FIXO</span>}
                        {e.receipt_url && <span style={{ fontSize: 10, color: '#16a34a' }}>📎</span>}
                      </div>
                    </td>
                    <td>
                      {e.card && <span className="c-chip" style={{ background: e.card.color + '20', color: e.card.color }}>{e.card.name}</span>}
                    </td>
                    <td>{e.category && <span className="c-text-sm">{e.category.icon} {e.category.name}</span>}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {e.splits?.map(s => (
                          <span key={s.id} className="c-chip" style={{ background: s.person.color + '20', color: s.person.color, fontSize: 11 }}>
                            {s.person.name} {fmt(s.amount)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{fmt(e.total_amount)}</td>
                    <td onClick={ev => ev.stopPropagation()}>
                      <div className="c-flex c-gap-2">
                        <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => { setEditingId(e.id); setShowForm(true) }}>✏️</button>
                        <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(e.id)} disabled={deleting === e.id}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nova / Editar Compra */}
      {showForm && (
        <div
          onClick={() => setShowForm(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: 'rgba(0,0,0,.45)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '24px 16px',
            overflowY: 'auto',
          }}
        >
          <div
            onClick={ev => ev.stopPropagation()}
            style={{
              background: 'var(--c-bg)', borderRadius: 16,
              width: '100%', maxWidth: 700,
              boxShadow: '0 20px 60px rgba(0,0,0,.3)',
              padding: '8px 24px 24px',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowForm(false)}
              style={{
                position: 'absolute', top: 12, right: 16,
                background: 'none', border: 'none',
                color: 'var(--c-text-muted)', fontSize: 22,
                cursor: 'pointer', lineHeight: 1, padding: 4,
              }}
            >✕</button>
            <NovaCompra
              editId={editingId}
              onSuccess={() => { setShowForm(false); load() }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Modal de detalhes */}
      {selected && (
        <ExpenseModal
          expense={selected}
          onClose={() => setSelected(null)}
          onEdit={id => { setSelected(null); setEditingId(id); setShowForm(true) }}
          onDelete={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  )
}
