import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO, differenceInDays, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/* ── Constants ─────────────────────────────────────────────────────────── */
const COMBUSTIVEIS = ['Gasolina', 'Álcool', 'Flex', 'Diesel', 'GNV', 'Elétrico', 'Híbrido']
const DOC_TIPOS = ['CRLV', 'DUT', 'Seguro', 'Licenciamento', 'IPVA', 'Multa', 'Contrato de Compra', 'Laudo', 'Outro']
const MANUT_TIPOS = ['Troca de óleo', 'Filtro de óleo', 'Filtro de ar', 'Alinhamento', 'Balanceamento', 'Pneus', 'Freios', 'Bateria', 'Suspensão', 'Revisão', 'Ar condicionado', 'Outros']
const GASTO_CATS = ['Combustível', 'Seguro', 'IPVA', 'Licenciamento', 'Multa', 'Pneus', 'Manutenção', 'Estacionamento', 'Lavagem', 'Acessórios', 'Outros']
const FOTO_ALBUMS = ['Geral', 'Manutenções', 'Sinistros', 'Venda', 'Outros']

/* ── Helpers ───────────────────────────────────────────────────────────── */
const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = d => d ? format(parseISO(d), 'dd/MM/yyyy') : '—'
const fmtDateShort = d => d ? format(parseISO(d), "dd/MM/yy") : '—'

async function getSignedUrl(path) {
  if (!path) return null
  const { data } = await supabase.storage.from('veiculos').createSignedUrl(path, 3600)
  return data?.signedUrl || null
}

async function uploadFile(file, folder = 'geral') {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('veiculos').upload(path, file)
  if (error) throw error
  return path
}

async function deleteFile(path) {
  if (!path) return
  await supabase.storage.from('veiculos').remove([path])
}

/* ── Shared UI ─────────────────────────────────────────────────────────── */
function Loading() {
  return (
    <div className="c-loading-screen">
      <div className="c-loading-spinner" />
    </div>
  )
}

function EmptyState({ icon, title, desc }) {
  return (
    <div className="c-empty-state">
      <div className="c-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  )
}

function ModalShell({ title, onClose, onSave, saving, saveLabel, children }) {
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
              {saving ? 'Salvando...' : (saveLabel || 'Salvar')}
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

/* ══════════════════════════════════════════════════════════════════════════
   VEICULOS LIST
══════════════════════════════════════════════════════════════════════════ */
function VeiculosList({ onSelect }) {
  const [veiculos, setVeiculos] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ total: 0, docsVencendo: 0, gastosAno: 0, segurosAtivos: 0, ultimoAbast: null })
  const [showForm, setShowForm] = useState(false)
  const [editingVeiculo, setEditingVeiculo] = useState(null)
  const [saving, setSaving] = useState(false)
  const [fotoUrls, setFotoUrls] = useState({})
  const [form, setForm] = useState({
    marca: '', modelo: '', ano: '', placa: '', cor: '', renavam: '', chassi: '',
    combustivel: COMBUSTIVEIS[0], quilometragem: '', data_compra: '', valor_compra: '',
    observacoes: ''
  })
  const [fotoFile, setFotoFile] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const plus30 = format(addDays(new Date(), 30), 'yyyy-MM-dd')
      const anoInicio = format(new Date(), 'yyyy') + '-01-01'

      const [veiculosR, docsVencR, gastosAnoR, segurosR, ultimoAbastR] = await Promise.allSettled([
        supabase.from('veiculos').select('*').order('created_at', { ascending: false }),
        supabase.from('veiculos_documentos').select('id,veiculo_id').not('data_validade', 'is', null).lte('data_validade', plus30).gte('data_validade', today),
        supabase.from('veiculos_gastos').select('valor').gte('data', anoInicio),
        supabase.from('veiculos_seguros').select('id,data_termino'),
        supabase.from('veiculos_abastecimentos').select('data,valor,litros,quilometragem').order('data', { ascending: false }).limit(1),
      ])

      const rows = veiculosR.status === 'fulfilled' ? (veiculosR.value.data || []) : []
      setVeiculos(rows)

      const docsVenc = docsVencR.status === 'fulfilled' ? (docsVencR.value.data || []) : []
      const gastosAno = gastosAnoR.status === 'fulfilled' ? (gastosAnoR.value.data || []) : []
      const seguros = segurosR.status === 'fulfilled' ? (segurosR.value.data || []) : []
      const ultimoAbast = ultimoAbastR.status === 'fulfilled' ? (ultimoAbastR.value.data || []) : []

      const gastosTotal = gastosAno.reduce((s, r) => s + Number(r.valor || 0), 0)
      const segurosAtivos = seguros.filter(s => s.data_termino && s.data_termino >= today).length

      setSummary({
        total: rows.length,
        docsVencendo: docsVenc.length,
        gastosAno: gastosTotal,
        segurosAtivos,
        ultimoAbast: ultimoAbast[0]?.data || null,
      })

      const urls = {}
      await Promise.all(rows.map(async v => {
        if (v.foto_principal_path) {
          urls[v.id] = await getSignedUrl(v.foto_principal_path)
        }
      }))
      setFotoUrls(urls)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditingVeiculo(null)
    setFotoFile(null)
    setForm({
      marca: '', modelo: '', ano: '', placa: '', cor: '', renavam: '', chassi: '',
      combustivel: COMBUSTIVEIS[0], quilometragem: '', data_compra: '', valor_compra: '',
      observacoes: ''
    })
    setShowForm(true)
  }

  function openEdit(v) {
    setEditingVeiculo(v)
    setFotoFile(null)
    setForm({
      marca: v.marca || '', modelo: v.modelo || '', ano: v.ano || '', placa: v.placa || '',
      cor: v.cor || '', renavam: v.renavam || '', chassi: v.chassi || '',
      combustivel: v.combustivel || COMBUSTIVEIS[0], quilometragem: v.quilometragem || '',
      data_compra: v.data_compra || '', valor_compra: v.valor_compra || '',
      observacoes: v.observacoes || ''
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.marca || !form.modelo) return alert('Marca e modelo são obrigatórios.')
    setSaving(true)
    try {
      let foto_principal_path = editingVeiculo?.foto_principal_path || null
      if (fotoFile) {
        if (foto_principal_path) await deleteFile(foto_principal_path)
        const folder = editingVeiculo ? `fotos/${editingVeiculo.id}` : 'fotos/novo'
        foto_principal_path = await uploadFile(fotoFile, folder)
      }
      const payload = {
        marca: form.marca, modelo: form.modelo,
        ano: form.ano ? Number(form.ano) : null,
        placa: form.placa || null, cor: form.cor || null,
        renavam: form.renavam || null, chassi: form.chassi || null,
        combustivel: form.combustivel || null,
        quilometragem: form.quilometragem ? Number(form.quilometragem) : null,
        data_compra: form.data_compra || null,
        valor_compra: form.valor_compra ? Number(String(form.valor_compra).replace(/[^\d,\.]/g, '').replace(',', '.')) : null,
        observacoes: form.observacoes || null,
        foto_principal_path,
      }
      if (editingVeiculo) {
        const { error } = await supabase.from('veiculos').update(payload).eq('id', editingVeiculo.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('veiculos').insert(payload)
        if (error) throw error
      }
      setShowForm(false)
      await load()
    } catch (err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(v) {
    if (!confirm(`Excluir ${v.marca} ${v.modelo}? Esta ação não pode ser desfeita.`)) return
    if (v.foto_principal_path) await deleteFile(v.foto_principal_path)
    await supabase.from('veiculos').delete().eq('id', v.id)
    await load()
  }

  const summaryCards = [
    { icon: '🚗', label: 'Veículos', value: summary.total, color: '#6366f1' },
    { icon: '📁', label: 'Docs Vencendo', value: summary.docsVencendo, color: summary.docsVencendo > 0 ? '#d97706' : '#15803d' },
    { icon: '💸', label: 'Gastos no Ano', value: fmtBRL(summary.gastosAno), color: '#3b82f6' },
    { icon: '🛡️', label: 'Seguros Ativos', value: summary.segurosAtivos, color: '#10b981' },
    { icon: '⛽', label: 'Último Abast.', value: summary.ultimoAbast ? fmtDateShort(summary.ultimoAbast) : '—', color: '#8b5cf6' },
  ]

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>🚗 Veículos</h2>
        <button className="c-btn c-btn-primary" onClick={openNew}>+ Veículo</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, marginBottom: 24 }}>
        {summaryCards.map(c => (
          <div key={c.label} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '14px 18px', minWidth: 130, flexShrink: 0 }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {veiculos.length === 0 ? (
        <EmptyState icon="🚗" title="Nenhum veículo cadastrado" desc="Adicione seu primeiro veículo para começar." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {veiculos.map(v => (
            <div key={v.id} className="c-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Foto — 16:9 */}
              <div
                style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: 'linear-gradient(135deg, #6366f120 0%, #818cf820 100%)', cursor: 'pointer', flexShrink: 0 }}
                onClick={() => onSelect(v)}
              >
                {fotoUrls[v.id]
                  ? <img src={fotoUrls[v.id]} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} alt={v.modelo} />
                  : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, opacity: 0.4 }}>🚗</div>
                }
              </div>

              {/* Conteúdo */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 0, flex: 1 }}>
                {/* Título */}
                <div
                  style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, cursor: 'pointer', color: 'var(--c-text)' }}
                  onClick={() => onSelect(v)}
                >
                  {v.marca} {v.modelo}
                </div>

                {/* Placa + Ano */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {v.placa && (
                    <span style={{ background: 'var(--c-surface2, #f8fafc)', border: '1px solid var(--c-border)', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }}>
                      {v.placa}
                    </span>
                  )}
                  {v.ano && (
                    <span style={{ background: '#6366f115', color: '#6366f1', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                      {v.ano}
                    </span>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--c-border)', marginBottom: 12 }} />

                {/* Detalhes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 12 }}>
                  {v.combustivel && <span>⛽ {v.combustivel}</span>}
                  {v.cor && <span>🎨 {v.cor}</span>}
                  {v.quilometragem && <span>🛣️ {Number(v.quilometragem).toLocaleString('pt-BR')} km</span>}
                </div>

                <div style={{ borderTop: '1px solid var(--c-border)', marginBottom: 12 }} />

                {/* Ações */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="c-btn c-btn-primary" style={{ flex: 1, fontSize: 13 }} onClick={() => onSelect(v)}>Ver detalhes</button>
                  <button className="c-btn c-btn-secondary c-btn-sm" style={{ fontSize: 13 }} onClick={() => openEdit(v)}>Editar</button>
                  <button className="c-btn c-btn-danger c-btn-sm" style={{ fontSize: 13 }} onClick={() => handleDelete(v)}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="c-fab-nova" style={{ display: 'none' }} onClick={openNew}>+</button>

      {showForm && (
        <ModalShell
          title={editingVeiculo ? 'Editar Veículo' : 'Novo Veículo'}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
          saving={saving}
        >
          <Field label="Marca *">
            <input className="c-form-input" value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} placeholder="Ex: Toyota" />
          </Field>
          <Field label="Modelo *">
            <input className="c-form-input" value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} placeholder="Ex: Corolla" />
          </Field>
          <Field label="Ano">
            <input className="c-form-input" type="number" min={1960} max={2030} value={form.ano} onChange={e => setForm(f => ({ ...f, ano: e.target.value }))} placeholder="2023" />
          </Field>
          <Field label="Placa">
            <input className="c-form-input" value={form.placa} onChange={e => setForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))} placeholder="ABC1D23" />
          </Field>
          <Field label="Cor">
            <input className="c-form-input" value={form.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} placeholder="Branco" />
          </Field>
          <Field label="RENAVAM">
            <input className="c-form-input" value={form.renavam} onChange={e => setForm(f => ({ ...f, renavam: e.target.value }))} />
          </Field>
          <Field label="Chassi">
            <input className="c-form-input" value={form.chassi} onChange={e => setForm(f => ({ ...f, chassi: e.target.value }))} />
          </Field>
          <Field label="Combustível">
            <select className="c-form-select" value={form.combustivel} onChange={e => setForm(f => ({ ...f, combustivel: e.target.value }))}>
              {COMBUSTIVEIS.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Quilometragem">
            <input className="c-form-input" type="number" value={form.quilometragem} onChange={e => setForm(f => ({ ...f, quilometragem: e.target.value }))} placeholder="85000" />
          </Field>
          <Field label="Data de Compra">
            <input type="date" value={form.data_compra} onChange={e => setForm(f => ({ ...f, data_compra: e.target.value }))}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 16, color: 'var(--c-text)', background: 'var(--c-surface)', fontFamily: 'inherit' }} />
          </Field>
          <Field label="Valor de Compra (R$)">
            <input className="c-form-input" value={form.valor_compra} onChange={e => setForm(f => ({ ...f, valor_compra: e.target.value }))} placeholder="45000,00" />
          </Field>
          <Field label="Foto Principal">
            <input type="file" accept="image/*" onChange={e => setFotoFile(e.target.files[0] || null)} />
            {editingVeiculo?.foto_principal_path && !fotoFile && <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>✓ Foto já anexada</div>}
          </Field>
          <Field label="Observações">
            <textarea className="c-form-textarea" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} />
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   RESUMO TAB
══════════════════════════════════════════════════════════════════════════ */
function ResumoTab({ veiculo }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const today = format(new Date(), 'yyyy-MM-dd')
      const plus30 = format(addDays(new Date(), 30), 'yyyy-MM-dd')

      const [gastosR, seguroR, manutR, docsR] = await Promise.allSettled([
        supabase.from('veiculos_gastos').select('valor').eq('veiculo_id', veiculo.id),
        supabase.from('veiculos_seguros').select('seguradora,data_termino,status').eq('veiculo_id', veiculo.id).order('data_termino', { ascending: false }).limit(1),
        supabase.from('veiculos_manutencoes').select('tipo,proxima_data,proxima_km').not('proxima_data', 'is', null).eq('veiculo_id', veiculo.id).gte('proxima_data', today).order('proxima_data').limit(1),
        supabase.from('veiculos_documentos').select('nome,data_validade').not('data_validade', 'is', null).lte('data_validade', plus30).gte('data_validade', today).eq('veiculo_id', veiculo.id),
      ])

      const gastos = gastosR.status === 'fulfilled' ? (gastosR.value.data || []) : []
      const seguro = seguroR.status === 'fulfilled' ? (seguroR.value.data || []) : []
      const manut = manutR.status === 'fulfilled' ? (manutR.value.data || []) : []
      const docs = docsR.status === 'fulfilled' ? (docsR.value.data || []) : []

      setStats({
        totalGastos: gastos.reduce((s, r) => s + Number(r.valor || 0), 0),
        seguro: seguro[0] || null,
        proximaManut: manut[0] || null,
        docsVencendo: docs,
      })
      setLoading(false)
    }
    load()
  }, [veiculo.id])

  if (loading) return <Loading />

  const infoRows = [
    ['Marca', veiculo.marca],
    ['Modelo', veiculo.modelo],
    ['Ano', veiculo.ano],
    ['Placa', veiculo.placa],
    ['Cor', veiculo.cor],
    ['RENAVAM', veiculo.renavam],
    ['Chassi', veiculo.chassi],
    ['Combustível', veiculo.combustivel],
    ['Quilometragem', veiculo.quilometragem ? `${Number(veiculo.quilometragem).toLocaleString('pt-BR')} km` : null],
    ['Data de Compra', veiculo.data_compra ? fmtDate(veiculo.data_compra) : null],
    ['Valor de Compra', veiculo.valor_compra ? fmtBRL(veiculo.valor_compra) : null],
    ['Observações', veiculo.observacoes],
  ].filter(([, v]) => v != null && v !== '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {stats?.docsVencendo?.length > 0 && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', color: '#854d0e', fontWeight: 600 }}>
          ⚠️ {stats.docsVencendo.length} documento(s) vencendo em breve: {stats.docsVencendo.map(d => d.nome).join(', ')}
        </div>
      )}

      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 14, padding: '18px 20px' }}>
        <div style={{ fontWeight: 700, marginBottom: 14, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', fontSize: 12 }}>Dados do Veículo</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {infoRows.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', gap: 12, fontSize: 14 }}>
              <span style={{ color: 'var(--c-text-muted)', minWidth: 130, flexShrink: 0 }}>{label}</span>
              <span style={{ fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 12 }}>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>💸</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1' }}>{fmtBRL(stats?.totalGastos)}</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Total em Gastos</div>
        </div>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🛡️</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: stats?.seguro ? '#10b981' : 'var(--c-text-muted)' }}>
            {stats?.seguro ? stats.seguro.seguradora : 'Sem seguro'}
          </div>
          {stats?.seguro?.data_termino && (
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Vence: {fmtDate(stats.seguro.data_termino)}</div>
          )}
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Seguro</div>
        </div>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '16px' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🔧</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: stats?.proximaManut ? '#d97706' : 'var(--c-text-muted)' }}>
            {stats?.proximaManut ? stats.proximaManut.tipo : 'Nenhuma'}
          </div>
          {stats?.proximaManut?.proxima_data && (
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{fmtDate(stats.proximaManut.proxima_data)}</div>
          )}
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Próx. Manutenção</div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   DOCUMENTAÇÃO TAB
══════════════════════════════════════════════════════════════════════════ */
function DocumentacaoTab({ veiculo }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null)
  const [form, setForm] = useState({ nome: '', tipo: DOC_TIPOS[0], data_emissao: '', data_validade: '', observacoes: '' })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [signedUrls, setSignedUrls] = useState({})

  const today = format(new Date(), 'yyyy-MM-dd')
  const plus30 = format(addDays(new Date(), 30), 'yyyy-MM-dd')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('veiculos_documentos').select('*').eq('veiculo_id', veiculo.id).order('data_validade', { ascending: true })
    const rows = data || []
    setDocs(rows)
    const urls = {}
    await Promise.all(rows.filter(d => d.arquivo_path).map(async d => {
      urls[d.id] = await getSignedUrl(d.arquivo_path)
    }))
    setSignedUrls(urls)
    setLoading(false)
  }, [veiculo.id])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditingDoc(null)
    setFile(null)
    setForm({ nome: '', tipo: DOC_TIPOS[0], data_emissao: '', data_validade: '', observacoes: '' })
    setShowForm(true)
  }

  function openEdit(d) {
    setEditingDoc(d)
    setFile(null)
    setForm({ nome: d.nome || '', tipo: d.tipo || DOC_TIPOS[0], data_emissao: d.data_emissao || '', data_validade: d.data_validade || '', observacoes: d.observacoes || '' })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.nome) return alert('Nome é obrigatório.')
    setSaving(true)
    try {
      let arquivo_path = editingDoc?.arquivo_path || null
      if (file) {
        if (arquivo_path) await deleteFile(arquivo_path)
        arquivo_path = await uploadFile(file, `documentos/${veiculo.id}`)
      }
      const payload = {
        veiculo_id: veiculo.id, nome: form.nome, tipo: form.tipo,
        data_emissao: form.data_emissao || null, data_validade: form.data_validade || null,
        observacoes: form.observacoes || null, arquivo_path
      }
      if (editingDoc) {
        const { error } = await supabase.from('veiculos_documentos').update(payload).eq('id', editingDoc.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('veiculos_documentos').insert(payload)
        if (error) throw error
      }
      setShowForm(false)
      await load()
    } catch (err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(d) {
    if (!confirm('Excluir este documento?')) return
    if (d.arquivo_path) await deleteFile(d.arquivo_path)
    await supabase.from('veiculos_documentos').delete().eq('id', d.id)
    await load()
  }

  function getValidadeStyle(validade) {
    if (!validade) return { color: '#64748b', bg: '#f1f5f9', label: 'Sem validade' }
    if (validade < today) return { color: '#dc2626', bg: '#fee2e2', label: `Vencido em ${fmtDate(validade)}` }
    if (validade <= plus30) return { color: '#854d0e', bg: '#fef9c3', label: `Vence em ${fmtDate(validade)}` }
    return { color: '#15803d', bg: '#dcfce7', label: `Válido até ${fmtDate(validade)}` }
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>📁 Documentos</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Documento</button>
      </div>

      {docs.length === 0 ? (
        <EmptyState icon="📁" title="Nenhum documento" desc="Adicione documentos do veículo." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {docs.map(d => {
            const vs = getValidadeStyle(d.data_validade)
            return (
              <div key={d.id} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700 }}>{d.nome}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#ede9fe', color: '#6366f1', fontWeight: 600 }}>{d.tipo}</span>
                  </div>
                  <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 99, background: vs.bg, color: vs.color, fontWeight: 600 }}>{vs.label}</span>
                  {d.data_emissao && <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 4 }}>Emissão: {fmtDate(d.data_emissao)}</div>}
                  {d.observacoes && <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 4 }}>{d.observacoes}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {d.arquivo_path && signedUrls[d.id] && (
                    <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => window.open(signedUrls[d.id], '_blank')}>PDF</button>
                  )}
                  <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => openEdit(d)}>Editar</button>
                  <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(d)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <ModalShell title={editingDoc ? 'Editar Documento' : 'Novo Documento'} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Nome *">
            <input className="c-form-input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: CRLV 2025" />
          </Field>
          <Field label="Tipo">
            <select className="c-form-select" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              {DOC_TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Data de Emissão">
            <input type="date" value={form.data_emissao} onChange={e => setForm(f => ({ ...f, data_emissao: e.target.value }))}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 16, color: 'var(--c-text)', background: 'var(--c-surface)', fontFamily: 'inherit' }} />
          </Field>
          <Field label="Data de Validade">
            <input type="date" value={form.data_validade} onChange={e => setForm(f => ({ ...f, data_validade: e.target.value }))}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 16, color: 'var(--c-text)', background: 'var(--c-surface)', fontFamily: 'inherit' }} />
          </Field>
          <Field label="Observações">
            <textarea className="c-form-textarea" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} />
          </Field>
          <Field label="Arquivo (PDF, imagem)">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0] || null)} />
            {editingDoc?.arquivo_path && !file && <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>✓ Arquivo já anexado</div>}
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MANUTENÇÕES TAB
══════════════════════════════════════════════════════════════════════════ */
function ManutencoesTab({ veiculo }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({ tipo: MANUT_TIPOS[0], data: '', quilometragem: '', valor: '', oficina: '', prestador: '', observacao: '', proxima_data: '', proxima_km: '' })
  const [saving, setSaving] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')
  const plus30 = format(addDays(new Date(), 30), 'yyyy-MM-dd')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('veiculos_manutencoes').select('*').eq('veiculo_id', veiculo.id).order('data', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }, [veiculo.id])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditingItem(null)
    setForm({ tipo: MANUT_TIPOS[0], data: '', quilometragem: '', valor: '', oficina: '', prestador: '', observacao: '', proxima_data: '', proxima_km: '' })
    setShowForm(true)
  }

  function openEdit(item) {
    setEditingItem(item)
    setForm({
      tipo: item.tipo || MANUT_TIPOS[0], data: item.data || '', quilometragem: item.quilometragem || '',
      valor: item.valor || '', oficina: item.oficina || '', prestador: item.prestador || '',
      observacao: item.observacao || '', proxima_data: item.proxima_data || '', proxima_km: item.proxima_km || ''
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.data) return alert('Data é obrigatória.')
    setSaving(true)
    try {
      const payload = {
        veiculo_id: veiculo.id, tipo: form.tipo, data: form.data,
        quilometragem: form.quilometragem ? Number(form.quilometragem) : null,
        valor: form.valor ? Number(String(form.valor).replace(/[^\d,\.]/g, '').replace(',', '.')) : null,
        oficina: form.oficina || null, prestador: form.prestador || null,
        observacao: form.observacao || null,
        proxima_data: form.proxima_data || null,
        proxima_km: form.proxima_km ? Number(form.proxima_km) : null,
      }
      if (editingItem) {
        const { error } = await supabase.from('veiculos_manutencoes').update(payload).eq('id', editingItem.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('veiculos_manutencoes').insert(payload)
        if (error) throw error
      }
      setShowForm(false)
      await load()
    } catch (err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(item) {
    if (!confirm('Excluir esta manutenção?')) return
    await supabase.from('veiculos_manutencoes').delete().eq('id', item.id)
    await load()
  }

  const alertItems = items.filter(i => i.proxima_data && i.proxima_data >= today && i.proxima_data <= plus30)

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>🔧 Manutenções</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Manutenção</button>
      </div>

      {alertItems.length > 0 && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#854d0e', fontWeight: 600 }}>
          ⚠️ {alertItems.length} manutenção(ões) próxima(s): {alertItems.map(i => `${i.tipo} (${fmtDate(i.proxima_data)})`).join(', ')}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon="🔧" title="Nenhuma manutenção" desc="Registre as manutenções do veículo." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => (
            <div key={item.id} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 18 }}>🔧</span>
                  <span style={{ fontWeight: 700 }}>{item.tipo}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--c-text-muted)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {item.data && <span>📅 {fmtDate(item.data)}</span>}
                  {item.quilometragem && <span>🛣️ {Number(item.quilometragem).toLocaleString('pt-BR')} km</span>}
                  {item.valor && <span>💰 {fmtBRL(item.valor)}</span>}
                  {item.oficina && <span>🏪 {item.oficina}</span>}
                </div>
                {(item.proxima_data || item.proxima_km) && (
                  <div style={{ fontSize: 12, color: '#854d0e', marginTop: 4, fontWeight: 600 }}>
                    Próxima: {item.proxima_data ? fmtDate(item.proxima_data) : ''}{item.proxima_data && item.proxima_km ? ' / ' : ''}{item.proxima_km ? `${Number(item.proxima_km).toLocaleString('pt-BR')} km` : ''}
                  </div>
                )}
                {item.observacao && <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 4 }}>{item.observacao}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => openEdit(item)}>Editar</button>
                <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(item)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ModalShell title={editingItem ? 'Editar Manutenção' : 'Nova Manutenção'} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Tipo">
            <select className="c-form-select" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              {MANUT_TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Data *">
            <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 16, color: 'var(--c-text)', background: 'var(--c-surface)', fontFamily: 'inherit' }} />
          </Field>
          <Field label="Quilometragem">
            <input className="c-form-input" type="number" value={form.quilometragem} onChange={e => setForm(f => ({ ...f, quilometragem: e.target.value }))} placeholder="85000" />
          </Field>
          <Field label="Valor (R$)">
            <input className="c-form-input" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="350,00" />
          </Field>
          <Field label="Oficina">
            <input className="c-form-input" value={form.oficina} onChange={e => setForm(f => ({ ...f, oficina: e.target.value }))} />
          </Field>
          <Field label="Prestador">
            <input className="c-form-input" value={form.prestador} onChange={e => setForm(f => ({ ...f, prestador: e.target.value }))} />
          </Field>
          <Field label="Observação">
            <textarea className="c-form-textarea" value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} rows={2} />
          </Field>
          <Field label="Próxima Manutenção (data)">
            <input type="date" value={form.proxima_data} onChange={e => setForm(f => ({ ...f, proxima_data: e.target.value }))}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 16, color: 'var(--c-text)', background: 'var(--c-surface)', fontFamily: 'inherit' }} />
          </Field>
          <Field label="Próxima Manutenção (km)">
            <input className="c-form-input" type="number" value={form.proxima_km} onChange={e => setForm(f => ({ ...f, proxima_km: e.target.value }))} placeholder="90000" />
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   ABASTECIMENTOS TAB
══════════════════════════════════════════════════════════════════════════ */
function AbastecimentosTab({ veiculo }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ data: '', combustivel: COMBUSTIVEIS[0], valor: '', litros: '', quilometragem: '', posto: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('veiculos_abastecimentos').select('*').eq('veiculo_id', veiculo.id).order('data', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }, [veiculo.id])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    if (!form.data) return alert('Data é obrigatória.')
    setSaving(true)
    try {
      const payload = {
        veiculo_id: veiculo.id, data: form.data, combustivel: form.combustivel,
        valor: form.valor ? Number(String(form.valor).replace(/[^\d,\.]/g, '').replace(',', '.')) : null,
        litros: form.litros ? Number(form.litros) : null,
        quilometragem: form.quilometragem ? Number(form.quilometragem) : null,
        posto: form.posto || null,
      }
      const { error } = await supabase.from('veiculos_abastecimentos').insert(payload)
      if (error) throw error
      setShowForm(false)
      setForm({ data: '', combustivel: COMBUSTIVEIS[0], valor: '', litros: '', quilometragem: '', posto: '' })
      await load()
    } catch (err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(item) {
    if (!confirm('Excluir este abastecimento?')) return
    await supabase.from('veiculos_abastecimentos').delete().eq('id', item.id)
    await load()
  }

  const totalLitros = items.reduce((s, i) => s + Number(i.litros || 0), 0)
  const totalGasto = items.reduce((s, i) => s + Number(i.valor || 0), 0)

  function calcConsumoMedio() {
    const withBoth = [...items].filter(i => i.quilometragem && i.litros).sort((a, b) => Number(a.quilometragem) - Number(b.quilometragem))
    if (withBoth.length < 2) return null
    let totalKm = 0, totalL = 0
    for (let i = 1; i < withBoth.length; i++) {
      const km = Number(withBoth[i].quilometragem) - Number(withBoth[i - 1].quilometragem)
      const l = Number(withBoth[i].litros)
      if (km > 0 && l > 0) { totalKm += km; totalL += l }
    }
    if (totalL === 0) return null
    return (totalKm / totalL).toFixed(1)
  }

  const consumoMedio = calcConsumoMedio()

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>⛽ Abastecimentos</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={() => setShowForm(true)}>+ Abastec.</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1' }}>{totalLitros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}L</div>
          <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>Total Litros</div>
        </div>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>{fmtBRL(totalGasto)}</div>
          <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>Total Gasto</div>
        </div>
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{consumoMedio ? `${consumoMedio} km/l` : 'N/D'}</div>
          <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>Consumo Médio</div>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="⛽" title="Nenhum abastecimento" desc="Registre os abastecimentos do veículo." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => (
            <div key={item.id} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>⛽ {item.combustivel}</div>
                <div style={{ fontSize: 13, color: 'var(--c-text-muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {item.data && <span>📅 {fmtDate(item.data)}</span>}
                  {item.litros && <span>{Number(item.litros).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}L</span>}
                  {item.valor && <span>{fmtBRL(item.valor)}</span>}
                  {item.quilometragem && <span>🛣️ {Number(item.quilometragem).toLocaleString('pt-BR')} km</span>}
                  {item.posto && <span>📍 {item.posto}</span>}
                </div>
              </div>
              <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(item)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ModalShell title="Novo Abastecimento" onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Data *">
            <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 16, color: 'var(--c-text)', background: 'var(--c-surface)', fontFamily: 'inherit' }} />
          </Field>
          <Field label="Combustível">
            <select className="c-form-select" value={form.combustivel} onChange={e => setForm(f => ({ ...f, combustivel: e.target.value }))}>
              {COMBUSTIVEIS.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Valor (R$)">
            <input className="c-form-input" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="150,00" />
          </Field>
          <Field label="Litros">
            <input className="c-form-input" type="number" step="0.01" value={form.litros} onChange={e => setForm(f => ({ ...f, litros: e.target.value }))} placeholder="40.5" />
          </Field>
          <Field label="Quilometragem">
            <input className="c-form-input" type="number" value={form.quilometragem} onChange={e => setForm(f => ({ ...f, quilometragem: e.target.value }))} placeholder="85000" />
          </Field>
          <Field label="Posto">
            <input className="c-form-input" value={form.posto} onChange={e => setForm(f => ({ ...f, posto: e.target.value }))} placeholder="Nome do posto" />
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   GASTOS TAB
══════════════════════════════════════════════════════════════════════════ */
function GastosTab({ veiculo }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({ descricao: '', categoria: GASTO_CATS[0], valor: '', data: '', observacao: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('veiculos_gastos').select('*').eq('veiculo_id', veiculo.id).order('data', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }, [veiculo.id])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditingItem(null)
    setForm({ descricao: '', categoria: GASTO_CATS[0], valor: '', data: '', observacao: '' })
    setShowForm(true)
  }

  function openEdit(item) {
    setEditingItem(item)
    setForm({ descricao: item.descricao || '', categoria: item.categoria || GASTO_CATS[0], valor: item.valor || '', data: item.data || '', observacao: item.observacao || '' })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.descricao) return alert('Descrição é obrigatória.')
    setSaving(true)
    try {
      const payload = {
        veiculo_id: veiculo.id, descricao: form.descricao, categoria: form.categoria,
        valor: form.valor ? Number(String(form.valor).replace(/[^\d,\.]/g, '').replace(',', '.')) : null,
        data: form.data || null, observacao: form.observacao || null,
      }
      if (editingItem) {
        const { error } = await supabase.from('veiculos_gastos').update(payload).eq('id', editingItem.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('veiculos_gastos').insert(payload)
        if (error) throw error
      }
      setShowForm(false)
      await load()
    } catch (err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(item) {
    if (!confirm('Excluir este gasto?')) return
    await supabase.from('veiculos_gastos').delete().eq('id', item.id)
    await load()
  }

  const total = items.reduce((s, i) => s + Number(i.valor || 0), 0)

  const byCategory = GASTO_CATS.map(cat => ({
    cat,
    total: items.filter(i => i.categoria === cat).reduce((s, i) => s + Number(i.valor || 0), 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const maxCatTotal = byCategory[0]?.total || 1

  const CAT_COLORS = {
    'Combustível': '#f59e0b', 'Seguro': '#10b981', 'IPVA': '#6366f1', 'Licenciamento': '#3b82f6',
    'Multa': '#ef4444', 'Pneus': '#8b5cf6', 'Manutenção': '#ec4899', 'Estacionamento': '#14b8a6',
    'Lavagem': '#06b6d4', 'Acessórios': '#f97316', 'Outros': '#64748b'
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>💸 Gastos</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Gasto</button>
      </div>

      <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 14, padding: '18px 20px', marginBottom: 20, color: '#fff' }}>
        <div style={{ fontSize: 13, opacity: .85 }}>Total em Gastos</div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>{fmtBRL(total)}</div>
      </div>

      {byCategory.length > 0 && (
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 12, color: 'var(--c-text-muted)', textTransform: 'uppercase' }}>Por Categoria</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {byCategory.map(c => (
              <div key={c.cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                  <span style={{ fontWeight: 600 }}>{c.cat}</span>
                  <span style={{ color: 'var(--c-text-muted)' }}>{fmtBRL(c.total)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: 'var(--c-border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, width: `${(c.total / maxCatTotal) * 100}%`, background: CAT_COLORS[c.cat] || '#6366f1' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon="💸" title="Nenhum gasto" desc="Registre os gastos do veículo." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => (
            <div key={item.id} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700 }}>{item.descricao}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#ede9fe', color: '#6366f1', fontWeight: 600 }}>{item.categoria}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1' }}>{fmtBRL(item.valor)}</div>
                {item.data && <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>{fmtDate(item.data)}</div>}
                {item.observacao && <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>{item.observacao}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => openEdit(item)}>Editar</button>
                <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(item)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ModalShell title={editingItem ? 'Editar Gasto' : 'Novo Gasto'} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Descrição *">
            <input className="c-form-input" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Revisão 50.000 km" />
          </Field>
          <Field label="Categoria">
            <select className="c-form-select" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
              {GASTO_CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Valor (R$)">
            <input className="c-form-input" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="500,00" />
          </Field>
          <Field label="Data">
            <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 16, color: 'var(--c-text)', background: 'var(--c-surface)', fontFamily: 'inherit' }} />
          </Field>
          <Field label="Observação">
            <textarea className="c-form-textarea" value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} rows={2} />
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   SEGURO TAB
══════════════════════════════════════════════════════════════════════════ */
function SeguroTab({ veiculo }) {
  const [seguros, setSeguros] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSeguro, setEditingSeguro] = useState(null)
  const [form, setForm] = useState({ seguradora: '', numero_apolice: '', valor: '', data_inicio: '', data_termino: '', franquia: '', observacoes: '' })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [signedUrls, setSignedUrls] = useState({})

  const today = format(new Date(), 'yyyy-MM-dd')
  const plus30 = format(addDays(new Date(), 30), 'yyyy-MM-dd')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('veiculos_seguros').select('*').eq('veiculo_id', veiculo.id).order('data_termino', { ascending: false })
    const rows = data || []
    setSeguros(rows)
    const urls = {}
    await Promise.all(rows.filter(s => s.arquivo_path).map(async s => {
      urls[s.id] = await getSignedUrl(s.arquivo_path)
    }))
    setSignedUrls(urls)
    setLoading(false)
  }, [veiculo.id])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditingSeguro(null)
    setFile(null)
    setForm({ seguradora: '', numero_apolice: '', valor: '', data_inicio: '', data_termino: '', franquia: '', observacoes: '' })
    setShowForm(true)
  }

  function openEdit(s) {
    setEditingSeguro(s)
    setFile(null)
    setForm({ seguradora: s.seguradora || '', numero_apolice: s.numero_apolice || '', valor: s.valor || '', data_inicio: s.data_inicio || '', data_termino: s.data_termino || '', franquia: s.franquia || '', observacoes: s.observacoes || '' })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.seguradora) return alert('Seguradora é obrigatória.')
    setSaving(true)
    try {
      let arquivo_path = editingSeguro?.arquivo_path || null
      if (file) {
        if (arquivo_path) await deleteFile(arquivo_path)
        arquivo_path = await uploadFile(file, `seguros/${veiculo.id}`)
      }
      const payload = {
        veiculo_id: veiculo.id, seguradora: form.seguradora,
        numero_apolice: form.numero_apolice || null,
        valor: form.valor ? Number(String(form.valor).replace(/[^\d,\.]/g, '').replace(',', '.')) : null,
        data_inicio: form.data_inicio || null, data_termino: form.data_termino || null,
        franquia: form.franquia ? Number(String(form.franquia).replace(/[^\d,\.]/g, '').replace(',', '.')) : null,
        observacoes: form.observacoes || null, arquivo_path,
      }
      if (editingSeguro) {
        const { error } = await supabase.from('veiculos_seguros').update(payload).eq('id', editingSeguro.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('veiculos_seguros').insert(payload)
        if (error) throw error
      }
      setShowForm(false)
      await load()
    } catch (err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(s) {
    if (!confirm('Excluir este seguro?')) return
    if (s.arquivo_path) await deleteFile(s.arquivo_path)
    await supabase.from('veiculos_seguros').delete().eq('id', s.id)
    await load()
  }

  function getStatus(termino) {
    if (!termino) return { label: 'Sem validade', bg: '#f1f5f9', color: '#64748b' }
    if (termino < today) return { label: 'Expirado', bg: '#fee2e2', color: '#dc2626' }
    if (termino <= plus30) return { label: 'Vencendo', bg: '#fef9c3', color: '#854d0e' }
    return { label: 'Ativo', bg: '#dcfce7', color: '#15803d' }
  }

  const featured = seguros.find(s => s.data_termino && s.data_termino >= today) || seguros[0]

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>🛡️ Seguro</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Seguro</button>
      </div>

      {seguros.length === 0 ? (
        <EmptyState icon="🛡️" title="Nenhum seguro" desc="Adicione o seguro do veículo." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {featured && (() => {
            const st = getStatus(featured.data_termino)
            return (
              <div style={{ background: 'var(--c-surface)', border: '2px solid #6366f1', borderRadius: 14, padding: '18px 20px', marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6 }}>🛡️ {featured.seguradora}</div>
                    {featured.numero_apolice && <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 4 }}>Apólice: {featured.numero_apolice}</div>}
                    {featured.valor && <div style={{ fontSize: 20, fontWeight: 700, color: '#6366f1', marginBottom: 4 }}>{fmtBRL(featured.valor)}</div>}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                      {featured.data_inicio && <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Início: {fmtDate(featured.data_inicio)}</span>}
                      {featured.data_termino && <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Término: {fmtDate(featured.data_termino)}</span>}
                    </div>
                    {featured.franquia && <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 4 }}>Franquia: {fmtBRL(featured.franquia)}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    <span style={{ background: st.bg, color: st.color, padding: '4px 12px', borderRadius: 99, fontSize: 13, fontWeight: 700 }}>{st.label}</span>
                    {featured.arquivo_path && signedUrls[featured.id] && (
                      <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => window.open(signedUrls[featured.id], '_blank')}>📄 Apólice</button>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => openEdit(featured)}>Editar</button>
                      <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(featured)}>✕</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {seguros.filter(s => s.id !== featured?.id).map(s => {
            const st = getStatus(s.data_termino)
            return (
              <div key={s.id} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700 }}>{s.seguradora}</span>
                    <span style={{ background: st.bg, color: st.color, padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
                    {s.data_inicio ? `${fmtDate(s.data_inicio)} → ` : ''}{s.data_termino ? fmtDate(s.data_termino) : ''}
                    {s.valor ? ` · ${fmtBRL(s.valor)}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {s.arquivo_path && signedUrls[s.id] && (
                    <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => window.open(signedUrls[s.id], '_blank')}>PDF</button>
                  )}
                  <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => openEdit(s)}>Editar</button>
                  <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(s)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <ModalShell title={editingSeguro ? 'Editar Seguro' : 'Novo Seguro'} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Seguradora *">
            <input className="c-form-input" value={form.seguradora} onChange={e => setForm(f => ({ ...f, seguradora: e.target.value }))} placeholder="Ex: Porto Seguro" />
          </Field>
          <Field label="Número da Apólice">
            <input className="c-form-input" value={form.numero_apolice} onChange={e => setForm(f => ({ ...f, numero_apolice: e.target.value }))} />
          </Field>
          <Field label="Valor (R$)">
            <input className="c-form-input" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="3500,00" />
          </Field>
          <Field label="Data de Início">
            <input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 16, color: 'var(--c-text)', background: 'var(--c-surface)', fontFamily: 'inherit' }} />
          </Field>
          <Field label="Data de Término">
            <input type="date" value={form.data_termino} onChange={e => setForm(f => ({ ...f, data_termino: e.target.value }))}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 16, color: 'var(--c-text)', background: 'var(--c-surface)', fontFamily: 'inherit' }} />
          </Field>
          <Field label="Franquia (R$)">
            <input className="c-form-input" value={form.franquia} onChange={e => setForm(f => ({ ...f, franquia: e.target.value }))} placeholder="2000,00" />
          </Field>
          <Field label="Observações">
            <textarea className="c-form-textarea" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} />
          </Field>
          <Field label="Arquivo da Apólice">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0] || null)} />
            {editingSeguro?.arquivo_path && !file && <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>✓ Arquivo já anexado</div>}
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   FOTOS TAB
══════════════════════════════════════════════════════════════════════════ */
function FotosTab({ veiculo }) {
  const [fotos, setFotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [album, setAlbum] = useState(FOTO_ALBUMS[0])
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [signedUrls, setSignedUrls] = useState({})
  const [lightbox, setLightbox] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('veiculos_fotos').select('*').eq('veiculo_id', veiculo.id).order('created_at', { ascending: false })
    const rows = data || []
    setFotos(rows)
    const urls = {}
    await Promise.all(rows.map(async f => {
      if (f.storage_path) urls[f.id] = await getSignedUrl(f.storage_path)
    }))
    setSignedUrls(urls)
    setLoading(false)
  }, [veiculo.id])

  useEffect(() => { load() }, [load])

  async function handleUpload() {
    if (!files.length) return alert('Selecione ao menos uma foto.')
    setUploading(true)
    try {
      await Promise.all(Array.from(files).map(async file => {
        const path = await uploadFile(file, `fotos/${veiculo.id}/${album.toLowerCase()}`)
        const { error } = await supabase.from('veiculos_fotos').insert({ veiculo_id: veiculo.id, storage_path: path, album })
        if (error) throw error
      }))
      setShowUpload(false)
      setFiles([])
      setAlbum(FOTO_ALBUMS[0])
      await load()
    } catch (err) { alert(err.message) } finally { setUploading(false) }
  }

  async function handleDelete(foto) {
    if (!confirm('Excluir esta foto?')) return
    if (foto.storage_path) await deleteFile(foto.storage_path)
    await supabase.from('veiculos_fotos').delete().eq('id', foto.id)
    await load()
  }

  const byAlbum = FOTO_ALBUMS.map(a => ({ album: a, items: fotos.filter(f => f.album === a) })).filter(g => g.items.length > 0)

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>📸 Fotos</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={() => setShowUpload(true)}>+ Fotos</button>
      </div>

      {fotos.length === 0 ? (
        <EmptyState icon="📸" title="Nenhuma foto" desc="Adicione fotos do veículo." />
      ) : (
        byAlbum.map(g => (
          <div key={g.album} style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: 'var(--c-text-muted)' }}>{g.album}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 6 }}>
              {g.items.map(f => (
                <div key={f.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: 'var(--c-surface)', border: '1px solid var(--c-border)', aspectRatio: '1/1' }}
                  onMouseEnter={e => { const btn = e.currentTarget.querySelector('.del-btn'); if (btn) btn.style.opacity = '1' }}
                  onMouseLeave={e => { const btn = e.currentTarget.querySelector('.del-btn'); if (btn) btn.style.opacity = '0' }}>
                  {signedUrls[f.id] ? (
                    <img src={signedUrls[f.id]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block' }}
                      onClick={() => setLightbox(signedUrls[f.id])} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>📷</div>
                  )}
                  <button className="del-btn" onClick={() => handleDelete(f)}
                    style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.55)', color: '#fff', border: 'none', borderRadius: 99, width: 26, height: 26, cursor: 'pointer', fontSize: 13, opacity: 0, transition: 'opacity .2s' }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <img src={lightbox} alt="" style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {showUpload && (
        <ModalShell
          title="Adicionar Fotos"
          onClose={() => setShowUpload(false)}
          onSave={handleUpload}
          saving={uploading}
          saveLabel={uploading ? 'Enviando...' : `Enviar${files.length > 1 ? ` (${files.length})` : ''}`}
        >
          <Field label="Álbum">
            <select className="c-form-select" value={album} onChange={e => setAlbum(e.target.value)}>
              {FOTO_ALBUMS.map(a => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Fotos *">
            <input type="file" accept="image/*" multiple onChange={e => setFiles(Array.from(e.target.files))} />
            {files.length > 1 && <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 4 }}>{files.length} fotos selecionadas</div>}
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   HISTÓRICO TAB
══════════════════════════════════════════════════════════════════════════ */
function HistoricoTab({ veiculo }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [manutR, abastR, docsR, gastosR, segurosR] = await Promise.allSettled([
        supabase.from('veiculos_manutencoes').select('id,data,tipo,valor').eq('veiculo_id', veiculo.id),
        supabase.from('veiculos_abastecimentos').select('id,data,combustivel,litros,valor').eq('veiculo_id', veiculo.id),
        supabase.from('veiculos_documentos').select('id,data_emissao,nome,tipo').eq('veiculo_id', veiculo.id),
        supabase.from('veiculos_gastos').select('id,data,descricao,categoria,valor').eq('veiculo_id', veiculo.id),
        supabase.from('veiculos_seguros').select('id,data_inicio,seguradora,valor').eq('veiculo_id', veiculo.id),
      ])

      const all = []

      const manutData = manutR.status === 'fulfilled' ? (manutR.value.data || []) : []
      manutData.forEach(r => all.push({ id: `m${r.id}`, date: r.data, icon: '🔧', iconColor: '#ec4899', desc: r.tipo, sub: r.valor }))

      const abastData = abastR.status === 'fulfilled' ? (abastR.value.data || []) : []
      abastData.forEach(r => all.push({ id: `a${r.id}`, date: r.data, icon: '⛽', iconColor: '#f59e0b', desc: `${r.combustivel || ''}${r.litros ? ' ' + r.litros + 'L' : ''}`.trim(), sub: r.valor }))

      const docsData = docsR.status === 'fulfilled' ? (docsR.value.data || []) : []
      docsData.forEach(r => all.push({ id: `d${r.id}`, date: r.data_emissao, icon: '📑', iconColor: '#3b82f6', desc: `${r.nome} (${r.tipo})`, sub: null }))

      const gastosData = gastosR.status === 'fulfilled' ? (gastosR.value.data || []) : []
      gastosData.forEach(r => all.push({ id: `g${r.id}`, date: r.data, icon: '💸', iconColor: '#6366f1', desc: `${r.descricao} (${r.categoria})`, sub: r.valor }))

      const segurosData = segurosR.status === 'fulfilled' ? (segurosR.value.data || []) : []
      segurosData.forEach(r => all.push({ id: `s${r.id}`, date: r.data_inicio, icon: '🛡️', iconColor: '#10b981', desc: `Seguro ${r.seguradora}`, sub: r.valor }))

      all.sort((a, b) => {
        if (!a.date && !b.date) return 0
        if (!a.date) return 1
        if (!b.date) return -1
        return b.date.localeCompare(a.date)
      })

      setEvents(all)
      setLoading(false)
    }
    load()
  }, [veiculo.id])

  if (loading) return <Loading />

  if (events.length === 0) return <EmptyState icon="📈" title="Nenhum histórico" desc="Os registros do veículo aparecerão aqui." />

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>📈 Histórico</div>
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: 'var(--c-border)', borderRadius: 1 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {events.map(ev => (
            <div key={ev.id} style={{ position: 'relative', paddingLeft: 16 }}>
              <div style={{ position: 'absolute', left: -20, top: 6, width: 10, height: 10, borderRadius: '50%', background: ev.iconColor, border: '2px solid var(--c-surface)' }} />
              <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 2 }}>{ev.date ? fmtDate(ev.date) : 'Sem data'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{ev.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{ev.desc}</span>
              </div>
              {ev.sub != null && Number(ev.sub) > 0 && (
                <div style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, marginTop: 2 }}>{fmtBRL(ev.sub)}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   VEICULO DETAIL
══════════════════════════════════════════════════════════════════════════ */
function VeiculoDetail({ veiculo, onBack, onUpdated }) {
  const [tab, setTab] = useState('resumo')
  const [fotoUrl, setFotoUrl] = useState(null)

  useEffect(() => {
    async function loadFoto() {
      if (veiculo.foto_principal_path) {
        const url = await getSignedUrl(veiculo.foto_principal_path)
        setFotoUrl(url)
      } else {
        setFotoUrl(null)
      }
    }
    loadFoto()
  }, [veiculo])

  const tabs = [
    ['resumo', '📊 Resumo'],
    ['documentacao', '📁 Docs'],
    ['manutencoes', '🔧 Manutenções'],
    ['abastecimentos', '⛽ Abastec.'],
    ['gastos', '💸 Gastos'],
    ['seguro', '🛡️ Seguro'],
    ['fotos', '📸 Fotos'],
    ['historico', '📈 Histórico'],
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <button className="c-btn c-btn-secondary" onClick={onBack}>← Veículos</button>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: '#6366f120', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
          {fotoUrl ? <img src={fotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={veiculo.modelo} /> : '🚗'}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{veiculo.marca} {veiculo.modelo}</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {veiculo.ano && <span style={{ background: '#6366f120', color: '#6366f1', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>{veiculo.ano}</span>}
            {veiculo.placa && <span style={{ background: '#f8fafc', border: '1px solid var(--c-border)', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>{veiculo.placa}</span>}
            {veiculo.cor && <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>● {veiculo.cor}</span>}
            {veiculo.combustivel && <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>⛽ {veiculo.combustivel}</span>}
          </div>
          {veiculo.quilometragem && <div style={{ marginTop: 4, fontSize: 13, color: 'var(--c-text-muted)' }}>🛣️ {Number(veiculo.quilometragem).toLocaleString('pt-BR')} km</div>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, marginBottom: 20, borderBottom: '2px solid var(--c-border)' }}>
        {tabs.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ whiteSpace: 'nowrap', padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: tab === key ? 700 : 500, fontSize: 13, background: tab === key ? '#6366f1' : 'transparent', color: tab === key ? '#fff' : 'var(--c-text-muted)' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'resumo' && <ResumoTab veiculo={veiculo} />}
      {tab === 'documentacao' && <DocumentacaoTab veiculo={veiculo} />}
      {tab === 'manutencoes' && <ManutencoesTab veiculo={veiculo} />}
      {tab === 'abastecimentos' && <AbastecimentosTab veiculo={veiculo} />}
      {tab === 'gastos' && <GastosTab veiculo={veiculo} />}
      {tab === 'seguro' && <SeguroTab veiculo={veiculo} />}
      {tab === 'fotos' && <FotosTab veiculo={veiculo} />}
      {tab === 'historico' && <HistoricoTab veiculo={veiculo} />}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════════════ */
export default function Veiculos() {
  const [selected, setSelected] = useState(null)
  if (selected) return <VeiculoDetail veiculo={selected} onBack={() => setSelected(null)} onUpdated={v => setSelected(v)} />
  return <VeiculosList onSelect={setSelected} />
}
