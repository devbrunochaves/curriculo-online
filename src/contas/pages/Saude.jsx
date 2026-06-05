import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO, differenceInDays, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/* ── Constants ─────────────────────────────────────────────────────────── */
const TIPOS_SANGUINEOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const ESPECIALIDADES = ['Clínico Geral', 'Cardiologista', 'Dermatologista', 'Dentista', 'Endocrinologista', 'Gastroenterologista', 'Ginecologista', 'Neurologista', 'Nutricionista', 'Oftalmologista', 'Ortopedista', 'Otorrinolaringologista', 'Pediatra', 'Psicólogo', 'Psiquiatra', 'Urologista', 'Outro']
const TIPOS_EXAME = ['Hemograma', 'Exame de sangue', 'Raio-X', 'Ultrassom', 'Tomografia', 'Ressonância magnética', 'Endoscopia', 'Colonoscopia', 'Eletrocardiograma', 'Preventivo', 'Mamografia', 'Densitometria', 'Outro']
const FREQUENCIAS = ['1x ao dia', '2x ao dia', '3x ao dia', 'A cada 8h', 'A cada 12h', 'Semanal', 'Quinzenal', 'Mensal', 'Conforme necessário']
const DOC_TIPOS = ['Cartão SUS', 'Cartão Convênio', 'Carteira de Vacinação', 'Laudo Médico', 'Relatório Médico', 'Receita', 'Outro']

/* ── Helpers ───────────────────────────────────────────────────────────── */
const fmtBRL = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = d => d ? format(parseISO(d), 'dd/MM/yyyy') : '—'

function calcAge(dataNasc) {
  if (!dataNasc) return null
  return Math.floor(differenceInDays(new Date(), parseISO(dataNasc)) / 365.25)
}

async function getSignedUrl(path) {
  if (!path) return null
  const { data } = await supabase.storage.from('saude').createSignedUrl(path, 3600)
  return data?.signedUrl || null
}

async function uploadFile(file, folder = 'geral') {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('saude').upload(path, file)
  if (error) throw error
  return path
}

async function deleteFile(path) {
  if (!path) return
  await supabase.storage.from('saude').remove([path])
}

/* ── Shared UI ─────────────────────────────────────────────────────────── */
const dateInputStyle = {
  display: 'block', width: '100%', boxSizing: 'border-box', padding: '9px 12px',
  border: '1.5px solid var(--c-border)', borderRadius: 8, fontSize: 16,
  color: 'var(--c-text)', background: 'var(--c-surface)', fontFamily: 'inherit'
}

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
   SAUDE DASHBOARD
══════════════════════════════════════════════════════════════════════════ */
function SaudeDashboard({ onSelect }) {
  const [pessoas, setPessoas] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ membros: 0, consultas: 0, medicamentos: 0, exames: 0, vacinas: 0 })
  const [showForm, setShowForm] = useState(false)
  const [editingPessoa, setEditingPessoa] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: '', data_nascimento: '', tipo_sanguineo: '', peso: '', altura: '',
    convenio: '', numero_convenio: '', contato_emergencia: '', alergias: '', observacoes: ''
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const plus7 = format(addDays(new Date(), 7), 'yyyy-MM-dd')
      const plus30 = format(addDays(new Date(), 30), 'yyyy-MM-dd')

      const [pessoasR, consultasR, medicamentosR, examesR, vacinasR] = await Promise.allSettled([
        supabase.from('saude_pessoas').select('*').order('nome'),
        supabase.from('saude_consultas').select('*').gte('data', today).lte('data', plus7).order('data').order('hora'),
        supabase.from('saude_medicamentos').select('*').eq('ativo', true),
        supabase.from('saude_exames').select('id').limit(100),
        supabase.from('saude_vacinas').select('*').not('proxima_dose', 'is', null).lte('proxima_dose', plus30).gte('proxima_dose', today),
      ])

      const rows = pessoasR.status === 'fulfilled' ? (pessoasR.value.data || []) : []
      setPessoas(rows)

      const consultas = consultasR.status === 'fulfilled' ? (consultasR.value.data || []) : []
      const medicamentos = medicamentosR.status === 'fulfilled' ? (medicamentosR.value.data || []) : []
      const exames = examesR.status === 'fulfilled' ? (examesR.value.data || []) : []
      const vacinas = vacinasR.status === 'fulfilled' ? (vacinasR.value.data || []) : []

      setSummary({
        membros: rows.length,
        consultas: consultas.length,
        medicamentos: medicamentos.length,
        exames: exames.length,
        vacinas: vacinas.length,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditingPessoa(null)
    setForm({ nome: '', data_nascimento: '', tipo_sanguineo: '', peso: '', altura: '', convenio: '', numero_convenio: '', contato_emergencia: '', alergias: '', observacoes: '' })
    setShowForm(true)
  }

  function openEdit(p) {
    setEditingPessoa(p)
    setForm({
      nome: p.nome || '', data_nascimento: p.data_nascimento || '', tipo_sanguineo: p.tipo_sanguineo || '',
      peso: p.peso || '', altura: p.altura || '', convenio: p.convenio || '',
      numero_convenio: p.numero_convenio || '', contato_emergencia: p.contato_emergencia || '',
      alergias: p.alergias || '', observacoes: p.observacoes || ''
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.nome) return alert('Nome é obrigatório.')
    setSaving(true)
    try {
      const payload = {
        nome: form.nome,
        data_nascimento: form.data_nascimento || null,
        tipo_sanguineo: form.tipo_sanguineo || null,
        peso: form.peso ? Number(form.peso) : null,
        altura: form.altura ? Number(form.altura) : null,
        convenio: form.convenio || null,
        numero_convenio: form.numero_convenio || null,
        contato_emergencia: form.contato_emergencia || null,
        alergias: form.alergias || null,
        observacoes: form.observacoes || null,
      }
      if (editingPessoa) {
        const { error } = await supabase.from('saude_pessoas').update(payload).eq('id', editingPessoa.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('saude_pessoas').insert(payload)
        if (error) throw error
      }
      setShowForm(false)
      await load()
    } catch (err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(p) {
    if (!confirm(`Excluir ${p.nome}? Esta ação não pode ser desfeita.`)) return
    await supabase.from('saude_pessoas').delete().eq('id', p.id)
    await load()
  }

  const summaryCards = [
    { icon: '❤️', label: 'Membros', value: summary.membros, color: '#ec4899' },
    { icon: '🏥', label: 'Próximas consultas', value: summary.consultas, color: '#6366f1' },
    { icon: '💊', label: 'Medicamentos ativos', value: summary.medicamentos, color: '#f97316' },
    { icon: '📄', label: 'Exames', value: summary.exames, color: '#3b82f6' },
    { icon: '💉', label: 'Vacinas vencendo', value: summary.vacinas, color: summary.vacinas > 0 ? '#d97706' : '#10b981' },
  ]

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>❤️ Saúde</h2>
        <button className="c-btn c-btn-primary" onClick={openNew}>+ Pessoa</button>
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

      {pessoas.length === 0 ? (
        <EmptyState icon="❤️" title="Nenhum membro cadastrado" desc="Adicione um membro da família para começar." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pessoas.map(p => {
            const age = calcAge(p.data_nascimento)
            return (
              <div key={p.id} className="c-card"
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer' }}
                onClick={() => onSelect(p)}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {p.nome.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p.nome}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    {p.data_nascimento && (
                      <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
                        {fmtDate(p.data_nascimento)}{age != null ? ` · ${age} anos` : ''}
                      </span>
                    )}
                    {p.tipo_sanguineo && (
                      <span style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{p.tipo_sanguineo}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--c-text-muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {p.convenio && <span>🏥 {p.convenio}</span>}
                    {p.alergias && <span style={{ color: '#dc2626' }}>⚠️ {p.alergias}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => openEdit(p)}>Editar</button>
                  <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(p)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button className="c-fab-nova" style={{ display: 'none' }} onClick={openNew}>+</button>

      {showForm && (
        <ModalShell
          title={editingPessoa ? 'Editar Pessoa' : 'Nova Pessoa'}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
          saving={saving}
        >
          <Field label="Nome *">
            <input className="c-form-input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Maria Silva" />
          </Field>
          <Field label="Data de Nascimento">
            <input type="date" value={form.data_nascimento} onChange={e => setForm(f => ({ ...f, data_nascimento: e.target.value }))} style={dateInputStyle} />
          </Field>
          <Field label="Tipo Sanguíneo">
            <select className="c-form-select" value={form.tipo_sanguineo} onChange={e => setForm(f => ({ ...f, tipo_sanguineo: e.target.value }))}>
              <option value="">Selecione...</option>
              {TIPOS_SANGUINEOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Peso (kg)">
            <input className="c-form-input" type="number" step="0.1" value={form.peso} onChange={e => setForm(f => ({ ...f, peso: e.target.value }))} placeholder="70" />
          </Field>
          <Field label="Altura (cm)">
            <input className="c-form-input" type="number" value={form.altura} onChange={e => setForm(f => ({ ...f, altura: e.target.value }))} placeholder="170" />
          </Field>
          <Field label="Convênio">
            <input className="c-form-input" value={form.convenio} onChange={e => setForm(f => ({ ...f, convenio: e.target.value }))} placeholder="Ex: Unimed" />
          </Field>
          <Field label="Número do Convênio">
            <input className="c-form-input" value={form.numero_convenio} onChange={e => setForm(f => ({ ...f, numero_convenio: e.target.value }))} />
          </Field>
          <Field label="Contato de Emergência">
            <input className="c-form-input" value={form.contato_emergencia} onChange={e => setForm(f => ({ ...f, contato_emergencia: e.target.value }))} placeholder="Nome e telefone" />
          </Field>
          <Field label="Alergias">
            <textarea className="c-form-textarea" value={form.alergias} onChange={e => setForm(f => ({ ...f, alergias: e.target.value }))} rows={2} placeholder="Ex: Dipirona, amendoim..." />
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
function ResumoTab({ pessoa, onEdit }) {
  const infoRows = [
    ['Nome', pessoa.nome],
    ['Data de Nascimento', pessoa.data_nascimento ? `${fmtDate(pessoa.data_nascimento)} (${calcAge(pessoa.data_nascimento)} anos)` : null],
    ['Tipo Sanguíneo', pessoa.tipo_sanguineo],
    ['Peso', pessoa.peso ? `${pessoa.peso} kg` : null],
    ['Altura', pessoa.altura ? `${pessoa.altura} cm` : null],
    ['Convênio', pessoa.convenio],
    ['Número do Convênio', pessoa.numero_convenio],
    ['Contato de Emergência', pessoa.contato_emergencia],
    ['Alergias', pessoa.alergias],
    ['Observações', pessoa.observacoes],
  ].filter(([, v]) => v != null && v !== '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="c-btn c-btn-secondary" onClick={onEdit}>✏️ Editar perfil</button>
      </div>

      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 14, padding: '18px 20px' }}>
        <div style={{ fontWeight: 700, marginBottom: 14, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', fontSize: 12 }}>Dados da Pessoa</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {infoRows.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', gap: 12, fontSize: 14 }}>
              <span style={{ color: 'var(--c-text-muted)', minWidth: 160, flexShrink: 0 }}>{label}</span>
              <span style={{ fontWeight: 500, color: label === 'Alergias' ? '#dc2626' : 'inherit' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   CONSULTAS TAB
══════════════════════════════════════════════════════════════════════════ */
function ConsultasTab({ pessoa }) {
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingConsulta, setEditingConsulta] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ especialidade: ESPECIALIDADES[0], medico: '', clinica: '', data: '', hora: '', local: '', observacoes: '', retorno: '' })

  const today = format(new Date(), 'yyyy-MM-dd')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('saude_consultas').select('*').eq('pessoa_id', pessoa.id).order('data', { ascending: false })
    setConsultas(data || [])
    setLoading(false)
  }, [pessoa.id])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditingConsulta(null)
    setForm({ especialidade: ESPECIALIDADES[0], medico: '', clinica: '', data: '', hora: '', local: '', observacoes: '', retorno: '' })
    setShowForm(true)
  }

  function openEdit(c) {
    setEditingConsulta(c)
    setForm({
      especialidade: c.especialidade || ESPECIALIDADES[0], medico: c.medico || '',
      clinica: c.clinica || '', data: c.data || '', hora: c.hora || '',
      local: c.local || '', observacoes: c.observacoes || '', retorno: c.retorno || ''
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.data) return alert('Data é obrigatória.')
    setSaving(true)
    try {
      const payload = {
        pessoa_id: pessoa.id,
        especialidade: form.especialidade,
        medico: form.medico || null,
        clinica: form.clinica || null,
        data: form.data,
        hora: form.hora || null,
        local: form.local || null,
        observacoes: form.observacoes || null,
        retorno: form.retorno || null,
      }
      if (editingConsulta) {
        const { error } = await supabase.from('saude_consultas').update(payload).eq('id', editingConsulta.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('saude_consultas').insert(payload)
        if (error) throw error
        // Agenda integration — only on insert
        await supabase.from('agenda_eventos').insert({
          titulo: `Consulta ${form.especialidade}${form.medico ? ' - Dr(a). ' + form.medico : ''}`,
          categoria: 'medico',
          data_inicio: form.data,
          hora_inicio: form.hora || null,
          dia_inteiro: !form.hora,
          local: form.clinica || form.local || null,
          descricao: form.observacoes || null,
        })
      }
      setShowForm(false)
      await load()
    } catch (err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(c) {
    if (!confirm('Excluir esta consulta?')) return
    await supabase.from('saude_consultas').delete().eq('id', c.id)
    await load()
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>🏥 Consultas</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Consulta</button>
      </div>

      {consultas.length === 0 ? (
        <EmptyState icon="🏥" title="Nenhuma consulta" desc="Registre as consultas médicas." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {consultas.map(c => {
            const isPast = c.data < today
            return (
              <div key={c.id} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderLeft: isPast ? '4px solid var(--c-border)' : '4px solid #10b981', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, opacity: isPast ? 0.75 : 1 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700 }}>{c.especialidade}</span>
                    {c.medico && <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>Dr(a). {c.medico}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--c-text-muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {c.data && <span>📅 {fmtDate(c.data)}{c.hora ? ' às ' + c.hora : ''}</span>}
                    {(c.clinica || c.local) && <span>📍 {c.clinica || c.local}</span>}
                  </div>
                  {c.retorno && <div style={{ fontSize: 12, color: '#854d0e', marginTop: 4, fontWeight: 600 }}>Retorno: {fmtDate(c.retorno)}</div>}
                  {c.observacoes && <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 4 }}>{c.observacoes}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => openEdit(c)}>Editar</button>
                  <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(c)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <ModalShell title={editingConsulta ? 'Editar Consulta' : 'Nova Consulta'} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Especialidade">
            <select className="c-form-select" value={form.especialidade} onChange={e => setForm(f => ({ ...f, especialidade: e.target.value }))}>
              {ESPECIALIDADES.map(e => <option key={e}>{e}</option>)}
            </select>
          </Field>
          <Field label="Médico(a)">
            <input className="c-form-input" value={form.medico} onChange={e => setForm(f => ({ ...f, medico: e.target.value }))} placeholder="Nome do médico" />
          </Field>
          <Field label="Clínica / Hospital">
            <input className="c-form-input" value={form.clinica} onChange={e => setForm(f => ({ ...f, clinica: e.target.value }))} placeholder="Nome da clínica" />
          </Field>
          <Field label="Data *">
            <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} style={dateInputStyle} />
          </Field>
          <Field label="Hora">
            <input type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} style={dateInputStyle} />
          </Field>
          <Field label="Local (endereço)">
            <input className="c-form-input" value={form.local} onChange={e => setForm(f => ({ ...f, local: e.target.value }))} />
          </Field>
          <Field label="Observações">
            <textarea className="c-form-textarea" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} />
          </Field>
          <Field label="Data de Retorno">
            <input type="date" value={form.retorno} onChange={e => setForm(f => ({ ...f, retorno: e.target.value }))} style={dateInputStyle} />
          </Field>
          {!editingConsulta && (
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)', padding: '8px 12px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
              📅 A consulta será adicionada automaticamente à Agenda Familiar.
            </div>
          )}
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   EXAMES TAB
══════════════════════════════════════════════════════════════════════════ */
function ExamesTab({ pessoa }) {
  const [exames, setExames] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExame, setEditingExame] = useState(null)
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState(null)
  const [signedUrls, setSignedUrls] = useState({})
  const [form, setForm] = useState({ tipo: '', data: '', medico_solicitante: '', observacao: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('saude_exames').select('*').eq('pessoa_id', pessoa.id).order('data', { ascending: false })
    const rows = data || []
    setExames(rows)
    const urls = {}
    await Promise.all(rows.filter(e => e.arquivo_path).map(async e => {
      urls[e.id] = await getSignedUrl(e.arquivo_path)
    }))
    setSignedUrls(urls)
    setLoading(false)
  }, [pessoa.id])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditingExame(null)
    setFile(null)
    setForm({ tipo: '', data: '', medico_solicitante: '', observacao: '' })
    setShowForm(true)
  }

  function openEdit(e) {
    setEditingExame(e)
    setFile(null)
    setForm({ tipo: e.tipo || '', data: e.data || '', medico_solicitante: e.medico_solicitante || '', observacao: e.observacao || '' })
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      let arquivo_path = editingExame?.arquivo_path || null
      if (file) {
        if (arquivo_path) await deleteFile(arquivo_path)
        arquivo_path = await uploadFile(file, `exames/${pessoa.id}`)
      }
      const payload = {
        pessoa_id: pessoa.id,
        tipo: form.tipo,
        data: form.data || null,
        medico_solicitante: form.medico_solicitante || null,
        observacao: form.observacao || null,
        arquivo_path,
      }
      if (editingExame) {
        const { error } = await supabase.from('saude_exames').update(payload).eq('id', editingExame.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('saude_exames').insert(payload)
        if (error) throw error
      }
      setShowForm(false)
      await load()
    } catch (err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(e) {
    if (!confirm('Excluir este exame?')) return
    if (e.arquivo_path) await deleteFile(e.arquivo_path)
    await supabase.from('saude_exames').delete().eq('id', e.id)
    await load()
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>🧪 Exames</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Exame</button>
      </div>

      {exames.length === 0 ? (
        <EmptyState icon="🧪" title="Nenhum exame" desc="Registre os exames realizados." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {exames.map(e => (
            <div key={e.id} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700 }}>{e.tipo}</span>
                  {e.data && <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>📅 {fmtDate(e.data)}</span>}
                </div>
                {e.medico_solicitante && <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 2 }}>Solicitado por: {e.medico_solicitante}</div>}
                {e.observacao && <div style={{ fontSize: 12, color: 'var(--c-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{e.observacao}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {e.arquivo_path && signedUrls[e.id] && (
                  <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => window.open(signedUrls[e.id], '_blank')}>📥</button>
                )}
                <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => openEdit(e)}>Editar</button>
                <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(e)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ModalShell title={editingExame ? 'Editar Exame' : 'Novo Exame'} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Tipo">
            <input type="text" className="c-form-input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} placeholder="Ex: Hemograma, Ultrassom, Raio-X..." />
          </Field>
          <Field label="Data">
            <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} style={dateInputStyle} />
          </Field>
          <Field label="Médico Solicitante">
            <input className="c-form-input" value={form.medico_solicitante} onChange={e => setForm(f => ({ ...f, medico_solicitante: e.target.value }))} />
          </Field>
          <Field label="Observação">
            <textarea className="c-form-textarea" value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} rows={2} />
          </Field>
          <Field label="Arquivo (PDF, imagem)">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0] || null)} />
            {editingExame?.arquivo_path && !file && <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>✓ Arquivo já anexado</div>}
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MEDICAMENTOS TAB
══════════════════════════════════════════════════════════════════════════ */
function MedicamentosTab({ pessoa }) {
  const [medicamentos, setMedicamentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMed, setEditingMed] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showHistorico, setShowHistorico] = useState(false)
  const [form, setForm] = useState({ nome: '', dosagem: '', frequencia: FREQUENCIAS[0], horario: '', data_inicio: '', data_fim: '', observacoes: '', ativo: true })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('saude_medicamentos').select('*').eq('pessoa_id', pessoa.id).order('nome')
    setMedicamentos(data || [])
    setLoading(false)
  }, [pessoa.id])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditingMed(null)
    setForm({ nome: '', dosagem: '', frequencia: FREQUENCIAS[0], horario: '', data_inicio: '', data_fim: '', observacoes: '', ativo: true })
    setShowForm(true)
  }

  function openEdit(m) {
    setEditingMed(m)
    setForm({
      nome: m.nome || '', dosagem: m.dosagem || '', frequencia: m.frequencia || FREQUENCIAS[0],
      horario: m.horario || '', data_inicio: m.data_inicio || '', data_fim: m.data_fim || '',
      observacoes: m.observacoes || '', ativo: m.ativo !== false
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.nome) return alert('Nome é obrigatório.')
    setSaving(true)
    try {
      const payload = {
        pessoa_id: pessoa.id,
        nome: form.nome,
        dosagem: form.dosagem || null,
        frequencia: form.frequencia || null,
        horario: form.horario || null,
        data_inicio: form.data_inicio || null,
        data_fim: form.data_fim || null,
        observacoes: form.observacoes || null,
        ativo: form.ativo,
      }
      if (editingMed) {
        const { error } = await supabase.from('saude_medicamentos').update(payload).eq('id', editingMed.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('saude_medicamentos').insert(payload)
        if (error) throw error
      }
      setShowForm(false)
      await load()
    } catch (err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(m) {
    if (!confirm('Excluir este medicamento?')) return
    await supabase.from('saude_medicamentos').delete().eq('id', m.id)
    await load()
  }

  async function toggleAtivo(m) {
    await supabase.from('saude_medicamentos').update({ ativo: !m.ativo }).eq('id', m.id)
    await load()
  }

  const emUso = medicamentos.filter(m => m.ativo)
  const historico = medicamentos.filter(m => !m.ativo)

  if (loading) return <Loading />

  function MedCard({ m }) {
    return (
      <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 18 }}>💊</span>
            <span style={{ fontWeight: 700 }}>{m.nome}</span>
            {m.dosagem && <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{m.dosagem}</span>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {m.frequencia && <span>{m.frequencia}</span>}
            {m.horario && <span>⏰ {m.horario}</span>}
          </div>
          {(m.data_inicio || m.data_fim) && (
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 4 }}>
              {m.data_inicio ? fmtDate(m.data_inicio) : ''}{m.data_inicio ? ' → ' : ''}{m.data_fim ? fmtDate(m.data_fim) : 'em uso'}
            </div>
          )}
          {m.observacoes && <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 4 }}>{m.observacoes}</div>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => toggleAtivo(m)}>{m.ativo ? 'Pausar' : 'Ativar'}</button>
            <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => openEdit(m)}>Editar</button>
            <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(m)}>✕</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>💊 Medicamentos</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Medicamento</button>
      </div>

      {medicamentos.length === 0 ? (
        <EmptyState icon="💊" title="Nenhum medicamento" desc="Registre os medicamentos em uso." />
      ) : (
        <>
          {emUso.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10, color: '#10b981' }}>Em uso ({emUso.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {emUso.map(m => <MedCard key={m.id} m={m} />)}
              </div>
            </div>
          )}
          {historico.length > 0 && (
            <div>
              <button onClick={() => setShowHistorico(h => !h)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14, color: 'var(--c-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 10 }}>
                {showHistorico ? '▾' : '▸'} Histórico ({historico.length})
              </button>
              {showHistorico && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: 0.8 }}>
                  {historico.map(m => <MedCard key={m.id} m={m} />)}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showForm && (
        <ModalShell title={editingMed ? 'Editar Medicamento' : 'Novo Medicamento'} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Nome *">
            <input className="c-form-input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Losartana" />
          </Field>
          <Field label="Dosagem">
            <input className="c-form-input" value={form.dosagem} onChange={e => setForm(f => ({ ...f, dosagem: e.target.value }))} placeholder="Ex: 500mg, 1 comprimido" />
          </Field>
          <Field label="Frequência">
            <select className="c-form-select" value={form.frequencia} onChange={e => setForm(f => ({ ...f, frequencia: e.target.value }))}>
              {FREQUENCIAS.map(fr => <option key={fr}>{fr}</option>)}
            </select>
          </Field>
          <Field label="Horário">
            <input className="c-form-input" value={form.horario} onChange={e => setForm(f => ({ ...f, horario: e.target.value }))} placeholder="Ex: 08:00 e 20:00" />
          </Field>
          <Field label="Data de Início">
            <input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} style={dateInputStyle} />
          </Field>
          <Field label="Data de Fim (opcional)">
            <input type="date" value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))} style={dateInputStyle} />
          </Field>
          <Field label="Observações">
            <textarea className="c-form-textarea" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} />
          </Field>
          <Field label="Em uso">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} />
              <span style={{ fontSize: 14 }}>Medicamento ativo</span>
            </label>
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   RECEITAS TAB
══════════════════════════════════════════════════════════════════════════ */
function ReceitasTab({ pessoa }) {
  const [receitas, setReceitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingReceita, setEditingReceita] = useState(null)
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState(null)
  const [signedUrls, setSignedUrls] = useState({})
  const [form, setForm] = useState({ medico: '', data: '', observacoes: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('saude_receitas').select('*').eq('pessoa_id', pessoa.id).order('data', { ascending: false })
    const rows = data || []
    setReceitas(rows)
    const urls = {}
    await Promise.all(rows.filter(r => r.arquivo_path).map(async r => {
      urls[r.id] = await getSignedUrl(r.arquivo_path)
    }))
    setSignedUrls(urls)
    setLoading(false)
  }, [pessoa.id])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditingReceita(null)
    setFile(null)
    setForm({ medico: '', data: '', observacoes: '' })
    setShowForm(true)
  }

  function openEdit(r) {
    setEditingReceita(r)
    setFile(null)
    setForm({ medico: r.medico || '', data: r.data || '', observacoes: r.observacoes || '' })
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      let arquivo_path = editingReceita?.arquivo_path || null
      if (file) {
        if (arquivo_path) await deleteFile(arquivo_path)
        arquivo_path = await uploadFile(file, `receitas/${pessoa.id}`)
      }
      const payload = {
        pessoa_id: pessoa.id,
        medico: form.medico || null,
        data: form.data || null,
        observacoes: form.observacoes || null,
        arquivo_path,
      }
      if (editingReceita) {
        const { error } = await supabase.from('saude_receitas').update(payload).eq('id', editingReceita.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('saude_receitas').insert(payload)
        if (error) throw error
      }
      setShowForm(false)
      await load()
    } catch (err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(r) {
    if (!confirm('Excluir esta receita?')) return
    if (r.arquivo_path) await deleteFile(r.arquivo_path)
    await supabase.from('saude_receitas').delete().eq('id', r.id)
    await load()
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>📋 Receitas</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Receita</button>
      </div>

      {receitas.length === 0 ? (
        <EmptyState icon="📋" title="Nenhuma receita" desc="Registre as receitas médicas." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {receitas.map(r => (
            <div key={r.id} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 18 }}>📋</span>
                  {r.data && <span style={{ fontWeight: 600 }}>{fmtDate(r.data)}</span>}
                  {r.medico && <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>Dr(a). {r.medico}</span>}
                </div>
                {r.observacoes && <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 4 }}>{r.observacoes}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {r.arquivo_path && signedUrls[r.id] && (
                  <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => window.open(signedUrls[r.id], '_blank')}>📥</button>
                )}
                <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => openEdit(r)}>Editar</button>
                <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(r)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ModalShell title={editingReceita ? 'Editar Receita' : 'Nova Receita'} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Médico(a)">
            <input className="c-form-input" value={form.medico} onChange={e => setForm(f => ({ ...f, medico: e.target.value }))} placeholder="Nome do médico" />
          </Field>
          <Field label="Data">
            <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} style={dateInputStyle} />
          </Field>
          <Field label="Observações">
            <textarea className="c-form-textarea" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} />
          </Field>
          <Field label="Arquivo (PDF, imagem)">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files[0] || null)} />
            {editingReceita?.arquivo_path && !file && <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>✓ Arquivo já anexado</div>}
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   VACINAS TAB
══════════════════════════════════════════════════════════════════════════ */
function VacinasTab({ pessoa }) {
  const [vacinas, setVacinas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVacina, setEditingVacina] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ vacina: '', data: '', proxima_dose: '', observacoes: '' })

  const today = format(new Date(), 'yyyy-MM-dd')
  const plus30 = format(addDays(new Date(), 30), 'yyyy-MM-dd')

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('saude_vacinas').select('*').eq('pessoa_id', pessoa.id).order('data', { ascending: false })
    setVacinas(data || [])
    setLoading(false)
  }, [pessoa.id])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditingVacina(null)
    setForm({ vacina: '', data: '', proxima_dose: '', observacoes: '' })
    setShowForm(true)
  }

  function openEdit(v) {
    setEditingVacina(v)
    setForm({ vacina: v.vacina || '', data: v.data || '', proxima_dose: v.proxima_dose || '', observacoes: v.observacoes || '' })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.vacina) return alert('Nome da vacina é obrigatório.')
    setSaving(true)
    try {
      const payload = {
        pessoa_id: pessoa.id,
        vacina: form.vacina,
        data: form.data || null,
        proxima_dose: form.proxima_dose || null,
        observacoes: form.observacoes || null,
      }
      if (editingVacina) {
        const { error } = await supabase.from('saude_vacinas').update(payload).eq('id', editingVacina.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('saude_vacinas').insert(payload)
        if (error) throw error
      }
      setShowForm(false)
      await load()
    } catch (err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(v) {
    if (!confirm('Excluir esta vacina?')) return
    await supabase.from('saude_vacinas').delete().eq('id', v.id)
    await load()
  }

  function getProximaDoseStyle(proxima) {
    if (!proxima) return null
    if (proxima < today) return { color: '#dc2626', label: `⚠️ Vencida em ${fmtDate(proxima)}` }
    if (proxima <= plus30) return { color: '#d97706', label: `⏳ Próxima dose: ${fmtDate(proxima)}` }
    return { color: '#15803d', label: `✓ Próxima dose: ${fmtDate(proxima)}` }
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>💉 Vacinas</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Vacina</button>
      </div>

      {vacinas.length === 0 ? (
        <EmptyState icon="💉" title="Nenhuma vacina" desc="Registre o histórico de vacinação." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {vacinas.map(v => {
            const ds = getProximaDoseStyle(v.proxima_dose)
            return (
              <div key={v.id} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 18 }}>💉</span>
                    <span style={{ fontWeight: 700 }}>{v.vacina}</span>
                    {v.data && <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{fmtDate(v.data)}</span>}
                  </div>
                  {ds && <div style={{ fontSize: 12, fontWeight: 600, color: ds.color, marginTop: 2 }}>{ds.label}</div>}
                  {v.observacoes && <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 4 }}>{v.observacoes}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => openEdit(v)}>Editar</button>
                  <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(v)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <ModalShell title={editingVacina ? 'Editar Vacina' : 'Nova Vacina'} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Vacina *">
            <input className="c-form-input" value={form.vacina} onChange={e => setForm(f => ({ ...f, vacina: e.target.value }))} placeholder="Ex: Influenza, COVID-19..." />
          </Field>
          <Field label="Data de Aplicação">
            <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} style={dateInputStyle} />
          </Field>
          <Field label="Próxima Dose">
            <input type="date" value={form.proxima_dose} onChange={e => setForm(f => ({ ...f, proxima_dose: e.target.value }))} style={dateInputStyle} />
          </Field>
          <Field label="Observações">
            <textarea className="c-form-textarea" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} />
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   DOCUMENTOS TAB
══════════════════════════════════════════════════════════════════════════ */
function DocumentosTab({ pessoa }) {
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null)
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState(null)
  const [signedUrls, setSignedUrls] = useState({})
  const [form, setForm] = useState({ nome: '', tipo: DOC_TIPOS[0], data: '', observacoes: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('saude_documentos').select('*').eq('pessoa_id', pessoa.id).order('created_at', { ascending: false })
    const rows = data || []
    setDocumentos(rows)
    const urls = {}
    await Promise.all(rows.filter(d => d.arquivo_path).map(async d => {
      urls[d.id] = await getSignedUrl(d.arquivo_path)
    }))
    setSignedUrls(urls)
    setLoading(false)
  }, [pessoa.id])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditingDoc(null)
    setFile(null)
    setForm({ nome: '', tipo: DOC_TIPOS[0], data: '', observacoes: '' })
    setShowForm(true)
  }

  function openEdit(d) {
    setEditingDoc(d)
    setFile(null)
    setForm({ nome: d.nome || '', tipo: d.tipo || DOC_TIPOS[0], data: d.data || '', observacoes: d.observacoes || '' })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.nome) return alert('Nome é obrigatório.')
    setSaving(true)
    try {
      let arquivo_path = editingDoc?.arquivo_path || null
      if (file) {
        if (arquivo_path) await deleteFile(arquivo_path)
        arquivo_path = await uploadFile(file, `documentos/${pessoa.id}`)
      }
      const payload = {
        pessoa_id: pessoa.id,
        nome: form.nome,
        tipo: form.tipo,
        data: form.data || null,
        observacoes: form.observacoes || null,
        arquivo_path,
      }
      if (editingDoc) {
        const { error } = await supabase.from('saude_documentos').update(payload).eq('id', editingDoc.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('saude_documentos').insert(payload)
        if (error) throw error
      }
      setShowForm(false)
      await load()
    } catch (err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(d) {
    if (!confirm('Excluir este documento?')) return
    if (d.arquivo_path) await deleteFile(d.arquivo_path)
    await supabase.from('saude_documentos').delete().eq('id', d.id)
    await load()
  }

  function getDocIcon(tipo) {
    if (!tipo) return '📁'
    if (tipo.toLowerCase().includes('cartão')) return '🏥'
    if (tipo.toLowerCase().includes('vacinação')) return '💉'
    if (tipo.toLowerCase().includes('receita')) return '📋'
    return '📁'
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>📁 Documentos</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Documento</button>
      </div>

      {documentos.length === 0 ? (
        <EmptyState icon="📁" title="Nenhum documento" desc="Adicione documentos de saúde." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {documentos.map(d => (
            <div key={d.id} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 20 }}>{getDocIcon(d.tipo)}</span>
                  <span style={{ fontWeight: 700 }}>{d.nome}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#ede9fe', color: '#6366f1', fontWeight: 600 }}>{d.tipo}</span>
                  {d.data && <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{fmtDate(d.data)}</span>}
                </div>
                {d.observacoes && <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{d.observacoes}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {d.arquivo_path && signedUrls[d.id] && (
                  <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => window.open(signedUrls[d.id], '_blank')}>📥</button>
                )}
                <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => openEdit(d)}>Editar</button>
                <button className="c-btn c-btn-danger c-btn-sm" onClick={() => handleDelete(d)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ModalShell title={editingDoc ? 'Editar Documento' : 'Novo Documento'} onClose={() => setShowForm(false)} onSave={handleSave} saving={saving}>
          <Field label="Nome *">
            <input className="c-form-input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Cartão Unimed" />
          </Field>
          <Field label="Tipo">
            <select className="c-form-select" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              {DOC_TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Data do documento">
            <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} style={dateInputStyle} />
          </Field>
          <Field label="Observações">
            <textarea className="c-form-textarea" value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} />
          </Field>
          <Field label="Arquivo (PDF, imagem)">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => setFile(e.target.files[0] || null)} />
            {editingDoc?.arquivo_path && !file && <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>✓ Arquivo já anexado</div>}
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   HISTÓRICO TAB
══════════════════════════════════════════════════════════════════════════ */
function HistoricoTab({ pessoa }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [consultasR, examesR, medicamentosR, receitasR, vacinasR] = await Promise.allSettled([
        supabase.from('saude_consultas').select('id,data,especialidade,medico,clinica').eq('pessoa_id', pessoa.id),
        supabase.from('saude_exames').select('id,data,tipo,medico_solicitante').eq('pessoa_id', pessoa.id),
        supabase.from('saude_medicamentos').select('id,data_inicio,nome,dosagem,frequencia').eq('pessoa_id', pessoa.id),
        supabase.from('saude_receitas').select('id,data,medico').eq('pessoa_id', pessoa.id),
        supabase.from('saude_vacinas').select('id,data,vacina').eq('pessoa_id', pessoa.id),
      ])

      const all = []

      const consultasData = consultasR.status === 'fulfilled' ? (consultasR.value.data || []) : []
      consultasData.forEach(r => all.push({
        id: `c${r.id}`, date: r.data, icon: '🏥', iconColor: '#6366f1',
        desc: `${r.especialidade}${r.medico ? ' - Dr(a). ' + r.medico : ''}`,
        sub: r.clinica || null
      }))

      const examesData = examesR.status === 'fulfilled' ? (examesR.value.data || []) : []
      examesData.forEach(r => all.push({
        id: `e${r.id}`, date: r.data, icon: '🧪', iconColor: '#3b82f6',
        desc: r.tipo,
        sub: r.medico_solicitante || null
      }))

      const medicamentosData = medicamentosR.status === 'fulfilled' ? (medicamentosR.value.data || []) : []
      medicamentosData.forEach(r => all.push({
        id: `m${r.id}`, date: r.data_inicio, icon: '💊', iconColor: '#ec4899',
        desc: `${r.nome}${r.dosagem ? ' ' + r.dosagem : ''}`,
        sub: r.frequencia || null
      }))

      const receitasData = receitasR.status === 'fulfilled' ? (receitasR.value.data || []) : []
      receitasData.forEach(r => all.push({
        id: `r${r.id}`, date: r.data, icon: '📋', iconColor: '#f59e0b',
        desc: `Receita${r.medico ? ' - ' + r.medico : ''}`,
        sub: null
      }))

      const vacinasData = vacinasR.status === 'fulfilled' ? (vacinasR.value.data || []) : []
      vacinasData.forEach(r => all.push({
        id: `v${r.id}`, date: r.data, icon: '💉', iconColor: '#10b981',
        desc: r.vacina,
        sub: null
      }))

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
  }, [pessoa.id])

  if (loading) return <Loading />

  if (events.length === 0) return <EmptyState icon="📈" title="Nenhum histórico" desc="Os registros de saúde aparecerão aqui." />

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
              {ev.sub && <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 2 }}>{ev.sub}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   PESSOA DETAIL
══════════════════════════════════════════════════════════════════════════ */
function PessoaDetail({ pessoa, onBack, onUpdated }) {
  const [tab, setTab] = useState('resumo')
  const [showEditForm, setShowEditForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: pessoa.nome || '', data_nascimento: pessoa.data_nascimento || '',
    tipo_sanguineo: pessoa.tipo_sanguineo || '', peso: pessoa.peso || '',
    altura: pessoa.altura || '', convenio: pessoa.convenio || '',
    numero_convenio: pessoa.numero_convenio || '', contato_emergencia: pessoa.contato_emergencia || '',
    alergias: pessoa.alergias || '', observacoes: pessoa.observacoes || ''
  })

  const tabs = [
    ['resumo', '📊 Resumo'],
    ['consultas', '🏥 Consultas'],
    ['exames', '🧪 Exames'],
    ['medicamentos', '💊 Medicamentos'],
    ['receitas', '📋 Receitas'],
    ['vacinas', '💉 Vacinas'],
    ['documentos', '📁 Documentos'],
    ['historico', '📈 Histórico'],
  ]

  async function handleEditSave() {
    if (!form.nome) return alert('Nome é obrigatório.')
    setSaving(true)
    try {
      const payload = {
        nome: form.nome,
        data_nascimento: form.data_nascimento || null,
        tipo_sanguineo: form.tipo_sanguineo || null,
        peso: form.peso ? Number(form.peso) : null,
        altura: form.altura ? Number(form.altura) : null,
        convenio: form.convenio || null,
        numero_convenio: form.numero_convenio || null,
        contato_emergencia: form.contato_emergencia || null,
        alergias: form.alergias || null,
        observacoes: form.observacoes || null,
      }
      const { data, error } = await supabase.from('saude_pessoas').update(payload).eq('id', pessoa.id).select().single()
      if (error) throw error
      setShowEditForm(false)
      if (data) onUpdated(data)
    } catch (err) { alert(err.message) } finally { setSaving(false) }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button className="c-btn c-btn-secondary" onClick={onBack}>← Saúde</button>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#ec4899,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
          {pessoa.nome.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{pessoa.nome}</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {pessoa.data_nascimento && (
              <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>{calcAge(pessoa.data_nascimento)} anos</span>
            )}
            {pessoa.tipo_sanguineo && (
              <span style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{pessoa.tipo_sanguineo}</span>
            )}
            {pessoa.convenio && (
              <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>🏥 {pessoa.convenio}</span>
            )}
          </div>
          {pessoa.alergias && (
            <div style={{ marginTop: 4, fontSize: 12, color: '#dc2626' }}>⚠️ Alergias: {pessoa.alergias}</div>
          )}
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

      {tab === 'resumo' && <ResumoTab pessoa={pessoa} onEdit={() => setShowEditForm(true)} />}
      {tab === 'consultas' && <ConsultasTab pessoa={pessoa} />}
      {tab === 'exames' && <ExamesTab pessoa={pessoa} />}
      {tab === 'medicamentos' && <MedicamentosTab pessoa={pessoa} />}
      {tab === 'receitas' && <ReceitasTab pessoa={pessoa} />}
      {tab === 'vacinas' && <VacinasTab pessoa={pessoa} />}
      {tab === 'documentos' && <DocumentosTab pessoa={pessoa} />}
      {tab === 'historico' && <HistoricoTab pessoa={pessoa} />}

      {showEditForm && (
        <ModalShell title="Editar Perfil" onClose={() => setShowEditForm(false)} onSave={handleEditSave} saving={saving}>
          <Field label="Nome *">
            <input className="c-form-input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
          </Field>
          <Field label="Data de Nascimento">
            <input type="date" value={form.data_nascimento} onChange={e => setForm(f => ({ ...f, data_nascimento: e.target.value }))} style={dateInputStyle} />
          </Field>
          <Field label="Tipo Sanguíneo">
            <select className="c-form-select" value={form.tipo_sanguineo} onChange={e => setForm(f => ({ ...f, tipo_sanguineo: e.target.value }))}>
              <option value="">Selecione...</option>
              {TIPOS_SANGUINEOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Peso (kg)">
            <input className="c-form-input" type="number" step="0.1" value={form.peso} onChange={e => setForm(f => ({ ...f, peso: e.target.value }))} />
          </Field>
          <Field label="Altura (cm)">
            <input className="c-form-input" type="number" value={form.altura} onChange={e => setForm(f => ({ ...f, altura: e.target.value }))} />
          </Field>
          <Field label="Convênio">
            <input className="c-form-input" value={form.convenio} onChange={e => setForm(f => ({ ...f, convenio: e.target.value }))} />
          </Field>
          <Field label="Número do Convênio">
            <input className="c-form-input" value={form.numero_convenio} onChange={e => setForm(f => ({ ...f, numero_convenio: e.target.value }))} />
          </Field>
          <Field label="Contato de Emergência">
            <input className="c-form-input" value={form.contato_emergencia} onChange={e => setForm(f => ({ ...f, contato_emergencia: e.target.value }))} />
          </Field>
          <Field label="Alergias">
            <textarea className="c-form-textarea" value={form.alergias} onChange={e => setForm(f => ({ ...f, alergias: e.target.value }))} rows={2} />
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
   MAIN EXPORT
══════════════════════════════════════════════════════════════════════════ */
export default function Saude() {
  const [selected, setSelected] = useState(null)
  if (selected) return <PessoaDetail pessoa={selected} onBack={() => setSelected(null)} onUpdated={p => setSelected(p)} />
  return <SaudeDashboard onSelect={setSelected} />
}
