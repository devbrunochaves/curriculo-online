import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/* ── Definição das colunas Kanban ── */
const COLUNAS = [
  { key: 'lead',           label: 'Leads',                icon: '🎯', color: '#6366f1', desc: 'Capturados pelo agente' },
  { key: 'sem_presenca',   label: 'Sem Presença Digital', icon: '❌', color: '#ef4444', desc: 'Sem site ou redes sociais' },
  { key: 'presenca_fraca', label: 'Presença Fraca',       icon: '⚠️', color: '#f59e0b', desc: 'Site ou perfil desatualizado' },
  { key: 'presenca_ativa', label: 'Presença Ativa',       icon: '✅', color: '#10b981', desc: 'Bem posicionados online' },
]

/* Mapeia status legado → coluna Kanban */
function getColuna(status) {
  if (COLUNAS.some(c => c.key === status)) return status
  if (status === 'ativo')     return 'presenca_ativa'
  if (status === 'pausado')   return 'presenca_fraca'
  return 'lead'
}

const STATUS_OPTS = [
  { key: 'lead',           label: 'Lead (capturado)' },
  { key: 'sem_presenca',   label: 'Sem Presença Digital' },
  { key: 'presenca_fraca', label: 'Presença Fraca' },
  { key: 'presenca_ativa', label: 'Presença Ativa' },
]

const NICHOS = ['Advocacia','Saúde','Nutrição','Barbearia','Moda','Estética','Gastronomia','Educação','Imobiliária','Tecnologia','Outro']
const AVATAR_COLORS = ['#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#ec4899','#06b6d4','#84cc16']

function getInitials(nome) {
  if (!nome) return '?'
  const parts = nome.trim().split(' ')
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2)
}

const EMPTY_FORM = {
  nome: '', empresa: '', nicho: '', whatsapp: '', email: '',
  instagram: '', drive_link: '', status: 'lead', notas: '', avatar_color: '#f59e0b',
}

export default function Clientes() {
  const [clientes, setClientes]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filtroNicho, setFiltroNicho] = useState('')
  const [modal, setModal]             = useState(false)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [editId, setEditId]           = useState(null)
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(null)

  /* drag & drop */
  const [draggedId, setDraggedId]   = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)
  const dragNode = useRef(null)

  /* card notas expandida */
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase
      .from('crm_clientes')
      .select('*')
      .order('created_at', { ascending: false })
    setClientes(data || [])
    setLoading(false)
  }

  function openNew(defaultStatus = 'lead') {
    setEditId(null)
    setForm({
      ...EMPTY_FORM,
      status: defaultStatus,
      avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    })
    setModal(true)
  }

  function openEdit(c) {
    setEditId(c.id)
    setForm({
      nome: c.nome || '', empresa: c.empresa || '', nicho: c.nicho || '',
      whatsapp: c.whatsapp || '', email: c.email || '', instagram: c.instagram || '',
      drive_link: c.drive_link || '', status: c.status || 'lead',
      notas: c.notas || '', avatar_color: c.avatar_color || '#f59e0b',
    })
    setModal(true)
  }

  async function save() {
    if (!form.nome.trim()) return
    setSaving(true)
    if (editId) {
      await supabase.from('crm_clientes').update(form).eq('id', editId)
    } else {
      await supabase.from('crm_clientes').insert(form)
    }
    setSaving(false)
    setModal(false)
    load()
  }

  async function del(id) {
    if (!window.confirm('Remover este cliente? Todos os dados relacionados serão excluídos.')) return
    setDeleting(id)
    await supabase.from('crm_clientes').delete().eq('id', id)
    setDeleting(null)
    load()
  }

  /* ── Drag & Drop handlers ── */
  function handleDragStart(e, id) {
    setDraggedId(id)
    dragNode.current = e.target
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    // pequeno delay para o ghost aparecer antes do .dragging
    setTimeout(() => { if (dragNode.current) dragNode.current.classList.add('crm-kb-card-dragging') }, 0)
  }

  function handleDragEnd() {
    if (dragNode.current) dragNode.current.classList.remove('crm-kb-card-dragging')
    dragNode.current = null
    setDraggedId(null)
    setDragOverCol(null)
  }

  function handleDragOver(e, colKey) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverCol !== colKey) setDragOverCol(colKey)
  }

  function handleDragLeave(e) {
    // só limpa se saiu para fora do container da coluna
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverCol(null)
    }
  }

  async function handleDrop(e, colKey) {
    e.preventDefault()
    const id = draggedId || e.dataTransfer.getData('text/plain')
    setDraggedId(null)
    setDragOverCol(null)
    if (!id || !colKey) return
    const cliente = clientes.find(c => c.id === id)
    if (cliente && getColuna(cliente.status) === colKey) return // sem mudança
    await supabase.from('crm_clientes').update({ status: colKey }).eq('id', id)
    load()
  }

  /* ── Filtros ── */
  const nichosDisponiveis = [...new Set(clientes.map(c => c.nicho).filter(Boolean))].sort()

  const filtered = clientes.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.nome?.toLowerCase().includes(q) || c.empresa?.toLowerCase().includes(q) || c.nicho?.toLowerCase().includes(q)
    const matchNicho  = !filtroNicho || c.nicho === filtroNicho
    return matchSearch && matchNicho
  })

  if (loading) return (
    <div className="crm-loading-screen">
      <div className="crm-loading-spinner" />
      <p>Carregando...</p>
    </div>
  )

  const totalLeads = clientes.filter(c => getColuna(c.status) === 'lead').length

  return (
    <div>
      {/* ── Header ── */}
      <div className="crm-page-header">
        <div className="crm-page-header-left">
          <h2>Pipeline de Clientes</h2>
          <p>{totalLeads} leads · {clientes.length} total</p>
        </div>
        <button className="crm-btn crm-btn-primary" onClick={() => openNew('lead')}>
          + Novo Lead
        </button>
      </div>

      {/* ── Barra de filtros ── */}
      <div className="crm-search-bar">
        <div className="crm-search-input-wrap">
          <input
            className="crm-input"
            placeholder="Buscar por nome, empresa ou nicho..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="crm-search-clear" onClick={() => setSearch('')} title="Limpar busca">×</button>
          )}
        </div>

        <select
          className="crm-select"
          style={{ width: 190 }}
          value={filtroNicho}
          onChange={e => setFiltroNicho(e.target.value)}
        >
          <option value="">Todos os nichos</option>
          {nichosDisponiveis.map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        {(search || filtroNicho) && (
          <button
            className="crm-btn crm-btn-ghost crm-btn-sm"
            onClick={() => { setSearch(''); setFiltroNicho('') }}
          >
            ✕ Limpar filtros
          </button>
        )}
      </div>

      {/* ── Kanban Board ── */}
      <div className="crm-kb-board">
        {COLUNAS.map(col => {
          const cards = filtered.filter(c => getColuna(c.status) === col.key)
          const isDragOver = dragOverCol === col.key

          return (
            <div
              key={col.key}
              className={`crm-kb-col${isDragOver ? ' crm-kb-col-over' : ''}`}
              style={{ '--col-color': col.color }}
              onDragOver={e => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, col.key)}
            >
              {/* Header da coluna */}
              <div className="crm-kb-col-header">
                <div className="crm-kb-col-title">
                  <span className="crm-kb-col-icon">{col.icon}</span>
                  <div>
                    <div className="crm-kb-col-name">{col.label}</div>
                    <div className="crm-kb-col-desc">{col.desc}</div>
                  </div>
                </div>
                <span className="crm-kb-col-count" style={{ background: col.color + '22', color: col.color }}>
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="crm-kb-cards">
                {cards.length === 0 && (
                  <div className={`crm-kb-empty${isDragOver ? ' crm-kb-empty-over' : ''}`}>
                    {isDragOver ? '↓ Soltar aqui' : 'Nenhum lead'}
                  </div>
                )}

                {cards.map(c => (
                  <KanbanCard
                    key={c.id}
                    cliente={c}
                    col={col}
                    expanded={expandedId === c.id}
                    onToggleExpand={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    onEdit={() => openEdit(c)}
                    onDelete={() => del(c.id)}
                    deleting={deleting === c.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>

              {/* Adicionar nesta coluna */}
              <button
                className="crm-kb-add-btn"
                onClick={() => openNew(col.key)}
              >
                + Adicionar
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Modal de cadastro / edição ── */}
      {modal && (
        <div className="crm-modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="crm-modal">
            <div className="crm-modal-header">
              <h3>{editId ? 'Editar Cliente' : 'Novo Cliente'}</h3>
              <button className="crm-modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="crm-modal-body">
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Nome *</label>
                  <input className="crm-input" placeholder="Nome do contato" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                </div>
                <div className="crm-form-group">
                  <label>Empresa</label>
                  <input className="crm-input" placeholder="Razão social ou nome fantasia" value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} />
                </div>
              </div>
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Nicho</label>
                  <select className="crm-select" value={form.nicho} onChange={e => setForm(f => ({ ...f, nicho: e.target.value }))}>
                    <option value="">Selecionar...</option>
                    {NICHOS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="crm-form-group">
                  <label>Coluna (estágio)</label>
                  <select className="crm-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>WhatsApp</label>
                  <input className="crm-input" placeholder="(27) 99999-9999" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                </div>
                <div className="crm-form-group">
                  <label>E-mail</label>
                  <input className="crm-input" type="email" placeholder="email@empresa.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="crm-form-row">
                <div className="crm-form-group">
                  <label>Instagram</label>
                  <input className="crm-input" placeholder="@perfil ou URL completa" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} />
                </div>
                <div className="crm-form-group">
                  <label>Link do Drive</label>
                  <input className="crm-input" placeholder="https://drive.google.com/..." value={form.drive_link} onChange={e => setForm(f => ({ ...f, drive_link: e.target.value }))} />
                </div>
              </div>
              <div className="crm-form-group">
                <label>Cor do avatar</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {AVATAR_COLORS.map(cor => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, avatar_color: cor }))}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: cor, border: 'none',
                        cursor: 'pointer', outline: form.avatar_color === cor ? '3px solid #fff' : 'none',
                        outlineOffset: 2, boxShadow: form.avatar_color === cor ? `0 0 0 5px ${cor}55` : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="crm-form-group">
                <label>Notas</label>
                <textarea className="crm-textarea" placeholder="Observações sobre o cliente..." value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
              </div>
            </div>
            <div className="crm-modal-footer">
              <button className="crm-btn crm-btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="crm-btn crm-btn-primary" onClick={save} disabled={saving || !form.nome.trim()}>
                {saving ? 'Salvando...' : editId ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Componente de card do Kanban ── */
function KanbanCard({ cliente: c, col, expanded, onToggleExpand, onEdit, onDelete, deleting, onDragStart, onDragEnd }) {
  const notasLinhas = (c.notas || '').split('\n').filter(Boolean)

  return (
    <div
      className="crm-kb-card"
      draggable
      onDragStart={e => onDragStart(e, c.id)}
      onDragEnd={onDragEnd}
    >
      {/* Linha de cor no topo */}
      <div className="crm-kb-card-accent" style={{ background: col.color }} />

      {/* Header do card */}
      <div className="crm-kb-card-header">
        <div className="crm-avatar crm-kb-avatar" style={{ background: c.avatar_color || '#6366f1' }}>
          {getInitials(c.nome).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link to={`/crm/clientes/${c.id}`} className="crm-client-link">
            <div className="crm-kb-card-name">{c.nome}</div>
          </Link>
          {c.empresa && <div className="crm-kb-card-empresa">{c.empresa}</div>}
          {c.nicho && (
            <span className="crm-badge crm-badge-info crm-kb-nicho">{c.nicho}</span>
          )}
        </div>
        {/* Drag handle visual */}
        <span className="crm-kb-drag-handle" title="Arraste para classificar">⠿</span>
      </div>

      {/* Contatos */}
      {(c.whatsapp || c.instagram) && (
        <div className="crm-kb-contacts">
          {c.whatsapp && (
            <a
              href={`https://wa.me/55${c.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="crm-kb-contact-link crm-kb-wpp"
              onClick={e => e.stopPropagation()}
            >
              <span>📱</span> {c.whatsapp}
            </a>
          )}
          {c.instagram && (
            <a
              href={c.instagram.startsWith('http') ? c.instagram : `https://instagram.com/${c.instagram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="crm-kb-contact-link crm-kb-insta"
              onClick={e => e.stopPropagation()}
            >
              <span>📷</span> {c.instagram}
            </a>
          )}
        </div>
      )}

      {/* Notas preview */}
      {notasLinhas.length > 0 && (
        <div className="crm-kb-notas">
          <div className={`crm-kb-notas-text${expanded ? ' crm-kb-notas-expanded' : ''}`}>
            {expanded ? notasLinhas.join('\n') : notasLinhas[0]}
          </div>
          {notasLinhas.length > 1 && (
            <button className="crm-kb-notas-toggle" onClick={onToggleExpand}>
              {expanded ? '▲ menos' : `▼ +${notasLinhas.length - 1} linhas`}
            </button>
          )}
        </div>
      )}

      {/* Rodapé com ações */}
      <div className="crm-kb-card-footer">
        <button className="crm-kb-action crm-kb-action-edit" onClick={onEdit} title="Editar">
          ✏️ Editar
        </button>
        <button
          className="crm-kb-action crm-kb-action-del"
          onClick={onDelete}
          disabled={deleting}
          title="Remover"
        >
          {deleting ? '...' : '🗑️'}
        </button>
      </div>
    </div>
  )
}
