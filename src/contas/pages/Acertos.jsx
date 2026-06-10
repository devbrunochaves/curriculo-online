import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { format, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const fmt = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 12px', fontSize: 14,
  border: '1.5px solid #d1d5db', borderRadius: 10,
  background: '#f9fafb', color: '#111827',
  outline: 'none', fontFamily: 'inherit', appearance: 'auto',
}
const dateInputStyle = {
  ...inputStyle, WebkitAppearance: 'none', appearance: 'none',
  fontSize: 13, padding: '10px 10px', display: 'block', overflow: 'hidden',
}
const labelStyle = {
  fontSize: 12, fontWeight: 600, color: 'var(--c-text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.4px',
}

/* ── Modal de pagamento ────────────────────────────────────────── */
function ModalPagamento({ pd, monthRef, onClose, onSaved }) {
  const pendingItems = pd.allItems.filter(i => i.falta > 0)
  const firstKey = pendingItems[0] ? `${pendingItems[0].type}:${pendingItems[0].key}` : ''

  const [selectedKey, setSelectedKey] = useState(firstKey)
  const [valor, setValor] = useState(pendingItems[0] ? pendingItems[0].falta.toFixed(2) : '')
  const [data, setData]   = useState(format(new Date(), 'yyyy-MM-dd'))
  const [obs, setObs]     = useState('')
  const [saving, setSaving] = useState(false)

  function handleChange(key) {
    setSelectedKey(key)
    const [type, id] = key.split(':')
    const item = pd.allItems.find(i => i.type === type && i.key === id)
    if (item) setValor(Math.max(0, item.falta).toFixed(2))
  }

  async function save() {
    if (!selectedKey || !valor || !data) return
    setSaving(true)
    const [type, id] = selectedKey.split(':')
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('acertos').insert({
      user_id: user.id,
      pessoa_id: pd.pessoa.id,
      card_id: type === 'card' ? id : null,
      bill_entry_id: type === 'bill' ? id : null,
      valor: parseFloat(valor),
      data,
      mes_ref: monthRef,
      observacao: obs || null,
    })
    setSaving(false)
    onSaved(); onClose()
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const selectedItem = (() => {
    if (!selectedKey) return null
    const [type, id] = selectedKey.split(':')
    return pd.allItems.find(i => i.type === type && i.key === id)
  })()

  return (
    <div className="c-modal-overlay" onClick={onClose} style={{ alignItems: 'center', padding: '20px' }}>
      <div className="c-modal-sheet" onClick={e => e.stopPropagation()} style={{ borderRadius: 16, width: '100%', maxWidth: 420 }}>
        <div className="c-modal-header">
          <div>
            <div className="c-modal-title">Registrar Pagamento</div>
            <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 2 }}>{pd.pessoa.name}</div>
          </div>
          <button className="c-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="c-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Origem (cartão ou conta fixa) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={labelStyle}>Cartão / Conta Fixa</span>
            <select value={selectedKey} onChange={e => handleChange(e.target.value)} style={inputStyle}>
              <option value="">Selecione...</option>
              {pd.cardItems.length > 0 && (
                <optgroup label="💳 Cartões">
                  {pd.cardItems.map(item => (
                    <option key={item.key} value={`card:${item.key}`}>
                      {item.name} — falta {fmt(Math.max(0, item.falta))}
                    </option>
                  ))}
                </optgroup>
              )}
              {pd.billItems.length > 0 && (
                <optgroup label="🏠 Contas Fixas">
                  {pd.billItems.map(item => (
                    <option key={item.key} value={`bill:${item.key}`}>
                      {item.name} — falta {fmt(Math.max(0, item.falta))}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {selectedItem && (
              <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
                Total devido:{' '}
                <strong style={{ color: selectedItem.color }}>{fmt(selectedItem.totalDevido)}</strong>
              </div>
            )}
          </div>

          {/* Valor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={labelStyle}>Valor recebido (R$)</span>
            <input type="number" value={valor} onChange={e => setValor(e.target.value)} min="0" step="0.01" placeholder="0,00" style={inputStyle} />
          </div>

          {/* Data */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={labelStyle}>Data do recebimento</span>
            <input type="date" value={data} onChange={e => setData(e.target.value)} style={dateInputStyle} />
          </div>

          {/* Observação */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={labelStyle}>Observação (opcional)</span>
            <input type="text" value={obs} onChange={e => setObs(e.target.value)} placeholder="Ex: Pix recebido" style={inputStyle} />
          </div>
        </div>

        <div className="c-modal-footer">
          <button className="c-btn c-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="c-btn c-btn-primary" onClick={save} disabled={saving || !selectedKey || !valor}>
            {saving ? 'Salvando...' : '✓ Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Histórico de pagamentos registrados ───────────────────────── */
function HistoricoAcertos({ acertos, cards, billEntries, onDelete }) {
  if (!acertos.length) return null
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
        Pagamentos registrados
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {acertos.map(ac => {
          const card  = cards.find(c => c.id === ac.card_id)
          const entry = billEntries.find(e => e.id === ac.bill_entry_id)
          const nome  = card?.name || entry?.bill?.name || '—'
          const icon  = card ? '💳' : '🏠'
          return (
            <div key={ac.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderRadius: 8, background: '#16a34a12', border: '1px solid #16a34a30' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>✓</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)' }}>{icon} {nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>
                    {format(new Date(ac.data + 'T12:00:00'), 'dd/MM/yyyy')}
                    {ac.observacao ? ` · ${ac.observacao}` : ''}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 14 }}>{fmt(ac.valor)}</span>
                <button onClick={() => onDelete(ac.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--c-text-muted)', padding: '0 2px' }} title="Desfazer">✕</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Linha de item (cartão ou conta fixa) ──────────────────────── */
function ItemRow({ item }) {
  const pago = item.falta <= 0
  const cor  = pago ? '#16a34a' : item.color
  const icon = item.type === 'bill' ? '🏠' : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 10, background: pago ? '#16a34a08' : item.color + '08', border: `1px solid ${pago ? '#16a34a25' : item.color + '25'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon
          ? <span style={{ fontSize: 14 }}>{icon}</span>
          : <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
        }
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)' }}>{item.name}</div>
          {item.totalPago > 0 && <div style={{ fontSize: 11, color: '#16a34a' }}>pago {fmt(item.totalPago)}</div>}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: pago ? '#16a34a' : 'var(--c-text)' }}>{fmt(item.totalDevido)}</div>
        {!pago && <div style={{ fontSize: 11, color: '#ef4444' }}>falta {fmt(item.falta)}</div>}
        {pago  && <div style={{ fontSize: 11, color: '#16a34a' }}>✓ quitado</div>}
      </div>
    </div>
  )
}

/* ── Página principal ──────────────────────────────────────────── */
export default function Acertos() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [expenses, setExpenses]       = useState([])
  const [billEntries, setBillEntries] = useState([])
  const [cards, setCards]             = useState([])
  const [people, setPeople]           = useState([])
  const [acertos, setAcertos]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [modalPd, setModalPd]         = useState(null)

  const monthRef   = format(currentDate, 'yyyy-MM')
  const monthLabel = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })

  const load = useCallback(async () => {
    setLoading(true)

    // Gera entradas do mês se ainda não existirem (igual ao ContasFixas)
    const { data: allBills } = await supabase
      .from('recurring_bills').select('id, default_amount').eq('is_active', true)
    if (allBills?.length) {
      const { data: existing } = await supabase
        .from('bill_entries').select('bill_id').eq('month_ref', monthRef)
      const existingIds = new Set((existing || []).map(e => e.bill_id))
      const toCreate = allBills
        .filter(b => !existingIds.has(b.id))
        .map(b => ({ bill_id: b.id, month_ref: monthRef, amount: b.default_amount ?? 0 }))
      if (toCreate.length) {
        const { data: created } = await supabase.from('bill_entries').insert(toCreate).select()
        if (created?.length) {
          const prevRef = format(subMonths(new Date(monthRef + '-01'), 1), 'yyyy-MM')
          const { data: prev } = await supabase
            .from('bill_entries')
            .select('id, bill_id, splits:bill_entry_splits(person_id, amount)')
            .eq('month_ref', prevRef)
            .in('bill_id', created.map(e => e.bill_id))
          const toCopy = []
          for (const entry of created) {
            const p = prev?.find(e => e.bill_id === entry.bill_id)
            p?.splits?.forEach(s => toCopy.push({ entry_id: entry.id, person_id: s.person_id, amount: s.amount }))
          }
          if (toCopy.length) await supabase.from('bill_entry_splits').insert(toCopy)
        }
      }
    }

    const [{ data: exp }, { data: bills }, { data: c }, { data: p }, { data: ac }] = await Promise.all([
      supabase.from('expenses')
        .select('*, splits:expense_splits(*, person:people(*))')
        .eq('month_ref', monthRef),
      supabase.from('bill_entries')
        .select('*, bill:recurring_bills(name, person_id), splits:bill_entry_splits(person_id, amount)')
        .eq('month_ref', monthRef),
      supabase.from('cards').select('*').eq('is_active', true),
      supabase.from('people').select('*').eq('is_active', true),
      supabase.from('acertos').select('*').eq('mes_ref', monthRef),
    ])
    setExpenses(exp || [])
    setBillEntries(bills || [])
    setCards(c || [])
    setPeople(p || [])
    setAcertos(ac || [])
    setLoading(false)
  }, [monthRef])

  useEffect(() => { load() }, [load])

  async function deleteAcerto(id) {
    if (!confirm('Desfazer este pagamento?')) return
    await supabase.from('acertos').delete().eq('id', id)
    setAcertos(prev => prev.filter(a => a.id !== id))
  }

  // ── Cálculo por pessoa ───────────────────────────────────────────
  const pessoaData = people.map(pessoa => {
    // Splits por cartão
    const splitsByCard = {}
    for (const expense of expenses) {
      if (!expense.card_id) continue
      const split = (expense.splits || []).find(s => s.person_id === pessoa.id)
      if (!split) continue
      splitsByCard[expense.card_id] = (splitsByCard[expense.card_id] || 0) + Number(split.amount || 0)
    }

    // Splits por conta fixa (split multi-pessoa OU atribuição direta via person_id)
    const splitsByBill = {}
    for (const entry of billEntries) {
      const entryAmount = Number(entry.amount || 0)
      const multiSplit = (entry.splits || []).find(s => s.person_id === pessoa.id)
      if (multiSplit) {
        splitsByBill[entry.id] = (splitsByBill[entry.id] || 0) + Number(multiSplit.amount || 0)
      } else if (entry.bill?.person_id === pessoa.id) {
        splitsByBill[entry.id] = (splitsByBill[entry.id] || 0) + entryAmount
      }
    }

    // Acertos registrados
    const pessoaAcertos  = acertos.filter(a => a.pessoa_id === pessoa.id)
    const acertosByCard  = {}
    const acertosByBill  = {}
    for (const ac of pessoaAcertos) {
      if (ac.card_id)        acertosByCard[ac.card_id]        = (acertosByCard[ac.card_id]        || 0) + Number(ac.valor || 0)
      if (ac.bill_entry_id)  acertosByBill[ac.bill_entry_id]  = (acertosByBill[ac.bill_entry_id]  || 0) + Number(ac.valor || 0)
    }

    const cardItems = Object.entries(splitsByCard).map(([cardId, totalDevido]) => {
      const card      = cards.find(c => c.id === cardId)
      const totalPago = acertosByCard[cardId] || 0
      const falta     = Math.round((totalDevido - totalPago) * 100) / 100
      return { type: 'card', key: cardId, name: card?.name, color: card?.color || '#6366f1', totalDevido, totalPago, falta }
    }).filter(i => i.name).sort((a, b) => b.totalDevido - a.totalDevido)

    const billItems = Object.entries(splitsByBill).map(([entryId, totalDevido]) => {
      const entry     = billEntries.find(e => e.id === entryId)
      const totalPago = acertosByBill[entryId] || 0
      const falta     = Math.round((totalDevido - totalPago) * 100) / 100
      return { type: 'bill', key: entryId, name: entry?.bill?.name, color: '#f59e0b', totalDevido, totalPago, falta }
    }).filter(i => i.name).sort((a, b) => b.totalDevido - a.totalDevido)

    const allItems    = [...cardItems, ...billItems]
    const totalDevido = allItems.reduce((s, i) => s + i.totalDevido, 0)
    const totalPago   = allItems.reduce((s, i) => s + i.totalPago, 0)
    const totalFalta  = allItems.reduce((s, i) => s + Math.max(0, i.falta), 0)

    return { pessoa, allItems, cardItems, billItems, totalDevido, totalPago, totalFalta, status: totalFalta <= 0 ? 'quitado' : 'pendente', pessoaAcertos }
  }).filter(pd => pd.totalDevido > 0)

  const totalGeral    = pessoaData.reduce((s, pd) => s + pd.totalDevido, 0)
  const totalQuitado  = pessoaData.reduce((s, pd) => s + pd.totalPago, 0)
  const totalPendente = pessoaData.reduce((s, pd) => s + pd.totalFalta, 0)
  const qtdQuitados   = pessoaData.filter(pd => pd.status === 'quitado').length

  if (loading) return (
    <div className="c-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ textAlign: 'center', color: 'var(--c-text-muted)' }}>
        <div className="c-loading-spinner" style={{ margin: '0 auto 12px' }} />
        <div>Carregando acertos...</div>
      </div>
    </div>
  )

  return (
    <div className="c-page">

      {/* ── Cabeçalho ─────────────────────────────────────────── */}
      <div className="c-page-header">
        <div>
          <h1 className="c-page-title">🤝 Acertos</h1>
          <p className="c-page-subtitle">Controle de quitação entre pessoas</p>
        </div>
      </div>

      {/* ── Navegação de mês ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24, background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '12px 20px' }}>
        <button className="c-btn c-btn-secondary" style={{ padding: '6px 14px', fontSize: 18 }} onClick={() => setCurrentDate(d => subMonths(d, 1))}>‹</button>
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-text)', textTransform: 'capitalize', minWidth: 200, textAlign: 'center' }}>{monthLabel}</span>
        <button className="c-btn c-btn-secondary" style={{ padding: '6px 14px', fontSize: 18 }} onClick={() => setCurrentDate(d => addMonths(d, 1))}>›</button>
      </div>

      {/* ── Cards de resumo ───────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="c-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Total a receber</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--c-text)' }}>{fmt(totalGeral)}</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 3 }}>{pessoaData.length} pessoa{pessoaData.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="c-card" style={{ padding: '14px 16px', borderColor: '#16a34a40' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Já quitado</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>{fmt(totalQuitado)}</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 3 }}>{qtdQuitados} quitada{qtdQuitados !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div className="c-card" style={{ padding: '14px 16px', borderColor: totalPendente > 0 ? '#ef444440' : '#16a34a40' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: totalPendente > 0 ? '#ef4444' : '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Pendente</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: totalPendente > 0 ? '#ef4444' : '#16a34a' }}>{fmt(totalPendente)}</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 3 }}>
            {pessoaData.filter(pd => pd.status === 'pendente').length} pendente{pessoaData.filter(pd => pd.status === 'pendente').length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* ── Lista de pessoas ──────────────────────────────────── */}
      {pessoaData.length === 0 ? (
        <div className="c-card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Nenhum acerto neste mês</div>
          <div style={{ color: 'var(--c-text-muted)', fontSize: 14 }}>Não há divisões registradas em {monthLabel}.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pessoaData.map(pd => {
            const isQuitado = pd.status === 'quitado'
            const cor = pd.pessoa.color || '#6366f1'
            const pct = pd.totalDevido > 0 ? Math.min(100, (pd.totalPago / pd.totalDevido) * 100) : 100
            const nCartoes = pd.cardItems.length
            const nFixas   = pd.billItems.length
            const subtitle = [
              nCartoes > 0 && `${nCartoes} cartão${nCartoes !== 1 ? 'ões' : ''}`,
              nFixas   > 0 && `${nFixas} conta${nFixas !== 1 ? 's' : ''} fixa${nFixas !== 1 ? 's' : ''}`,
            ].filter(Boolean).join(', ')

            return (
              <div key={pd.pessoa.id} className="c-card" style={{ padding: 0, overflow: 'hidden', border: `1px solid ${isQuitado ? '#16a34a30' : cor + '30'}` }}>
                {/* Barra de progresso */}
                <div style={{ height: 4, background: 'var(--c-border)' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: isQuitado ? '#16a34a' : cor, transition: 'width .4s ease', borderRadius: '0 2px 2px 0' }} />
                </div>

                <div style={{ padding: '16px 18px' }}>
                  {/* Cabeçalho */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: cor + '20', border: `2px solid ${cor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: cor, flexShrink: 0 }}>
                        {pd.pessoa.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--c-text)' }}>{pd.pessoa.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{subtitle}</div>
                      </div>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: isQuitado ? '#16a34a15' : '#ef444415', color: isQuitado ? '#16a34a' : '#ef4444', border: `1px solid ${isQuitado ? '#16a34a30' : '#ef444430'}` }}>
                      {isQuitado ? '✓ Quitado' : '● Pendente'}
                    </div>
                  </div>

                  {/* Itens pendentes (cartões + contas fixas) — quitados somem daqui */}
                  {pd.allItems.some(i => i.falta > 0) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                      {pd.allItems.filter(i => i.falta > 0).map(item => <ItemRow key={`${item.type}:${item.key}`} item={item} />)}
                    </div>
                  )}

                  {/* Totalizador */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'var(--c-bg)', border: '1px solid var(--c-border)', marginBottom: pd.pessoaAcertos.length > 0 ? 14 : 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
                      Total: <strong style={{ color: 'var(--c-text)' }}>{fmt(pd.totalDevido)}</strong>
                      {'  ·  '}
                      Pago: <strong style={{ color: '#16a34a' }}>{fmt(pd.totalPago)}</strong>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: pd.totalFalta > 0 ? '#ef4444' : '#16a34a' }}>
                      {pd.totalFalta > 0 ? `Falta ${fmt(pd.totalFalta)}` : '✓ Quitado'}
                    </div>
                  </div>

                  {/* Histórico */}
                  <HistoricoAcertos acertos={pd.pessoaAcertos} cards={cards} billEntries={billEntries} onDelete={deleteAcerto} />

                  {/* Botão registrar */}
                  {!isQuitado && (
                    <button className="c-btn c-btn-primary" style={{ width: '100%', marginTop: 14 }} onClick={() => setModalPd(pd)}>
                      + Registrar Pagamento
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal ─────────────────────────────────────────────── */}
      {modalPd && (
        <ModalPagamento pd={modalPd} monthRef={monthRef} onClose={() => setModalPd(null)} onSaved={load} />
      )}
    </div>
  )
}
