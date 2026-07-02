import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { format, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

const fmt = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'

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
  const [search, setSearch]             = useState('')
  const [deleting, setDeleting]         = useState(null)
  const [selected, setSelected]         = useState(null)  // expense aberta no modal

  const monthRef = format(currentDate, 'yyyy-MM')

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
          <button className="c-btn c-btn-primary c-btn-sm" onClick={() => navigate('/contas/nova')}>+ Nova</button>
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
                      background: e.reconciled ? 'rgba(16,185,129,0.07)' : undefined,
                      transition: 'background 0.2s',
                    }}
                    className="c-table-row-hover"
                  >
                    <td onClick={ev => ev.stopPropagation()} style={{ textAlign: 'center', paddingRight: 0 }}>
                      <button
                        onClick={() => toggleReconciled(e.id, e.reconciled)}
                        title={e.reconciled ? 'Desmarcar conciliação' : 'Marcar como conciliado'}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          border: `2px solid ${e.reconciled ? '#10b981' : '#d1d5db'}`,
                          background: e.reconciled ? '#10b981' : 'transparent',
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
                        <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => navigate(`/contas/nova?edit=${e.id}`)}>✏️</button>
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

      {/* Modal de detalhes */}
      {selected && (
        <ExpenseModal
          expense={selected}
          onClose={() => setSelected(null)}
          onEdit={id => navigate(`/contas/nova?edit=${id}`)}
          onDelete={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  )
}
