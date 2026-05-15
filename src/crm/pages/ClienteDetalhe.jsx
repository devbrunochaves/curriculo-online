import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SERVICO_LABEL = {
  social_media: 'Social Media',
  trafego_pago: 'Tráfego Pago',
  design:       'Design Gráfico',
  site:         'Site / Landing Page',
  gmn:          'Google Meu Negócio',
  gestao_marca: 'Gestão de Marca',
}

const STATUS_CONTRATO_BADGE = {
  ativo:     'crm-badge-success',
  pausado:   'crm-badge-warning',
  encerrado: 'crm-badge-muted',
}

const STATUS_ENTREGA_BADGE = {
  planejado:    'crm-badge-muted',
  em_andamento: 'crm-badge-info',
  revisao:      'crm-badge-warning',
  concluido:    'crm-badge-success',
}

function getInitials(nome) {
  if (!nome) return '?'
  const p = nome.trim().split(' ')
  return p.length >= 2 ? p[0][0] + p[1][0] : p[0].slice(0, 2)
}

function fmtBRL(v) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

export default function ClienteDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente]     = useState(null)
  const [contratos, setContratos] = useState([])
  const [entregas, setEntregas]   = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => { load() }, [id])

  async function load() {
    const [{ data: c }, { data: ct }, { data: e }] = await Promise.all([
      supabase.from('crm_clientes').select('*').eq('id', id).single(),
      supabase.from('crm_contratos').select('*').eq('cliente_id', id).order('created_at', { ascending: false }),
      supabase.from('crm_entregas').select('*').eq('cliente_id', id).order('prazo', { ascending: true }),
    ])
    setCliente(c)
    setContratos(ct || [])
    setEntregas(e || [])
    setLoading(false)
  }

  if (loading) return (
    <div className="crm-loading-screen">
      <div className="crm-loading-spinner" />
      <p>Carregando...</p>
    </div>
  )

  if (!cliente) return (
    <div className="crm-empty">
      <div className="crm-empty-icon">❌</div>
      <p>Cliente não encontrado</p>
      <button className="crm-btn crm-btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate('/crm/clientes')}>
        ← Voltar
      </button>
    </div>
  )

  const mrr = contratos.filter(c => c.status === 'ativo').reduce((s, c) => s + (parseFloat(c.valor_mensal) || 0), 0)
  const pendentes = entregas.filter(e => e.status !== 'concluido').length

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--crm-text-faint)' }}>
        <Link to="/crm/clientes" style={{ color: 'var(--crm-text-faint)', textDecoration: 'none' }}>Clientes</Link>
        {' → '}
        <span style={{ color: 'var(--crm-text-muted)' }}>{cliente.nome}</span>
      </div>

      {/* Header */}
      <div className="crm-detail-header">
        <div className="crm-avatar crm-detail-avatar" style={{ background: cliente.avatar_color || '#f59e0b' }}>
          {getInitials(cliente.nome).toUpperCase()}
        </div>
        <div className="crm-detail-meta">
          <h2>{cliente.nome}</h2>
          <p>
            {cliente.empresa && <span>{cliente.empresa} · </span>}
            {cliente.nicho && <span>{cliente.nicho} · </span>}
            <span className={`crm-badge ${cliente.status === 'ativo' ? 'crm-badge-success' : cliente.status === 'lead' ? 'crm-badge-info' : 'crm-badge-muted'}`} style={{ fontSize: 11 }}>
              {cliente.status}
            </span>
          </p>
        </div>
        <button className="crm-btn crm-btn-ghost crm-btn-sm" style={{ marginLeft: 'auto' }} onClick={() => navigate('/crm/clientes')}>
          ← Voltar
        </button>
      </div>

      {/* Stats rápidos */}
      <div className="crm-grid-3" style={{ marginBottom: 24 }}>
        <div className="crm-card crm-card-sm">
          <div className="crm-stat">
            <div className="crm-stat-label">MRR do cliente</div>
            <div className="crm-stat-value" style={{ fontSize: 22 }}>{fmtBRL(mrr)}</div>
          </div>
        </div>
        <div className="crm-card crm-card-sm">
          <div className="crm-stat">
            <div className="crm-stat-label">Serviços ativos</div>
            <div className="crm-stat-value" style={{ fontSize: 22 }}>{contratos.filter(c => c.status === 'ativo').length}</div>
          </div>
        </div>
        <div className="crm-card crm-card-sm">
          <div className="crm-stat">
            <div className="crm-stat-label">Entregas pendentes</div>
            <div className="crm-stat-value" style={{ fontSize: 22 }}>{pendentes}</div>
          </div>
        </div>
      </div>

      <div className="crm-grid-2">
        {/* Contatos */}
        <div className="crm-card">
          <div className="crm-section-title">Contato</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {cliente.whatsapp && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 16 }}>📱</span>
                <a href={`https://wa.me/55${cliente.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                  style={{ color: 'var(--crm-accent)', fontSize: 13 }}>
                  {cliente.whatsapp}
                </a>
              </div>
            )}
            {cliente.email && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 16 }}>✉️</span>
                <a href={`mailto:${cliente.email}`} style={{ color: 'var(--crm-accent)', fontSize: 13 }}>
                  {cliente.email}
                </a>
              </div>
            )}
            {!cliente.whatsapp && !cliente.email && (
              <p style={{ color: 'var(--crm-text-faint)', fontSize: 13 }}>Nenhum contato cadastrado</p>
            )}
            {cliente.notas && (
              <div style={{ marginTop: 8, padding: '12px', background: 'var(--crm-surface2)', borderRadius: 8, fontSize: 13, color: 'var(--crm-text-muted)', lineHeight: 1.6 }}>
                {cliente.notas}
              </div>
            )}
          </div>
        </div>

        {/* Contratos / Serviços */}
        <div className="crm-card">
          <div className="crm-section-title">Serviços Contratados</div>
          {contratos.length === 0 ? (
            <div style={{ color: 'var(--crm-text-faint)', fontSize: 13, marginTop: 12 }}>
              Nenhum contrato. <Link to="/crm/contratos" style={{ color: 'var(--crm-accent)' }}>Adicionar →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {contratos.map(ct => (
                <div key={ct.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--crm-surface2)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--crm-text)' }}>
                      {SERVICO_LABEL[ct.servico] || ct.servico}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--crm-text-faint)' }}>
                      {fmtBRL(ct.valor_mensal)}/mês
                      {ct.data_inicio && ` · desde ${new Date(ct.data_inicio).toLocaleDateString('pt-BR')}`}
                    </div>
                  </div>
                  <span className={`crm-badge ${STATUS_CONTRATO_BADGE[ct.status] || 'crm-badge-muted'}`}>
                    {ct.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Entregas */}
      {entregas.length > 0 && (
        <div className="crm-card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="crm-section-title" style={{ marginBottom: 0 }}>Entregas</div>
            <Link to="/crm/entregas" style={{ fontSize: 12, color: 'var(--crm-accent)', textDecoration: 'none' }}>Ver no kanban →</Link>
          </div>
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Prazo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {entregas.slice(0, 8).map(e => (
                  <tr key={e.id}>
                    <td className="crm-td-main">{e.titulo}</td>
                    <td>{e.tipo || '—'}</td>
                    <td>{e.prazo ? new Date(e.prazo).toLocaleDateString('pt-BR') : '—'}</td>
                    <td>
                      <span className={`crm-badge ${STATUS_ENTREGA_BADGE[e.status] || 'crm-badge-muted'}`}>
                        {e.status?.replace('_', ' ')}
                      </span>
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
