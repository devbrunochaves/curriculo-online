import { useState, useEffect, useCallback } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  AlertTriangle, Building2, Check, ChevronDown, ChevronLeft, ChevronRight,
  Download, ExternalLink, FileText, Info, Pencil, Plus, Receipt, Trash2,
  Upload, X, Zap,
} from 'lucide-react'
import {
  Button, ConfirmDialog, FormField, IconButton, MetricCard, ModalShell,
  PageHeader, SectionCard, StatusBadge,
} from '../components/ui'
import {
  getMyWorkspaceId, createWorkspace, getMeiProfile, createMeiProfile,
  updateMeiProfile, getMeiLimite, getMeiNotas, createMeiNota, updateMeiNota,
  deleteMeiNota, getMeiDas, createMeiDas, updateMeiDas, deleteMeiDas,
  getMeiDeclaracaoByAno, upsertMeiDeclaracao, getMeiDocumentos,
  createMeiDocumento, updateMeiDocumento, deleteMeiDocumento,
} from '../lib/meiQueries'
import {
  uploadMeiFile, getMeiSignedUrl, getMeiSignedDownload, deleteMeiFile,
} from '../lib/meiStorage'
import '../styles/mei-v2.css'

// ── Helpers ───────────────────────────────────────────────────────────────
const fmt         = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'
const parseBRL    = str => { if (!str) return 0; return parseFloat(String(str).replace(/\./g, '').replace(',', '.')) || 0 }
const formatBRLInput = str => {
  const digits = String(str || '').replace(/\D/g, '')
  if (!digits) return ''
  return (Number(digits) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
const fmtDate  = d => d ? format(typeof d === 'string' ? parseISO(d) : d, 'dd/MM/yyyy') : '—'
const fmtMonth = m => m ? format(parseISO(m + '-01'), "MMMM 'de' yyyy", { locale: ptBR }) : '—'
const isoDate  = d => d ? format(typeof d === 'string' ? parseISO(d) : d, 'yyyy-MM-dd') : ''

const TIPO_ATIVIDADE_LABELS = {
  servicos: 'Prestação de Serviços', comercio: 'Comércio',
  industria: 'Indústria', misto: 'Misto (Serviços + Comércio)',
}
const TIPO_RECEITA_LABELS   = { servicos: 'Prestação de Serviços', comercio: 'Comércio / Indústria' }
const STATUS_NOTA_LABELS    = { emitida: 'Emitida', cancelada: 'Cancelada' }
const STATUS_DAS_LABELS     = { pendente: 'Pendente', pago: 'Pago', atrasado: 'Atrasado' }
const STATUS_DECL_LABELS    = { nao_enviada: 'Não enviada', enviada: 'Enviada' }
const CAT_DOC_LABELS        = { empresa: 'Empresa', impostos: 'Impostos', declaracoes: 'Declarações', outros: 'Outros' }

const TABS = [
  { id: 'overview',    label: 'Visão Geral' },
  { id: 'notas',       label: 'Notas Fiscais' },
  { id: 'das',         label: 'DAS' },
  { id: 'declaracao',  label: 'Declaração Anual' },
  { id: 'relatorios',  label: 'Relatórios' },
  { id: 'documentos',  label: 'Documentos' },
]

const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const LINKS_UTEIS = [
  { label: 'Portal do Empreendedor', url: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor' },
  { label: 'Emissão de DAS', url: 'https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao' },
  { label: 'DASN-SIMEI', url: 'https://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/dasnsimei.app/Identificacao' },
  { label: 'Consulta CNPJ', url: 'https://www.receita.fazenda.gov.br/pessoajuridica/cnpj/cnpjreva/cnpjrevacaptcha.asp' },
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i)

const EMPTY_PROFILE = { cnpj: '', razao_social: '', nome_fantasia: '', data_abertura: '', tipo_atividade: 'servicos', inscricao_municipal: '', observacoes: '' }
const EMPTY_NOTA    = { numero: '', data_emissao: isoDate(new Date()), competencia: format(new Date(), 'yyyy-MM'), cliente_nome: '', cliente_documento: '', descricao: '', valor: '', tipo_receita: 'servicos', status: 'emitida', recebida: false, data_recebimento: '', observacoes: '' }
const EMPTY_DAS     = { competencia: format(new Date(), 'yyyy-MM'), valor: '', vencimento: '', status: 'pendente', data_pagamento: '', observacoes: '' }
const EMPTY_DOC     = { nome: '', categoria: 'empresa', descricao: '', data_documento: '', arquivo_path: '' }

// ── Limite alert tone ─────────────────────────────────────────────────────
function limiteTone(pct) {
  if (pct >= 100) return 'danger'
  if (pct >= 90)  return 'danger'
  if (pct >= 80)  return 'warning'
  if (pct >= 70)  return 'warning'
  return 'success'
}

// ── Custom Tooltip for chart ──────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="c-mei-chart-tooltip">
      <div className="c-mei-chart-tooltip-label">{label}</div>
      <div className="c-mei-chart-tooltip-value">{fmt(payload[0].value)}</div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
export default function Mei() {
  const [workspaceId, setWorkspaceId] = useState(null)
  const [profile,     setProfile]     = useState(null)  // null = loading | false = not configured | object = configured
  const [loading,     setLoading]     = useState(true)
  const [activeTab,   setActiveTab]   = useState('overview')
  const [year,        setYear]        = useState(CURRENT_YEAR)

  // Tab data
  const [limite,      setLimite]      = useState(81000)
  const [notas,       setNotas]       = useState([])
  const [das,         setDas]         = useState([])
  const [declaracao,  setDeclaracao]  = useState(null)
  const [documentos,  setDocumentos]  = useState([])
  const [tabLoading,  setTabLoading]  = useState(false)

  // Modals
  const [modal,       setModal]       = useState(null)
  // modal values: null | 'config' | 'nota' | {nota} | 'das' | {das} | 'decl' | 'doc' | {doc}
  const [form,        setForm]        = useState({})
  const [saving,      setSaving]      = useState(false)
  const [delConfirm,  setDelConfirm]  = useState(null)  // { type, id, path? }
  const [fileInput,   setFileInput]   = useState(null)
  const [filterMes,   setFilterMes]   = useState(format(new Date(), 'yyyy-MM'))

  // ── Bootstrap: load workspace + MEI profile ──────────────────────────────
  useEffect(() => {
    async function boot() {
      setLoading(true)
      try {
        const wsId = await getMyWorkspaceId()
        setWorkspaceId(wsId)
        if (!wsId) { setProfile(false); return }
        const p = await getMeiProfile()
        setProfile(p ?? false)
      } catch (e) {
        console.error(e)
        setProfile(false)
      } finally {
        setLoading(false)
      }
    }
    boot()
  }, [])

  // ── Load tab data when tab or year changes ────────────────────────────────
  const loadTabData = useCallback(async (tab, yr, prof) => {
    if (!prof) return
    setTabLoading(true)
    try {
      if (tab === 'overview' || tab === 'notas' || tab === 'relatorios') {
        const [n, l] = await Promise.all([getMeiNotas(prof.id, yr), getMeiLimite(yr)])
        setNotas(n)
        setLimite(l)
        if (tab === 'overview') {
          const d = await getMeiDas(prof.id, yr)
          setDas(d)
        }
      } else if (tab === 'das') {
        const [d, l] = await Promise.all([getMeiDas(prof.id, yr), getMeiLimite(yr)])
        setDas(d)
        setLimite(l)
      } else if (tab === 'declaracao') {
        const [dec, n, l] = await Promise.all([
          getMeiDeclaracaoByAno(prof.id, yr),
          getMeiNotas(prof.id, yr),
          getMeiLimite(yr),
        ])
        setDeclaracao(dec)
        setNotas(n)
        setLimite(l)
      } else if (tab === 'documentos') {
        const docs = await getMeiDocumentos(prof.id)
        setDocumentos(docs)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setTabLoading(false)
    }
  }, [])

  useEffect(() => {
    if (profile) loadTabData(activeTab, year, profile)
  }, [activeTab, year, profile, loadTabData])

  // ── Computed values ───────────────────────────────────────────────────────
  const notasAtivas   = notas.filter(n => n.status !== 'cancelada')
  const faturamento   = notasAtivas.reduce((s, n) => s + Number(n.valor), 0)
  const recebido      = notasAtivas.filter(n => n.recebida).reduce((s, n) => s + Number(n.valor), 0)
  const aReceber      = notasAtivas.filter(n => !n.recebida).reduce((s, n) => s + Number(n.valor), 0)
  const pctLimite     = limite > 0 ? Math.min((faturamento / limite) * 100, 100) : 0
  const restante      = Math.max(limite - faturamento, 0)

  const mesAtual      = format(new Date(), 'yyyy-MM')
  const notasMes      = notasAtivas.filter(n => n.competencia === mesAtual)
  const faturamentoMes= notasMes.reduce((s, n) => s + Number(n.valor), 0)

  const mesesComNotas = [...new Set(notasAtivas.map(n => n.competencia.substring(0,7)))].sort()
  const mediaMensal   = mesesComNotas.length > 0 ? faturamento / mesesComNotas.length : 0

  // Monthly chart data
  const chartData = MONTHS_SHORT.map((mes, i) => {
    const comp  = `${year}-${String(i + 1).padStart(2, '0')}`
    const total = notasAtivas.filter(n => n.competencia === comp).reduce((s, n) => s + Number(n.valor), 0)
    return { mes, valor: total }
  })

  // DAS alerts
  const today      = new Date()
  const dasPendentes = das.filter(d => d.status !== 'pago')
  const dasAtrasados = das.filter(d => d.status === 'atrasado' || (d.status === 'pendente' && d.vencimento && parseISO(d.vencimento) < today))
  const dasProximos  = das.filter(d => {
    if (d.status === 'pago') return false
    if (!d.vencimento) return false
    const diff = (parseISO(d.vencimento) - today) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  })

  // Alerts list
  const alertas = []
  if (faturamento / limite >= 1)   alertas.push({ tone: 'danger',  msg: `Limite do MEI atingido em ${year}! Faturamento: ${fmt(faturamento)}` })
  else if (faturamento / limite >= 0.9) alertas.push({ tone: 'danger',  msg: `Faturamento em ${Math.round(pctLimite)}% do limite — zona crítica.` })
  else if (faturamento / limite >= 0.8) alertas.push({ tone: 'warning', msg: `Faturamento em ${Math.round(pctLimite)}% do limite — atenção.` })
  else if (faturamento / limite >= 0.7) alertas.push({ tone: 'warning', msg: `Faturamento em ${Math.round(pctLimite)}% do limite.` })
  dasAtrasados.forEach(d => alertas.push({ tone: 'danger',  msg: `DAS ${fmtMonth(d.competencia)} está atrasado!` }))
  dasProximos.forEach(d  => alertas.push({ tone: 'warning', msg: `DAS ${fmtMonth(d.competencia)} vence em ${fmtDate(d.vencimento)}.` }))

  // ── Handlers ──────────────────────────────────────────────────────────────

  const closeModal = useCallback(() => { setModal(null); setForm({}); setFileInput(null) }, [])

  function openConfig(edit = false) {
    setForm(edit && profile ? {
      cnpj: profile.cnpj || '', razao_social: profile.razao_social || '',
      nome_fantasia: profile.nome_fantasia || '', data_abertura: profile.data_abertura || '',
      tipo_atividade: profile.tipo_atividade || 'servicos',
      inscricao_municipal: profile.inscricao_municipal || '',
      observacoes: profile.observacoes || '',
    } : { ...EMPTY_PROFILE })
    setModal(edit ? 'config-edit' : 'config')
  }

  async function handleSaveProfile() {
    if (!form.razao_social?.trim()) return alert('Razão Social é obrigatória.')
    setSaving(true)
    try {
      let wsId = workspaceId
      if (!wsId) {
        wsId = await createWorkspace(form.nome_fantasia || form.razao_social)
        setWorkspaceId(wsId)
      }
      const fields = {
        cnpj: form.cnpj?.trim() || null,
        razao_social: form.razao_social.trim(),
        nome_fantasia: form.nome_fantasia?.trim() || null,
        data_abertura: form.data_abertura || null,
        tipo_atividade: form.tipo_atividade,
        inscricao_municipal: form.inscricao_municipal?.trim() || null,
        observacoes: form.observacoes?.trim() || null,
      }
      let p
      if (modal === 'config-edit') {
        p = await updateMeiProfile(profile.id, fields)
      } else {
        p = await createMeiProfile(wsId, fields)
      }
      setProfile(p)
      closeModal()
      loadTabData('overview', year, p)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  function openNota(nota = null) {
    setForm(nota ? {
      numero: nota.numero || '', data_emissao: nota.data_emissao || '',
      competencia: nota.competencia || '', cliente_nome: nota.cliente_nome || '',
      cliente_documento: nota.cliente_documento || '', descricao: nota.descricao || '',
      valor: formatBRLInput(String(Math.round(Number(nota.valor) * 100))),
      tipo_receita: nota.tipo_receita || 'servicos', status: nota.status || 'emitida',
      recebida: nota.recebida || false, data_recebimento: nota.data_recebimento || '',
      observacoes: nota.observacoes || '',
    } : { ...EMPTY_NOTA, valor: '' })
    setModal(nota ? { nota } : 'nota')
    setFileInput(null)
  }

  async function handleSaveNota() {
    if (!form.data_emissao) return alert('Data de emissão é obrigatória.')
    if (parseBRL(form.valor) <= 0) return alert('Valor deve ser maior que zero.')
    setSaving(true)
    try {
      const fields = {
        numero: form.numero?.trim() || null,
        data_emissao: form.data_emissao,
        competencia: form.competencia,
        cliente_nome: form.cliente_nome?.trim() || null,
        cliente_documento: form.cliente_documento?.trim() || null,
        descricao: form.descricao?.trim() || null,
        valor: parseBRL(form.valor),
        tipo_receita: form.tipo_receita,
        status: form.status,
        recebida: form.recebida,
        data_recebimento: form.recebida ? form.data_recebimento || null : null,
        observacoes: form.observacoes?.trim() || null,
      }

      let saved
      if (modal?.nota) {
        saved = await updateMeiNota(modal.nota.id, fields)
        if (fileInput) {
          if (modal.nota.arquivo_path) await deleteMeiFile(modal.nota.arquivo_path)
          const path = await uploadMeiFile(workspaceId, 'notas', saved.id, fileInput)
          saved = await updateMeiNota(saved.id, { arquivo_path: path })
        }
      } else {
        saved = await createMeiNota(workspaceId, profile.id, fields)
        if (fileInput) {
          const path = await uploadMeiFile(workspaceId, 'notas', saved.id, fileInput)
          await updateMeiNota(saved.id, { arquivo_path: path })
        }
      }
      closeModal()
      loadTabData(activeTab, year, profile)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteNota(id, filePath) {
    try {
      if (filePath) await deleteMeiFile(filePath)
      await deleteMeiNota(id)
      setDelConfirm(null)
      loadTabData(activeTab, year, profile)
    } catch (e) { alert(e.message) }
  }

  function openDas(item = null) {
    setForm(item ? {
      competencia: item.competencia || '', valor: formatBRLInput(String(Math.round(Number(item.valor) * 100))),
      vencimento: item.vencimento || '', status: item.status || 'pendente',
      data_pagamento: item.data_pagamento || '', observacoes: item.observacoes || '',
    } : { ...EMPTY_DAS, valor: '' })
    setModal(item ? { das: item } : 'das')
    setFileInput(null)
  }

  async function handleSaveDas() {
    if (!form.competencia) return alert('Competência é obrigatória.')
    if (parseBRL(form.valor) <= 0) return alert('Valor deve ser maior que zero.')
    setSaving(true)
    try {
      const fields = {
        competencia: form.competencia,
        valor: parseBRL(form.valor),
        vencimento: form.vencimento || null,
        status: form.status,
        data_pagamento: form.status === 'pago' ? form.data_pagamento || null : null,
        observacoes: form.observacoes?.trim() || null,
      }
      let saved
      if (modal?.das) {
        saved = await updateMeiDas(modal.das.id, fields)
        if (fileInput) {
          if (modal.das.comprovante_path) await deleteMeiFile(modal.das.comprovante_path)
          const path = await uploadMeiFile(workspaceId, 'das', saved.id, fileInput)
          await updateMeiDas(saved.id, { comprovante_path: path })
        }
      } else {
        saved = await createMeiDas(workspaceId, profile.id, fields)
        if (fileInput) {
          const path = await uploadMeiFile(workspaceId, 'das', saved.id, fileInput)
          await updateMeiDas(saved.id, { comprovante_path: path })
        }
      }
      closeModal()
      loadTabData(activeTab, year, profile)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteDas(id, path) {
    try {
      if (path) await deleteMeiFile(path)
      await deleteMeiDas(id)
      setDelConfirm(null)
      loadTabData(activeTab, year, profile)
    } catch (e) { alert(e.message) }
  }

  async function handleSaveDeclaracao(fields) {
    setSaving(true)
    try {
      const dec = await upsertMeiDeclaracao(workspaceId, profile.id, year, fields)
      if (fileInput?.declaracao) {
        if (dec.declaracao_path) await deleteMeiFile(dec.declaracao_path)
        const path = await uploadMeiFile(workspaceId, 'declaracoes', dec.id, fileInput.declaracao)
        await upsertMeiDeclaracao(workspaceId, profile.id, year, { ...fields, declaracao_path: path })
      }
      if (fileInput?.recibo) {
        const current = declaracao || dec
        if (current?.recibo_path) await deleteMeiFile(current.recibo_path)
        const path = await uploadMeiFile(workspaceId, 'declaracoes', dec.id, fileInput.recibo)
        await upsertMeiDeclaracao(workspaceId, profile.id, year, { ...fields, recibo_path: path })
      }
      closeModal()
      loadTabData('declaracao', year, profile)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  function openDoc(doc = null) {
    setForm(doc ? {
      nome: doc.nome || '', categoria: doc.categoria || 'empresa',
      descricao: doc.descricao || '', data_documento: doc.data_documento || '',
    } : { ...EMPTY_DOC })
    setModal(doc ? { doc } : 'doc')
    setFileInput(null)
  }

  async function handleSaveDoc() {
    if (!form.nome?.trim()) return alert('Nome do documento é obrigatório.')
    setSaving(true)
    try {
      const fields = {
        nome: form.nome.trim(), categoria: form.categoria,
        descricao: form.descricao?.trim() || null,
        data_documento: form.data_documento || null,
      }
      let saved
      if (modal?.doc) {
        saved = await updateMeiDocumento(modal.doc.id, fields)
        if (fileInput) {
          if (modal.doc.arquivo_path) await deleteMeiFile(modal.doc.arquivo_path)
          const path = await uploadMeiFile(workspaceId, 'documentos', saved.id, fileInput)
          await updateMeiDocumento(saved.id, { arquivo_path: path })
        }
      } else {
        saved = await createMeiDocumento(workspaceId, profile.id, fields)
        if (fileInput) {
          const path = await uploadMeiFile(workspaceId, 'documentos', saved.id, fileInput)
          await (await import('../lib/meiQueries')).updateMeiDocumento(saved.id, { arquivo_path: path })
        }
      }
      closeModal()
      loadTabData('documentos', year, profile)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteDoc(id, path) {
    try {
      if (path) await deleteMeiFile(path)
      await deleteMeiDocumento(id)
      setDelConfirm(null)
      loadTabData('documentos', year, profile)
    } catch (e) { alert(e.message) }
  }

  async function viewFile(path) {
    const url = await getMeiSignedUrl(path)
    if (url) window.open(url, '_blank')
    else alert('Não foi possível abrir o arquivo.')
  }

  async function downloadFile(path) {
    const url = await getMeiSignedDownload(path)
    if (url) { const a = document.createElement('a'); a.href = url; a.click() }
  }

  // ── Render guards ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="c-mei-page">
        <div className="c-loading-screen" style={{ height: 300 }}><div className="c-loading-spinner" /></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="c-mei-page">
        <PageHeader eyebrow="Financeiro" title="MEI" description="Acompanhe seu faturamento, notas fiscais e obrigações fiscais." />
        <div className="c-mei-empty">
          <div className="c-mei-empty-icon"><Building2 /></div>
          <h2 className="c-mei-empty-title">Organize seu MEI no Life OS</h2>
          <p className="c-mei-empty-sub">Acompanhe faturamento, notas fiscais, DAS e declaração anual em um só lugar.</p>
          <Button icon={<Plus />} onClick={() => openConfig(false)}>Configurar meu MEI</Button>
        </div>
        {renderConfigModal()}
        {renderConfirmDialog()}
      </div>
    )
  }

  // ── Section renders ───────────────────────────────────────────────────────

  function renderOverview() {
    const pctBar = Math.min(pctLimite, 100)
    return (
      <div className="c-mei-overview">
        {/* Metrics row */}
        <div className="c-mei-metrics-grid">
          <div className="c-mei-metric-card accent">
            <div className="c-mei-metric-label">Faturamento {year}</div>
            <div className="c-mei-metric-value">{fmt(faturamento)}</div>
            <div className="c-mei-progress-bar-wrap">
              <div className="c-mei-progress-bar" style={{ '--pct': `${pctBar}%`, '--tone': limiteTone(pctLimite) === 'success' ? 'var(--v2-color-success)' : limiteTone(pctLimite) === 'warning' ? 'var(--v2-color-warning)' : 'var(--v2-color-danger)' }} />
            </div>
            <div className="c-mei-metric-sub">{pctLimite.toFixed(1)}% do limite anual · Restam {fmt(restante)}</div>
          </div>
          <div className="c-mei-metric-card">
            <div className="c-mei-metric-label">Limite do MEI {year}</div>
            <div className="c-mei-metric-value">{fmt(limite)}</div>
            <StatusBadge tone={limiteTone(pctLimite)}>
              {pctLimite >= 100 ? 'Limite atingido' : pctLimite >= 80 ? 'Em alerta' : pctLimite >= 70 ? 'Atenção' : 'Normal'}
            </StatusBadge>
          </div>
          <div className="c-mei-metric-card">
            <div className="c-mei-metric-label">{format(new Date(), "MMMM/yyyy", { locale: ptBR })}</div>
            <div className="c-mei-metric-value">{fmt(faturamentoMes)}</div>
            <div className="c-mei-metric-sub">{notasMes.length} nota{notasMes.length !== 1 ? 's' : ''} emitida{notasMes.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="c-mei-metric-card">
            <div className="c-mei-metric-label">Média mensal</div>
            <div className="c-mei-metric-value">{fmt(mediaMensal)}</div>
            <div className="c-mei-metric-sub">Base: {mesesComNotas.length} mês{mesesComNotas.length !== 1 ? 'es' : ''} com receita</div>
          </div>
        </div>

        <div className="c-mei-overview-body">
          <div className="c-mei-overview-main">
            {/* Chart */}
            <SectionCard title="Faturamento mensal" description={`Receitas emitidas (notas ativas) em ${year}.`}>
              <div className="c-mei-chart-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--v2-color-border)" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--v2-color-text-muted)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--v2-color-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--v2-color-bg-subtle)' }} />
                    <Bar dataKey="valor" fill="var(--v2-color-accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            {/* Resumo financeiro */}
            <SectionCard title={`Resumo financeiro ${year}`} description="Notas emitidas vs. valor efetivamente recebido.">
              <div className="c-mei-resumo-grid">
                <div className="c-mei-resumo-item">
                  <span>Notas emitidas</span>
                  <strong>{fmt(faturamento)}</strong>
                </div>
                <div className="c-mei-resumo-item">
                  <span>Recebido</span>
                  <strong className="success">{fmt(recebido)}</strong>
                </div>
                <div className="c-mei-resumo-item">
                  <span>A receber</span>
                  <strong className={aReceber > 0 ? 'warning' : ''}>{fmt(aReceber)}</strong>
                </div>
                <div className="c-mei-resumo-item">
                  <span>Total de notas</span>
                  <strong>{notasAtivas.length}</strong>
                </div>
              </div>
            </SectionCard>

            {/* Últimas notas */}
            <SectionCard title="Últimas notas" actions={<Button size="sm" icon={<Plus />} onClick={() => { setActiveTab('notas'); openNota() }}>Nova nota</Button>}>
              {notasAtivas.slice(0, 5).length === 0
                ? <p className="c-mei-table-empty">Nenhuma nota emitida em {year}.</p>
                : (
                <div className="c-mei-table-wrap">
                  <table className="c-mei-table">
                    <thead><tr><th>Data</th><th>Cliente</th><th>Nº</th><th>Valor</th><th>Situação</th></tr></thead>
                    <tbody>
                      {notasAtivas.slice(0, 5).map(n => (
                        <tr key={n.id}>
                          <td>{fmtDate(n.data_emissao)}</td>
                          <td>{n.cliente_nome || <span className="c-mei-muted">—</span>}</td>
                          <td>{n.numero || <span className="c-mei-muted">—</span>}</td>
                          <td className="c-mei-num">{fmt(n.valor)}</td>
                          <td><StatusBadge tone={n.recebida ? 'success' : 'warning'}>{n.recebida ? 'Recebida' : 'A receber'}</StatusBadge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>

          <aside className="c-mei-overview-aside">
            {/* Alertas */}
            {alertas.length > 0 && (
              <SectionCard title="Atenções">
                <div className="c-mei-alerts">
                  {alertas.map((a, i) => (
                    <div key={i} className={`c-mei-alert ${a.tone}`}>
                      <AlertTriangle size={14} />
                      <span>{a.msg}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Próximos vencimentos DAS */}
            <SectionCard title="DAS — vencimentos">
              {dasPendentes.length === 0
                ? <p className="c-mei-muted" style={{ fontSize: 13 }}>Nenhum DAS pendente em {year}.</p>
                : (
                <div className="c-mei-das-list">
                  {dasPendentes.slice(0, 4).map(d => (
                    <div key={d.id} className={`c-mei-das-item ${d.status}`}>
                      <div className="c-mei-das-comp">{fmtMonth(d.competencia)}</div>
                      <div className="c-mei-das-right">
                        <span className="c-mei-das-valor">{fmt(d.valor)}</span>
                        {d.vencimento && <span className="c-mei-das-venc">Vence {fmtDate(d.vencimento)}</span>}
                        <StatusBadge tone={d.status === 'pago' ? 'success' : d.status === 'atrasado' ? 'danger' : 'warning'}>
                          {STATUS_DAS_LABELS[d.status]}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Links úteis */}
            <SectionCard title="Links úteis">
              <div className="c-mei-links">
                {LINKS_UTEIS.map(l => (
                  <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="c-mei-link">
                    <ExternalLink size={13} />
                    <span>{l.label}</span>
                  </a>
                ))}
              </div>
            </SectionCard>

            {/* Dados do MEI */}
            <SectionCard title="Dados do MEI" actions={<IconButton icon={<Pencil />} label="Editar" size="sm" variant="ghost" onClick={() => openConfig(true)} />}>
              <div className="c-mei-profile-info">
                {profile.cnpj && <div><span>CNPJ</span><strong>{profile.cnpj}</strong></div>}
                <div><span>Razão Social</span><strong>{profile.razao_social}</strong></div>
                {profile.nome_fantasia && <div><span>Nome Fantasia</span><strong>{profile.nome_fantasia}</strong></div>}
                <div><span>Atividade</span><strong>{TIPO_ATIVIDADE_LABELS[profile.tipo_atividade]}</strong></div>
                {profile.data_abertura && <div><span>Abertura</span><strong>{fmtDate(profile.data_abertura)}</strong></div>}
              </div>
            </SectionCard>
          </aside>
        </div>
      </div>
    )
  }

  function renderNotas() {
    return (
      <SectionCard
        title={`Notas Fiscais — ${year}`}
        description="Notas canceladas ficam no histórico mas não entram no faturamento."
        actions={<Button icon={<Plus />} onClick={() => openNota()}>Nova nota</Button>}
      >
        {tabLoading
          ? <div className="c-loading-screen" style={{ height: 120 }}><div className="c-loading-spinner" /></div>
          : notas.length === 0
          ? <div className="c-mei-table-empty">Nenhuma nota fiscal em {year}.</div>
          : (
          <div className="c-mei-table-wrap">
            <table className="c-mei-table">
              <thead>
                <tr>
                  <th>Data</th><th>Cliente</th><th>Nº</th><th>Valor</th>
                  <th>Tipo</th><th>Situação</th><th>Recebimento</th><th></th>
                </tr>
              </thead>
              <tbody>
                {notas.map(n => (
                  <tr key={n.id} className={n.status === 'cancelada' ? 'c-mei-row-cancelled' : ''}>
                    <td>{fmtDate(n.data_emissao)}</td>
                    <td>{n.cliente_nome || <span className="c-mei-muted">—</span>}</td>
                    <td>{n.numero || <span className="c-mei-muted">—</span>}</td>
                    <td className="c-mei-num">{fmt(n.valor)}</td>
                    <td><StatusBadge tone="neutral">{TIPO_RECEITA_LABELS[n.tipo_receita]}</StatusBadge></td>
                    <td><StatusBadge tone={n.status === 'cancelada' ? 'danger' : 'success'}>{STATUS_NOTA_LABELS[n.status]}</StatusBadge></td>
                    <td>
                      {n.status !== 'cancelada' && (
                        <StatusBadge tone={n.recebida ? 'success' : 'warning'}>{n.recebida ? 'Recebida' : 'A receber'}</StatusBadge>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {n.arquivo_path && <IconButton icon={<FileText />} label="Ver NF" size="sm" variant="ghost" onClick={() => viewFile(n.arquivo_path)} />}
                        <IconButton icon={<Pencil />} label="Editar" size="sm" variant="ghost" onClick={() => openNota(n)} />
                        <IconButton icon={<Trash2 />} label="Excluir" size="sm" variant="ghost"
                          style={{ color: 'var(--v2-color-danger)' }}
                          onClick={() => setDelConfirm({ type: 'nota', id: n.id, path: n.arquivo_path })} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    )
  }

  function renderDas() {
    return (
      <SectionCard
        title={`DAS — ${year}`}
        description="Guias de pagamento mensais do MEI."
        actions={<Button icon={<Plus />} onClick={() => openDas()}>Novo DAS</Button>}
      >
        {tabLoading
          ? <div className="c-loading-screen" style={{ height: 120 }}><div className="c-loading-spinner" /></div>
          : das.length === 0
          ? <div className="c-mei-table-empty">Nenhum DAS cadastrado em {year}.</div>
          : (
          <div className="c-mei-table-wrap">
            <table className="c-mei-table">
              <thead>
                <tr><th>Competência</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Pago em</th><th></th></tr>
              </thead>
              <tbody>
                {das.map(d => (
                  <tr key={d.id}>
                    <td style={{ textTransform: 'capitalize' }}>{fmtMonth(d.competencia)}</td>
                    <td className="c-mei-num">{fmt(d.valor)}</td>
                    <td>{fmtDate(d.vencimento)}</td>
                    <td>
                      <StatusBadge tone={d.status === 'pago' ? 'success' : d.status === 'atrasado' ? 'danger' : 'warning'}>
                        {STATUS_DAS_LABELS[d.status]}
                      </StatusBadge>
                    </td>
                    <td>{d.data_pagamento ? fmtDate(d.data_pagamento) : <span className="c-mei-muted">—</span>}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {d.comprovante_path && <IconButton icon={<FileText />} label="Comprovante" size="sm" variant="ghost" onClick={() => viewFile(d.comprovante_path)} />}
                        <IconButton icon={<Pencil />} label="Editar" size="sm" variant="ghost" onClick={() => openDas(d)} />
                        <IconButton icon={<Trash2 />} label="Excluir" size="sm" variant="ghost"
                          style={{ color: 'var(--v2-color-danger)' }}
                          onClick={() => setDelConfirm({ type: 'das', id: d.id, path: d.comprovante_path })} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    )
  }

  function renderDeclaracao() {
    const servCalc = notasAtivas.filter(n => n.tipo_receita === 'servicos').reduce((s, n) => s + Number(n.valor), 0)
    const comCalc  = notasAtivas.filter(n => n.tipo_receita === 'comercio').reduce((s, n) => s + Number(n.valor), 0)

    return (
      <div className="c-mei-decl-wrap">
        <SectionCard
          title={`Declaração Anual — ${year}`}
          description="DASN-SIMEI. Valores calculados automaticamente com base nas notas emitidas (exceto canceladas)."
          actions={
            <StatusBadge tone={declaracao?.status === 'enviada' ? 'success' : 'warning'}>
              {declaracao ? STATUS_DECL_LABELS[declaracao.status] : 'Não enviada'}
            </StatusBadge>
          }
        >
          {tabLoading
            ? <div className="c-loading-screen" style={{ height: 120 }}><div className="c-loading-spinner" /></div>
            : (
            <>
              <div className="c-mei-decl-calc">
                <div className="c-mei-decl-row">
                  <span>Receita prestação de serviços <span className="c-mei-muted">(calculado)</span></span>
                  <strong>{fmt(servCalc)}</strong>
                </div>
                <div className="c-mei-decl-row">
                  <span>Receita comércio/indústria <span className="c-mei-muted">(calculado)</span></span>
                  <strong>{fmt(comCalc)}</strong>
                </div>
                <div className="c-mei-decl-row total">
                  <span>Receita bruta total</span>
                  <strong>{fmt(servCalc + comCalc)}</strong>
                </div>
              </div>

              {declaracao && (
                <div className="c-mei-decl-submitted">
                  <div className="c-mei-decl-row"><span>Enviado em</span><strong>{fmtDate(declaracao.data_entrega)}</strong></div>
                  {declaracao.declaracao_path && (
                    <Button variant="secondary" size="sm" icon={<Download />} onClick={() => downloadFile(declaracao.declaracao_path)}>Baixar declaração</Button>
                  )}
                  {declaracao.recibo_path && (
                    <Button variant="secondary" size="sm" icon={<Download />} onClick={() => downloadFile(declaracao.recibo_path)}>Baixar recibo</Button>
                  )}
                </div>
              )}

              <div className="c-mei-decl-actions">
                <Button
                  icon={declaracao?.status === 'enviada' ? <Pencil /> : <Check />}
                  onClick={() => {
                    setForm({
                      receita_servicos: String(declaracao?.receita_servicos ?? servCalc),
                      receita_comercio: String(declaracao?.receita_comercio ?? comCalc),
                      teve_funcionario: declaracao?.teve_funcionario ?? false,
                      status: declaracao?.status ?? 'nao_enviada',
                      data_entrega: declaracao?.data_entrega ?? '',
                    })
                    setModal('decl')
                  }}
                >
                  {declaracao?.status === 'enviada' ? 'Editar declaração' : 'Registrar envio'}
                </Button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--v2-color-text-subtle)', marginTop: 8 }}>
                Este registro é apenas para controle pessoal. A declaração oficial deve ser enviada pelo Portal do Empreendedor ou DASN-SIMEI.
              </p>
            </>
          )}
        </SectionCard>
      </div>
    )
  }

  function renderRelatorios() {
    const notasFiltradas = notasAtivas.filter(n => n.competencia === filterMes)
    const totFilt  = notasFiltradas.reduce((s, n) => s + Number(n.valor), 0)
    const recFilt  = notasFiltradas.filter(n => n.recebida).reduce((s, n) => s + Number(n.valor), 0)
    const arecFilt = notasFiltradas.filter(n => !n.recebida).reduce((s, n) => s + Number(n.valor), 0)
    const servFilt = notasFiltradas.filter(n => n.tipo_receita === 'servicos').reduce((s, n) => s + Number(n.valor), 0)
    const comFilt  = notasFiltradas.filter(n => n.tipo_receita === 'comercio').reduce((s, n) => s + Number(n.valor), 0)

    return (
      <div>
        <div className="c-mei-relatorio-filter">
          <FormField label="Mês de referência">
            <input className="c-fixas-v2-input" type="month" value={filterMes} onChange={e => setFilterMes(e.target.value)} />
          </FormField>
        </div>
        <div className="c-mei-metrics-grid">
          <MetricCard label="Receita serviços"  value={fmt(servFilt)}  tone="accent"  />
          <MetricCard label="Receita comércio"  value={fmt(comFilt)}   tone="neutral" />
          <MetricCard label="Receita total"     value={fmt(totFilt)}   tone="accent"  />
          <MetricCard label="Qtd. notas"        value={String(notasFiltradas.length)} tone="neutral" />
          <MetricCard label="Recebido"          value={fmt(recFilt)}   tone="success" />
          <MetricCard label="A receber"         value={fmt(arecFilt)}  tone={arecFilt > 0 ? 'warning' : 'success'} />
        </div>
      </div>
    )
  }

  function renderDocumentos() {
    const cats = ['empresa', 'impostos', 'declaracoes', 'outros']
    return (
      <div className="c-mei-docs-wrap">
        <div className="c-mei-docs-header">
          <Button icon={<Plus />} onClick={() => openDoc()}>Adicionar documento</Button>
        </div>
        {tabLoading
          ? <div className="c-loading-screen" style={{ height: 120 }}><div className="c-loading-spinner" /></div>
          : documentos.length === 0
          ? <div className="c-mei-table-empty">Nenhum documento cadastrado.</div>
          : cats.map(cat => {
              const docs = documentos.filter(d => d.categoria === cat)
              if (!docs.length) return null
              return (
                <SectionCard key={cat} title={CAT_DOC_LABELS[cat]}>
                  <div className="c-mei-doc-grid">
                    {docs.map(d => (
                      <div key={d.id} className="c-mei-doc-card">
                        <div className="c-mei-doc-icon"><FileText size={20} /></div>
                        <div className="c-mei-doc-body">
                          <div className="c-mei-doc-nome">{d.nome}</div>
                          {d.descricao && <div className="c-mei-doc-desc">{d.descricao}</div>}
                          {d.data_documento && <div className="c-mei-doc-date">{fmtDate(d.data_documento)}</div>}
                        </div>
                        <div className="c-mei-doc-actions">
                          {d.arquivo_path && (
                            <>
                              <IconButton icon={<FileText />} label="Ver" size="sm" variant="ghost" onClick={() => viewFile(d.arquivo_path)} />
                              <IconButton icon={<Download />} label="Baixar" size="sm" variant="ghost" onClick={() => downloadFile(d.arquivo_path)} />
                            </>
                          )}
                          <IconButton icon={<Pencil />} label="Editar" size="sm" variant="ghost" onClick={() => openDoc(d)} />
                          <IconButton icon={<Trash2 />} label="Excluir" size="sm" variant="ghost"
                            style={{ color: 'var(--v2-color-danger)' }}
                            onClick={() => setDelConfirm({ type: 'doc', id: d.id, path: d.arquivo_path })} />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )
            })
        }
      </div>
    )
  }

  // ── Modal renders ─────────────────────────────────────────────────────────

  function renderConfigModal() {
    const isEdit = modal === 'config-edit'
    return (
      <ModalShell
        open={modal === 'config' || modal === 'config-edit'}
        title={isEdit ? 'Editar MEI' : 'Configurar meu MEI'}
        description={isEdit ? undefined : 'Dados básicos do seu negócio. Você poderá editar depois.'}
        onClose={closeModal}
        size="md"
        actions={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button onClick={handleSaveProfile} loading={saving} disabled={!form.razao_social?.trim()}>Salvar</Button>
          </>
        }
      >
        <FormField label="Razão Social" required>
          <input className="c-fixas-v2-input" type="text" placeholder="Nome registrado no CNPJ" value={form.razao_social || ''} onChange={e => setForm(f => ({ ...f, razao_social: e.target.value }))} autoFocus />
        </FormField>
        <FormField label="Nome Fantasia">
          <input className="c-fixas-v2-input" type="text" placeholder="Nome usado no dia a dia" value={form.nome_fantasia || ''} onChange={e => setForm(f => ({ ...f, nome_fantasia: e.target.value }))} />
        </FormField>
        <FormField label="CNPJ">
          <input className="c-fixas-v2-input" type="text" placeholder="XX.XXX.XXX/XXXX-XX" value={form.cnpj || ''} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} />
        </FormField>
        <FormField label="Data de abertura">
          <input className="c-fixas-v2-input" type="date" value={form.data_abertura || ''} onChange={e => setForm(f => ({ ...f, data_abertura: e.target.value }))} />
        </FormField>
        <FormField label="Tipo de atividade">
          <select className="c-v2-select-field" value={form.tipo_atividade || 'servicos'} onChange={e => setForm(f => ({ ...f, tipo_atividade: e.target.value }))}>
            <option value="servicos">Prestação de Serviços</option>
            <option value="comercio">Comércio</option>
            <option value="industria">Indústria</option>
            <option value="misto">Misto (Serviços + Comércio)</option>
          </select>
        </FormField>
        <FormField label="Inscrição Municipal">
          <input className="c-fixas-v2-input" type="text" placeholder="Opcional" value={form.inscricao_municipal || ''} onChange={e => setForm(f => ({ ...f, inscricao_municipal: e.target.value }))} />
        </FormField>
        <FormField label="Observações">
          <input className="c-fixas-v2-input" type="text" placeholder="Opcional" value={form.observacoes || ''} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
        </FormField>
      </ModalShell>
    )
  }

  function renderNotaModal() {
    const isEdit = !!modal?.nota
    return (
      <ModalShell
        open={modal === 'nota' || !!modal?.nota}
        title={isEdit ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal'}
        onClose={closeModal} size="md"
        actions={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button onClick={handleSaveNota} loading={saving} disabled={!form.data_emissao || parseBRL(form.valor) <= 0}>Salvar</Button>
          </>
        }
      >
        <FormField label="Número da nota">
          <input className="c-fixas-v2-input" type="text" placeholder="Ex: 000032" value={form.numero || ''} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--v2-space-3)' }}>
          <FormField label="Data de emissão" required>
            <input className="c-fixas-v2-input" type="date" value={form.data_emissao || ''} onChange={e => setForm(f => ({ ...f, data_emissao: e.target.value }))} />
          </FormField>
          <FormField label="Competência" required>
            <input className="c-fixas-v2-input" type="month" value={form.competencia || ''} onChange={e => setForm(f => ({ ...f, competencia: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Cliente">
          <input className="c-fixas-v2-input" type="text" placeholder="Nome do cliente" value={form.cliente_nome || ''} onChange={e => setForm(f => ({ ...f, cliente_nome: e.target.value }))} />
        </FormField>
        <FormField label="CPF/CNPJ do cliente">
          <input className="c-fixas-v2-input" type="text" placeholder="Opcional" value={form.cliente_documento || ''} onChange={e => setForm(f => ({ ...f, cliente_documento: e.target.value }))} />
        </FormField>
        <FormField label="Descrição">
          <input className="c-fixas-v2-input" type="text" placeholder="Serviço prestado" value={form.descricao || ''} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
        </FormField>
        <FormField label="Valor (R$)" required>
          <input className="c-fixas-v2-input" type="text" inputMode="numeric" placeholder="0,00" value={form.valor || ''} onChange={e => setForm(f => ({ ...f, valor: formatBRLInput(e.target.value) }))} />
        </FormField>
        <FormField label="Tipo de receita">
          <select className="c-v2-select-field" value={form.tipo_receita || 'servicos'} onChange={e => setForm(f => ({ ...f, tipo_receita: e.target.value }))}>
            <option value="servicos">Prestação de Serviços</option>
            <option value="comercio">Comércio / Indústria</option>
          </select>
        </FormField>
        <FormField label="Situação">
          <select className="c-v2-select-field" value={form.status || 'emitida'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="emitida">Emitida</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </FormField>
        <div className="c-mei-recebida-row">
          <label className="c-mei-check-label">
            <input type="checkbox" checked={form.recebida || false} onChange={e => setForm(f => ({ ...f, recebida: e.target.checked }))} />
            <span>Valor recebido</span>
          </label>
          {form.recebida && (
            <FormField label="Data de recebimento">
              <input className="c-fixas-v2-input" type="date" value={form.data_recebimento || ''} onChange={e => setForm(f => ({ ...f, data_recebimento: e.target.value }))} />
            </FormField>
          )}
        </div>
        <FormField label="Arquivo da NF" help="PDF ou XML — opcional">
          <input className="c-fixas-v2-input" type="file" accept=".pdf,.xml" onChange={e => setFileInput(e.target.files?.[0] ?? null)} />
        </FormField>
        <FormField label="Observações">
          <input className="c-fixas-v2-input" type="text" placeholder="Opcional" value={form.observacoes || ''} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
        </FormField>
      </ModalShell>
    )
  }

  function renderDasModal() {
    const isEdit = !!modal?.das
    return (
      <ModalShell
        open={modal === 'das' || !!modal?.das}
        title={isEdit ? 'Editar DAS' : 'Novo DAS'}
        onClose={closeModal} size="md"
        actions={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button onClick={handleSaveDas} loading={saving} disabled={!form.competencia || parseBRL(form.valor) <= 0}>Salvar</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--v2-space-3)' }}>
          <FormField label="Competência" required>
            <input className="c-fixas-v2-input" type="month" value={form.competencia || ''} onChange={e => setForm(f => ({ ...f, competencia: e.target.value }))} />
          </FormField>
          <FormField label="Valor (R$)" required>
            <input className="c-fixas-v2-input" type="text" inputMode="numeric" placeholder="0,00" value={form.valor || ''} onChange={e => setForm(f => ({ ...f, valor: formatBRLInput(e.target.value) }))} />
          </FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--v2-space-3)' }}>
          <FormField label="Vencimento">
            <input className="c-fixas-v2-input" type="date" value={form.vencimento || ''} onChange={e => setForm(f => ({ ...f, vencimento: e.target.value }))} />
          </FormField>
          <FormField label="Status">
            <select className="c-v2-select-field" value={form.status || 'pendente'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="atrasado">Atrasado</option>
            </select>
          </FormField>
        </div>
        {form.status === 'pago' && (
          <FormField label="Data de pagamento">
            <input className="c-fixas-v2-input" type="date" value={form.data_pagamento || ''} onChange={e => setForm(f => ({ ...f, data_pagamento: e.target.value }))} />
          </FormField>
        )}
        <FormField label="Comprovante de pagamento" help="PDF — opcional">
          <input className="c-fixas-v2-input" type="file" accept=".pdf,image/*" onChange={e => setFileInput(e.target.files?.[0] ?? null)} />
        </FormField>
        <FormField label="Observações">
          <input className="c-fixas-v2-input" type="text" placeholder="Opcional" value={form.observacoes || ''} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
        </FormField>
      </ModalShell>
    )
  }

  function renderDeclModal() {
    return (
      <ModalShell
        open={modal === 'decl'}
        title={`Declaração Anual ${year}`}
        description="Revise os valores antes de marcar como enviada."
        onClose={closeModal} size="md"
        actions={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button onClick={() => handleSaveDeclaracao({
              receita_servicos: parseBRL(String(form.receita_servicos)),
              receita_comercio: parseBRL(String(form.receita_comercio)),
              teve_funcionario: form.teve_funcionario || false,
              status: form.status,
              data_entrega: form.data_entrega || null,
            })} loading={saving}>Salvar</Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--v2-space-3)' }}>
          <FormField label="Receita serviços (R$)">
            <input className="c-fixas-v2-input" type="text" inputMode="numeric" placeholder="0,00"
              value={typeof form.receita_servicos === 'number' ? formatBRLInput(String(Math.round(form.receita_servicos * 100))) : form.receita_servicos || ''}
              onChange={e => setForm(f => ({ ...f, receita_servicos: e.target.value }))} />
          </FormField>
          <FormField label="Receita comércio (R$)">
            <input className="c-fixas-v2-input" type="text" inputMode="numeric" placeholder="0,00"
              value={typeof form.receita_comercio === 'number' ? formatBRLInput(String(Math.round(form.receita_comercio * 100))) : form.receita_comercio || ''}
              onChange={e => setForm(f => ({ ...f, receita_comercio: e.target.value }))} />
          </FormField>
        </div>
        <div className="c-mei-check-label" style={{ marginBottom: 'var(--v2-space-3)' }}>
          <label className="c-mei-check-label">
            <input type="checkbox" checked={form.teve_funcionario || false} onChange={e => setForm(f => ({ ...f, teve_funcionario: e.target.checked }))} />
            <span>Teve funcionário no período</span>
          </label>
        </div>
        <FormField label="Status">
          <select className="c-v2-select-field" value={form.status || 'nao_enviada'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="nao_enviada">Não enviada</option>
            <option value="enviada">Enviada</option>
          </select>
        </FormField>
        {form.status === 'enviada' && (
          <FormField label="Data de envio">
            <input className="c-fixas-v2-input" type="date" value={form.data_entrega || ''} onChange={e => setForm(f => ({ ...f, data_entrega: e.target.value }))} />
          </FormField>
        )}
        <FormField label="Arquivo da declaração" help="PDF — opcional">
          <input className="c-fixas-v2-input" type="file" accept=".pdf" onChange={e => setFileInput(prev => ({ ...prev, declaracao: e.target.files?.[0] ?? null }))} />
        </FormField>
        <FormField label="Recibo" help="PDF — opcional">
          <input className="c-fixas-v2-input" type="file" accept=".pdf" onChange={e => setFileInput(prev => ({ ...prev, recibo: e.target.files?.[0] ?? null }))} />
        </FormField>
      </ModalShell>
    )
  }

  function renderDocModal() {
    const isEdit = !!modal?.doc
    return (
      <ModalShell
        open={modal === 'doc' || !!modal?.doc}
        title={isEdit ? 'Editar Documento' : 'Adicionar Documento'}
        onClose={closeModal} size="md"
        actions={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button onClick={handleSaveDoc} loading={saving} disabled={!form.nome?.trim()}>Salvar</Button>
          </>
        }
      >
        <FormField label="Nome" required>
          <input className="c-fixas-v2-input" type="text" placeholder="Ex: CCMEI" value={form.nome || ''} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} autoFocus />
        </FormField>
        <FormField label="Categoria">
          <select className="c-v2-select-field" value={form.categoria || 'empresa'} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
            <option value="empresa">Empresa</option>
            <option value="impostos">Impostos</option>
            <option value="declaracoes">Declarações</option>
            <option value="outros">Outros</option>
          </select>
        </FormField>
        <FormField label="Descrição">
          <input className="c-fixas-v2-input" type="text" placeholder="Opcional" value={form.descricao || ''} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
        </FormField>
        <FormField label="Data do documento">
          <input className="c-fixas-v2-input" type="date" value={form.data_documento || ''} onChange={e => setForm(f => ({ ...f, data_documento: e.target.value }))} />
        </FormField>
        <FormField label="Arquivo" help="PDF ou imagem — opcional">
          <input className="c-fixas-v2-input" type="file" accept=".pdf,image/*" onChange={e => setFileInput(e.target.files?.[0] ?? null)} />
        </FormField>
      </ModalShell>
    )
  }

  function renderConfirmDialog() {
    if (!delConfirm) return null
    return (
      <ConfirmDialog
        open
        title="Confirmar exclusão"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        tone="danger"
        onCancel={() => setDelConfirm(null)}
        onConfirm={() => {
          if (delConfirm.type === 'nota') handleDeleteNota(delConfirm.id, delConfirm.path)
          if (delConfirm.type === 'das')  handleDeleteDas(delConfirm.id, delConfirm.path)
          if (delConfirm.type === 'doc')  handleDeleteDoc(delConfirm.id, delConfirm.path)
        }}
      />
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="c-mei-page">
      <PageHeader
        eyebrow="Financeiro"
        title={profile.nome_fantasia || profile.razao_social}
        description="Acompanhe seu faturamento, notas fiscais e obrigações fiscais."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--v2-space-2)' }}>
            <select
              className="c-mei-year-select"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        }
      />

      {/* Tab navigation */}
      <nav className="c-mei-tabs" aria-label="Seções do MEI">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`c-mei-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <div className="c-mei-content">
        {activeTab === 'overview'   && renderOverview()}
        {activeTab === 'notas'      && renderNotas()}
        {activeTab === 'das'        && renderDas()}
        {activeTab === 'declaracao' && renderDeclaracao()}
        {activeTab === 'relatorios' && renderRelatorios()}
        {activeTab === 'documentos' && renderDocumentos()}
      </div>

      {/* Modals */}
      {renderConfigModal()}
      {renderNotaModal()}
      {renderDasModal()}
      {renderDeclModal()}
      {renderDocModal()}
      {renderConfirmDialog()}
    </div>
  )
}
