import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/* ── Constantes ─────────────────────────────────────────────────── */
const CATEGORIAS = [
  { key: 'pessoal',    icon: '🪪', label: 'Pessoal',     color: '#6366f1' },
  { key: 'veiculo',    icon: '🚗', label: 'Veículos',    color: '#f97316' },
  { key: 'imovel',     icon: '🏠', label: 'Casa/Imóvel', color: '#10b981' },
  { key: 'contrato',   icon: '📄', label: 'Contratos',   color: '#3b82f6' },
  { key: 'saude',      icon: '🏥', label: 'Saúde',       color: '#ef4444' },
  { key: 'trabalho',   icon: '💼', label: 'Trabalho',    color: '#8b5cf6' },
  { key: 'financeiro', icon: '💳', label: 'Financeiro',  color: '#f59e0b' },
  { key: 'familia',    icon: '👶', label: 'Família',     color: '#ec4899' },
  { key: 'outros',     icon: '📌', label: 'Outros',      color: '#64748b' },
]

const TIPOS_DOC = [
  'RG', 'CPF', 'CNH', 'Passaporte',
  'Certidão de Nascimento', 'Certidão de Casamento', 'Certidão de Óbito',
  'Escritura do Imóvel', 'Contrato de Aluguel', 'Contrato de Prestação de Serviço',
  'Apólice de Seguro', 'Documento do Veículo (CRLV)',
  'Comprovante de Residência', 'Comprovante de Renda',
  'Cartão do SUS', 'Exame Médico', 'Receita Médica', 'Outro',
]

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp'

/* ── Helpers ────────────────────────────────────────────────────── */
const getCat = key => CATEGORIAS.find(c => c.key === key) ?? CATEGORIAS.at(-1)

function getStatus(dataValidade) {
  if (!dataValidade) return { key: 'sem_validade', label: 'Sem validade', color: '#64748b', bg: '#f1f5f9' }
  const dias = differenceInDays(parseISO(dataValidade), new Date())
  if (dias < 0)   return { key: 'vencido',  label: 'Vencido',           color: '#dc2626', bg: '#fef2f2' }
  if (dias <= 30) return { key: 'vencendo', label: `Vence em ${dias}d`, color: '#d97706', bg: '#fffbeb' }
  return                  { key: 'ativo',   label: 'Ativo',              color: '#16a34a', bg: '#f0fdf4' }
}

const fmtDate = d => d ? format(parseISO(d), 'dd/MM/yyyy') : '—'
const fmtSize = b => {
  if (!b) return ''
  if (b < 1024)    return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}
const sanitize = name =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_')

/* ══ DocFormModal ═══════════════════════════════════════════════════ */
function DocFormModal({ doc, people, onSave, onClose }) {
  const isEdit = !!doc?.id

  const [form, setForm] = useState({
    nome:          doc?.nome          ?? '',
    categoria:     doc?.categoria     ?? 'pessoal',
    tipo:          doc?.tipo          ?? '',
    numero:        doc?.numero        ?? '',
    orgao_emissor: doc?.orgao_emissor ?? '',
    data_emissao:  doc?.data_emissao  ?? '',
    data_validade: doc?.data_validade ?? '',
    pessoa_id:     doc?.pessoa_id     ?? '',
    observacoes:   doc?.observacoes   ?? '',
    tags:          doc?.tags?.join(', ') ?? '',
    favorito:      doc?.favorito      ?? false,
  })
  const [files, setFiles]   = useState([])
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError]   = useState('')
  const fileRef = useRef()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const cat = getCat(form.categoria)

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  async function handleSave(e) {
    e.preventDefault()
    if (!form.nome.trim()) { setError('Nome é obrigatório'); return }
    setSaving(true); setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const payload = {
      nome:          form.nome.trim(),
      categoria:     form.categoria,
      tipo:          form.tipo          || null,
      numero:        form.numero        || null,
      orgao_emissor: form.orgao_emissor || null,
      data_emissao:  form.data_emissao  || null,
      data_validade: form.data_validade || null,
      pessoa_id:     form.pessoa_id     || null,
      observacoes:   form.observacoes   || null,
      tags:          form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      favorito:      form.favorito,
      user_id:       user?.id ?? null,
    }

    let docId = doc?.id
    if (isEdit) {
      const { error: err } = await supabase.from('documentos').update({ ...payload, updated_at: new Date() }).eq('id', docId)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { data: ins, error: err } = await supabase.from('documentos').insert(payload).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      docId = ins.id
    }

    // Upload files
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const path = `${user?.id ?? 'anon'}/${docId}/${Date.now()}_${sanitize(file.name)}`
      const { error: upErr } = await supabase.storage.from('documentos').upload(path, file, { cacheControl: '3600' })
      if (!upErr) {
        await supabase.from('documentos_arquivos').insert({
          documento_id: docId, user_id: user?.id ?? null,
          nome_arquivo: file.name, tipo_arquivo: file.type,
          tamanho: file.size, storage_path: path,
        })
      }
      setProgress(Math.round(((i + 1) / files.length) * 100))
    }

    onSave()
  }

  return (
    <div className="c-modal-overlay" onClick={onClose}>
      <div className="c-modal-sheet" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--c-border)' }} />
        </div>

        <div style={{ padding: '8px 20px 14px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 17 }}>{isEdit ? 'Editar Documento' : 'Novo Documento'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--c-text-muted)', lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '65vh', overflowY: 'auto' }}>

            {/* Nome + Favorito */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="c-form-label">Nome *</label>
                <input className="c-form-input" placeholder="Ex: CNH Bruno" value={form.nome} onChange={e => set('nome', e.target.value)} autoFocus />
              </div>
              <button type="button" onClick={() => set('favorito', !form.favorito)}
                style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, border: `2px solid ${form.favorito ? '#f59e0b' : 'var(--c-border)'}`, background: form.favorito ? '#fffbeb' : 'var(--c-surface2)', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {form.favorito ? '⭐' : '☆'}
              </button>
            </div>

            {/* Categoria */}
            <div>
              <label className="c-form-label">Categoria</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CATEGORIAS.map(c => (
                  <button key={c.key} type="button" onClick={() => set('categoria', c.key)}
                    style={{
                      padding: '5px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: form.categoria === c.key ? c.color + '20' : 'var(--c-surface2)',
                      border: `1.5px solid ${form.categoria === c.key ? c.color : 'var(--c-border)'}`,
                      color: form.categoria === c.key ? c.color : 'var(--c-text-muted)',
                    }}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo + Pessoa */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="c-form-label">Tipo</label>
                <select className="c-form-select" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                  <option value="">— Selecione —</option>
                  {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="c-form-label">Pessoa relacionada</label>
                <select className="c-form-select" value={form.pessoa_id} onChange={e => set('pessoa_id', e.target.value)}>
                  <option value="">— Nenhuma —</option>
                  {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            {/* Número + Órgão emissor */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="c-form-label">Número</label>
                <input className="c-form-input" placeholder="Ex: 12.345.678-9" value={form.numero} onChange={e => set('numero', e.target.value)} />
              </div>
              <div>
                <label className="c-form-label">Órgão emissor</label>
                <input className="c-form-input" placeholder="Ex: SSP/SP, Detran" value={form.orgao_emissor} onChange={e => set('orgao_emissor', e.target.value)} />
              </div>
            </div>

            {/* Datas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="c-form-label">Data de emissão</label>
                <input type="date" className="c-form-input" value={form.data_emissao} onChange={e => set('data_emissao', e.target.value)} />
              </div>
              <div>
                <label className="c-form-label">Data de validade</label>
                <input type="date" className="c-form-input" value={form.data_validade} onChange={e => set('data_validade', e.target.value)} />
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="c-form-label">Observações</label>
              <textarea className="c-form-textarea" rows={2} placeholder="Informações adicionais..." value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
            </div>

            {/* Tags */}
            <div>
              <label className="c-form-label">Tags <span style={{ fontWeight: 400, color: 'var(--c-text-muted)' }}>(separadas por vírgula)</span></label>
              <input className="c-form-input" placeholder="Ex: urgente, renovar, original" value={form.tags} onChange={e => set('tags', e.target.value)} />
            </div>

            {/* Upload */}
            <div>
              <label className="c-form-label">Arquivos {isEdit && <span style={{ fontWeight: 400, color: 'var(--c-text-muted)' }}>(adicionar mais)</span>}</label>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--c-accent)' }}
                onDragLeave={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
                onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--c-border)'; setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]) }}
                style={{ border: '2px dashed var(--c-border)', borderRadius: 10, padding: 16, textAlign: 'center', cursor: 'pointer', background: 'var(--c-surface2)', transition: 'border-color .15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--c-accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
              >
                <div style={{ fontSize: 28, marginBottom: 4 }}>📎</div>
                <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>Clique ou arraste arquivos aqui</div>
                <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 2 }}>PDF, PNG, JPG, JPEG, WEBP</div>
              </div>
              <input ref={fileRef} type="file" multiple accept={ACCEPT} style={{ display: 'none' }}
                onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])}
                capture="environment"
              />

              {files.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'var(--c-surface2)', border: '1px solid var(--c-border)', fontSize: 12 }}>
                      <span>{f.type.includes('pdf') ? '📄' : '🖼️'}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      <span style={{ color: 'var(--c-text-muted)', flexShrink: 0 }}>{fmtSize(f.size)}</span>
                      <button type="button" onClick={() => setFiles(p => p.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 14, lineHeight: 1, padding: '2px' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {saving && files.length > 0 && progress > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 4 }}>Enviando arquivos… {progress}%</div>
                  <div style={{ height: 4, borderRadius: 99, background: 'var(--c-border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: 'var(--c-accent)', width: `${progress}%`, transition: 'width .3s' }} />
                  </div>
                </div>
              )}
            </div>

            {error && <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 500 }}>⚠️ {error}</div>}
          </div>

          <div style={{ padding: '12px 20px 24px', borderTop: '1px solid var(--c-border)', display: 'flex', gap: 10 }}>
            <button type="button" className="c-btn c-btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="c-btn c-btn-primary" style={{ flex: 2, background: cat.color, borderColor: cat.color }} disabled={saving}>
              {saving ? 'Salvando...' : isEdit ? '💾 Salvar' : `${cat.icon} Criar documento`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ══ ArquivoItem ════════════════════════════════════════════════════ */
function ArquivoItem({ arquivo, onDelete }) {
  const [url, setUrl]         = useState(null)
  const [preview, setPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const isImg = arquivo.tipo_arquivo?.startsWith('image') || /\.(png|jpg|jpeg|webp)$/i.test(arquivo.nome_arquivo)
  const isPdf = arquivo.tipo_arquivo?.includes('pdf')     || /\.pdf$/i.test(arquivo.nome_arquivo)

  async function loadUrl() {
    if (url) return url
    setLoading(true)
    const { data } = await supabase.storage.from('documentos').createSignedUrl(arquivo.storage_path, 3600)
    setLoading(false)
    if (data?.signedUrl) { setUrl(data.signedUrl); return data.signedUrl }
    return null
  }

  async function handleOpen() {
    const u = await loadUrl()
    if (u) window.open(u, '_blank')
  }

  async function handleDownload() {
    const { data } = await supabase.storage.from('documentos').createSignedUrl(arquivo.storage_path, 3600, { download: true })
    if (data?.signedUrl) {
      const a = document.createElement('a'); a.href = data.signedUrl; a.download = arquivo.nome_arquivo; a.click()
    }
  }

  async function togglePreview() {
    if (!preview && !url) await loadUrl()
    setPreview(p => !p)
  }

  return (
    <div style={{ borderRadius: 10, border: '1px solid var(--c-border)', overflow: 'hidden', background: 'var(--c-surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>{isPdf ? '📄' : isImg ? '🖼️' : '📎'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{arquivo.nome_arquivo}</div>
          {arquivo.tamanho > 0 && <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>{fmtSize(arquivo.tamanho)}</div>}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {isImg && (
            <button onClick={togglePreview} className="c-btn c-btn-secondary c-btn-sm" style={{ padding: '4px 8px', fontSize: 11 }}>
              {loading ? '…' : preview ? '▲' : '👁️'}
            </button>
          )}
          <button onClick={handleOpen} className="c-btn c-btn-secondary c-btn-sm" style={{ padding: '4px 8px' }} title="Abrir">↗️</button>
          <button onClick={handleDownload} className="c-btn c-btn-secondary c-btn-sm" style={{ padding: '4px 8px' }} title="Baixar">⬇️</button>
          <button onClick={onDelete} className="c-btn c-btn-danger c-btn-sm" style={{ padding: '4px 8px' }}>✕</button>
        </div>
      </div>
      {preview && url && isImg && (
        <div style={{ padding: '0 12px 12px' }}>
          <img src={url} alt={arquivo.nome_arquivo}
            style={{ width: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--c-border)', background: '#f8fafc' }} />
        </div>
      )}
    </div>
  )
}

/* ══ DocDetailModal ═════════════════════════════════════════════════ */
function DocDetailModal({ doc, people, onEdit, onDelete, onClose, deleting }) {
  const [arquivos, setArquivos] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [uploading, setUploading]       = useState(false)
  const fileRef = useRef()

  const cat    = getCat(doc.categoria)
  const status = getStatus(doc.data_validade)
  const pessoa = people.find(p => p.id === doc.pessoa_id)

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  const loadArquivos = useCallback(async () => {
    setLoadingFiles(true)
    const { data } = await supabase.from('documentos_arquivos').select('*').eq('documento_id', doc.id).order('created_at')
    setArquivos(data || [])
    setLoadingFiles(false)
  }, [doc.id])

  useEffect(() => { loadArquivos() }, [loadArquivos])

  async function handleDeleteArquivo(arq) {
    if (!confirm(`Excluir "${arq.nome_arquivo}"?`)) return
    await supabase.storage.from('documentos').remove([arq.storage_path])
    await supabase.from('documentos_arquivos').delete().eq('id', arq.id)
    loadArquivos()
  }

  async function handleUploadMore(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    for (const file of files) {
      const path = `${user?.id ?? 'anon'}/${doc.id}/${Date.now()}_${sanitize(file.name)}`
      const { error } = await supabase.storage.from('documentos').upload(path, file, { cacheControl: '3600' })
      if (!error) {
        await supabase.from('documentos_arquivos').insert({
          documento_id: doc.id, user_id: user?.id ?? null,
          nome_arquivo: file.name, tipo_arquivo: file.type,
          tamanho: file.size, storage_path: path,
        })
      }
    }
    setUploading(false)
    loadArquivos()
    e.target.value = ''
  }

  return (
    <div className="c-modal-overlay" onClick={onClose}>
      <div className="c-modal-sheet" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--c-border)' }} />
        </div>

        {/* Cabeçalho */}
        <div style={{ padding: '8px 20px 16px', borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: cat.color + '20', border: `2px solid ${cat.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
              {cat.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{doc.nome}</span>
                {doc.favorito && <span style={{ fontSize: 16 }}>⭐</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, background: cat.color + '15', padding: '2px 8px', borderRadius: 99 }}>{cat.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: status.color, background: status.bg, padding: '2px 8px', borderRadius: 99 }}>{status.label}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--c-text-muted)', padding: '4px', flexShrink: 0, lineHeight: 1 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '55vh', overflowY: 'auto' }}>
          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {doc.tipo          && <InfoItem icon="📋" label="Tipo"         value={doc.tipo} />}
            {doc.numero        && <InfoItem icon="🔢" label="Número"       value={doc.numero} />}
            {doc.orgao_emissor && <InfoItem icon="🏛️" label="Órgão emissor" value={doc.orgao_emissor} />}
            {pessoa            && <InfoItem icon="👤" label="Pessoa"       value={pessoa.name} color={pessoa.color} />}
            {doc.data_emissao  && <InfoItem icon="📅" label="Emissão"      value={fmtDate(doc.data_emissao)} />}
            {doc.data_validade && <InfoItem icon="⏰" label="Validade"     value={fmtDate(doc.data_validade)} color={status.color} />}
          </div>

          {doc.observacoes && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>Observações</div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, background: 'var(--c-surface2)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--c-border)' }}>{doc.observacoes}</p>
            </div>
          )}

          {doc.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {doc.tags.map(t => (
                <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'var(--c-surface2)', border: '1px solid var(--c-border)', color: 'var(--c-text-muted)' }}>#{t}</span>
              ))}
            </div>
          )}

          {/* Arquivos */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                Arquivos {!loadingFiles && `(${arquivos.length})`}
              </div>
              <button onClick={() => fileRef.current?.click()} className="c-btn c-btn-secondary c-btn-sm" disabled={uploading} style={{ fontSize: 11 }}>
                {uploading ? 'Enviando…' : '+ Adicionar'}
              </button>
              <input ref={fileRef} type="file" multiple accept={ACCEPT} style={{ display: 'none' }} onChange={handleUploadMore} capture="environment" />
            </div>

            {loadingFiles ? (
              <div style={{ textAlign: 'center', padding: 12, color: 'var(--c-text-muted)', fontSize: 13 }}>Carregando...</div>
            ) : arquivos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 16, border: '1.5px dashed var(--c-border)', borderRadius: 10, color: 'var(--c-text-muted)', fontSize: 13 }}>
                📎 Nenhum arquivo anexado
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {arquivos.map(arq => (
                  <ArquivoItem key={arq.id} arquivo={arq} onDelete={() => handleDeleteArquivo(arq)} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '12px 20px 24px', borderTop: '1px solid var(--c-border)', display: 'flex', gap: 10 }}>
          <button className="c-btn c-btn-secondary" style={{ flex: 1 }} onClick={() => { onClose(); onEdit(doc) }}>✏️ Editar</button>
          <button className="c-btn c-btn-danger" style={{ flex: 1 }} onClick={() => onDelete(doc.id)} disabled={deleting === doc.id}>
            {deleting === doc.id ? 'Excluindo...' : '🗑️ Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value, color }) {
  return (
    <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--c-surface2)', border: '1px solid var(--c-border)' }}>
      <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginBottom: 2 }}>{icon} {label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color || 'var(--c-text)' }}>{value}</div>
    </div>
  )
}

/* ══ DocCard (grid) ═════════════════════════════════════════════════ */
function DocCard({ doc, pessoa, onView }) {
  const cat    = getCat(doc.categoria)
  const status = getStatus(doc.data_validade)
  return (
    <div onClick={onView}
      style={{ padding: 16, borderRadius: 14, cursor: 'pointer', background: 'var(--c-surface)', border: `1.5px solid ${cat.color}20`, boxShadow: 'var(--c-shadow)', transition: 'all .15s', position: 'relative' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 4px 16px ${cat.color}20` }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--c-shadow)' }}
    >
      {doc.favorito && <span style={{ position: 'absolute', top: 10, right: 12, fontSize: 14 }}>⭐</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: cat.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          {cat.icon}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, background: cat.color + '15', padding: '2px 8px', borderRadius: 99 }}>{cat.label}</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3, lineHeight: 1.3 }}>{doc.nome}</div>
      {doc.tipo && <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 8 }}>{doc.tipo}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
        {pessoa
          ? <span style={{ fontSize: 11, fontWeight: 600, color: pessoa.color, background: pessoa.color + '15', padding: '2px 8px', borderRadius: 99 }}>{pessoa.name}</span>
          : <span />}
        <span style={{ fontSize: 11, fontWeight: 600, color: status.color, background: status.bg, padding: '2px 8px', borderRadius: 99 }}>{status.label}</span>
      </div>
    </div>
  )
}

/* ══ DocRow (lista) ═════════════════════════════════════════════════ */
function DocRow({ doc, pessoa, onView, onEdit, onDelete, onFavorite, deleting }) {
  const cat    = getCat(doc.categoria)
  const status = getStatus(doc.data_validade)
  return (
    <div onClick={onView}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', background: 'var(--c-surface)', border: '1.5px solid var(--c-border)', transition: 'background .1s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--c-surface2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--c-surface)'}
    >
      <div style={{ width: 38, height: 38, borderRadius: 10, background: cat.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        {cat.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{doc.nome}</span>
          {doc.favorito && <span style={{ fontSize: 12 }}>⭐</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--c-text-muted)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 1 }}>
          <span style={{ color: cat.color, fontWeight: 600 }}>{cat.label}</span>
          {doc.tipo   && <span>{doc.tipo}</span>}
          {pessoa     && <span style={{ color: pessoa.color, fontWeight: 600 }}>👤 {pessoa.name}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: status.color, background: status.bg, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap' }}>{status.label}</span>
        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
          <button className="c-btn c-btn-secondary c-btn-sm" onClick={onFavorite} style={{ padding: '4px 8px' }}>{doc.favorito ? '⭐' : '☆'}</button>
          <button className="c-btn c-btn-secondary c-btn-sm" onClick={e => { e.stopPropagation(); onEdit() }} style={{ padding: '4px 8px' }}>✏️</button>
          <button className="c-btn c-btn-danger c-btn-sm" onClick={e => { e.stopPropagation(); onDelete(doc.id) }} disabled={deleting === doc.id} style={{ padding: '4px 8px' }}>🗑️</button>
        </div>
      </div>
    </div>
  )
}

/* ══ Página principal ═══════════════════════════════════════════════ */
export default function Documentos() {
  const [docs, setDocs]         = useState([])
  const [people, setPeople]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [viewMode, setViewMode] = useState('lista')
  const [showForm, setShowForm] = useState(false)
  const [editingDoc, setEditingDoc]   = useState(null)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [deleting, setDeleting]       = useState(null)

  const [search, setSearch]             = useState('')
  const [filterCat, setFilterCat]       = useState('')
  const [filterPerson, setFilterPerson] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: d }, { data: p }] = await Promise.all([
      supabase.from('documentos').select('*').order('favorito', { ascending: false }).order('nome'),
      supabase.from('people').select('*').eq('is_active', true),
    ])
    setDocs(d || [])
    setPeople(p || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!confirm('Excluir este documento e todos os arquivos?')) return
    setDeleting(id)
    const { data: arqs } = await supabase.from('documentos_arquivos').select('storage_path').eq('documento_id', id)
    if (arqs?.length) await supabase.storage.from('documentos').remove(arqs.map(a => a.storage_path))
    await supabase.from('documentos').delete().eq('id', id)
    setDocs(prev => prev.filter(d => d.id !== id))
    setDeleting(null)
    setSelectedDoc(null)
  }

  async function toggleFavorito(doc) {
    await supabase.from('documentos').update({ favorito: !doc.favorito }).eq('id', doc.id)
    setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, favorito: !d.favorito } : d))
  }

  function openEdit(doc)  { setEditingDoc(doc); setSelectedDoc(null); setShowForm(true) }
  function afterSave()    { setShowForm(false); setEditingDoc(null); load() }

  const filtered = useMemo(() => {
    let d = docs
    if (search) {
      const q = search.toLowerCase()
      d = d.filter(doc =>
        doc.nome?.toLowerCase().includes(q) ||
        doc.numero?.toLowerCase().includes(q) ||
        doc.tipo?.toLowerCase().includes(q)   ||
        doc.observacoes?.toLowerCase().includes(q) ||
        doc.tags?.some(t => t.toLowerCase().includes(q))
      )
    }
    if (filterCat)    d = d.filter(doc => doc.categoria === filterCat)
    if (filterPerson) d = d.filter(doc => doc.pessoa_id === filterPerson)
    if (filterStatus === 'favorito')     d = d.filter(doc => doc.favorito)
    if (filterStatus === 'vencido')      d = d.filter(doc => getStatus(doc.data_validade).key === 'vencido')
    if (filterStatus === 'vencendo')     d = d.filter(doc => getStatus(doc.data_validade).key === 'vencendo')
    if (filterStatus === 'sem_validade') d = d.filter(doc => !doc.data_validade)
    return d
  }, [docs, search, filterCat, filterPerson, filterStatus])

  const stats = useMemo(() => ({
    total:     docs.length,
    pessoal:   docs.filter(d => d.categoria === 'pessoal').length,
    imovel:    docs.filter(d => d.categoria === 'imovel').length,
    contrato:  docs.filter(d => d.categoria === 'contrato').length,
    atencao:   docs.filter(d => ['vencido','vencendo'].includes(getStatus(d.data_validade).key)).length,
    favoritos: docs.filter(d => d.favorito).length,
  }), [docs])

  const hasFilters = search || filterCat || filterPerson || filterStatus

  return (
    <div>
      {/* ── Header ── */}
      <div className="c-flex c-items-center c-justify-between c-mb-4" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="c-page-header" style={{ margin: 0 }}>
          <h2>📁 Documentos</h2>
          <p>
            {filtered.length} documento{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== docs.length ? ` de ${docs.length}` : ''}
          </p>
        </div>
        <div className="c-flex c-gap-2" style={{ alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 10, padding: 3 }}>
            <button onClick={() => setViewMode('lista')} className={`c-btn c-btn-sm ${viewMode === 'lista' ? 'c-btn-primary' : 'c-btn-secondary'}`} style={{ border: 'none', padding: '4px 10px' }}>☰ Lista</button>
            <button onClick={() => setViewMode('cards')} className={`c-btn c-btn-sm ${viewMode === 'cards' ? 'c-btn-primary' : 'c-btn-secondary'}`} style={{ border: 'none', padding: '4px 10px' }}>⊞ Cards</button>
          </div>
          <button className="c-btn c-btn-primary c-btn-sm" onClick={() => { setEditingDoc(null); setShowForm(true) }}>+ Documento</button>
        </div>
      </div>

      {/* ── Cards de resumo ── */}
      <div className="c-cards-carousel" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total',        value: stats.total,     icon: '📁', color: '#6366f1', f: null,         t: null },
          { label: 'Pessoal',      value: stats.pessoal,   icon: '🪪', color: '#6366f1', f: 'pessoal',    t: 'cat' },
          { label: 'Casa/Imóvel',  value: stats.imovel,    icon: '🏠', color: '#10b981', f: 'imovel',     t: 'cat' },
          { label: 'Contratos',    value: stats.contrato,  icon: '📄', color: '#3b82f6', f: 'contrato',   t: 'cat' },
          { label: 'Atenção',      value: stats.atencao,   icon: '⚠️', color: '#d97706', f: 'vencendo',   t: 'status' },
          { label: 'Favoritos',    value: stats.favoritos, icon: '⭐', color: '#f59e0b', f: 'favorito',   t: 'status' },
        ].map(c => (
          <div key={c.label}
            className="c-cards-carousel-item"
            onClick={() => {
              if (!c.t)               { setFilterCat(''); setFilterStatus('') }
              else if (c.t === 'cat') setFilterCat(filterCat === c.f ? '' : c.f)
              else                    setFilterStatus(filterStatus === c.f ? '' : c.f)
            }}
            style={{ padding: '14px 18px', borderRadius: 12, cursor: 'pointer', background: c.color + '10', border: `1.5px solid ${c.color}25`, transition: 'all .15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: c.color, letterSpacing: '-0.5px' }}>{c.value}</div>
            <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div className="c-card c-mb-4">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label className="c-form-label">Buscar</label>
            <input className="c-form-input" placeholder="Nome, número, tipo, tag..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="c-form-label">Categoria</label>
            <select className="c-form-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">Todas</option>
              {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
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
            <label className="c-form-label">Status</label>
            <select className="c-form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="favorito">⭐ Favoritos</option>
              <option value="vencendo">⚠️ Vencendo</option>
              <option value="vencido">❌ Vencidos</option>
              <option value="sem_validade">📌 Sem validade</option>
            </select>
          </div>
        </div>
        {hasFilters && (
          <div style={{ marginTop: 10 }}>
            <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => { setSearch(''); setFilterCat(''); setFilterPerson(''); setFilterStatus('') }}>
              ✕ Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* ── Conteúdo ── */}
      {loading ? (
        <div className="c-loading-screen" style={{ height: '40vh' }}><div className="c-loading-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="c-card">
          <div className="c-empty-state">
            <div className="c-empty-icon">📁</div>
            <h3>Nenhum documento encontrado</h3>
            <p>{hasFilters ? 'Tente ajustar os filtros.' : 'Clique em "+ Documento" para adicionar.'}</p>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
          {filtered.map(doc => (
            <DocCard key={doc.id} doc={doc} pessoa={people.find(p => p.id === doc.pessoa_id)} onView={() => setSelectedDoc(doc)} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(doc => (
            <DocRow
              key={doc.id} doc={doc}
              pessoa={people.find(p => p.id === doc.pessoa_id)}
              onView={() => setSelectedDoc(doc)}
              onEdit={() => openEdit(doc)}
              onDelete={handleDelete}
              onFavorite={() => toggleFavorito(doc)}
              deleting={deleting}
            />
          ))}
        </div>
      )}

      {showForm && (
        <DocFormModal doc={editingDoc} people={people} onSave={afterSave} onClose={() => { setShowForm(false); setEditingDoc(null) }} />
      )}
      {selectedDoc && (
        <DocDetailModal doc={selectedDoc} people={people} onEdit={openEdit} onDelete={handleDelete} onClose={() => setSelectedDoc(null)} deleting={deleting} />
      )}
    </div>
  )
}
