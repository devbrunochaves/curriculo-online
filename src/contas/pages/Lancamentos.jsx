import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { format, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

const fmt = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'

export default function Lancamentos() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [expenses, setExpenses] = useState([])
  const [cards, setCards]       = useState([])
  const [people, setPeople]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [filterCard, setFilterCard]     = useState('')
  const [filterPerson, setFilterPerson] = useState('')
  const [filterFixed, setFilterFixed]   = useState('')
  const [search, setSearch]             = useState('')
  const [deleting, setDeleting]         = useState(null)

  const monthRef = format(currentDate, 'yyyy-MM')

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: exp }, { data: c }, { data: p }] = await Promise.all([
      supabase.from('expenses').select('*, card:cards(*), category:categories(*), splits:expense_splits(*, person:people(*))').eq('month_ref', monthRef).order('date', { ascending: false }),
      supabase.from('cards').select('*').eq('is_active', true),
      supabase.from('people').select('*').eq('is_active', true),
    ])
    setExpenses(exp || []); setCards(c || []); setPeople(p || [])
    setLoading(false)
  }, [monthRef])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!confirm('Excluir este lançamento?')) return
    setDeleting(id)
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
    setDeleting(null)
  }

  let filtered = expenses
  if (filterCard)   filtered = filtered.filter(e => e.card_id === filterCard)
  if (filterFixed)  filtered = filtered.filter(e => filterFixed === 'fixed' ? e.is_fixed : !e.is_fixed)
  if (filterPerson) filtered = filtered.filter(e => e.splits?.some(s => s.person_id === filterPerson))
  if (search)       filtered = filtered.filter(e => e.description.toLowerCase().includes(search.toLowerCase()))

  const total = filtered.reduce((s, e) => s + Number(e.total_amount), 0)

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
                  <th>Data</th><th>Descrição</th><th>Cartão</th><th>Categoria</th><th>Pessoas</th>
                  <th style={{ textAlign: 'right' }}>Total</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--c-text-muted)', fontSize: 12 }}>
                      {format(new Date(e.date + 'T12:00:00'), 'dd/MM/yy')}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{e.description}</div>
                      {e.notes && <div className="c-text-muted c-text-sm">{e.notes}</div>}
                      {e.is_fixed && <span className="c-chip c-badge-info" style={{ fontSize: 10 }}>FIXO</span>}
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
                    <td>
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
    </div>
  )
}
