import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CATS = [
  { value: 'financeira',  label: 'Financeira',  icon: '💰' },
  { value: 'apartamento', label: 'Apartamento', icon: '🏠' },
  { value: 'viagem',      label: 'Viagem',      icon: '✈️' },
  { value: 'familia',     label: 'Família',     icon: '👨‍👩‍👧' },
  { value: 'saude',       label: 'Saúde',       icon: '💊' },
  { value: 'estudos',     label: 'Estudos',     icon: '📚' },
  { value: 'trabalho',    label: 'Trabalho',    icon: '💼' },
  { value: 'pessoal',     label: 'Pessoal',     icon: '🌟' },
  { value: 'emergencia',  label: 'Emergência',  icon: '🚨' },
  { value: 'outros',      label: 'Outros',      icon: '📦' },
]

const STATUSES = [
  { value: 'planejada',  label: 'Planejada',    color: '#64748b' },
  { value: 'andamento',  label: 'Em andamento', color: '#6366f1' },
  { value: 'pausada',    label: 'Pausada',      color: '#f59e0b' },
  { value: 'concluida',  label: 'Concluída',    color: '#16a34a' },
  { value: 'cancelada',  label: 'Cancelada',    color: '#dc2626' },
]

const PRIS = [
  { value: 'baixa', label: 'Baixa', color: '#10b981' },
  { value: 'media', label: 'Média', color: '#f59e0b' },
  { value: 'alta',  label: 'Alta',  color: '#dc2626' },
]

const CORES = ['#6366f1','#ec4899','#f97316','#10b981','#f59e0b','#dc2626','#3b82f6','#8b5cf6','#14b8a6','#06b6d4']
const ICONES = ['🎯','💰','🏠','✈️','👨‍👩‍👧','💊','📚','💼','🌟','🚨','🚗','🎓','🏋️','🏖️','🎸','💡','🌱','⭐','🐶','🎁']

const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function calcMeta(m) {
  const pct = m.valor_objetivo > 0 ? Math.min(100, (m.valor_atual / m.valor_objetivo) * 100) : 0
  const restante = Math.max(0, Number(m.valor_objetivo || 0) - Number(m.valor_atual || 0))
  const diasRestantes = m.data_limite ? differenceInDays(parseISO(m.data_limite), new Date()) : null
  const porMes = diasRestantes !== null && diasRestantes > 0 ? restante / (diasRestantes / 30) : null
  const porSemana = diasRestantes !== null && diasRestantes > 0 ? restante / (diasRestantes / 7) : null
  return { pct, restante, diasRestantes, porMes, porSemana }
}

function accentFor(meta) {
  if (meta.status === 'concluida') return '#16a34a'
  if (meta.status === 'cancelada') return '#94a3b8'
  if (meta.data_limite) {
    const d = differenceInDays(parseISO(meta.data_limite), new Date())
    if (d < 0)  return '#dc2626'
    if (d < 30) return '#f59e0b'
  }
  return meta.cor || '#6366f1'
}

const BLANK = {
  nome: '', descricao: '', categoria: 'financeira',
  valor_objetivo: '', valor_atual: '0',
  data_inicio: format(new Date(), 'yyyy-MM-dd'), data_limite: '',
  status: 'andamento', prioridade: 'media',
  cor: '#6366f1', icone: '🎯', observacoes: '',
}

/* ── Small reusable pieces ────────────────────────────────────────── */
function ModalShell({ title, onClose, onSave, saving, children }) {
  return (
    <div className="c-modal-overlay" onClick={onClose}>
      <div className="c-modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="c-modal-header">
          <h3 className="c-modal-title">{title}</h3>
          <button className="c-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="c-modal-body">{children}</div>
        {onSave && (
          <div className="c-modal-footer">
            <button className="c-btn c-btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="c-btn c-btn-primary" onClick={onSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="c-form-group">
      <label className="c-form-label">{label}</label>
      {children}
    </div>
  )
}

function Bar({ pct, color }) {
  return (
    <div style={{ height: 8, borderRadius: 4, background: '#e2e8f0', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, borderRadius: 4, background: color || '#6366f1', transition: 'width .4s' }} />
    </div>
  )
}

function SBadge({ status }) {
  const s = STATUSES.find(x => x.value === status) || STATUSES[0]
  return <span style={{ background: s.color + '20', color: s.color, border: `1px solid ${s.color}40`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.label}</span>
}

function PBadge({ prioridade }) {
  const p = PRIS.find(x => x.value === prioridade) || PRIS[1]
  return <span style={{ background: p.color + '20', color: p.color, border: `1px solid ${p.color}40`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{p.label}</span>
}

function DateInput({ value, onChange }) {
  return (
    <input type="date" value={value} onChange={onChange}
      style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 16, color: 'var(--c-text)', background: 'var(--c-surface)', fontFamily: 'inherit' }} />
  )
}

/* ══ Main Component ═══════════════════════════════════════════════ */
export default function Metas() {
  const [metas, setMetas]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCat, setFilterCat]     = useState('all')
  const [filterPri, setFilterPri]     = useState('all')
  const [sortBy, setSortBy]           = useState('prazo')
  const [showForm, setShowForm]       = useState(false)
  const [editingMeta, setEditingMeta] = useState(null)
  const [detailMeta, setDetailMeta]   = useState(null)
  const [aportes, setAportes]         = useState([])
  const [aLoading, setALoading]       = useState(false)
  const [showAporte, setShowAporte]   = useState(false)
  const [form, setForm]               = useState(BLANK)
  const [aForm, setAForm]             = useState({ valor: '', data: format(new Date(), 'yyyy-MM-dd'), observacao: '' })
  const [saving, setSaving]           = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('metas').select('*').order('created_at', { ascending: false })
    setMetas(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function loadAportes(metaId) {
    setALoading(true)
    const { data } = await supabase.from('metas_aportes').select('*').eq('meta_id', metaId).order('data', { ascending: false })
    setAportes(data || [])
    setALoading(false)
  }

  /* ── Derived ──────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...metas]
    if (filterStatus !== 'all') list = list.filter(m => m.status === filterStatus)
    if (filterCat    !== 'all') list = list.filter(m => m.categoria === filterCat)
    if (filterPri    !== 'all') list = list.filter(m => m.prioridade === filterPri)
    const priOrder = { alta: 0, media: 1, baixa: 2 }
    switch (sortBy) {
      case 'prazo':
        list.sort((a, b) => !a.data_limite ? 1 : !b.data_limite ? -1 : a.data_limite.localeCompare(b.data_limite)); break
      case 'pct_asc':
        list.sort((a, b) => (a.valor_objetivo > 0 ? a.valor_atual / a.valor_objetivo : 0) - (b.valor_objetivo > 0 ? b.valor_atual / b.valor_objetivo : 0)); break
      case 'pct_desc':
        list.sort((a, b) => (b.valor_objetivo > 0 ? b.valor_atual / b.valor_objetivo : 0) - (a.valor_objetivo > 0 ? a.valor_atual / a.valor_objetivo : 0)); break
      case 'valor':
        list.sort((a, b) => b.valor_objetivo - a.valor_objetivo); break
      case 'prioridade':
        list.sort((a, b) => (priOrder[a.prioridade] ?? 1) - (priOrder[b.prioridade] ?? 1)); break
    }
    return list
  }, [metas, filterStatus, filterCat, filterPri, sortBy])

  const stats = useMemo(() => {
    const proxima = metas.filter(m => m.data_limite && m.status !== 'concluida' && m.status !== 'cancelada')
      .sort((a, b) => a.data_limite.localeCompare(b.data_limite))[0]
    return {
      total:      metas.length,
      andamento:  metas.filter(m => m.status === 'andamento').length,
      concluidas: metas.filter(m => m.status === 'concluida').length,
      valorObj:   metas.reduce((s, m) => s + Number(m.valor_objetivo || 0), 0),
      valorAcum:  metas.reduce((s, m) => s + Number(m.valor_atual    || 0), 0),
      proxima,
    }
  }, [metas])

  /* ── Form helpers ─────────────────────────────────────────────── */
  function openAdd()  { setForm(BLANK); setEditingMeta(null); setShowForm(true) }
  function openEdit(meta) {
    setForm({
      nome: meta.nome || '', descricao: meta.descricao || '',
      categoria: meta.categoria || 'financeira',
      valor_objetivo: meta.valor_objetivo ? String(meta.valor_objetivo).replace('.', ',') : '',
      valor_atual:    meta.valor_atual    ? String(meta.valor_atual).replace('.', ',')    : '0',
      data_inicio: meta.data_inicio || '', data_limite: meta.data_limite || '',
      status: meta.status || 'andamento', prioridade: meta.prioridade || 'media',
      cor: meta.cor || '#6366f1', icone: meta.icone || '🎯',
      observacoes: meta.observacoes || '',
    })
    setEditingMeta(meta); setShowForm(true); setDetailMeta(null)
  }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function saveMeta() {
    if (!form.nome.trim()) return
    setSaving(true)
    const payload = {
      nome: form.nome.trim(), descricao: form.descricao.trim() || null,
      categoria: form.categoria,
      valor_objetivo: form.valor_objetivo ? parseFloat(String(form.valor_objetivo).replace(',', '.')) : 0,
      valor_atual:    form.valor_atual    ? parseFloat(String(form.valor_atual).replace(',', '.'))    : 0,
      data_inicio: form.data_inicio || null, data_limite: form.data_limite || null,
      status: form.status, prioridade: form.prioridade,
      cor: form.cor, icone: form.icone,
      observacoes: form.observacoes.trim() || null,
    }
    if (editingMeta) await supabase.from('metas').update(payload).eq('id', editingMeta.id)
    else             await supabase.from('metas').insert(payload)
    setSaving(false); setShowForm(false); load()
  }

  async function deleteMeta(id) {
    if (!confirm('Excluir esta meta? Esta ação não pode ser desfeita.')) return
    await supabase.from('metas').delete().eq('id', id)
    if (detailMeta?.id === id) setDetailMeta(null)
    load()
  }

  /* ── Aporte helpers ───────────────────────────────────────────── */
  function openDetail(meta) {
    setDetailMeta(meta); loadAportes(meta.id)
    setShowAporte(false)
    setAForm({ valor: '', data: format(new Date(), 'yyyy-MM-dd'), observacao: '' })
  }

  async function saveAporte() {
    if (!aForm.valor || !detailMeta) return
    setSaving(true)
    const valor = parseFloat(String(aForm.valor).replace(',', '.'))
    const { error } = await supabase.from('metas_aportes').insert({
      meta_id: detailMeta.id, valor, data: aForm.data,
      observacao: aForm.observacao.trim() || null,
    })
    if (!error) {
      const novoValor = Number(detailMeta.valor_atual || 0) + valor
      await supabase.from('metas').update({ valor_atual: novoValor }).eq('id', detailMeta.id)
      const updated = { ...detailMeta, valor_atual: novoValor }
      setDetailMeta(updated)
      setMetas(ms => ms.map(m => m.id === detailMeta.id ? updated : m))
      setAForm({ valor: '', data: format(new Date(), 'yyyy-MM-dd'), observacao: '' })
      setShowAporte(false)
      loadAportes(detailMeta.id)
    }
    setSaving(false)
  }

  async function deleteAporte(a) {
    if (!confirm('Excluir este aporte?')) return
    await supabase.from('metas_aportes').delete().eq('id', a.id)
    const novoValor = Math.max(0, Number(detailMeta.valor_atual || 0) - Number(a.valor))
    await supabase.from('metas').update({ valor_atual: novoValor }).eq('id', detailMeta.id)
    const updated = { ...detailMeta, valor_atual: novoValor }
    setDetailMeta(updated)
    setMetas(ms => ms.map(m => m.id === detailMeta.id ? updated : m))
    loadAportes(detailMeta.id)
  }

  if (loading) return <div className="c-loading-screen"><div className="c-loading-spinner" /></div>

  const today = format(new Date(), 'yyyy-MM-dd')

  /* ══ RENDER ═════════════════════════════════════════════════════ */
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 16px 80px' }}>

      <div className="c-page-header">
        <h2>🎯 Metas</h2>
        <p>Planeje e acompanhe seus objetivos</p>
      </div>

      {/* ── SUMMARY CARDS ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginBottom: 24 }}>
        {[
          { icon: '🎯', value: stats.total,     label: 'Total',        color: '#6366f1' },
          { icon: '🔄', value: stats.andamento, label: 'Em andamento', color: '#3b82f6' },
          { icon: '✅', value: stats.concluidas, label: 'Concluídas',  color: '#16a34a' },
          { icon: '💰', value: fmtBRL(stats.valorObj),  label: 'Valor objetivo', color: '#6366f1', sm: true },
          { icon: '📈', value: fmtBRL(stats.valorAcum), label: 'Acumulado',      color: '#10b981', sm: true },
        ].map((c, i) => (
          <div key={i} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border, #e2e8f0)', borderRadius: 12, padding: '14px 16px', flexShrink: 0, minWidth: c.sm ? 130 : 110, textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ fontSize: c.sm ? 14 : 22, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 11, color: 'var(--c-text-muted, #64748b)', marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
        {stats.proxima && (
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border, #e2e8f0)', borderRadius: 12, padding: '14px 16px', flexShrink: 0, minWidth: 150, textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>⏰</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', lineHeight: 1.3 }}>
              {stats.proxima.nome.length > 18 ? stats.proxima.nome.slice(0, 18) + '…' : stats.proxima.nome}
            </div>
            <div style={{ fontSize: 11, color: 'var(--c-text-muted, #64748b)', marginTop: 4 }}>
              {stats.proxima.data_limite ? format(parseISO(stats.proxima.data_limite), 'dd/MM/yyyy') : 'Sem prazo'}
            </div>
          </div>
        )}
      </div>

      {/* ── FILTERS ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <select className="c-form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: '1 1 120px', minWidth: 120 }}>
          <option value="all">Todos os status</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="c-form-select" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ flex: '1 1 120px', minWidth: 120 }}>
          <option value="all">Todas as categorias</option>
          {CATS.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
        </select>
        <select className="c-form-select" value={filterPri} onChange={e => setFilterPri(e.target.value)} style={{ flex: '1 1 100px', minWidth: 100 }}>
          <option value="all">Prioridade</option>
          {PRIS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select className="c-form-select" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ flex: '1 1 140px', minWidth: 140 }}>
          <option value="prazo">Ordenar: Prazo</option>
          <option value="pct_asc">Menor progresso</option>
          <option value="pct_desc">Maior progresso</option>
          <option value="valor">Maior valor</option>
          <option value="prioridade">Prioridade</option>
        </select>
        <button className="c-btn c-btn-primary" onClick={openAdd} style={{ whiteSpace: 'nowrap' }}>+ Nova Meta</button>
      </div>

      {/* ── GOALS LIST ────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="c-empty-state">
          <div className="c-empty-icon">🎯</div>
          <h3>{metas.length === 0 ? 'Nenhuma meta ainda' : 'Nenhuma meta encontrada'}</h3>
          <p>{metas.length === 0 ? 'Crie sua primeira meta!' : 'Ajuste os filtros acima.'}</p>
          {metas.length === 0 && <button className="c-btn c-btn-primary c-mt-3" onClick={openAdd}>+ Nova Meta</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(meta => {
            const { pct, restante, diasRestantes, porMes, porSemana } = calcMeta(meta)
            const color = accentFor(meta)
            const cat = CATS.find(c => c.value === meta.categoria)
            const isOverdue = meta.data_limite && meta.data_limite < today && meta.status !== 'concluida' && meta.status !== 'cancelada'
            const isNear    = !isOverdue && diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 30 && meta.status !== 'concluida'
            const isCanceled = meta.status === 'cancelada'

            return (
              <div
                key={meta.id}
                className="c-card"
                style={{ padding: '16px 18px', cursor: 'pointer', opacity: isCanceled ? 0.6 : 1, borderLeft: `4px solid ${color}` }}
                onClick={() => openDetail(meta)}
              >
                {/* Row 1: icon + name + badges + actions */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {meta.icone || '🎯'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, textDecoration: isCanceled ? 'line-through' : 'none' }}>
                      {meta.nome}
                      {cat && <span style={{ marginLeft: 6, fontSize: 12, color: 'var(--c-text-muted)', fontWeight: 400 }}>{cat.icon} {cat.label}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <SBadge status={meta.status} />
                      <PBadge prioridade={meta.prioridade} />
                      {isOverdue && <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>Atrasada</span>}
                      {isNear    && <span style={{ background: '#fefce8', color: '#ca8a04', border: '1px solid #fef08a', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>Prazo próximo</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => openEdit(meta)}>✏️</button>
                    <button className="c-btn c-btn-danger c-btn-sm"    onClick={() => deleteMeta(meta.id)}>🗑️</button>
                  </div>
                </div>

                {/* Row 2: progress */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                    <span style={{ fontWeight: 700, color }}>{fmtBRL(meta.valor_atual)}</span>
                    <span style={{ color: 'var(--c-text-muted)' }}>de {fmtBRL(meta.valor_objetivo)}</span>
                  </div>
                  <Bar pct={pct} color={color} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 12 }}>
                    <span style={{ fontWeight: 700, color }}>{pct.toFixed(0)}% concluído</span>
                    <span style={{ color: 'var(--c-text-muted)' }}>Falta {fmtBRL(restante)}</span>
                  </div>
                </div>

                {/* Row 3: deadline + monthly */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--c-text-muted)', paddingTop: 8, borderTop: '1px solid var(--c-border, #e2e8f0)' }}>
                  {meta.data_limite && (
                    <span>⏰ Prazo: {format(parseISO(meta.data_limite), 'dd/MM/yyyy')}
                      {diasRestantes !== null ? ` (${diasRestantes < 0 ? `${Math.abs(diasRestantes)}d atrasada` : `${diasRestantes}d restantes`})` : ''}
                    </span>
                  )}
                  {porMes    !== null && porMes    > 0 && meta.status !== 'concluida' && <span>📅 {fmtBRL(porMes)}/mês</span>}
                  {porSemana !== null && porSemana > 0 && meta.status !== 'concluida' && <span>📆 {fmtBRL(porSemana)}/sem</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── FAB (mobile) ──────────────────────────────────────── */}
      <button onClick={openAdd} aria-label="Nova Meta" className="c-fab-nova"
        style={{ position: 'fixed', bottom: 24, right: 20, zIndex: 300, width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', fontSize: 26,
          border: 'none', cursor: 'pointer', display: 'none',
          alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,.5)' }}>
        +
      </button>

      {/* ══ FORM MODAL ══════════════════════════════════════════ */}
      {showForm && (
        <ModalShell title={editingMeta ? 'Editar Meta' : 'Nova Meta'} onClose={() => setShowForm(false)} onSave={saveMeta} saving={saving}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Nome da meta *">
              <input type="text" className="c-form-input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Reserva de Emergência" />
            </Field>
            <Field label="Descrição">
              <textarea className="c-form-textarea" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Descreva o objetivo..." rows={2} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Categoria">
                <select className="c-form-select" value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                  {CATS.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className="c-form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Valor objetivo (R$)">
                <input type="text" className="c-form-input" value={form.valor_objetivo} onChange={e => set('valor_objetivo', e.target.value)} placeholder="0,00" />
              </Field>
              <Field label="Valor atual (R$)">
                <input type="text" className="c-form-input" value={form.valor_atual} onChange={e => set('valor_atual', e.target.value)} placeholder="0,00" />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Data inicial"><DateInput value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} /></Field>
              <Field label="Data limite"><DateInput value={form.data_limite} onChange={e => set('data_limite', e.target.value)} /></Field>
            </div>
            <Field label="Prioridade">
              <div style={{ display: 'flex', gap: 8 }}>
                {PRIS.map(p => (
                  <button key={p.value} type="button" onClick={() => set('prioridade', p.value)}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
                      border: `2px solid ${form.prioridade === p.value ? p.color : 'var(--c-border)'}`,
                      background: form.prioridade === p.value ? p.color + '20' : 'transparent',
                      color: form.prioridade === p.value ? p.color : 'var(--c-text-muted)' }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Ícone">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {ICONES.map(ic => (
                    <span key={ic} onClick={() => set('icone', ic)}
                      style={{ fontSize: 20, cursor: 'pointer', padding: 4, borderRadius: 6,
                        background: form.icone === ic ? '#f1f5f9' : 'transparent',
                        border: form.icone === ic ? '2px solid var(--c-accent,#6366f1)' : '2px solid transparent' }}>
                      {ic}
                    </span>
                  ))}
                </div>
              </Field>
              <Field label="Cor">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CORES.map(c => (
                    <div key={c} onClick={() => set('cor', c)}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                        border: form.cor === c ? '3px solid #0f172a' : '2px solid transparent' }} />
                  ))}
                </div>
              </Field>
            </div>
            <Field label="Observações">
              <textarea className="c-form-textarea" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Anotações adicionais..." rows={2} />
            </Field>
          </div>
        </ModalShell>
      )}

      {/* ══ DETAIL MODAL ════════════════════════════════════════ */}
      {detailMeta && (() => {
        const meta = detailMeta
        const { pct, restante, diasRestantes, porMes, porSemana } = calcMeta(meta)
        const color = accentFor(meta)
        const cat   = CATS.find(c => c.value === meta.categoria)
        return (
          <ModalShell title={`${meta.icone || '🎯'} ${meta.nome}`} onClose={() => setDetailMeta(null)}>
            {/* Progress */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 22, color }}>{fmtBRL(meta.valor_atual)}</span>
                <span style={{ color: 'var(--c-text-muted)', alignSelf: 'flex-end', fontSize: 14 }}>de {fmtBRL(meta.valor_objetivo)}</span>
              </div>
              <Bar pct={pct} color={color} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 13 }}>
                <span style={{ fontWeight: 700, color }}>{pct.toFixed(1)}% concluído</span>
                <span style={{ color: 'var(--c-text-muted)' }}>Falta {fmtBRL(restante)}</span>
              </div>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Status',         value: <SBadge status={meta.status} /> },
                { label: 'Prioridade',     value: <PBadge prioridade={meta.prioridade} /> },
                { label: 'Categoria',      value: `${cat?.icon || ''} ${cat?.label || meta.categoria}` },
                { label: 'Prazo',          value: meta.data_limite ? format(parseISO(meta.data_limite), 'dd/MM/yyyy') : '—' },
                diasRestantes !== null && { label: 'Dias restantes', value: diasRestantes < 0 ? `${Math.abs(diasRestantes)}d atrasada` : `${diasRestantes} dias` },
                porMes    !== null && porMes    > 0 && { label: 'Poupar/mês',   value: fmtBRL(porMes)    },
                porSemana !== null && porSemana > 0 && { label: 'Poupar/semana', value: fmtBRL(porSemana) },
                meta.data_inicio && { label: 'Início', value: format(parseISO(meta.data_inicio), 'dd/MM/yyyy') },
              ].filter(Boolean).map((item, i) => (
                <div key={i} style={{ background: 'var(--c-bg,#f8fafc)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {meta.descricao && (
              <div style={{ marginBottom: 14, padding: '12px 14px', background: 'var(--c-bg,#f8fafc)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginBottom: 4 }}>Descrição</div>
                <div style={{ fontSize: 14 }}>{meta.descricao}</div>
              </div>
            )}

            {meta.observacoes && (
              <div style={{ marginBottom: 14, padding: '12px 14px', background: 'var(--c-bg,#f8fafc)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginBottom: 4 }}>Observações</div>
                <div style={{ fontSize: 14 }}>{meta.observacoes}</div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button className="c-btn c-btn-primary" style={{ flex: 1 }} onClick={() => setShowAporte(a => !a)}>
                {showAporte ? '✕ Cancelar aporte' : '+ Registrar Aporte'}
              </button>
              <button className="c-btn c-btn-secondary" onClick={() => openEdit(meta)}>✏️ Editar</button>
            </div>

            {/* Aporte form */}
            {showAporte && (
              <div style={{ border: '1.5px solid var(--c-border)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Novo Aporte</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="c-form-group">
                    <label className="c-form-label">Valor (R$) *</label>
                    <input type="text" className="c-form-input" value={aForm.valor}
                      onChange={e => setAForm(f => ({ ...f, valor: e.target.value }))} placeholder="0,00" />
                  </div>
                  <div className="c-form-group">
                    <label className="c-form-label">Data</label>
                    <DateInput value={aForm.data} onChange={e => setAForm(f => ({ ...f, data: e.target.value }))} />
                  </div>
                  <div className="c-form-group">
                    <label className="c-form-label">Observação</label>
                    <input type="text" className="c-form-input" value={aForm.observacao}
                      onChange={e => setAForm(f => ({ ...f, observacao: e.target.value }))} placeholder="Ex: salário do mês" />
                  </div>
                  <button className="c-btn c-btn-primary" onClick={saveAporte} disabled={saving}>
                    {saving ? 'Salvando...' : 'Confirmar Aporte'}
                  </button>
                </div>
              </div>
            )}

            {/* Aportes history */}
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Histórico de Aportes</div>
            {aLoading ? (
              <div style={{ textAlign: 'center', padding: 16 }}><div className="c-loading-spinner" style={{ width: 24, height: 24 }} /></div>
            ) : aportes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--c-text-muted)', fontSize: 14 }}>
                Nenhum aporte registrado ainda.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {aportes.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--c-bg,#f8fafc)', borderRadius: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#16a34a' }}>+{fmtBRL(a.valor)}</div>
                      <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
                        {format(parseISO(a.data), 'dd/MM/yyyy', { locale: ptBR })}
                        {a.observacao && ` • ${a.observacao}`}
                      </div>
                    </div>
                    <button className="c-btn c-btn-danger c-btn-sm" onClick={() => deleteAporte(a)}>🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </ModalShell>
        )
      })()}

    </div>
  )
}
