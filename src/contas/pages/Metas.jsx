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
import {
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Coins,
  Edit3,
  Landmark,
  Package,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  WalletCards,
  X,
} from 'lucide-react'
import {
  Button,
  EmptyState,
  FormField,
  IconButton,
  MetricCard,
  PageHeader,
  SectionCard,
  SelectField,
  Skeleton,
} from '../components/ui'

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

function tipoIcon(tipo) {
  const props = { size: 18 }
  if (tipo === 'investimento') return <TrendingUp {...props} />
  if (tipo === 'corrente') return <WalletCards {...props} />
  if (tipo === 'tesouro') return <Landmark {...props} />
  if (tipo === 'cripto') return <Coins {...props} />
  if (tipo === 'emergencia') return <Target {...props} />
  if (tipo === 'outros') return <Package {...props} />
  return <PiggyBank {...props} />
}

function CofrinhoModal({ title, description, onClose, actions, children, size = 'md' }) {
  return (
    <div className="c-cofrinhos-v2-modal-backdrop" onClick={onClose}>
      <div className={`c-cofrinhos-v2-modal c-cofrinhos-v2-modal--${size}`} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="cofrinhos-modal-title">
        <header className="c-cofrinhos-v2-modal__header">
          <div>
            <h2 id="cofrinhos-modal-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <IconButton icon={<X size={18} />} label="Fechar" variant="ghost" onClick={onClose} />
        </header>
        <div className="c-cofrinhos-v2-modal__body">{children}</div>
        {actions && <footer className="c-cofrinhos-v2-modal__footer">{actions}</footer>}
      </div>
    </div>
  )
}

function ProgressBar({ pct, color, label }) {
  return (
    <div className="c-cofrinhos-v2-progress" aria-label={label || `Progresso ${pct.toFixed(0)}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(pct))}>
      <span style={{ width: `${Math.min(100, pct)}%`, background: color || 'var(--v2-color-success)' }} />
    </div>
  )
}

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

  if (loading) {
    return (
      <div className="c-cofrinhos-v2-page" aria-busy="true">
        <PageHeader eyebrow="Família" title="Cofrinhos" description="Carregando seus objetivos financeiros." />
        <div className="c-cofrinhos-v2-metrics">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
        <SectionCard padding="lg"><Skeleton variant="text" lines={6} /></SectionCard>
      </div>
    )
  }

  const tipoOptions = [{ value: 'all', label: 'Todos os tipos' }, ...TIPOS.map(t => ({ value: t.value, label: t.label }))]

  return (
    <div className="c-cofrinhos-v2-page">
      <PageHeader
        eyebrow="Família"
        title="Cofrinhos"
        description="Controle onde está guardado o seu dinheiro e acompanhe o avanço das metas."
        actions={<Button icon={<Plus size={16} />} onClick={openAdd}>Novo Cofrinho</Button>}
      />

      <div className="c-cofrinhos-v2-metrics">
        <MetricCard label="Total guardado" value={fmtBRL(stats.total)} tone="success" icon={<CircleDollarSign size={18} />} description="Somando todos os cofrinhos" />
        <MetricCard label="Cofrinhos" value={stats.count} icon={<PiggyBank size={18} />} description="Registros cadastrados" />
        <MetricCard label="Soma das metas" value={fmtBRL(stats.totalMeta)} tone="accent" icon={<Target size={18} />} description="Objetivos com valor definido" />
        <MetricCard label="Com meta" value={stats.comMeta} icon={<CheckCircle2 size={18} />} description="Cofrinhos com meta ativa" />
      </div>

      <SectionCard
        title="Objetivos"
        description={`${filtered.length} cofrinho${filtered.length !== 1 ? 's' : ''} exibido${filtered.length !== 1 ? 's' : ''}.`}
        actions={
          <div className="c-cofrinhos-v2-filter">
            <SelectField
              label="Tipo"
              value={filterTipo}
              options={tipoOptions}
              onChange={e => setFilterTipo(e.target.value)}
            />
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={<PiggyBank size={24} />}
            title={cofrinhos.length === 0 ? 'Nenhum cofrinho ainda' : 'Nenhum cofrinho encontrado'}
            description={cofrinhos.length === 0 ? 'Crie seu primeiro cofrinho para acompanhar suas metas.' : 'Ajuste o filtro acima para visualizar outros tipos.'}
            action={cofrinhos.length === 0 ? <Button icon={<Plus size={16} />} onClick={openAdd}>Novo Cofrinho</Button> : null}
          />
        ) : (
          <div className="c-cofrinhos-v2-grid">
            {filtered.map(c => {
              const tipo = TIPOS.find(t => t.value === c.tipo)
              const pct  = c.valor_meta > 0 ? Math.min(100, (c.valor_atual / c.valor_meta) * 100) : null
              const cor  = c.cor || '#10b981'
              return (
                <article key={c.id} className="c-cofrinhos-v2-card" style={{ '--cofrinho-color': cor }}>
                  <button type="button" className="c-cofrinhos-v2-card__body" onClick={() => openDetail(c)}>
                    <span className="c-cofrinhos-v2-card__icon">{tipoIcon(c.tipo)}</span>
                    <span className="c-cofrinhos-v2-card__content">
                      <span className="c-cofrinhos-v2-card__name">{c.nome}</span>
                      <span className="c-cofrinhos-v2-card__meta">
                        {c.onde_guardado || 'Local não informado'}
                        {tipo && ` · ${tipo.label}`}
                      </span>
                    </span>
                    <span className="c-cofrinhos-v2-card__emoji" aria-label="Ícone salvo">{c.icone || '🐷'}</span>
                  </button>

                  <div className="c-cofrinhos-v2-card__amounts">
                    <strong>{fmtBRL(c.valor_atual)}</strong>
                    {c.valor_meta > 0 && <span>meta: {fmtBRL(c.valor_meta)}</span>}
                  </div>

                  {pct !== null && (
                    <div className="c-cofrinhos-v2-progress-block">
                      <ProgressBar pct={pct} color={cor} label={`Progresso de ${c.nome}: ${pct.toFixed(0)}%`} />
                      <div>
                        <strong>{pct.toFixed(0)}%</strong>
                        <span>falta {fmtBRL(Math.max(0, c.valor_meta - c.valor_atual))}</span>
                      </div>
                    </div>
                  )}

                  {c.observacoes && <p className="c-cofrinhos-v2-card__notes">{c.observacoes}</p>}

                  <div className="c-cofrinhos-v2-card__actions">
                    <IconButton icon={<Edit3 size={16} />} label={`Editar ${c.nome}`} variant="secondary" size="sm" onClick={() => openEdit(c)} />
                    <IconButton icon={<Trash2 size={16} />} label={`Excluir ${c.nome}`} variant="danger" size="sm" onClick={() => deleteCofrinho(c.id)} />
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </SectionCard>

      {showForm && (
        <CofrinhoModal
          title={editingId ? 'Editar Cofrinho' : 'Novo Cofrinho'}
          description={editingId ? 'Atualize os dados já cadastrados.' : 'Cadastre um novo objetivo ou local onde o dinheiro está guardado.'}
          onClose={() => setShowForm(false)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={save} loading={saving}>Salvar</Button>
            </>
          }
        >
          <div className="c-cofrinhos-v2-form">
            <FormField label="Nome do cofrinho *">
              <input type="text" className="c-cofrinhos-v2-input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Reserva de Emergência" autoFocus />
            </FormField>

            <div className="c-cofrinhos-v2-form-grid">
              <FormField label="Onde está guardado">
                <input type="text" className="c-cofrinhos-v2-input" value={form.onde_guardado} onChange={e => set('onde_guardado', e.target.value)} placeholder="Ex: Nubank, XP, Binance" />
              </FormField>
              <SelectField label="Tipo" value={form.tipo} options={TIPOS.map(t => ({ value: t.value, label: t.label }))} onChange={e => set('tipo', e.target.value)} />
            </div>

            <div className="c-cofrinhos-v2-form-grid">
              <FormField label="Valor atual (R$) *">
                <input type="text" className="c-cofrinhos-v2-input" value={form.valor_atual} onChange={e => set('valor_atual', e.target.value)} placeholder="0,00" />
              </FormField>
              <FormField label="Meta (R$) - opcional">
                <input type="text" className="c-cofrinhos-v2-input" value={form.valor_meta} onChange={e => set('valor_meta', e.target.value)} placeholder="0,00" />
              </FormField>
            </div>

            <div className="c-cofrinhos-v2-form-grid">
              <FormField label="Ícone">
                <div className="c-cofrinhos-v2-icon-picker">
                  {ICONES.map(ic => (
                    <button key={ic} type="button" className={form.icone === ic ? 'is-active' : ''} onClick={() => set('icone', ic)}>{ic}</button>
                  ))}
                </div>
              </FormField>
              <FormField label="Cor">
                <div className="c-cofrinhos-v2-color-picker">
                  {CORES.map(cor => (
                    <button key={cor} type="button" className={form.cor === cor ? 'is-active' : ''} style={{ background: cor }} onClick={() => set('cor', cor)} aria-label={`Selecionar cor ${cor}`} />
                  ))}
                </div>
              </FormField>
            </div>

            <FormField label="Observações">
              <textarea className="c-cofrinhos-v2-input c-cofrinhos-v2-textarea" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Ex: CDB com liquidez diária, rendimento 110% CDI..." rows={3} />
            </FormField>
          </div>
        </CofrinhoModal>
      )}

      {detailCofrinho && (() => {
        const c    = detailCofrinho
        const cor  = c.cor || '#10b981'
        const pct  = c.valor_meta > 0 ? Math.min(100, (c.valor_atual / c.valor_meta) * 100) : null
        const tipo = TIPOS.find(t => t.value === c.tipo)
        return (
          <CofrinhoModal title={`${c.icone || '🐷'} ${c.nome}`} description={tipo?.label || 'Cofrinho'} onClose={() => setDetail(null)} size="lg">
            <div className="c-cofrinhos-v2-detail" style={{ '--cofrinho-color': cor }}>
              <section className="c-cofrinhos-v2-detail-hero">
                <span className="c-cofrinhos-v2-detail-hero__icon">{tipoIcon(c.tipo)}</span>
                <div>
                  <strong>{fmtBRL(c.valor_atual)}</strong>
                  <span>{c.onde_guardado ? `${c.onde_guardado} · ${tipo?.label || 'Tipo não informado'}` : tipo?.label || 'Tipo não informado'}</span>
                </div>
              </section>

              {pct !== null && (
                <section className="c-cofrinhos-v2-detail-progress">
                  <ProgressBar pct={pct} color={cor} label={`Progresso de ${c.nome}: ${pct.toFixed(1)}%`} />
                  <div>
                    <strong>{pct.toFixed(1)}% da meta</strong>
                    <span>meta: {fmtBRL(c.valor_meta)}</span>
                  </div>
                </section>
              )}

              {c.observacoes && <p className="c-cofrinhos-v2-detail-notes">{c.observacoes}</p>}

              <div className="c-cofrinhos-v2-detail-actions">
                <Button icon={<Plus size={16} />} onClick={() => setShowAporte(a => !a)}>{showAporte ? 'Cancelar movimentação' : 'Registrar Movimentação'}</Button>
                <Button variant="secondary" icon={<Edit3 size={16} />} onClick={() => openEdit(c)}>Editar</Button>
              </div>

              {showAporte && (
                <SectionCard title="Nova movimentação" description="Use valor negativo para retirada." className="c-cofrinhos-v2-aporte-form">
                  <div className="c-cofrinhos-v2-form">
                    <FormField label="Valor (R$) *">
                      <input type="text" className="c-cofrinhos-v2-input" value={aForm.valor} onChange={e => setAForm(f => ({ ...f, valor: e.target.value }))} placeholder="0,00" autoFocus />
                    </FormField>
                    <FormField label="Data">
                      <input type="date" className="c-cofrinhos-v2-input" value={aForm.data} onChange={e => setAForm(f => ({ ...f, data: e.target.value }))} />
                    </FormField>
                    <FormField label="Observação">
                      <input type="text" className="c-cofrinhos-v2-input" value={aForm.observacao} onChange={e => setAForm(f => ({ ...f, observacao: e.target.value }))} placeholder="Ex: depósito mensal, rendimento de junho..." />
                    </FormField>
                    <Button onClick={saveAporte} loading={saving}>Confirmar</Button>
                  </div>
                </SectionCard>
              )}

              <SectionCard title="Histórico" description="Movimentações cadastradas para este cofrinho." className="c-cofrinhos-v2-history">
                {aLoading ? (
                  <Skeleton variant="text" lines={4} />
                ) : aportes.length === 0 ? (
                  <EmptyState compact icon={<Banknote size={22} />} title="Nenhuma movimentação registrada" description="Os depósitos e retiradas aparecerão aqui." />
                ) : (
                  <div className="c-cofrinhos-v2-history-list">
                    {aportes.map(a => {
                      const isNeg = Number(a.valor) < 0
                      return (
                        <div key={a.id} className="c-cofrinhos-v2-history-row">
                          <span className={isNeg ? 'is-negative' : 'is-positive'}>{isNeg ? <Banknote size={16} /> : <Coins size={16} />}</span>
                          <div>
                            <strong>{isNeg ? '' : '+'}{fmtBRL(a.valor)}</strong>
                            <small>
                              {format(parseISO(a.data), 'dd/MM/yyyy', { locale: ptBR })}
                              {a.observacao && ` · ${a.observacao}`}
                            </small>
                          </div>
                          <IconButton icon={<Trash2 size={16} />} label="Excluir movimentação" variant="danger" size="sm" onClick={() => deleteAporte(a)} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </SectionCard>
            </div>
          </CofrinhoModal>
        )
      })()}
    </div>
  )
}
