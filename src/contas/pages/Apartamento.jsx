import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { format, parseISO, differenceInDays } from 'date-fns'

/* ── Constants ─────────────────────────────────────────────────────────── */
const ALBUNS = ['Compra do Imóvel','Reforma','Sala','Cozinha','Quartos','Banheiros','Decoração','Antes e Depois','Área Externa','Outros']
const CAT_GASTOS = ['Reforma','Móveis','Eletrodomésticos','Decoração','Condomínio','Pintura','Iluminação','Marcenaria','Construção','Manutenção','Outros']
const CAT_DOCS = ['Escritura','Matrícula','IPTU','Contrato','Habite-se','Planta Baixa','Manual da Construtora','Garantias','Seguros','Outros']
const TIPOS_MANUT = ['Elétrica','Hidráulica','Pintura','Ar Condicionado','Purificador','Internet','Limpeza','Outros']
const CAT_INV = ['Eletrodoméstico','Eletrônico','Móvel','Cama/Banho','Utensílio','Decoração','Outros']
const ESPECIALIDADES = ['Eletricista','Encanador','Marceneiro','Pintor','Pedreiro','Ar Condicionado','Internet','Outros']
const STATUS_PROJ = ['Planejado','Em Andamento','Concluído','Cancelado']
const FORMAS_PGTO = ['Dinheiro','Pix','Cartão Débito','Cartão Crédito','Boleto','Financiamento']

/* ── Helpers ───────────────────────────────────────────────────────────── */
const fmt = v => v != null ? Number(v).toLocaleString('pt-BR', {style:'currency', currency:'BRL'}) : '—'
const fmtDate = d => d ? format(parseISO(d), 'dd/MM/yyyy') : '—'
const BKT = 'apartamento'

async function getSignedUrl(path) {
  if (!path) return null
  const { data } = await supabase.storage.from(BKT).createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

async function uploadFile(file, folder) {
  const { data: { user } } = await supabase.auth.getUser()
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${user.id}/${folder}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(BKT).upload(path, file)
  if (error) throw error
  return path
}

async function deleteFile(path) {
  if (!path) return
  await supabase.storage.from(BKT).remove([path])
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

function ModalShell({ title, onClose, onSubmit, saving, saveLabel, children }) {
  return (
    <div className="c-modal-overlay" onClick={onClose}>
      <div className="c-modal-sheet" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px'}}>
          <div style={{width:40,height:4,borderRadius:99,background:'var(--c-border)'}}/>
        </div>
        <div style={{padding:'8px 20px 14px',borderBottom:'1px solid var(--c-border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontWeight:700,fontSize:17}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'var(--c-text-muted)',lineHeight:1}}>✕</button>
        </div>
        <form onSubmit={onSubmit}>
          <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:14,maxHeight:'65vh',overflowY:'auto',overflowX:'hidden'}}>
            {children}
          </div>
          <div style={{padding:'12px 20px 24px',borderTop:'1px solid var(--c-border)',display:'flex',gap:10}}>
            <button type="button" className="c-btn c-btn-secondary" style={{flex:1}} onClick={onClose}>Cancelar</button>
            <button type="submit" className="c-btn c-btn-primary" style={{flex:2}} disabled={saving}>{saveLabel ?? (saving?'Salvando...':'Salvar')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="c-form-label">{label}</label>
      {children}
    </div>
  )
}

function DateField({ label, value, onChange, required }) {
  return (
    <Field label={label}>
      <div style={{overflow:'hidden'}}>
        <input
          type="date"
          className="c-form-input c-date-input"
          style={{display:'block',width:'100%',boxSizing:'border-box',minWidth:0}}
          value={value}
          onChange={onChange}
          required={required}
        />
      </div>
    </Field>
  )
}

function StatusBadge({ status }) {
  const styles = {
    pago:        {background:'#dcfce7',color:'#15803d'},
    pendente:    {background:'#fef9c3',color:'#854d0e'},
    atrasado:    {background:'#fee2e2',color:'#dc2626'},
    agendado:    {background:'#fef9c3',color:'#854d0e'},
    em_andamento:{background:'#dbeafe',color:'#1d4ed8'},
    concluido:   {background:'#dcfce7',color:'#15803d'},
    Planejado:   {background:'#f1f5f9',color:'#475569'},
    'Em Andamento':{background:'#dbeafe',color:'#1d4ed8'},
    'Concluído': {background:'#dcfce7',color:'#15803d'},
    Cancelado:   {background:'#fee2e2',color:'#dc2626'},
  }
  const s = styles[status] || {background:'#f1f5f9',color:'#475569'}
  return (
    <span style={{...s,padding:'2px 10px',borderRadius:99,fontSize:12,fontWeight:600,whiteSpace:'nowrap'}}>
      {status}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   DASHBOARD TAB
══════════════════════════════════════════════════════════════════════════ */
function DashboardTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [gastos, boletos, docs, manut, garantias, fotos] = await Promise.all([
        supabase.from('apartamento_gastos').select('valor'),
        supabase.from('apartamento_boletos').select('status'),
        supabase.from('apartamento_documentos').select('id'),
        supabase.from('apartamento_manutencoes').select('id,titulo,tipo,data_proxima,status').order('data_proxima',{ascending:true}),
        supabase.from('apartamento_garantias').select('fim_garantia'),
        supabase.from('apartamento_fotos').select('id'),
      ])
      const totalInvestido = (gastos.data||[]).reduce((s,r)=>s+Number(r.valor||0),0)
      const boletosPendentes = (boletos.data||[]).filter(b=>b.status!=='pago').length
      const docCount = (docs.data||[]).length
      const manutData = manut.data || []
      const manutAgendadas = manutData.filter(m=>m.status==='agendado').length
      const garantiasAtivas = (garantias.data||[]).filter(g=>g.fim_garantia && g.fim_garantia > today).length
      const fotoCount = (fotos.data||[]).length
      const proxManut = manutData.find(m=>m.status==='agendado' && m.data_proxima)
      setData({totalInvestido,boletosPendentes,docCount,manutAgendadas,garantiasAtivas,fotoCount,proxManut})
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(()=>{ load() },[load])

  if (loading) return <Loading />
  if (!data) return null

  const cards = [
    { icon:'💰', label:'Total Investido', value:fmt(data.totalInvestido), color:'#6366f1' },
    { icon:'💸', label:'Boletos Pendentes', value:data.boletosPendentes, color: data.boletosPendentes>0?'#dc2626':'#15803d' },
    { icon:'📁', label:'Documentos', value:data.docCount, color:'#3b82f6' },
    { icon:'🔧', label:'Manutenções Agendadas', value:data.manutAgendadas, color: data.manutAgendadas>0?'#d97706':'#15803d' },
    { icon:'📑', label:'Garantias Ativas', value:data.garantiasAtivas, color:'#10b981' },
    { icon:'📸', label:'Fotos', value:data.fotoCount, color:'#8b5cf6' },
  ]

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12,marginBottom:24}}>
        {cards.map(c=>(
          <div key={c.label} style={{background:'var(--c-surface)',border:'1px solid var(--c-border)',borderRadius:12,padding:'16px 20px'}}>
            <div style={{fontSize:28,marginBottom:6}}>{c.icon}</div>
            <div style={{fontSize:22,fontWeight:700,color:c.color}}>{c.value}</div>
            <div style={{fontSize:13,color:'var(--c-text-muted)',marginTop:2}}>{c.label}</div>
          </div>
        ))}
      </div>
      {data.proxManut && (
        <div style={{background:'#fef9c3',border:'1px solid #fde68a',borderRadius:12,padding:'14px 18px'}}>
          <div style={{fontWeight:700,color:'#854d0e',marginBottom:4}}>🔔 Próxima Manutenção</div>
          <div style={{fontWeight:600}}>{data.proxManut.titulo}</div>
          <div style={{fontSize:13,color:'#92400e'}}>{data.proxManut.tipo} · {fmtDate(data.proxManut.data_proxima)}</div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   GALERIA TAB
══════════════════════════════════════════════════════════════════════════ */
function GaleriaTab() {
  const [fotos, setFotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [signedUrls, setSignedUrls] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ descricao:'', album: ALBUNS[0] })
  const [files, setFiles] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('apartamento_fotos').select('*').order('created_at',{ascending:false})
    const rows = data || []
    setFotos(rows)
    const urls = {}
    await Promise.all(rows.map(async f => {
      if (f.storage_path) urls[f.id] = await getSignedUrl(f.storage_path)
    }))
    setSignedUrls(urls)
    setLoading(false)
  }, [])

  useEffect(()=>{ load() },[load])

  async function handleSave(e) {
    e.preventDefault()
    if (!files.length) return alert('Selecione ao menos uma foto.')
    setSaving(true)
    try {
      await Promise.all(Array.from(files).map(async file => {
        const path = await uploadFile(file, 'fotos')
        const { error } = await supabase.from('apartamento_fotos').insert({
          titulo: '',
          descricao: form.descricao || null,
          album: form.album,
          storage_path: path,
        })
        if (error) throw error
      }))
      setShowModal(false)
      setForm({ descricao:'', album: ALBUNS[0] })
      setFiles([])
      await load()
    } catch(err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(foto) {
    if (!confirm('Excluir esta foto?')) return
    await deleteFile(foto.storage_path)
    await supabase.from('apartamento_fotos').delete().eq('id', foto.id)
    await load()
  }

  const byAlbum = ALBUNS.map(a=>({ album:a, items: fotos.filter(f=>f.album===a) })).filter(g=>g.items.length>0)

  if (loading) return <Loading />

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:18}}>📸 Galeria</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={()=>setShowModal(true)}>+ Foto</button>
      </div>

      {fotos.length === 0 ? (
        <EmptyState icon="📸" title="Nenhuma foto" desc="Adicione fotos do seu imóvel." />
      ) : (
        byAlbum.map(g=>(
          <div key={g.album} style={{marginBottom:24}}>
            <div style={{fontWeight:600,fontSize:15,marginBottom:10,color:'var(--c-text-muted)'}}>{g.album}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {g.items.map(f=>(
                <div key={f.id} style={{position:'relative',borderRadius:10,overflow:'hidden',background:'var(--c-surface)',border:'1px solid var(--c-border)'}}
                  onMouseEnter={e=>{ const btn=e.currentTarget.querySelector('.del-btn'); if(btn) btn.style.opacity='1' }}
                  onMouseLeave={e=>{ const btn=e.currentTarget.querySelector('.del-btn'); if(btn) btn.style.opacity='0' }}>
                  {signedUrls[f.id] ? (
                    <img
                      src={signedUrls[f.id]}
                      alt={f.titulo}
                      style={{width:'100%',height:120,objectFit:'cover',cursor:'pointer',display:'block'}}
                      onClick={()=>setLightbox(signedUrls[f.id])}
                    />
                  ) : (
                    <div style={{width:'100%',height:120,display:'flex',alignItems:'center',justifyContent:'center',fontSize:30}}>📷</div>
                  )}
                  <button className="del-btn" onClick={()=>handleDelete(f)}
                    style={{position:'absolute',top:6,right:6,background:'rgba(0,0,0,.55)',color:'#fff',border:'none',borderRadius:99,width:26,height:26,cursor:'pointer',fontSize:13,opacity:0,transition:'opacity .2s'}}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {lightbox && (
        <div onClick={()=>setLightbox(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.92)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
          <img src={lightbox} alt="" style={{maxWidth:'95vw',maxHeight:'90vh',objectFit:'contain',borderRadius:8}} onClick={e=>e.stopPropagation()} />
          <button onClick={()=>setLightbox(null)} style={{position:'absolute',top:20,right:24,background:'none',border:'none',color:'#fff',fontSize:32,cursor:'pointer'}}>✕</button>
        </div>
      )}

      {showModal && (
        <ModalShell title="Nova Foto" onClose={()=>setShowModal(false)} onSubmit={handleSave} saving={saving} saveLabel={saving ? 'Enviando...' : `Enviar${files.length > 1 ? ` (${files.length})` : ''}`}>
          <Field label="Álbum">
            <select className="c-form-select" value={form.album} onChange={e=>setForm(f=>({...f,album:e.target.value}))}>
              {ALBUNS.map(a=><option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Descrição">
            <textarea className="c-form-textarea" value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))} rows={2} placeholder="Opcional..." />
          </Field>
          <Field label="Fotos *">
            <input type="file" accept="image/*" multiple onChange={e=>setFiles(e.target.files)} required />
            {files.length > 1 && <div style={{fontSize:12,color:'var(--c-text-muted)',marginTop:4}}>{files.length} fotos selecionadas</div>}
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   BOLETOS TAB
══════════════════════════════════════════════════════════════════════════ */
function BoletosTab() {
  const [boletos, setBoletos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ competencia:'', valor:'', data_vencimento:'', data_pagamento:'', status:'pendente', observacoes:'' })
  const [pdfFile, setPdfFile] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('apartamento_boletos').select('*').order('data_vencimento',{ascending:false})
    setBoletos(data || [])
    setLoading(false)
  }, [])

  useEffect(()=>{ load() },[load])

  function openNew() {
    setEditItem(null)
    setForm({ competencia:'', valor:'', data_vencimento:'', data_pagamento:'', status:'pendente', observacoes:'' })
    setPdfFile(null)
    setShowModal(true)
  }

  function openEdit(b) {
    setEditItem(b)
    setForm({ competencia:b.competencia||'', valor:b.valor||'', data_vencimento:b.data_vencimento||'', data_pagamento:b.data_pagamento||'', status:b.status||'pendente', observacoes:b.observacoes||'' })
    setPdfFile(null)
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      let pdf_path = editItem?.pdf_path || null
      if (pdfFile) {
        if (pdf_path) await deleteFile(pdf_path)
        pdf_path = await uploadFile(pdfFile, 'boletos')
      }
      const payload = { ...form, valor: Number(form.valor) || null, pdf_path }
      if (editItem) {
        await supabase.from('apartamento_boletos').update(payload).eq('id', editItem.id)
      } else {
        await supabase.from('apartamento_boletos').insert(payload)
      }
      setShowModal(false)
      await load()
    } catch(err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(b) {
    if (!confirm('Excluir este boleto?')) return
    await deleteFile(b.pdf_path)
    await supabase.from('apartamento_boletos').delete().eq('id', b.id)
    await load()
  }

  async function handleDownload(b) {
    const url = await getSignedUrl(b.pdf_path)
    if (url) window.open(url, '_blank')
  }

  const totalPago = boletos.filter(b=>b.status==='pago').reduce((s,b)=>s+Number(b.valor||0),0)
  const totalPendente = boletos.filter(b=>b.status!=='pago').reduce((s,b)=>s+Number(b.valor||0),0)

  if (loading) return <Loading />

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:18}}>💸 Boletos</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Boleto</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20}}>
        <div style={{background:'#dcfce7',border:'1px solid #bbf7d0',borderRadius:10,padding:'12px 16px'}}>
          <div style={{fontSize:12,color:'#15803d',fontWeight:600}}>Total Pago</div>
          <div style={{fontSize:20,fontWeight:700,color:'#15803d'}}>{fmt(totalPago)}</div>
        </div>
        <div style={{background:'#fef9c3',border:'1px solid #fde68a',borderRadius:10,padding:'12px 16px'}}>
          <div style={{fontSize:12,color:'#854d0e',fontWeight:600}}>Total Pendente</div>
          <div style={{fontSize:20,fontWeight:700,color:'#854d0e'}}>{fmt(totalPendente)}</div>
        </div>
      </div>

      {boletos.length === 0 ? (
        <EmptyState icon="💸" title="Nenhum boleto" desc="Adicione seus boletos do imóvel." />
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {boletos.map(b=>(
            <div key={b.id} style={{background:'var(--c-surface)',border:'1px solid var(--c-border)',borderRadius:12,padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <div style={{fontWeight:700}}>{b.competencia}</div>
                  <StatusBadge status={b.status} />
                </div>
                <div style={{fontSize:20,fontWeight:700,color:'#6366f1'}}>{fmt(b.valor)}</div>
                <div style={{fontSize:12,color:'var(--c-text-muted)',marginTop:2}}>Venc: {fmtDate(b.data_vencimento)}{b.data_pagamento ? ` · Pago: ${fmtDate(b.data_pagamento)}` : ''}</div>
                {b.observacoes && <div style={{fontSize:12,color:'var(--c-text-muted)',marginTop:2}}>{b.observacoes}</div>}
              </div>
              <div style={{display:'flex',gap:6}}>
                {b.pdf_path && (
                  <button className="c-btn c-btn-secondary c-btn-sm" onClick={()=>handleDownload(b)}>PDF</button>
                )}
                <button className="c-btn c-btn-secondary c-btn-sm" onClick={()=>openEdit(b)}>Editar</button>
                <button className="c-btn c-btn-danger c-btn-sm" onClick={()=>handleDelete(b)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ModalShell title={editItem?'Editar Boleto':'Novo Boleto'} onClose={()=>setShowModal(false)} onSubmit={handleSave} saving={saving}>
          <Field label="Competência (ex: Janeiro/2025)">
            <input className="c-form-input" value={form.competencia} onChange={e=>setForm(f=>({...f,competencia:e.target.value}))} placeholder="Janeiro/2025" required />
          </Field>
          <Field label="Valor">
            <input className="c-form-input" type="number" step="0.01" value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))} required />
          </Field>
          <DateField label="Data de Vencimento" value={form.data_vencimento} onChange={e=>setForm(f=>({...f,data_vencimento:e.target.value}))} required />
          <DateField label="Data de Pagamento (opcional)" value={form.data_pagamento} onChange={e=>setForm(f=>({...f,data_pagamento:e.target.value}))} />
          <Field label="Status">
            <select className="c-form-select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="atrasado">Atrasado</option>
            </select>
          </Field>
          <Field label="Observações">
            <textarea className="c-form-textarea" value={form.observacoes} onChange={e=>setForm(f=>({...f,observacoes:e.target.value}))} rows={2} />
          </Field>
          <Field label="PDF do Boleto">
            <input type="file" accept=".pdf" onChange={e=>setPdfFile(e.target.files[0]||null)} />
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   GASTOS TAB
══════════════════════════════════════════════════════════════════════════ */
function GastosTab() {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ descricao:'', categoria:CAT_GASTOS[0], valor:'', data:'', forma_pagamento:FORMAS_PGTO[0], observacao:'' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('apartamento_gastos').select('*').order('data',{ascending:false})
    setGastos(data || [])
    setLoading(false)
  }, [])

  useEffect(()=>{ load() },[load])

  function openNew() {
    setEditItem(null)
    setForm({ descricao:'', categoria:CAT_GASTOS[0], valor:'', data:'', forma_pagamento:FORMAS_PGTO[0], observacao:'' })
    setShowModal(true)
  }

  function openEdit(g) {
    setEditItem(g)
    setForm({ descricao:g.descricao||'', categoria:g.categoria||CAT_GASTOS[0], valor:g.valor||'', data:g.data||'', forma_pagamento:g.forma_pagamento||FORMAS_PGTO[0], observacao:g.observacao||'' })
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, valor: Number(form.valor) || null }
      if (editItem) {
        await supabase.from('apartamento_gastos').update(payload).eq('id', editItem.id)
      } else {
        await supabase.from('apartamento_gastos').insert(payload)
      }
      setShowModal(false)
      await load()
    } catch(err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(g) {
    if (!confirm('Excluir este gasto?')) return
    await supabase.from('apartamento_gastos').delete().eq('id', g.id)
    await load()
  }

  const total = gastos.reduce((s,g)=>s+Number(g.valor||0),0)

  if (loading) return <Loading />

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:18}}>🧾 Gastos</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Gasto</button>
      </div>

      <div style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',borderRadius:14,padding:'18px 20px',marginBottom:20,color:'#fff'}}>
        <div style={{fontSize:13,opacity:.85}}>Total Investido</div>
        <div style={{fontSize:28,fontWeight:800}}>{fmt(total)}</div>
      </div>

      {gastos.length === 0 ? (
        <EmptyState icon="🧾" title="Nenhum gasto" desc="Registre os gastos do seu imóvel." />
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {gastos.map(g=>(
            <div key={g.id} style={{background:'var(--c-surface)',border:'1px solid var(--c-border)',borderRadius:12,padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                  <div style={{fontWeight:700}}>{g.descricao}</div>
                  <span className="c-chip" style={{fontSize:11,padding:'2px 8px',borderRadius:99,background:'var(--c-border)',color:'var(--c-text-muted)'}}>{g.categoria}</span>
                </div>
                <div style={{fontSize:18,fontWeight:700,color:'#6366f1'}}>{fmt(g.valor)}</div>
                <div style={{fontSize:12,color:'var(--c-text-muted)',marginTop:2}}>{fmtDate(g.data)} · {g.forma_pagamento}</div>
                {g.observacao && <div style={{fontSize:12,color:'var(--c-text-muted)',marginTop:2}}>{g.observacao}</div>}
              </div>
              <div style={{display:'flex',gap:6}}>
                <button className="c-btn c-btn-secondary c-btn-sm" onClick={()=>openEdit(g)}>Editar</button>
                <button className="c-btn c-btn-danger c-btn-sm" onClick={()=>handleDelete(g)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ModalShell title={editItem?'Editar Gasto':'Novo Gasto'} onClose={()=>setShowModal(false)} onSubmit={handleSave} saving={saving}>
          <Field label="Descrição">
            <input className="c-form-input" value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))} required />
          </Field>
          <Field label="Categoria">
            <select className="c-form-select" value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>
              {CAT_GASTOS.map(c=><option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Valor">
            <input className="c-form-input" type="number" step="0.01" value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))} required />
          </Field>
          <DateField label="Data" value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))} required />
          <Field label="Forma de Pagamento">
            <select className="c-form-select" value={form.forma_pagamento} onChange={e=>setForm(f=>({...f,forma_pagamento:e.target.value}))}>
              {FORMAS_PGTO.map(fp=><option key={fp}>{fp}</option>)}
            </select>
          </Field>
          <Field label="Observação">
            <textarea className="c-form-textarea" value={form.observacao} onChange={e=>setForm(f=>({...f,observacao:e.target.value}))} rows={2} />
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   DOCUMENTOS TAB
══════════════════════════════════════════════════════════════════════════ */
function DocumentosTab() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [detail, setDetail] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nome:'', categoria:CAT_DOCS[0], data:'', observacao:'' })
  const [arquivo, setArquivo] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('apartamento_documentos').select('*').order('created_at',{ascending:false})
    setDocs(data || [])
    setLoading(false)
  }, [])

  useEffect(()=>{ load() },[load])

  function openNew() {
    setEditItem(null)
    setForm({ nome:'', categoria:CAT_DOCS[0], data:'', observacao:'' })
    setArquivo(null)
    setShowModal(true)
  }

  function openEdit(d) {
    setEditItem(d)
    setForm({ nome:d.nome||'', categoria:d.categoria||CAT_DOCS[0], data:d.data||'', observacao:d.observacao||'' })
    setArquivo(null)
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      let storage_path = editItem?.storage_path || null
      if (arquivo) {
        if (storage_path) await deleteFile(storage_path)
        storage_path = await uploadFile(arquivo, 'documentos')
      }
      const payload = { ...form, storage_path }
      if (editItem) {
        await supabase.from('apartamento_documentos').update(payload).eq('id', editItem.id)
      } else {
        await supabase.from('apartamento_documentos').insert(payload)
      }
      setShowModal(false)
      await load()
    } catch(err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(d) {
    if (!confirm('Excluir este documento?')) return
    await deleteFile(d.storage_path)
    await supabase.from('apartamento_documentos').delete().eq('id', d.id)
    setDetail(null)
    await load()
  }

  async function handleOpen(d) {
    if (!d.storage_path) return
    const url = await getSignedUrl(d.storage_path)
    if (url) window.open(url, '_blank')
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:18}}>📁 Documentos</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Documento</button>
      </div>

      {docs.length === 0 ? (
        <EmptyState icon="📁" title="Nenhum documento" desc="Guarde os documentos do seu imóvel." />
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
          {docs.map(d=>(
            <div key={d.id} style={{background:'var(--c-surface)',border:'1px solid var(--c-border)',borderRadius:12,padding:'14px 16px',cursor:'pointer'}} onClick={()=>setDetail(d)}>
              <div style={{fontSize:28,marginBottom:8}}>📄</div>
              <div style={{fontWeight:700,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.nome}</div>
              <span style={{fontSize:11,padding:'2px 8px',borderRadius:99,background:'var(--c-border)',color:'var(--c-text-muted)'}}>{d.categoria}</span>
              <div style={{fontSize:12,color:'var(--c-text-muted)',marginTop:6}}>{fmtDate(d.data)}</div>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <div className="c-modal-overlay" onClick={()=>setDetail(null)}>
          <div className="c-modal-sheet" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px'}}>
              <div style={{width:40,height:4,borderRadius:99,background:'var(--c-border)'}}/>
            </div>
            <div style={{padding:'8px 20px 14px',borderBottom:'1px solid var(--c-border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700,fontSize:17}}>{detail.nome}</div>
              <button onClick={()=>setDetail(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'var(--c-text-muted)',lineHeight:1}}>✕</button>
            </div>
            <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:10}}>
              <div><span style={{color:'var(--c-text-muted)',fontSize:13}}>Categoria: </span><strong>{detail.categoria}</strong></div>
              <div><span style={{color:'var(--c-text-muted)',fontSize:13}}>Data: </span><strong>{fmtDate(detail.data)}</strong></div>
              {detail.observacao && <div><span style={{color:'var(--c-text-muted)',fontSize:13}}>Observação: </span>{detail.observacao}</div>}
            </div>
            <div style={{padding:'12px 20px 24px',borderTop:'1px solid var(--c-border)',display:'flex',gap:10}}>
              <button className="c-btn c-btn-danger" style={{flex:1}} onClick={()=>handleDelete(detail)}>Excluir</button>
              {detail.storage_path && (
                <button className="c-btn c-btn-secondary" style={{flex:1}} onClick={()=>handleOpen(detail)}>Abrir Arquivo</button>
              )}
              <button className="c-btn c-btn-primary" style={{flex:1}} onClick={()=>{ setDetail(null); openEdit(detail) }}>Editar</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <ModalShell title={editItem?'Editar Documento':'Novo Documento'} onClose={()=>setShowModal(false)} onSubmit={handleSave} saving={saving}>
          <Field label="Nome">
            <input className="c-form-input" value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} required />
          </Field>
          <Field label="Categoria">
            <select className="c-form-select" value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>
              {CAT_DOCS.map(c=><option key={c}>{c}</option>)}
            </select>
          </Field>
          <DateField label="Data" value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))} />
          <Field label="Observação">
            <textarea className="c-form-textarea" value={form.observacao} onChange={e=>setForm(f=>({...f,observacao:e.target.value}))} rows={2} />
          </Field>
          <Field label="Arquivo (PDF, imagem)">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setArquivo(e.target.files[0]||null)} />
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MANUTENÇÕES TAB
══════════════════════════════════════════════════════════════════════════ */
function ManutencoesTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ titulo:'', tipo:TIPOS_MANUT[0], status:'agendado', data_realizada:'', data_proxima:'', valor:'', prestador:'', observacao:'' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('apartamento_manutencoes').select('*').order('created_at',{ascending:false})
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(()=>{ load() },[load])

  function openNew() {
    setEditItem(null)
    setForm({ titulo:'', tipo:TIPOS_MANUT[0], status:'agendado', data_realizada:'', data_proxima:'', valor:'', prestador:'', observacao:'' })
    setShowModal(true)
  }

  function openEdit(item) {
    setEditItem(item)
    setForm({ titulo:item.titulo||'', tipo:item.tipo||TIPOS_MANUT[0], status:item.status||'agendado', data_realizada:item.data_realizada||'', data_proxima:item.data_proxima||'', valor:item.valor||'', prestador:item.prestador||'', observacao:item.observacao||'' })
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, valor: form.valor ? Number(form.valor) : null }
      if (editItem) {
        await supabase.from('apartamento_manutencoes').update(payload).eq('id', editItem.id)
      } else {
        await supabase.from('apartamento_manutencoes').insert(payload)
      }
      setShowModal(false)
      await load()
    } catch(err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(item) {
    if (!confirm('Excluir esta manutenção?')) return
    await supabase.from('apartamento_manutencoes').delete().eq('id', item.id)
    await load()
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:18}}>🔧 Manutenções</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Manutenção</button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="🔧" title="Nenhuma manutenção" desc="Registre as manutenções do imóvel." />
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {items.map(item=>(
            <div key={item.id} style={{background: item.status==='agendado' ? '#fef9c3' : 'var(--c-surface)', border:`1px solid ${item.status==='agendado'?'#fde68a':'var(--c-border)'}`, borderRadius:12, padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                  <div style={{fontWeight:700}}>{item.titulo}</div>
                  <StatusBadge status={item.status} />
                </div>
                <div style={{fontSize:12,color:'var(--c-text-muted)'}}>
                  {item.tipo}
                  {item.prestador ? ` · ${item.prestador}` : ''}
                  {item.valor ? ` · ${fmt(item.valor)}` : ''}
                </div>
                <div style={{fontSize:12,color:'var(--c-text-muted)',marginTop:2}}>
                  {item.data_realizada ? `Realizada: ${fmtDate(item.data_realizada)}` : ''}
                  {item.data_proxima ? `${item.data_realizada?' · ':''}Próxima: ${fmtDate(item.data_proxima)}` : ''}
                </div>
                {item.observacao && <div style={{fontSize:12,color:'var(--c-text-muted)',marginTop:4}}>{item.observacao}</div>}
              </div>
              <div style={{display:'flex',gap:6}}>
                <button className="c-btn c-btn-secondary c-btn-sm" onClick={()=>openEdit(item)}>Editar</button>
                <button className="c-btn c-btn-danger c-btn-sm" onClick={()=>handleDelete(item)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ModalShell title={editItem?'Editar Manutenção':'Nova Manutenção'} onClose={()=>setShowModal(false)} onSubmit={handleSave} saving={saving}>
          <Field label="Título">
            <input className="c-form-input" value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} required />
          </Field>
          <Field label="Tipo">
            <select className="c-form-select" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
              {TIPOS_MANUT.map(t=><option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="c-form-select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
              <option value="agendado">Agendado</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluído</option>
            </select>
          </Field>
          <DateField label="Data Realizada" value={form.data_realizada} onChange={e=>setForm(f=>({...f,data_realizada:e.target.value}))} />
          <DateField label="Próxima Manutenção" value={form.data_proxima} onChange={e=>setForm(f=>({...f,data_proxima:e.target.value}))} />
          <Field label="Valor">
            <input className="c-form-input" type="number" step="0.01" value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))} />
          </Field>
          <Field label="Prestador">
            <input className="c-form-input" value={form.prestador} onChange={e=>setForm(f=>({...f,prestador:e.target.value}))} placeholder="Nome do prestador" />
          </Field>
          <Field label="Observação">
            <textarea className="c-form-textarea" value={form.observacao} onChange={e=>setForm(f=>({...f,observacao:e.target.value}))} rows={2} />
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   INVENTÁRIO TAB
══════════════════════════════════════════════════════════════════════════ */
function InventarioTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [signedFotos, setSignedFotos] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nome:'', categoria:CAT_INV[0], marca:'', modelo:'', data_compra:'', valor:'', garantia_fim:'', localizacao:'' })
  const [nfFile, setNfFile] = useState(null)
  const [fotoFile, setFotoFile] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('apartamento_inventario').select('*').order('created_at',{ascending:false})
    const rows = data || []
    setItems(rows)
    const urls = {}
    await Promise.all(rows.map(async item => {
      if (item.foto_path) urls[item.id] = await getSignedUrl(item.foto_path)
    }))
    setSignedFotos(urls)
    setLoading(false)
  }, [])

  useEffect(()=>{ load() },[load])

  function openNew() {
    setEditItem(null)
    setForm({ nome:'', categoria:CAT_INV[0], marca:'', modelo:'', data_compra:'', valor:'', garantia_fim:'', localizacao:'' })
    setNfFile(null)
    setFotoFile(null)
    setShowModal(true)
  }

  function openEdit(item) {
    setEditItem(item)
    setForm({ nome:item.nome||'', categoria:item.categoria||CAT_INV[0], marca:item.marca||'', modelo:item.modelo||'', data_compra:item.data_compra||'', valor:item.valor||'', garantia_fim:item.garantia_fim||'', localizacao:item.localizacao||'' })
    setNfFile(null)
    setFotoFile(null)
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      let nf_path = editItem?.nf_path || null
      let foto_path = editItem?.foto_path || null
      if (nfFile) {
        if (nf_path) await deleteFile(nf_path)
        nf_path = await uploadFile(nfFile, 'inventario/nf')
      }
      if (fotoFile) {
        if (foto_path) await deleteFile(foto_path)
        foto_path = await uploadFile(fotoFile, 'inventario/fotos')
      }
      const payload = { ...form, valor: form.valor ? Number(form.valor) : null, nf_path, foto_path }
      if (editItem) {
        await supabase.from('apartamento_inventario').update(payload).eq('id', editItem.id)
      } else {
        await supabase.from('apartamento_inventario').insert(payload)
      }
      setShowModal(false)
      await load()
    } catch(err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(item) {
    if (!confirm('Excluir este item?')) return
    await deleteFile(item.nf_path)
    await deleteFile(item.foto_path)
    await supabase.from('apartamento_inventario').delete().eq('id', item.id)
    await load()
  }

  function garantiaBadge(fim) {
    if (!fim) return null
    const days = differenceInDays(parseISO(fim), new Date())
    if (days < 0) return { label:'Expirada', bg:'#fee2e2', color:'#dc2626' }
    if (days <= 30) return { label:`Vence em ${days}d`, bg:'#fef9c3', color:'#854d0e' }
    return { label:'Ativa', bg:'#dcfce7', color:'#15803d' }
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:18}}>🛒 Inventário</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Item</button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="🛒" title="Inventário vazio" desc="Registre os bens do seu imóvel." />
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
          {items.map(item=>{
            const badge = garantiaBadge(item.garantia_fim)
            return (
              <div key={item.id} style={{background:'var(--c-surface)',border:'1px solid var(--c-border)',borderRadius:12,overflow:'hidden'}}>
                {signedFotos[item.id] ? (
                  <img src={signedFotos[item.id]} alt={item.nome} style={{width:'100%',height:120,objectFit:'cover'}} />
                ) : (
                  <div style={{width:'100%',height:80,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,background:'var(--c-border)'}}>📦</div>
                )}
                <div style={{padding:'12px 14px'}}>
                  <div style={{fontWeight:700,marginBottom:2}}>{item.nome}</div>
                  <div style={{fontSize:12,color:'var(--c-text-muted)',marginBottom:6}}>{item.categoria}{item.marca?` · ${item.marca}`:''}</div>
                  {item.valor && <div style={{fontSize:16,fontWeight:700,color:'#6366f1',marginBottom:6}}>{fmt(item.valor)}</div>}
                  {badge && <span style={{...badge,padding:'2px 8px',borderRadius:99,fontSize:11,fontWeight:600}}>{badge.label}</span>}
                  {item.localizacao && <div style={{fontSize:11,color:'var(--c-text-muted)',marginTop:6}}>📍 {item.localizacao}</div>}
                  <div style={{display:'flex',gap:6,marginTop:10}}>
                    <button className="c-btn c-btn-secondary c-btn-sm" style={{flex:1}} onClick={()=>openEdit(item)}>Editar</button>
                    <button className="c-btn c-btn-danger c-btn-sm" onClick={()=>handleDelete(item)}>✕</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <ModalShell title={editItem?'Editar Item':'Novo Item'} onClose={()=>setShowModal(false)} onSubmit={handleSave} saving={saving}>
          <Field label="Nome">
            <input className="c-form-input" value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} required />
          </Field>
          <Field label="Categoria">
            <select className="c-form-select" value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>
              {CAT_INV.map(c=><option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Marca">
            <input className="c-form-input" value={form.marca} onChange={e=>setForm(f=>({...f,marca:e.target.value}))} />
          </Field>
          <Field label="Modelo">
            <input className="c-form-input" value={form.modelo} onChange={e=>setForm(f=>({...f,modelo:e.target.value}))} />
          </Field>
          <DateField label="Data de Compra" value={form.data_compra} onChange={e=>setForm(f=>({...f,data_compra:e.target.value}))} />
          <Field label="Valor">
            <input className="c-form-input" type="number" step="0.01" value={form.valor} onChange={e=>setForm(f=>({...f,valor:e.target.value}))} />
          </Field>
          <DateField label="Fim da Garantia" value={form.garantia_fim} onChange={e=>setForm(f=>({...f,garantia_fim:e.target.value}))} />
          <Field label="Localização">
            <input className="c-form-input" value={form.localizacao} onChange={e=>setForm(f=>({...f,localizacao:e.target.value}))} placeholder="Ex: Sala, Quarto principal" />
          </Field>
          <Field label="Nota Fiscal (PDF)">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setNfFile(e.target.files[0]||null)} />
          </Field>
          <Field label="Foto do Item">
            <input type="file" accept="image/*" onChange={e=>setFotoFile(e.target.files[0]||null)} />
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   GARANTIAS TAB
══════════════════════════════════════════════════════════════════════════ */
function GarantiasTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ produto:'', data_compra:'', inicio_garantia:'', fim_garantia:'', observacoes:'' })
  const [nfFile, setNfFile] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('apartamento_garantias').select('*').order('fim_garantia',{ascending:true})
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(()=>{ load() },[load])

  function openNew() {
    setEditItem(null)
    setForm({ produto:'', data_compra:'', inicio_garantia:'', fim_garantia:'', observacoes:'' })
    setNfFile(null)
    setShowModal(true)
  }

  function openEdit(item) {
    setEditItem(item)
    setForm({ produto:item.produto||'', data_compra:item.data_compra||'', inicio_garantia:item.inicio_garantia||'', fim_garantia:item.fim_garantia||'', observacoes:item.observacoes||'' })
    setNfFile(null)
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      let nf_path = editItem?.nf_path || null
      if (nfFile) {
        if (nf_path) await deleteFile(nf_path)
        nf_path = await uploadFile(nfFile, 'garantias')
      }
      const payload = { ...form, nf_path }
      if (editItem) {
        await supabase.from('apartamento_garantias').update(payload).eq('id', editItem.id)
      } else {
        await supabase.from('apartamento_garantias').insert(payload)
      }
      setShowModal(false)
      await load()
    } catch(err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(item) {
    if (!confirm('Excluir esta garantia?')) return
    await deleteFile(item.nf_path)
    await supabase.from('apartamento_garantias').delete().eq('id', item.id)
    await load()
  }

  async function handleNF(item) {
    const url = await getSignedUrl(item.nf_path)
    if (url) window.open(url, '_blank')
  }

  function getStatus(fim) {
    if (!fim) return { label:'Sem data', bg:'#f1f5f9', color:'#475569' }
    const days = differenceInDays(parseISO(fim), new Date())
    if (days < 0) return { label:'Expirada', bg:'#fee2e2', color:'#dc2626' }
    if (days <= 30) return { label:`Vencendo (${days}d)`, bg:'#fef9c3', color:'#854d0e' }
    return { label:'Ativa', bg:'#dcfce7', color:'#15803d' }
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:18}}>📑 Garantias</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Garantia</button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="📑" title="Nenhuma garantia" desc="Cadastre as garantias dos seus produtos." />
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {items.map(item=>{
            const st = getStatus(item.fim_garantia)
            return (
              <div key={item.id} style={{background:'var(--c-surface)',border:`1px solid ${st.color === '#dc2626' ? '#fca5a5' : st.color === '#854d0e' ? '#fde68a' : 'var(--c-border)'}`,borderRadius:12,padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                    <div style={{fontWeight:700}}>{item.produto}</div>
                    <span style={{...st,padding:'2px 10px',borderRadius:99,fontSize:11,fontWeight:600}}>{st.label}</span>
                  </div>
                  <div style={{fontSize:12,color:'var(--c-text-muted)'}}>
                    {item.data_compra ? `Compra: ${fmtDate(item.data_compra)}` : ''}
                    {item.inicio_garantia ? ` · Início: ${fmtDate(item.inicio_garantia)}` : ''}
                    {item.fim_garantia ? ` · Fim: ${fmtDate(item.fim_garantia)}` : ''}
                  </div>
                  {item.observacoes && <div style={{fontSize:12,color:'var(--c-text-muted)',marginTop:4}}>{item.observacoes}</div>}
                </div>
                <div style={{display:'flex',gap:6}}>
                  {item.nf_path && (
                    <button className="c-btn c-btn-secondary c-btn-sm" onClick={()=>handleNF(item)}>NF</button>
                  )}
                  <button className="c-btn c-btn-secondary c-btn-sm" onClick={()=>openEdit(item)}>Editar</button>
                  <button className="c-btn c-btn-danger c-btn-sm" onClick={()=>handleDelete(item)}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <ModalShell title={editItem?'Editar Garantia':'Nova Garantia'} onClose={()=>setShowModal(false)} onSubmit={handleSave} saving={saving}>
          <Field label="Produto">
            <input className="c-form-input" value={form.produto} onChange={e=>setForm(f=>({...f,produto:e.target.value}))} required />
          </Field>
          <DateField label="Data de Compra" value={form.data_compra} onChange={e=>setForm(f=>({...f,data_compra:e.target.value}))} />
          <DateField label="Início da Garantia" value={form.inicio_garantia} onChange={e=>setForm(f=>({...f,inicio_garantia:e.target.value}))} />
          <DateField label="Fim da Garantia" value={form.fim_garantia} onChange={e=>setForm(f=>({...f,fim_garantia:e.target.value}))} required />
          <Field label="Nota Fiscal (PDF/imagem)">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setNfFile(e.target.files[0]||null)} />
          </Field>
          <Field label="Observações">
            <textarea className="c-form-textarea" value={form.observacoes} onChange={e=>setForm(f=>({...f,observacoes:e.target.value}))} rows={2} />
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   PRESTADORES TAB
══════════════════════════════════════════════════════════════════════════ */
function PrestadoresTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [detail, setDetail] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nome:'', especialidade:ESPECIALIDADES[0], telefone:'', whatsapp:'', email:'', empresa:'', observacao:'' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('apartamento_prestadores').select('*').order('nome',{ascending:true})
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(()=>{ load() },[load])

  function openNew() {
    setEditItem(null)
    setForm({ nome:'', especialidade:ESPECIALIDADES[0], telefone:'', whatsapp:'', email:'', empresa:'', observacao:'' })
    setShowModal(true)
  }

  function openEdit(item) {
    setEditItem(item)
    setForm({ nome:item.nome||'', especialidade:item.especialidade||ESPECIALIDADES[0], telefone:item.telefone||'', whatsapp:item.whatsapp||'', email:item.email||'', empresa:item.empresa||'', observacao:item.observacao||'' })
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editItem) {
        await supabase.from('apartamento_prestadores').update(form).eq('id', editItem.id)
      } else {
        await supabase.from('apartamento_prestadores').insert(form)
      }
      setShowModal(false)
      await load()
    } catch(err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(item) {
    if (!confirm('Excluir este prestador?')) return
    await supabase.from('apartamento_prestadores').delete().eq('id', item.id)
    setDetail(null)
    await load()
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:18}}>👷 Prestadores</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Prestador</button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="👷" title="Nenhum prestador" desc="Cadastre os profissionais de confiança." />
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:12}}>
          {items.map(item=>(
            <div key={item.id} style={{background:'var(--c-surface)',border:'1px solid var(--c-border)',borderRadius:12,padding:'16px',cursor:'pointer'}} onClick={()=>setDetail(item)}>
              <div style={{width:44,height:44,borderRadius:'50%',background:'#6366f1',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:18,marginBottom:10}}>
                {item.nome.charAt(0).toUpperCase()}
              </div>
              <div style={{fontWeight:700,marginBottom:2}}>{item.nome}</div>
              <div style={{fontSize:12,color:'var(--c-text-muted)',marginBottom:6}}>{item.especialidade}{item.empresa?` · ${item.empresa}`:''}</div>
              {item.telefone && <div style={{fontSize:13}}>📞 {item.telefone}</div>}
              {item.whatsapp && (
                <a href={`https://wa.me/55${item.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                  onClick={e=>e.stopPropagation()}
                  style={{display:'inline-block',marginTop:6,fontSize:13,color:'#15803d',textDecoration:'none'}}>
                  💬 WhatsApp
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {detail && (
        <div className="c-modal-overlay" onClick={()=>setDetail(null)}>
          <div className="c-modal-sheet" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px'}}>
              <div style={{width:40,height:4,borderRadius:99,background:'var(--c-border)'}}/>
            </div>
            <div style={{padding:'8px 20px 14px',borderBottom:'1px solid var(--c-border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700,fontSize:17}}>{detail.nome}</div>
              <button onClick={()=>setDetail(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'var(--c-text-muted)',lineHeight:1}}>✕</button>
            </div>
            <div style={{padding:'16px 20px',display:'flex',flexDirection:'column',gap:10}}>
              <div><span style={{color:'var(--c-text-muted)',fontSize:13}}>Especialidade: </span><strong>{detail.especialidade}</strong></div>
              {detail.empresa && <div><span style={{color:'var(--c-text-muted)',fontSize:13}}>Empresa: </span><strong>{detail.empresa}</strong></div>}
              {detail.telefone && <div><span style={{color:'var(--c-text-muted)',fontSize:13}}>Telefone: </span><strong>{detail.telefone}</strong></div>}
              {detail.email && <div><span style={{color:'var(--c-text-muted)',fontSize:13}}>E-mail: </span><strong>{detail.email}</strong></div>}
              {detail.whatsapp && (
                <div>
                  <span style={{color:'var(--c-text-muted)',fontSize:13}}>WhatsApp: </span>
                  <a href={`https://wa.me/55${detail.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{color:'#15803d',fontWeight:600}}>
                    {detail.whatsapp}
                  </a>
                </div>
              )}
              {detail.observacao && <div><span style={{color:'var(--c-text-muted)',fontSize:13}}>Obs: </span>{detail.observacao}</div>}
            </div>
            <div style={{padding:'12px 20px 24px',borderTop:'1px solid var(--c-border)',display:'flex',gap:10}}>
              <button className="c-btn c-btn-danger" style={{flex:1}} onClick={()=>handleDelete(detail)}>Excluir</button>
              <button className="c-btn c-btn-primary" style={{flex:1}} onClick={()=>{ setDetail(null); openEdit(detail) }}>Editar</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <ModalShell title={editItem?'Editar Prestador':'Novo Prestador'} onClose={()=>setShowModal(false)} onSubmit={handleSave} saving={saving}>
          <Field label="Nome">
            <input className="c-form-input" value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} required />
          </Field>
          <Field label="Especialidade">
            <select className="c-form-select" value={form.especialidade} onChange={e=>setForm(f=>({...f,especialidade:e.target.value}))}>
              {ESPECIALIDADES.map(es=><option key={es}>{es}</option>)}
            </select>
          </Field>
          <Field label="Telefone">
            <input className="c-form-input" value={form.telefone} onChange={e=>setForm(f=>({...f,telefone:e.target.value}))} placeholder="(11) 99999-9999" />
          </Field>
          <Field label="WhatsApp">
            <input className="c-form-input" value={form.whatsapp} onChange={e=>setForm(f=>({...f,whatsapp:e.target.value}))} placeholder="(11) 99999-9999" />
          </Field>
          <Field label="E-mail">
            <input className="c-form-input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
          </Field>
          <Field label="Empresa">
            <input className="c-form-input" value={form.empresa} onChange={e=>setForm(f=>({...f,empresa:e.target.value}))} />
          </Field>
          <Field label="Observação">
            <textarea className="c-form-textarea" value={form.observacao} onChange={e=>setForm(f=>({...f,observacao:e.target.value}))} rows={2} />
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   PROJETOS TAB
══════════════════════════════════════════════════════════════════════════ */
function ProjetosTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nome:'', descricao:'', status:STATUS_PROJ[0], data_inicio:'', data_final:'', orcamento:'', valor_gasto:'' })

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('apartamento_projetos').select('*').order('created_at',{ascending:false})
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(()=>{ load() },[load])

  function openNew() {
    setEditItem(null)
    setForm({ nome:'', descricao:'', status:STATUS_PROJ[0], data_inicio:'', data_final:'', orcamento:'', valor_gasto:'' })
    setShowModal(true)
  }

  function openEdit(item) {
    setEditItem(item)
    setForm({ nome:item.nome||'', descricao:item.descricao||'', status:item.status||STATUS_PROJ[0], data_inicio:item.data_inicio||'', data_final:item.data_final||'', orcamento:item.orcamento||'', valor_gasto:item.valor_gasto||'' })
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        orcamento: form.orcamento ? Number(form.orcamento) : null,
        valor_gasto: form.valor_gasto ? Number(form.valor_gasto) : null,
      }
      if (editItem) {
        await supabase.from('apartamento_projetos').update(payload).eq('id', editItem.id)
      } else {
        await supabase.from('apartamento_projetos').insert(payload)
      }
      setShowModal(false)
      await load()
    } catch(err) { alert(err.message) } finally { setSaving(false) }
  }

  async function handleDelete(item) {
    if (!confirm('Excluir este projeto?')) return
    await supabase.from('apartamento_projetos').delete().eq('id', item.id)
    await load()
  }

  if (loading) return <Loading />

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:18}}>🎨 Projetos</div>
        <button className="c-btn c-btn-primary c-btn-sm" onClick={openNew}>+ Projeto</button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="🎨" title="Nenhum projeto" desc="Planeje os projetos do seu imóvel." />
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {items.map(item=>{
            const orc = Number(item.orcamento || 0)
            const gasto = Number(item.valor_gasto || 0)
            const saldo = orc - gasto
            const pct = orc > 0 ? Math.min(100, Math.round((gasto / orc) * 100)) : 0
            return (
              <div key={item.id} style={{background:'var(--c-surface)',border:'1px solid var(--c-border)',borderRadius:14,padding:'16px 18px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:10}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <div style={{fontWeight:700,fontSize:16}}>{item.nome}</div>
                      <StatusBadge status={item.status} />
                    </div>
                    {item.descricao && <div style={{fontSize:13,color:'var(--c-text-muted)'}}>{item.descricao}</div>}
                    <div style={{fontSize:12,color:'var(--c-text-muted)',marginTop:4}}>
                      {item.data_inicio ? `Início: ${fmtDate(item.data_inicio)}` : ''}
                      {item.data_final ? `${item.data_inicio?' · ':''}Fim: ${fmtDate(item.data_final)}` : ''}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <button className="c-btn c-btn-secondary c-btn-sm" onClick={()=>openEdit(item)}>Editar</button>
                    <button className="c-btn c-btn-danger c-btn-sm" onClick={()=>handleDelete(item)}>✕</button>
                  </div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
                  <div style={{background:'var(--c-bg)',borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
                    <div style={{fontSize:11,color:'var(--c-text-muted)'}}>Orçamento</div>
                    <div style={{fontWeight:700,color:'#6366f1'}}>{orc?fmt(orc):'—'}</div>
                  </div>
                  <div style={{background:'var(--c-bg)',borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
                    <div style={{fontSize:11,color:'var(--c-text-muted)'}}>Gasto</div>
                    <div style={{fontWeight:700,color:'#dc2626'}}>{gasto?fmt(gasto):'—'}</div>
                  </div>
                  <div style={{background:'var(--c-bg)',borderRadius:8,padding:'8px 10px',textAlign:'center'}}>
                    <div style={{fontSize:11,color:'var(--c-text-muted)'}}>Saldo</div>
                    <div style={{fontWeight:700,color:saldo>=0?'#15803d':'#dc2626'}}>{orc?fmt(saldo):'—'}</div>
                  </div>
                </div>

                {orc > 0 && (
                  <div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--c-text-muted)',marginBottom:4}}>
                      <span>Progresso</span>
                      <span>{pct}%</span>
                    </div>
                    <div style={{height:8,background:'var(--c-border)',borderRadius:99,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${pct}%`,background: pct>=100?'#dc2626':'#6366f1',borderRadius:99,transition:'width .3s'}} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <ModalShell title={editItem?'Editar Projeto':'Novo Projeto'} onClose={()=>setShowModal(false)} onSubmit={handleSave} saving={saving}>
          <Field label="Nome">
            <input className="c-form-input" value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} required />
          </Field>
          <Field label="Descrição">
            <textarea className="c-form-textarea" value={form.descricao} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))} rows={2} />
          </Field>
          <Field label="Status">
            <select className="c-form-select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
              {STATUS_PROJ.map(s=><option key={s}>{s}</option>)}
            </select>
          </Field>
          <DateField label="Data de Início" value={form.data_inicio} onChange={e=>setForm(f=>({...f,data_inicio:e.target.value}))} />
          <DateField label="Data Final" value={form.data_final} onChange={e=>setForm(f=>({...f,data_final:e.target.value}))} />
          <Field label="Orçamento">
            <input className="c-form-input" type="number" step="0.01" value={form.orcamento} onChange={e=>setForm(f=>({...f,orcamento:e.target.value}))} />
          </Field>
          <Field label="Valor Gasto">
            <input className="c-form-input" type="number" step="0.01" value={form.valor_gasto} onChange={e=>setForm(f=>({...f,valor_gasto:e.target.value}))} />
          </Field>
        </ModalShell>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function Apartamento() {
  const [tab, setTab] = useState('dashboard')

  const TABS = [
    { key:'dashboard',   icon:'🏠', label:'Visão Geral'  },
    { key:'galeria',     icon:'📸', label:'Galeria'      },
    { key:'boletos',     icon:'💸', label:'Boletos'      },
    { key:'gastos',      icon:'🧾', label:'Gastos'       },
    { key:'documentos',  icon:'📁', label:'Documentos'   },
    { key:'manutencoes', icon:'🔧', label:'Manutenções'  },
    { key:'inventario',  icon:'🛒', label:'Inventário'   },
    { key:'garantias',   icon:'📑', label:'Garantias'    },
    { key:'prestadores', icon:'👷', label:'Prestadores'  },
    { key:'projetos',    icon:'🎨', label:'Projetos'     },
  ]

  return (
    <div>
      {/* Tab bar - horizontal scroll */}
      <div style={{display:'flex',gap:4,overflowX:'auto',paddingBottom:8,marginBottom:20,scrollbarWidth:'none'}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{
              flexShrink:0, padding:'7px 14px', borderRadius:99, fontSize:13, fontWeight:600,
              border:'none', cursor:'pointer', whiteSpace:'nowrap',
              background: tab===t.key ? '#6366f1' : 'var(--c-surface)',
              color: tab===t.key ? '#fff' : 'var(--c-text-muted)',
              boxShadow: tab===t.key ? '0 2px 8px rgba(99,102,241,.3)' : 'none',
              transition:'all .15s',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'dashboard'   && <DashboardTab />}
      {tab === 'galeria'     && <GaleriaTab />}
      {tab === 'boletos'     && <BoletosTab />}
      {tab === 'gastos'      && <GastosTab />}
      {tab === 'documentos'  && <DocumentosTab />}
      {tab === 'manutencoes' && <ManutencoesTab />}
      {tab === 'inventario'  && <InventarioTab />}
      {tab === 'garantias'   && <GarantiasTab />}
      {tab === 'prestadores' && <PrestadoresTab />}
      {tab === 'projetos'    && <ProjetosTab />}
    </div>
  )
}
