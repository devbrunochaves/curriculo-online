/*
  SQL para criar as tabelas no Supabase (execute no SQL Editor):

  create table cofrinhos (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default now(),
    nome text not null,
    onde_guardado text,
    tipo text default 'poupanca',
    valor_atual numeric default 0,
    valor_meta numeric,
    cor text default '#10b981',
    icone text default '🐷',
    observacoes text
  );

  create table cofrinhos_aportes (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default now(),
    cofrinho_id uuid references cofrinhos(id) on delete cascade,
    valor numeric not null,
    data date not null default current_date,
    observacao text
  );
*/

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const TIPOS = [
  { value: 'poupanca',     label: 'Poupança',         icon: '🏦' },
  { value: 'investimento', label: 'Investimento',      icon: '📈' },
  { value: 'corrente',     label: 'Conta Corrente',    icon: '💳' },
  { value: 'tesouro',      label: 'Tesouro Direto',    icon: '🏛️' },
  { value: 'cripto',       label: 'Criptomoeda',       icon: '🪙'  },
  { value: 'emergencia',   label: 'Reserva de Emerg.', icon: '🚨' },
  { value: 'exterior',     label: 'Exterior',          icon: '🌎' },
  { value: 'outros',       label: 'Outros',            icon: '📦' },
]

const CORES  = ['#10b981','#6366f1','#3b82f6','#f59e0b','#ec4899','#f97316','#dc2626','#8b5cf6','#14b8a6','#06b6d4']
const ICONES = ['🐷','💰','🏦','📈','💳','🏛️','🪙','🚨','🌎','📦','💎','🌱','⭐','🎯','🏠','✈️','🎓','💡','🐶','🎁']

const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const BLANK = {
  nome: '', onde_guardado: '', tipo: 'poupanca',
  valor_atual: '0', valor_meta: '',
  cor: '#10b981', icone: '🐷', observacoes: '',
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
    <div style={{ height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, borderRadius: 3, background: color || '#10b981', transition: 'width .4s' }} />
    </div>
  )
}

/* ══ Main Component ═══════════════════════════════════════════════ */
export default function Cofrinhos() {
  const [cofrinhos, setCofrinhos]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [filterTipo, setFilterTipo]   = useState('all')
  const [showForm, setShowForm]       = useState(false)
  const [editingId, setEditingId]     = useState(null)
  const [detailCofrinho, setDetail]   = useState(null)
  const [aportes, setAportes]         = useState([])
  const [aLoading, setALoading]       = useState(false)
  const [showAporte, setShowAporte]   = useState(false)
  const [form, setForm]               = useState(BLANK)
  const [aForm, setAForm]             = useState({ valor: '', data: format(new Date(), 'yyyy-MM-dd'), observacao: '' })
  const [saving, setSaving]           = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('cofrinhos').select('*').order('created_at', { ascending: false })
    setCofrinhos(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function loadAportes(id) {
    setALoading(true)
    const { data } = await supabase.from('cofrinhos_aportes').select('*').eq('cofrinho_id', id).order('data', { ascending: false })
    setAportes(data || [])
    setALoading(false)
  }

  /* ── Derived ──────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    if (filterTipo === 'all') return cofrinhos
    return cofrinhos.filter(c => c.tipo === filterTipo)
  }, [cofrinhos, filterTipo])

  const stats = useMemo(() => {
    const total    = cofrinhos.reduce((s, c) => s + Number(c.valor_atual || 0), 0)
    const comMeta  = cofrinhos.filter(c => c.valor_meta > 0)
    const totalMeta = comMeta.reduce((s, c) => s + Number(c.valor_meta || 0), 0)
    return { total, count: cofrinhos.length, comMeta: comMeta.length, totalMeta }
  }, [cofrinhos])

  /* ── Form helpers ─────────────────────────────────────────────── */
  function openAdd() {
    setForm(BLANK); setEditingId(null); setShowForm(true)
  }
  function openEdit(c) {
    setForm({
      nome: c.nome || '', onde_guardado: c.onde_guardado || '', tipo: c.tipo || 'poupanca',
      valor_atual: c.valor_atual != null ? String(c.valor_atual).replace('.', ',') : '0',
      valor_meta:  c.valor_meta  != null ? String(c.valor_meta).replace('.', ',')  : '',
      cor: c.cor || '#10b981', icone: c.icone || '🐷', observacoes: c.observacoes || '',
    })
    setEditingId(c.id); setShowForm(true); setDetail(null)
  }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.nome.trim()) return
    setSaving(true)
    const payload = {
      nome:          form.nome.trim(),
      onde_guardado: form.onde_guardado.trim() || null,
      tipo:          form.tipo,
      valor_atual:   form.valor_atual ? parseFloat(String(form.valor_atual).replace(',', '.')) : 0,
      valor_meta:    form.valor_meta  ? parseFloat(String(form.valor_meta).replace(',', '.'))  : null,
      cor:           form.cor,
      icone:         form.icone,
      observacoes:   form.observacoes.trim() || null,
    }
    if (editingId) await supabase.from('cofrinhos').update(payload).eq('id', editingId)
    else           await supabase.from('cofrinhos').insert(payload)
    setSaving(false); setShowForm(false); load()
  }

  async function deleteCofrinho(id) {
    if (!confirm('Excluir este cofrinho? Esta ação não pode ser desfeita.')) return
    await supabase.from('cofrinhos').delete().eq('id', id)
    if (detailCofrinho?.id === id) setDetail(null)
    load()
  }

  /* ── Aporte helpers ───────────────────────────────────────────── */
  function openDetail(c) {
    setDetail(c); loadAportes(c.id)
    setShowAporte(false)
    setAForm({ valor: '', data: format(new Date(), 'yyyy-MM-dd'), observacao: '' })
  }

  async function saveAporte() {
    if (!aForm.valor || !detailCofrinho) return
    setSaving(true)
    const valor = parseFloat(String(aForm.valor).replace(',', '.'))
    const { error } = await supabase.from('cofrinhos_aportes').insert({
      cofrinho_id: detailCofrinho.id, valor, data: aForm.data,
      observacao: aForm.observacao.trim() || null,
    })
    if (!error) {
      const novoValor = Number(detailCofrinho.valor_atual || 0) + valor
      await supabase.from('cofrinhos').update({ valor_atual: novoValor }).eq('id', detailCofrinho.id)
      const updated = { ...detailCofrinho, valor_atual: novoValor }
      setDetail(updated)
      setCofrinhos(cs => cs.map(c => c.id === detailCofrinho.id ? updated : c))
      setAForm({ valor: '', data: format(new Date(), 'yyyy-MM-dd'), observacao: '' })
      setShowAporte(false)
      loadAportes(detailCofrinho.id)
    }
    setSaving(false)
  }

  async function deleteAporte(a) {
    if (!confirm('Excluir este registro?')) return
    await supabase.from('cofrinhos_aportes').delete().eq('id', a.id)
    const novoValor = Math.max(0, Number(detailCofrinho.valor_atual || 0) - Number(a.valor))
    await supabase.from('cofrinhos').update({ valor_atual: novoValor }).eq('id', detailCofrinho.id)
    const updated = { ...detailCofrinho, valor_atual: novoValor }
    setDetail(updated)
    setCofrinhos(cs => cs.map(c => c.id === detailCofrinho.id ? updated : c))
    loadAportes(detailCofrinho.id)
  }

  if (loading) return <div className="c-loading-screen"><div className="c-loading-spinner" /></div>

  /* ══ RENDER ═════════════════════════════════════════════════════ */
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 16px 80px' }}>

      <div className="c-page-header">
        <h2>🐷 Cofrinhos</h2>
        <p>Controle onde está guardado o seu dinheiro</p>
      </div>

      {/* ── SUMMARY CARDS ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginBottom: 24 }}>
        {[
          { icon: '💰', value: fmtBRL(stats.total),     label: 'Total guardado',   color: '#10b981', sm: true },
          { icon: '🐷', value: stats.count,              label: 'Cofrinhos',        color: '#6366f1' },
          { icon: '🎯', value: fmtBRL(stats.totalMeta),  label: 'Soma das metas',   color: '#3b82f6', sm: true },
          { icon: '📊', value: stats.comMeta,            label: 'Com meta',         color: '#f59e0b' },
        ].map((c, i) => (
          <div key={i} style={{
            background: 'var(--c-surface)', border: '1px solid var(--c-border, #e2e8f0)',
            borderRadius: 12, padding: '14px 16px', flexShrink: 0, minWidth: c.sm ? 140 : 110, textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ fontSize: c.sm ? 14 : 22, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 11, color: 'var(--c-text-muted, #64748b)', marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── FILTERS + ADD ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <select className="c-form-select" value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={{ flex: '1 1 160px', minWidth: 160 }}>
          <option value="all">Todos os tipos</option>
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
        </select>
        <button className="c-btn c-btn-primary" onClick={openAdd} style={{ whiteSpace: 'nowrap' }}>+ Novo Cofrinho</button>
      </div>

      {/* ── GRID DE COFRINHOS ─────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="c-empty-state">
          <div className="c-empty-icon">🐷</div>
          <h3>{cofrinhos.length === 0 ? 'Nenhum cofrinho ainda' : 'Nenhum cofrinho encontrado'}</h3>
          <p>{cofrinhos.length === 0 ? 'Crie seu primeiro cofrinho!' : 'Ajuste o filtro acima.'}</p>
          {cofrinhos.length === 0 && <button className="c-btn c-btn-primary c-mt-3" onClick={openAdd}>+ Novo Cofrinho</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map(c => {
            const tipo = TIPOS.find(t => t.value === c.tipo)
            const pct  = c.valor_meta > 0 ? Math.min(100, (c.valor_atual / c.valor_meta) * 100) : null
            const cor  = c.cor || '#10b981'
            return (
              <div
                key={c.id}
                className="c-card"
                style={{ padding: '16px 18px', cursor: 'pointer', borderTop: `4px solid ${cor}` }}
                onClick={() => openDetail(c)}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: cor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, flexShrink: 0,
                  }}>
                    {c.icone || '🐷'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.nome}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
                      {c.onde_guardado && <span style={{ marginRight: 6 }}>{c.onde_guardado}</span>}
                      {tipo && (
                        <span style={{
                          background: cor + '18', color: cor, border: `1px solid ${cor}40`,
                          borderRadius: 5, padding: '1px 7px', fontSize: 11, fontWeight: 600,
                        }}>
                          {tipo.icon} {tipo.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => openEdit(c)}>✏️</button>
                    <button className="c-btn c-btn-danger c-btn-sm"    onClick={() => deleteCofrinho(c.id)}>🗑️</button>
                  </div>
                </div>

                {/* Amount */}
                <div style={{ marginBottom: pct !== null ? 10 : 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: cor, lineHeight: 1 }}>
                    {fmtBRL(c.valor_atual)}
                  </div>
                  {c.valor_meta > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>
                      meta: {fmtBRL(c.valor_meta)}
                    </div>
                  )}
                </div>

                {/* Progress bar (only if has meta) */}
                {pct !== null && (
                  <div style={{ marginTop: 10 }}>
                    <Bar pct={pct} color={cor} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--c-text-muted)' }}>
                      <span style={{ fontWeight: 700, color: cor }}>{pct.toFixed(0)}%</span>
                      <span>falta {fmtBRL(Math.max(0, c.valor_meta - c.valor_atual))}</span>
                    </div>
                  </div>
                )}

                {c.observacoes && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--c-border, #e2e8f0)', fontSize: 12, color: 'var(--c-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.observacoes}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── FAB (mobile) ──────────────────────────────────────── */}
      <button onClick={openAdd} aria-label="Novo Cofrinho" className="c-fab-nova"
        style={{
          position: 'fixed', bottom: 24, right: 20, zIndex: 300,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontSize: 26,
          border: 'none', cursor: 'pointer', display: 'none',
          alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(16,185,129,.5)',
        }}>
        +
      </button>

      {/* ══ FORM MODAL ══════════════════════════════════════════ */}
      {showForm && (
        <ModalShell
          title={editingId ? 'Editar Cofrinho' : '🐷 Novo Cofrinho'}
          onClose={() => setShowForm(false)}
          onSave={save}
          saving={saving}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Nome do cofrinho *">
              <input type="text" className="c-form-input" value={form.nome}
                onChange={e => set('nome', e.target.value)}
                placeholder="Ex: Reserva de Emergência" autoFocus />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Onde está guardado">
                <input type="text" className="c-form-input" value={form.onde_guardado}
                  onChange={e => set('onde_guardado', e.target.value)}
                  placeholder="Ex: Nubank, XP, Binance" />
              </Field>
              <Field label="Tipo">
                <select className="c-form-select" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Valor atual (R$) *">
                <input type="text" className="c-form-input" value={form.valor_atual}
                  onChange={e => set('valor_atual', e.target.value)} placeholder="0,00" />
              </Field>
              <Field label="Meta (R$) — opcional">
                <input type="text" className="c-form-input" value={form.valor_meta}
                  onChange={e => set('valor_meta', e.target.value)} placeholder="0,00" />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Ícone">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {ICONES.map(ic => (
                    <span key={ic} onClick={() => set('icone', ic)}
                      style={{
                        fontSize: 20, cursor: 'pointer', padding: 4, borderRadius: 6,
                        background: form.icone === ic ? '#f1f5f9' : 'transparent',
                        border: form.icone === ic ? '2px solid var(--c-accent,#6366f1)' : '2px solid transparent',
                      }}>
                      {ic}
                    </span>
                  ))}
                </div>
              </Field>
              <Field label="Cor">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CORES.map(cor => (
                    <div key={cor} onClick={() => set('cor', cor)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: cor, cursor: 'pointer',
                        border: form.cor === cor ? '3px solid #0f172a' : '2px solid transparent',
                      }} />
                  ))}
                </div>
              </Field>
            </div>

            <Field label="Observações">
              <textarea className="c-form-textarea" value={form.observacoes}
                onChange={e => set('observacoes', e.target.value)}
                placeholder="Ex: CDB com liquidez diária, rendimento 110% CDI..." rows={2} />
            </Field>
          </div>
        </ModalShell>
      )}

      {/* ══ DETAIL MODAL ════════════════════════════════════════ */}
      {detailCofrinho && (() => {
        const c    = detailCofrinho
        const cor  = c.cor || '#10b981'
        const pct  = c.valor_meta > 0 ? Math.min(100, (c.valor_atual / c.valor_meta) * 100) : null
        const tipo = TIPOS.find(t => t.value === c.tipo)
        return (
          <ModalShell title={`${c.icone || '🐷'} ${c.nome}`} onClose={() => setDetail(null)}>

            {/* Amount hero */}
            <div style={{ textAlign: 'center', padding: '12px 0 20px', borderBottom: '1px solid var(--c-border, #e2e8f0)', marginBottom: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: cor }}>{fmtBRL(c.valor_atual)}</div>
              {c.onde_guardado && (
                <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 4 }}>
                  {tipo?.icon} {c.onde_guardado} · {tipo?.label}
                </div>
              )}
              {pct !== null && (
                <div style={{ marginTop: 14, padding: '0 8px' }}>
                  <Bar pct={pct} color={cor} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
                    <span style={{ fontWeight: 700, color: cor }}>{pct.toFixed(1)}% da meta</span>
                    <span style={{ color: 'var(--c-text-muted)' }}>meta: {fmtBRL(c.valor_meta)}</span>
                  </div>
                </div>
              )}
            </div>

            {c.observacoes && (
              <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--c-bg,#f8fafc)', borderRadius: 8, fontSize: 14 }}>
                {c.observacoes}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button className="c-btn c-btn-primary" style={{ flex: 1 }} onClick={() => setShowAporte(a => !a)}>
                {showAporte ? '✕ Cancelar' : '+ Registrar Movimentação'}
              </button>
              <button className="c-btn c-btn-secondary" onClick={() => openEdit(c)}>✏️ Editar</button>
            </div>

            {/* Aporte form */}
            {showAporte && (
              <div style={{ border: '1.5px solid var(--c-border)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Nova Movimentação</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="c-form-group">
                    <label className="c-form-label">Valor (R$) *</label>
                    <input type="text" className="c-form-input" value={aForm.valor}
                      onChange={e => setAForm(f => ({ ...f, valor: e.target.value }))}
                      placeholder="0,00 — use negativo para retirada" autoFocus />
                  </div>
                  <div className="c-form-group">
                    <label className="c-form-label">Data</label>
                    <input type="date" value={aForm.data}
                      onChange={e => setAForm(f => ({ ...f, data: e.target.value }))}
                      style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 16, color: 'var(--c-text)', background: 'var(--c-surface)', fontFamily: 'inherit' }} />
                  </div>
                  <div className="c-form-group">
                    <label className="c-form-label">Observação</label>
                    <input type="text" className="c-form-input" value={aForm.observacao}
                      onChange={e => setAForm(f => ({ ...f, observacao: e.target.value }))}
                      placeholder="Ex: depósito mensal, rendimento de junho..." />
                  </div>
                  <button className="c-btn c-btn-primary" onClick={saveAporte} disabled={saving}>
                    {saving ? 'Salvando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            )}

            {/* History */}
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Histórico</div>
            {aLoading ? (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <div className="c-loading-spinner" style={{ width: 24, height: 24 }} />
              </div>
            ) : aportes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--c-text-muted)', fontSize: 14 }}>
                Nenhuma movimentação registrada.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {aportes.map(a => {
                  const isNeg = Number(a.valor) < 0
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--c-bg,#f8fafc)', borderRadius: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: isNeg ? '#dc2626' : '#16a34a' }}>
                          {isNeg ? '' : '+'}{fmtBRL(a.valor)}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
                          {format(parseISO(a.data), 'dd/MM/yyyy', { locale: ptBR })}
                          {a.observacao && ` · ${a.observacao}`}
                        </div>
                      </div>
                      <button className="c-btn c-btn-danger c-btn-sm" onClick={() => deleteAporte(a)}>🗑️</button>
                    </div>
                  )
                })}
              </div>
            )}

          </ModalShell>
        )
      })()}

    </div>
  )
}
