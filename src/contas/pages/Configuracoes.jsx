import { useState, useEffect } from 'react'
import {
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Layers3,
  Pause,
  Pencil,
  Play,
  Plus,
  Save,
  Settings,
  Tag,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import {
  Button,
  EmptyState,
  FormField,
  IconButton,
  MetricCard,
  PageHeader,
  SectionCard,
  Skeleton,
  StatusBadge,
} from '../components/ui'

const fmt = v => Number(v)?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'
const COLORS = ['#6366f1','#EC4899','#F97316','#10b981','#EAB308','#DC2626','#2563EB','#8B5CF6','#14B8A6','#059669','#00B4D8','#F43F5E','#64748b']
const ICONS  = ['🍽️','🛒','⛽','💊','🏠','🚗','🎬','📱','👕','📚','💳','💸','📦','✈️','🐾','🎮','🏋️','💇','🎁','🔧']
const CARD_COLORS = ['#6366f1','#EC4899','#F97316','#10b981','#EAB308','#DC2626','#2563EB','#8B5CF6','#14B8A6','#059669','#00B4D8','#F43F5E']

const tabs = [
  { key: 'perfil', label: 'Perfil', icon: User },
  { key: 'pessoas', label: 'Pessoas', icon: Users },
  { key: 'cartoes', label: 'Cartões', icon: CreditCard },
  { key: 'categorias', label: 'Categorias', icon: Tag },
  { key: 'entradas', label: 'Entradas', icon: Banknote },
]

export default function Configuracoes() {
  const [tab, setTab] = useState('perfil')
  const activeTab = tabs.find(t => t.key === tab)

  return (
    <div className="c-config-v2-page">
      <PageHeader
        eyebrow="Sistema"
        title="Configurações"
        description="Gerencie perfil, pessoas, cartões, categorias e entradas auxiliares."
        meta={<StatusBadge tone="accent" icon={<Settings size={14} />}>{activeTab?.label}</StatusBadge>}
      />

      <nav className="c-config-v2-tabs" aria-label="Seções de configurações">
        {tabs.map(item => {
          const Icon = item.icon
          return (
            <button key={item.key} type="button" className={tab === item.key ? 'is-active' : ''} onClick={() => setTab(item.key)}>
              <Icon size={16} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {tab === 'perfil'     && <PerfilTab />}
      {tab === 'pessoas'    && <PessoasTab />}
      {tab === 'cartoes'    && <CartoesTab />}
      {tab === 'categorias' && <CategoriasTab />}
      {tab === 'entradas'   && <EntradasTab />}
    </div>
  )
}

function PerfilTab() {
  const [email, setEmail]       = useState('')
  const [fullName, setFullName] = useState('')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || '')
        setFullName(user.user_metadata?.full_name || '')
      }
    })
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ data: { full_name: fullName.trim() } })
    setSaving(false)
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  return (
    <SectionCard
      title="Dados da conta"
      description="Essas informações aparecem dentro do módulo Contas."
      padding="lg"
      className="c-config-v2-section c-config-v2-profile"
    >
      <form onSubmit={handleSave} className="c-config-v2-form">
        <FormField label="E-mail">
          <input type="email" className="c-v2-select-field" value={email} readOnly />
        </FormField>
        <FormField label="Nome de exibição" help='Este nome aparece no "Bom dia" da página Meu Dia.'>
          <input
            type="text"
            className="c-v2-select-field"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Ex: Bruno"
            maxLength={60}
          />
        </FormField>
        <div className="c-config-v2-actions">
          <Button type="submit" icon={<Save size={16} />} loading={saving} disabled={saving}>Salvar nome</Button>
          {saved && <StatusBadge tone="success" icon={<CheckCircle2 size={14} />}>Salvo</StatusBadge>}
        </div>
      </form>
    </SectionCard>
  )
}

function CardForm({ initial, onSave, onCancel }) {
  const [name, setName]       = useState(initial?.name || '')
  const [color, setColor]     = useState(initial?.color || CARD_COLORS[0])
  const [limit, setLimit]     = useState(initial?.limit_amount ? String(initial.limit_amount).replace('.', ',') : '')
  const [closing, setClosing] = useState(initial?.closing_day || '')
  const [due, setDue]         = useState(initial?.due_day || '')
  const [saving, setSaving]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true)
    const payload = { name, color, limit_amount: limit ? parseFloat(limit.replace(',', '.')) : null, closing_day: closing || null, due_day: due || null }
    if (initial?.id) await supabase.from('cards').update(payload).eq('id', initial.id)
    else             await supabase.from('cards').insert(payload)
    setSaving(false); onSave()
  }

  return (
    <form onSubmit={handleSubmit} className="c-config-v2-form">
      <FormField label="Nome do cartão">
        <input type="text" className="c-v2-select-field" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Nubank Bruno" />
      </FormField>
      <div className="c-config-v2-grid">
        <FormField label="Limite (R$)">
          <input type="text" className="c-v2-select-field" value={limit} onChange={e => setLimit(e.target.value)} placeholder="0,00" />
        </FormField>
        <ColorPicker label="Cor" colors={CARD_COLORS} value={color} onChange={setColor} />
      </div>
      <div className="c-config-v2-grid">
        <FormField label="Dia de fechamento">
          <input type="number" className="c-v2-select-field" value={closing} onChange={e => setClosing(e.target.value)} placeholder="Ex: 11" min={1} max={31} />
        </FormField>
        <FormField label="Dia de vencimento">
          <input type="number" className="c-v2-select-field" value={due} onChange={e => setDue(e.target.value)} placeholder="Ex: 18" min={1} max={31} />
        </FormField>
      </div>
      <div className="c-config-v2-actions">
        <Button type="submit" loading={saving} disabled={saving}>Salvar</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

function CartoesTab() {
  const [cards, setCards]     = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding]   = useState(false)
  const [editing, setEditing] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('cards').select('*').order('name')
    setCards(data || []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function toggleActive(card) { await supabase.from('cards').update({ is_active: !card.is_active }).eq('id', card.id); load() }
  async function handleDelete(id) { if (!confirm('Excluir este cartão? Lançamentos vinculados perderão a referência.')) return; await supabase.from('cards').delete().eq('id', id); load() }

  return (
    <div className="c-config-v2-stack">
      <div className="c-config-v2-metrics">
        <MetricCard label="Cartões" value={cards.length} icon={<CreditCard size={18} />} description="Registros cadastrados" />
        <MetricCard label="Ativos" value={cards.filter(c => c.is_active).length} tone="success" icon={<Play size={18} />} description="Disponíveis para uso" />
        <MetricCard label="Inativos" value={cards.filter(c => !c.is_active).length} tone="warning" icon={<Pause size={18} />} description="Ocultos nos fluxos" />
      </div>

      {!adding && <Button icon={<Plus size={16} />} onClick={() => setAdding(true)}>Novo Cartão</Button>}
      {adding && (
        <SectionCard title="Novo Cartão" description="Defina cor, limite e datas do cartão." padding="lg">
          <CardForm onSave={() => { setAdding(false); load() }} onCancel={() => setAdding(false)} />
        </SectionCard>
      )}

      <SectionCard title="Cartões cadastrados" description="Edite, ative ou desative cartões usados nos lançamentos." padding="lg">
        {loading ? (
          <Skeleton variant="text" lines={5} />
        ) : cards.length === 0 ? (
          <EmptyState compact icon={<CreditCard size={22} />} title="Nenhum cartão cadastrado" description="Adicione um cartão para usar nos lançamentos." />
        ) : (
          <div className="c-config-v2-list">
            {cards.map(c => (
              <article key={c.id} className={`c-config-v2-item ${!c.is_active ? 'is-muted' : ''}`}>
                {editing === c.id ? (
                  <CardForm initial={c} onSave={() => { setEditing(null); load() }} onCancel={() => setEditing(null)} />
                ) : (
                  <>
                    <span className="c-config-v2-avatar" style={{ '--item-color': c.color }}><CreditCard size={18} /></span>
                    <div className="c-config-v2-item-main">
                      <strong>{c.name}</strong>
                      <span>
                        {c.limit_amount && <>Limite: {fmt(c.limit_amount)} · </>}
                        {c.closing_day && <>Fecha dia {c.closing_day} · </>}
                        {c.due_day && <>Vence dia {c.due_day}</>}
                      </span>
                    </div>
                    <div className="c-config-v2-item-actions">
                      {!c.is_active && <StatusBadge tone="warning">Inativo</StatusBadge>}
                      <IconButton icon={<Pencil size={15} />} label="Editar cartão" variant="secondary" size="sm" onClick={() => setEditing(c.id)} />
                      <IconButton icon={c.is_active ? <Pause size={15} /> : <Play size={15} />} label={c.is_active ? 'Desativar' : 'Ativar'} variant="secondary" size="sm" onClick={() => toggleActive(c)} />
                      <IconButton icon={<Trash2 size={15} />} label="Excluir cartão" variant="danger" size="sm" onClick={() => handleDelete(c.id)} />
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

function PessoasTab() {
  const [people, setPeople] = useState([])
  const [name, setName]     = useState('')
  const [color, setColor]   = useState(COLORS[0])
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() { const { data } = await supabase.from('people').select('*').order('name'); setPeople(data || []) }
  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault(); setSaving(true)
    await supabase.from('people').insert({ name, color })
    setName(''); setColor(COLORS[0]); setAdding(false); setSaving(false); load()
  }

  async function toggleActive(p) { await supabase.from('people').update({ is_active: !p.is_active }).eq('id', p.id); load() }
  async function handleDelete(id) { if (!confirm('Excluir esta pessoa?')) return; await supabase.from('people').delete().eq('id', id); load() }

  return (
    <div className="c-config-v2-stack">
      {!adding && <Button icon={<Plus size={16} />} onClick={() => setAdding(true)}>Nova Pessoa</Button>}
      {adding && (
        <SectionCard title="Nova Pessoa" description="Cadastre uma pessoa para rateios e análises." padding="lg">
          <form onSubmit={handleAdd} className="c-config-v2-form">
            <FormField label="Nome">
              <input type="text" className="c-v2-select-field" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Ivan" />
            </FormField>
            <ColorPicker label="Cor" colors={COLORS} value={color} onChange={setColor} />
            <div className="c-config-v2-actions">
              <Button type="submit" loading={saving} disabled={saving}>Salvar</Button>
              <Button type="button" variant="secondary" onClick={() => setAdding(false)}>Cancelar</Button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard title="Pessoas cadastradas" description="Controle quem participa dos rateios." padding="lg">
        {people.length === 0 ? (
          <EmptyState compact icon={<Users size={22} />} title="Nenhuma pessoa cadastrada" description="Adicione pessoas para usar nos splits." />
        ) : (
          <div className="c-config-v2-list">
            {people.map(p => (
              <article key={p.id} className={`c-config-v2-item ${!p.is_active ? 'is-muted' : ''}`}>
                <span className="c-config-v2-dot" style={{ background: p.color }} />
                <div className="c-config-v2-item-main"><strong>{p.name}</strong></div>
                <div className="c-config-v2-item-actions">
                  {!p.is_active && <StatusBadge tone="warning">Inativo</StatusBadge>}
                  <IconButton icon={p.is_active ? <Pause size={15} /> : <Play size={15} />} label={p.is_active ? 'Desativar pessoa' : 'Ativar pessoa'} variant="secondary" size="sm" onClick={() => toggleActive(p)} />
                  <IconButton icon={<Trash2 size={15} />} label="Excluir pessoa" variant="danger" size="sm" onClick={() => handleDelete(p.id)} />
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

function CategoriasTab() {
  const [cats, setCats]   = useState([])
  const [name, setName]   = useState('')
  const [icon, setIcon]   = useState(ICONS[0])
  const [color, setColor] = useState(COLORS[0])
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() { const { data } = await supabase.from('categories').select('*').order('name'); setCats(data || []) }
  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault(); setSaving(true)
    await supabase.from('categories').insert({ name, icon, color })
    setName(''); setIcon(ICONS[0]); setColor(COLORS[0]); setAdding(false); setSaving(false); load()
  }

  async function handleDelete(id) { if (!confirm('Excluir esta categoria?')) return; await supabase.from('categories').delete().eq('id', id); load() }

  return (
    <div className="c-config-v2-stack">
      {!adding && <Button icon={<Plus size={16} />} onClick={() => setAdding(true)}>Nova Categoria</Button>}
      {adding && (
        <SectionCard title="Nova Categoria" description="Preserve ícone e cor usados nos relatórios." padding="lg">
          <form onSubmit={handleAdd} className="c-config-v2-form">
            <div className="c-config-v2-grid">
              <FormField label="Nome">
                <input type="text" className="c-v2-select-field" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Academia" />
              </FormField>
              <IconPicker value={icon} onChange={setIcon} />
            </div>
            <ColorPicker label="Cor" colors={COLORS} value={color} onChange={setColor} />
            <div className="c-config-v2-actions">
              <Button type="submit" loading={saving} disabled={saving}>Salvar</Button>
              <Button type="button" variant="secondary" onClick={() => setAdding(false)}>Cancelar</Button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard title="Categorias cadastradas" description="Categorias disponíveis nos lançamentos." padding="lg">
        {cats.length === 0 ? (
          <EmptyState compact icon={<Tag size={22} />} title="Nenhuma categoria cadastrada" description="Adicione categorias para organizar despesas." />
        ) : (
          <div className="c-config-v2-category-grid">
            {cats.map(c => (
              <article key={c.id} className="c-config-v2-category">
                <span className="c-config-v2-category-icon">{c.icon}</span>
                <strong>{c.name}</strong>
                <span className="c-config-v2-dot" style={{ background: c.color }} />
                <IconButton icon={<Trash2 size={15} />} label="Excluir categoria" variant="danger" size="sm" onClick={() => handleDelete(c.id)} />
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

function EntradasTab() {
  const [income, setIncome] = useState([])
  const [desc, setDesc]     = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate]     = useState(format(new Date(), 'yyyy-MM-dd'))
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [monthRef, setMonthRef] = useState(format(new Date(), 'yyyy-MM'))

  async function load() { const { data } = await supabase.from('income').select('*').eq('month_ref', monthRef).order('date', { ascending: false }); setIncome(data || []) }
  useEffect(() => { load() }, [monthRef])

  async function handleAdd(e) {
    e.preventDefault(); setSaving(true)
    const mRef = date.slice(0, 7)
    await supabase.from('income').insert({ description: desc, amount: parseFloat(amount.replace(',', '.')), date, month_ref: mRef })
    setDesc(''); setAmount(''); setAdding(false); setSaving(false); setMonthRef(mRef); load()
  }

  async function handleDelete(id) { if (!confirm('Excluir esta entrada?')) return; await supabase.from('income').delete().eq('id', id); load() }

  const total = income.reduce((s, r) => s + Number(r.amount), 0)

  return (
    <div className="c-config-v2-stack">
      <div className="c-config-v2-metrics">
        <MetricCard label="Total do mês" value={fmt(total)} tone="success" icon={<CircleDollarSign size={18} />} />
        <MetricCard label="Entradas" value={income.length} icon={<Banknote size={18} />} description={monthRef} />
      </div>

      <SectionCard
        title="Entradas auxiliares"
        description="Cadastro simples preservado para ajustes rápidos."
        padding="lg"
        actions={
          <div className="c-config-v2-income-actions">
            {!adding && <Button icon={<Plus size={16} />} onClick={() => setAdding(true)}>Nova Entrada</Button>}
            <FormField label="Mês">
              <input type="month" className="c-v2-select-field" value={monthRef} onChange={e => setMonthRef(e.target.value)} />
            </FormField>
          </div>
        }
      >
        {adding && (
          <form onSubmit={handleAdd} className="c-config-v2-form c-config-v2-income-form">
            <div className="c-config-v2-grid">
              <FormField label="Descrição">
                <input type="text" className="c-v2-select-field" value={desc} onChange={e => setDesc(e.target.value)} required placeholder="Ex: Salário Scale" />
              </FormField>
              <FormField label="Valor (R$)">
                <input type="text" className="c-v2-select-field" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="3.346,60" />
              </FormField>
            </div>
            <FormField label="Data">
              <input type="date" className="c-v2-select-field" value={date} onChange={e => setDate(e.target.value)} required />
            </FormField>
            <div className="c-config-v2-actions">
              <Button type="submit" loading={saving} disabled={saving}>Salvar</Button>
              <Button type="button" variant="secondary" onClick={() => setAdding(false)}>Cancelar</Button>
            </div>
          </form>
        )}

        {income.length === 0 ? (
          <EmptyState compact icon={<Banknote size={22} />} title="Nenhuma entrada neste mês" description="As entradas cadastradas para o mês selecionado aparecerão aqui." />
        ) : (
          <div className="c-config-v2-list">
            {income.map(r => (
              <article key={r.id} className="c-config-v2-item">
                <span className="c-config-v2-avatar is-success"><Banknote size={18} /></span>
                <div className="c-config-v2-item-main">
                  <strong>{r.description}</strong>
                  <span>{format(new Date(r.date + 'T12:00:00'), 'dd/MM/yyyy')}</span>
                </div>
                <div className="c-config-v2-item-actions">
                  <strong className="c-config-v2-money">{fmt(r.amount)}</strong>
                  <IconButton icon={<Trash2 size={15} />} label="Excluir entrada" variant="danger" size="sm" onClick={() => handleDelete(r.id)} />
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

function ColorPicker({ label, colors, value, onChange }) {
  return (
    <div className="c-v2-form-field">
      <span className="c-v2-form-field__label">{label}</span>
      <div className="c-config-v2-colors">
        {colors.map(c => (
          <button
            key={c}
            type="button"
            className={value === c ? 'is-active' : ''}
            style={{ background: c }}
            onClick={() => onChange(c)}
            aria-label={`Selecionar cor ${c}`}
            aria-pressed={value === c}
          />
        ))}
      </div>
    </div>
  )
}

function IconPicker({ value, onChange }) {
  return (
    <div className="c-v2-form-field">
      <span className="c-v2-form-field__label">Ícone</span>
      <div className="c-config-v2-icons">
        {ICONS.map(i => (
          <button key={i} type="button" className={value === i ? 'is-active' : ''} onClick={() => onChange(i)} aria-label={`Selecionar ícone ${i}`} aria-pressed={value === i}>
            {i}
          </button>
        ))}
      </div>
    </div>
  )
}
