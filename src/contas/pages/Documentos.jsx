import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  AlertTriangle,
  Archive,
  Briefcase,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  CircleHelp,
  Download,
  Eye,
  FileImage,
  FileText,
  Folder,
  HeartPulse,
  Home,
  IdCard,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Star,
  Tags,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { supabase } from '../lib/supabase'
import {
  Button,
  EmptyState,
  FormField,
  IconButton,
  MetricCard,
  ModalShell,
  PageHeader,
  SectionCard,
  SelectField,
  Skeleton,
  StatusBadge,
} from '../components/ui'

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
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_')

function CategoryIcon({ category, size = 18 }) {
  const icons = {
    pessoal: IdCard,
    veiculo: Car,
    imovel: Home,
    contrato: FileText,
    saude: HeartPulse,
    trabalho: Briefcase,
    financeiro: Archive,
    familia: Users,
    outros: Folder,
  }
  const Icon = icons[category] || Folder
  return <Icon size={size} />
}

function statusTone(status) {
  if (status.key === 'vencido') return 'danger'
  if (status.key === 'vencendo') return 'warning'
  if (status.key === 'ativo') return 'success'
  return 'neutral'
}

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

  const personOptions = people.map(p => ({ value: p.id, label: p.name }))

  return (
    <ModalShell
      open
      title={isEdit ? 'Editar Documento' : 'Novo Documento'}
      description="Cadastre os dados principais e anexe arquivos quando necessario."
      onClose={onClose}
      size="lg"
      className="c-documentos-v2-modal"
      actions={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="documentos-form" loading={saving} disabled={saving} style={{ '--doc-accent': cat.color }}>
            {isEdit ? 'Salvar' : 'Criar documento'}
          </Button>
        </>
      }
    >
      <form id="documentos-form" onSubmit={handleSave} className="c-documentos-v2-form">
        <div className="c-documentos-v2-form-grid c-documentos-v2-form-grid--headline">
          <FormField label="Nome" required>
            <input className="c-v2-select-field" placeholder="Ex: CNH Bruno" value={form.nome} onChange={e => set('nome', e.target.value)} autoFocus />
          </FormField>
          <button
            type="button"
            onClick={() => set('favorito', !form.favorito)}
            className={`c-documentos-v2-favorite-toggle ${form.favorito ? 'is-active' : ''}`}
            aria-label={form.favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            aria-pressed={form.favorito}
          >
            <Star size={20} fill={form.favorito ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="c-documentos-v2-category-picker" aria-label="Categoria">
          {CATEGORIAS.map(c => (
            <button
              key={c.key}
              type="button"
              onClick={() => set('categoria', c.key)}
              className={`c-documentos-v2-category-chip ${form.categoria === c.key ? 'is-active' : ''}`}
              style={{ '--doc-accent': c.color }}
            >
              <CategoryIcon category={c.key} size={14} />
              {c.label}
            </button>
          ))}
        </div>

        <div className="c-documentos-v2-form-grid">
          <SelectField
            label="Tipo"
            value={form.tipo}
            onChange={e => set('tipo', e.target.value)}
            placeholder="Selecione"
            options={TIPOS_DOC.map(t => ({ value: t, label: t }))}
          />
          <SelectField
            label="Pessoa relacionada"
            value={form.pessoa_id}
            onChange={e => set('pessoa_id', e.target.value)}
            placeholder="Nenhuma"
            options={personOptions}
          />
        </div>

        <div className="c-documentos-v2-form-grid">
          <FormField label="Numero">
            <input className="c-v2-select-field" placeholder="Ex: 12.345.678-9" value={form.numero} onChange={e => set('numero', e.target.value)} />
          </FormField>
          <FormField label="Orgao emissor">
            <input className="c-v2-select-field" placeholder="Ex: SSP/SP, Detran" value={form.orgao_emissor} onChange={e => set('orgao_emissor', e.target.value)} />
          </FormField>
        </div>

        <div className="c-documentos-v2-form-grid">
          <FormField label="Data de emissao">
            <input type="date" className="c-v2-select-field" value={form.data_emissao} onChange={e => set('data_emissao', e.target.value)} />
          </FormField>
          <FormField label="Data de validade">
            <input type="date" className="c-v2-select-field" value={form.data_validade} onChange={e => set('data_validade', e.target.value)} />
          </FormField>
        </div>

        <FormField label="Observacoes">
          <textarea className="c-documentos-v2-textarea" rows={3} placeholder="Informacoes adicionais..." value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
        </FormField>

        <FormField label="Tags" help="Separadas por virgula.">
          <input className="c-v2-select-field" placeholder="Ex: urgente, renovar, original" value={form.tags} onChange={e => set('tags', e.target.value)} />
        </FormField>

        <div className="c-documentos-v2-upload-group">
          <label className="c-v2-form-field__label">Arquivos {isEdit && <span>(adicionar mais)</span>}</label>
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click() }}
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('is-dragging') }}
            onDragLeave={e => e.currentTarget.classList.remove('is-dragging')}
            onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('is-dragging'); setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]) }}
            className="c-documentos-v2-upload"
          >
            <Upload size={22} />
            <strong>Clique ou arraste arquivos aqui</strong>
            <span>PDF, PNG, JPG, JPEG, WEBP</span>
          </div>
          <input ref={fileRef} type="file" multiple accept={ACCEPT} className="c-documentos-v2-file-input"
            onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])}
            capture="environment"
          />

          {files.length > 0 && (
            <div className="c-documentos-v2-upload-list">
              {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className="c-documentos-v2-upload-file">
                  {f.type.includes('pdf') ? <FileText size={16} /> : <FileImage size={16} />}
                  <span>{f.name}</span>
                  <small>{fmtSize(f.size)}</small>
                  <IconButton icon={<X size={14} />} label={`Remover ${f.name}`} variant="ghost" size="sm" onClick={() => setFiles(p => p.filter((_, j) => j !== i))} />
                </div>
              ))}
            </div>
          )}

          {saving && files.length > 0 && progress > 0 && (
            <div className="c-documentos-v2-progress" aria-label={`Enviando arquivos ${progress}%`}>
              <span>Enviando arquivos... {progress}%</span>
              <div><span style={{ width: `${progress}%` }} /></div>
            </div>
          )}
        </div>

        {error && <p className="c-documentos-v2-error" role="alert">{error}</p>}
      </form>
    </ModalShell>
  )
}

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
    <article className="c-documentos-v2-file-card">
      <div className="c-documentos-v2-file-main">
        <span className="c-documentos-v2-file-icon" aria-hidden="true">
          {isPdf ? <FileText size={20} /> : isImg ? <ImageIcon size={20} /> : <Paperclip size={20} />}
        </span>
        <div>
          <strong title={arquivo.nome_arquivo}>{arquivo.nome_arquivo}</strong>
          {arquivo.tamanho > 0 && <small>{fmtSize(arquivo.tamanho)}</small>}
        </div>
      </div>
      <div className="c-documentos-v2-file-actions">
        {isImg && (
          <IconButton icon={<Eye size={15} />} label={preview ? 'Ocultar preview' : 'Ver preview'} variant="secondary" size="sm" onClick={togglePreview} disabled={loading} />
        )}
        <IconButton icon={<Eye size={15} />} label="Abrir arquivo" variant="secondary" size="sm" onClick={handleOpen} />
        <IconButton icon={<Download size={15} />} label="Baixar arquivo" variant="secondary" size="sm" onClick={handleDownload} />
        <IconButton icon={<Trash2 size={15} />} label="Excluir arquivo" variant="danger" size="sm" onClick={onDelete} />
      </div>
      {preview && url && isImg && (
        <div className="c-documentos-v2-preview">
          <img src={url} alt={arquivo.nome_arquivo} />
        </div>
      )}
    </article>
  )
}

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
    <ModalShell
      open
      title={doc.nome}
      description="Detalhes, arquivos anexados e acoes do documento."
      onClose={onClose}
      size="lg"
      className="c-documentos-v2-modal"
      actions={
        <>
          <Button variant="secondary" icon={<Pencil size={16} />} onClick={() => { onClose(); onEdit(doc) }}>Editar</Button>
          <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => onDelete(doc.id)} loading={deleting === doc.id} disabled={deleting === doc.id}>
            Excluir
          </Button>
        </>
      }
    >
      <div className="c-documentos-v2-detail">
        <div className="c-documentos-v2-detail-hero">
          <span className="c-documentos-v2-doc-icon" style={{ '--doc-accent': cat.color }}>
            <CategoryIcon category={doc.categoria} size={24} />
          </span>
          <div>
            <div className="c-documentos-v2-badges">
              <StatusBadge tone="accent">{cat.label}</StatusBadge>
              <StatusBadge tone={statusTone(status)}>{status.label}</StatusBadge>
              {doc.favorito && <StatusBadge tone="warning" icon={<Star size={13} fill="currentColor" />}>Favorito</StatusBadge>}
            </div>
          </div>
        </div>

        <div className="c-documentos-v2-info-grid">
          {doc.tipo          && <InfoItem icon={<FileText size={15} />} label="Tipo"          value={doc.tipo} />}
          {doc.numero        && <InfoItem icon={<Tags size={15} />} label="Numero"        value={doc.numero} />}
          {doc.orgao_emissor && <InfoItem icon={<Building2 size={15} />} label="Orgao emissor" value={doc.orgao_emissor} />}
          {pessoa            && <InfoItem icon={<Users size={15} />} label="Pessoa"        value={pessoa.name} color={pessoa.color} />}
          {doc.data_emissao  && <InfoItem icon={<CalendarDays size={15} />} label="Emissao"       value={fmtDate(doc.data_emissao)} />}
          {doc.data_validade && <InfoItem icon={<CalendarDays size={15} />} label="Validade"      value={fmtDate(doc.data_validade)} color={status.color} />}
        </div>

        {doc.observacoes && (
          <section className="c-documentos-v2-note">
            <h3>Observacoes</h3>
            <p>{doc.observacoes}</p>
          </section>
        )}

        {doc.tags?.length > 0 && (
          <div className="c-documentos-v2-tag-list">
            {doc.tags.map(t => <span key={t}>#{t}</span>)}
          </div>
        )}

        <section className="c-documentos-v2-files-section">
          <header>
            <div>
              <h3>Arquivos {!loadingFiles && `(${arquivos.length})`}</h3>
              <p>Anexos vinculados a este documento.</p>
            </div>
            <Button variant="secondary" size="sm" icon={<Plus size={15} />} onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Enviando...' : 'Adicionar'}
            </Button>
            <input ref={fileRef} type="file" multiple accept={ACCEPT} className="c-documentos-v2-file-input" onChange={handleUploadMore} capture="environment" />
          </header>

          {loadingFiles ? (
            <Skeleton variant="text" lines={3} />
          ) : arquivos.length === 0 ? (
            <EmptyState compact icon={<Paperclip size={22} />} title="Nenhum arquivo anexado" description="Arquivos enviados para este documento aparecerao aqui." />
          ) : (
            <div className="c-documentos-v2-file-list">
              {arquivos.map(arq => <ArquivoItem key={arq.id} arquivo={arq} onDelete={() => handleDeleteArquivo(arq)} />)}
            </div>
          )}
        </section>
      </div>
    </ModalShell>
  )
}

function InfoItem({ icon, label, value, color }) {
  return (
    <div className="c-documentos-v2-info-item">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong style={{ color: color || undefined }}>{value}</strong>
      </div>
    </div>
  )
}

function DocCard({ doc, pessoa, onView }) {
  const cat    = getCat(doc.categoria)
  const status = getStatus(doc.data_validade)
  return (
    <button type="button" onClick={onView} className="c-documentos-v2-card">
      <div className="c-documentos-v2-card-top">
        <span className="c-documentos-v2-doc-icon" style={{ '--doc-accent': cat.color }}>
          <CategoryIcon category={doc.categoria} size={21} />
        </span>
        {doc.favorito && <Star size={16} fill="currentColor" className="c-documentos-v2-star" />}
      </div>
      <div>
        <strong title={doc.nome}>{doc.nome}</strong>
        {doc.tipo && <p>{doc.tipo}</p>}
      </div>
      <div className="c-documentos-v2-badges">
        <StatusBadge tone="accent" size="sm">{cat.label}</StatusBadge>
        <StatusBadge tone={statusTone(status)} size="sm">{status.label}</StatusBadge>
        {pessoa && <StatusBadge tone="info" size="sm">{pessoa.name}</StatusBadge>}
      </div>
    </button>
  )
}

function DocRow({ doc, pessoa, onView, onEdit, onDelete, onFavorite, deleting }) {
  const cat    = getCat(doc.categoria)
  const status = getStatus(doc.data_validade)
  return (
    <article className="c-documentos-v2-row">
      <button type="button" onClick={onView} className="c-documentos-v2-row-main">
        <span className="c-documentos-v2-doc-icon" style={{ '--doc-accent': cat.color }}>
          <CategoryIcon category={doc.categoria} size={20} />
        </span>
        <div>
          <strong title={doc.nome}>{doc.nome}</strong>
          <span>
            <b style={{ color: cat.color }}>{cat.label}</b>
            {doc.tipo && <> · {doc.tipo}</>}
            {pessoa && <> · {pessoa.name}</>}
          </span>
        </div>
      </button>
      <div className="c-documentos-v2-row-actions">
        <StatusBadge tone={statusTone(status)} size="sm">{status.label}</StatusBadge>
        <IconButton icon={<Star size={15} fill={doc.favorito ? 'currentColor' : 'none'} />} label={doc.favorito ? 'Remover favorito' : 'Favoritar'} variant="secondary" size="sm" onClick={onFavorite} />
        <IconButton icon={<Pencil size={15} />} label={`Editar ${doc.nome}`} variant="secondary" size="sm" onClick={onEdit} />
        <IconButton icon={<Trash2 size={15} />} label={`Excluir ${doc.nome}`} variant="danger" size="sm" onClick={() => onDelete(doc.id)} disabled={deleting === doc.id} />
      </div>
    </article>
  )
}

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

  const metricItems = [
    { label: 'Total', value: stats.total, icon: <Folder size={18} />, tone: 'accent', onClick: () => { setFilterCat(''); setFilterStatus('') } },
    { label: 'Pessoal', value: stats.pessoal, icon: <IdCard size={18} />, tone: 'neutral', onClick: () => setFilterCat(filterCat === 'pessoal' ? '' : 'pessoal') },
    { label: 'Casa/Imovel', value: stats.imovel, icon: <Home size={18} />, tone: 'success', onClick: () => setFilterCat(filterCat === 'imovel' ? '' : 'imovel') },
    { label: 'Contratos', value: stats.contrato, icon: <FileText size={18} />, tone: 'info', onClick: () => setFilterCat(filterCat === 'contrato' ? '' : 'contrato') },
    { label: 'Atencao', value: stats.atencao, icon: <AlertTriangle size={18} />, tone: 'warning', onClick: () => setFilterStatus(filterStatus === 'vencendo' ? '' : 'vencendo') },
    { label: 'Favoritos', value: stats.favoritos, icon: <Star size={18} />, tone: 'warning', onClick: () => setFilterStatus(filterStatus === 'favorito' ? '' : 'favorito') },
  ]

  return (
    <div className="c-documentos-v2-page">
      <PageHeader
        eyebrow="Casa"
        title="Documentos"
        description="Centralize documentos pessoais, da casa, veiculos, contratos e anexos importantes."
        meta={<StatusBadge tone="accent" icon={<Folder size={14} />}>{filtered.length} de {docs.length}</StatusBadge>}
        actions={
          <div className="c-documentos-v2-header-actions">
            <div className="c-documentos-v2-view-toggle" aria-label="Modo de visualizacao">
              <button type="button" onClick={() => setViewMode('lista')} className={viewMode === 'lista' ? 'is-active' : ''} aria-label="Ver em lista"><List size={15} /> Lista</button>
              <button type="button" onClick={() => setViewMode('cards')} className={viewMode === 'cards' ? 'is-active' : ''} aria-label="Ver em cards"><LayoutGrid size={15} /> Cards</button>
            </div>
            <Button icon={<Plus size={16} />} onClick={() => { setEditingDoc(null); setShowForm(true) }}>Documento</Button>
          </div>
        }
      />

      <div className="c-documentos-v2-metrics">
        {metricItems.map(item => (
          <button key={item.label} type="button" onClick={item.onClick} className="c-documentos-v2-metric-button">
            <MetricCard label={item.label} value={item.value} icon={item.icon} tone={item.tone} />
          </button>
        ))}
      </div>

      <SectionCard title="Filtros" description="Use os filtros existentes para localizar documentos." padding="lg" className="c-documentos-v2-filter-card">
        <div className="c-documentos-v2-filters">
          <FormField label="Buscar">
            <div className="c-documentos-v2-search">
              <Search size={16} />
              <input placeholder="Nome, numero, tipo, tag..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </FormField>
          <SelectField
            label="Categoria"
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            placeholder="Todas"
            options={CATEGORIAS.map(c => ({ value: c.key, label: c.label }))}
          />
          <SelectField
            label="Pessoa"
            value={filterPerson}
            onChange={e => setFilterPerson(e.target.value)}
            placeholder="Todas"
            options={people.map(p => ({ value: p.id, label: p.name }))}
          />
          <SelectField
            label="Status"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            placeholder="Todos"
            options={[
              { value: 'favorito', label: 'Favoritos' },
              { value: 'vencendo', label: 'Vencendo' },
              { value: 'vencido', label: 'Vencidos' },
              { value: 'sem_validade', label: 'Sem validade' },
            ]}
          />
        </div>
        {hasFilters && (
          <Button variant="secondary" size="sm" icon={<X size={15} />} onClick={() => { setSearch(''); setFilterCat(''); setFilterPerson(''); setFilterStatus('') }}>
            Limpar filtros
          </Button>
        )}
      </SectionCard>

      <SectionCard
        title="Arquivos cadastrados"
        description={viewMode === 'cards' ? 'Grade visual dos documentos filtrados.' : 'Lista compacta com status e acoes.'}
        padding="lg"
        className="c-documentos-v2-list-card"
      >
        {loading ? (
          <div className="c-documentos-v2-loading">
            <Skeleton variant="text" lines={4} />
            <Skeleton variant="card" height={72} />
            <Skeleton variant="card" height={72} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Folder size={26} />}
            title="Nenhum documento encontrado"
            description={hasFilters ? 'Tente ajustar os filtros.' : 'Clique em Documento para adicionar.'}
            action={!hasFilters ? <Button icon={<Plus size={16} />} onClick={() => { setEditingDoc(null); setShowForm(true) }}>Documento</Button> : null}
          />
        ) : viewMode === 'cards' ? (
          <div className="c-documentos-v2-grid">
            {filtered.map(doc => (
              <DocCard key={doc.id} doc={doc} pessoa={people.find(p => p.id === doc.pessoa_id)} onView={() => setSelectedDoc(doc)} />
            ))}
          </div>
        ) : (
          <div className="c-documentos-v2-rows">
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
      </SectionCard>

      {showForm && (
        <DocFormModal doc={editingDoc} people={people} onSave={afterSave} onClose={() => { setShowForm(false); setEditingDoc(null) }} />
      )}
      {selectedDoc && (
        <DocDetailModal doc={selectedDoc} people={people} onEdit={openEdit} onDelete={handleDelete} onClose={() => setSelectedDoc(null)} deleting={deleting} />
      )}
    </div>
  )
}
