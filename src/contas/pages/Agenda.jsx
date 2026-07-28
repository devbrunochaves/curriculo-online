import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, addDays, parseISO, differenceInDays,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Filter, Plus, Sun } from 'lucide-react'
import {
  Button,
  MetricCard,
  PageHeader,
  SectionCard,
  SelectField,
  Skeleton,
} from '../components/ui'

/* ── Constantes ─────────────────────────────────────────────────── */
const CATEGORIAS = [
  { key: 'medico',      icon: '🏥', label: 'Médico',      color: '#ef4444' },
  { key: 'viagem',      icon: '✈️',  label: 'Viagem',      color: '#3b82f6' },
  { key: 'aniversario', icon: '🎂', label: 'Aniversário', color: '#f59e0b' },
  { key: 'trabalho',    icon: '💼', label: 'Trabalho',    color: '#6366f1' },
  { key: 'casa',        icon: '🏠', label: 'Casa',        color: '#10b981' },
  { key: 'financeiro',  icon: '💳', label: 'Financeiro',  color: '#8b5cf6' },
  { key: 'estudos',     icon: '📚', label: 'Estudos',     color: '#06b6d4' },
  { key: 'veiculo',     icon: '🚗', label: 'Veículo',     color: '#f97316' },
  { key: 'familia',     icon: '👶', label: 'Família',     color: '#ec4899' },
  { key: 'outros',      icon: '📌', label: 'Outros',      color: '#64748b' },
]

const LEMBRETES = [
  { key: 'no_horario', label: 'No horário' },
  { key: '15min',      label: '15 min antes' },
  { key: '30min',      label: '30 min antes' },
  { key: '1h',         label: '1 hora antes' },
  { key: '3h',         label: '3 horas antes' },
  { key: '1dia',       label: '1 dia antes' },
  { key: '3dias',      label: '3 dias antes' },
  { key: '7dias',      label: '7 dias antes' },
]

const RECORRENCIAS = [
  { key: 'nenhuma',   label: 'Não repetir' },
  { key: 'diaria',    label: 'Diário' },
  { key: 'semanal',   label: 'Semanal' },
  { key: 'quinzenal', label: 'Quinzenal' },
  { key: 'mensal',    label: 'Mensal' },
  { key: 'anual',     label: 'Anual' },
]

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/* ── Helpers ────────────────────────────────────────────────────── */
const fmtDate    = d => format(d, 'yyyy-MM-dd')
const fmtDisplay = s => format(parseISO(s), "dd 'de' MMMM", { locale: ptBR })
const getCat     = key => CATEGORIAS.find(c => c.key === key) ?? CATEGORIAS.at(-1)

/* ══ Modal: formulário de evento ═══════════════════════════════════ */
function EventFormModal({ event, defaultDate, onSave, onClose }) {
  const isEdit = !!event?.id

  const [form, setForm] = useState({
    titulo:      event?.titulo         ?? '',
    descricao:   event?.descricao      ?? '',
    categoria:   event?.categoria      ?? 'outros',
    data_inicio: event?.data_inicio    ?? (defaultDate ? fmtDate(defaultDate) : fmtDate(new Date())),
    data_fim:    event?.data_fim       ?? '',
    hora_inicio: event?.hora_inicio?.slice(0,5) ?? '',
    hora_fim:    event?.hora_fim?.slice(0,5)    ?? '',
    local:       event?.local          ?? '',
    dia_inteiro: event?.dia_inteiro    ?? true,
    recorrencia: event?.recorrencia    ?? 'nenhuma',
    lembrete:    event?.lembrete       ?? '',
    notas:       event?.notas          ?? '',
    status:      event?.status         ?? 'ativo',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const cat = getCat(form.categoria)

  useEffect(() => {
    const onKey = ev => { if (ev.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSave(e) {
    e.preventDefault()
    if (!form.titulo.trim()) { setError('Título é obrigatório'); return }
    setSaving(true); setError('')

    const payload = {
      ...form,
      titulo:      form.titulo.trim(),
      hora_inicio: form.dia_inteiro ? null : form.hora_inicio || null,
      hora_fim:    form.dia_inteiro ? null : form.hora_fim    || null,
      data_fim:    form.data_fim    || null,
      lembrete:    form.lembrete    || null,
      descricao:   form.descricao   || null,
      local:       form.local       || null,
      notas:       form.notas       || null,
    }

    const { error: err } = isEdit
      ? await supabase.from('agenda_eventos').update({ ...payload, updated_at: new Date() }).eq('id', event.id)
      : await supabase.from('agenda_eventos').insert(payload)

    if (err) { setError(err.message); setSaving(false); return }
    onSave()
  }

  return (
    <div className="c-modal-overlay" onClick={onClose}>
      <div className="c-modal-sheet" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--c-border)' }} />
        </div>

        <div style={{ padding: '8px 20px 14px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{isEdit ? 'Editar Evento' : 'Novo Evento'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--c-text-muted)', lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '65vh', overflowY: 'auto', overflowX: 'hidden' }}>

            {/* Título */}
            <div>
              <label className="c-form-label">Título *</label>
              <input className="c-form-input" placeholder="Nome do evento" value={form.titulo}
                onChange={e => set('titulo', e.target.value)} autoFocus />
            </div>

            {/* Categoria */}
            <div>
              <label className="c-form-label">Categoria</label>
              <select className="c-form-select" value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                {CATEGORIAS.map(c => (
                  <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
                ))}
              </select>
            </div>

            {/* Dia inteiro — primeiro */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              <input type="checkbox" checked={form.dia_inteiro} onChange={e => set('dia_inteiro', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--c-accent)', flexShrink: 0 }} />
              Evento de dia inteiro
            </label>

            {/* Data início — sempre visível */}
            <div>
              <label className="c-form-label">Data início *</label>
              <input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)}
                style={{ display:'block', width:'100%', boxSizing:'border-box', padding:'9px 12px', border:'1.5px solid var(--c-border)', borderRadius:8, fontSize:16, color:'var(--c-text)', background:'var(--c-surface)', fontFamily:'inherit' }} />
            </div>

            {/* Data fim + Horários — só se não for dia inteiro */}
            {!form.dia_inteiro && (
              <>
                <div>
                  <label className="c-form-label">Data fim</label>
                  <input type="date" value={form.data_fim} min={form.data_inicio} onChange={e => set('data_fim', e.target.value)}
                    style={{ display:'block', width:'100%', boxSizing:'border-box', padding:'9px 12px', border:'1.5px solid var(--c-border)', borderRadius:8, fontSize:16, color:'var(--c-text)', background:'var(--c-surface)', fontFamily:'inherit' }} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label className="c-form-label">Hora início</label>
                    <input type="time" value={form.hora_inicio} onChange={e => set('hora_inicio', e.target.value)}
                      style={{ display:'block', width:'100%', boxSizing:'border-box', padding:'9px 12px', border:'1.5px solid var(--c-border)', borderRadius:8, fontSize:16, color:'var(--c-text)', background:'var(--c-surface)', fontFamily:'inherit' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="c-form-label">Hora fim</label>
                    <input type="time" value={form.hora_fim} onChange={e => set('hora_fim', e.target.value)}
                      style={{ display:'block', width:'100%', boxSizing:'border-box', padding:'9px 12px', border:'1.5px solid var(--c-border)', borderRadius:8, fontSize:16, color:'var(--c-text)', background:'var(--c-surface)', fontFamily:'inherit' }} />
                  </div>
                </div>
              </>
            )}

            {/* Local */}
            <div>
              <label className="c-form-label">Local</label>
              <input className="c-form-input" placeholder="Endereço ou nome do local" value={form.local} onChange={e => set('local', e.target.value)} />
            </div>

            {/* Recorrência + Lembrete */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="c-form-label">Recorrência</label>
                <select className="c-form-select" value={form.recorrencia} onChange={e => set('recorrencia', e.target.value)}>
                  {RECORRENCIAS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="c-form-label">Lembrete</label>
                <select className="c-form-select" value={form.lembrete} onChange={e => set('lembrete', e.target.value)}>
                  <option value="">Sem lembrete</option>
                  {LEMBRETES.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
                </select>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="c-form-label">Descrição</label>
              <textarea className="c-form-textarea" placeholder="Detalhes do evento..." rows={2}
                value={form.descricao} onChange={e => set('descricao', e.target.value)} />
            </div>

            {/* Observações */}
            <div>
              <label className="c-form-label">Observações</label>
              <textarea className="c-form-textarea" placeholder="Observações adicionais..." rows={2}
                value={form.notas} onChange={e => set('notas', e.target.value)} />
            </div>

            {/* Status (edit only) */}
            {isEdit && (
              <div>
                <label className="c-form-label">Status</label>
                <select className="c-form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="ativo">Ativo</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            )}

            {error && <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 500 }}>⚠️ {error}</div>}
          </div>

          <div style={{ padding: '12px 20px 24px', borderTop: '1px solid var(--c-border)', display: 'flex', gap: 10 }}>
            <button type="button" className="c-btn c-btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="c-btn c-btn-primary" style={{ flex: 2, background: cat.color, borderColor: cat.color }} disabled={saving}>
              {saving ? 'Salvando...' : isEdit ? 'Salvar' : `${cat.icon} Criar evento`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ══ Modal: detalhe do evento ═══════════════════════════════════════ */
function EventDetailModal({ event: e, onEdit, onDelete, onClose, deleting }) {
  const cat         = getCat(e.categoria)
  const lembrete    = LEMBRETES.find(l => l.key === e.lembrete)
  const recorrencia = RECORRENCIAS.find(r => r.key === e.recorrencia)

  useEffect(() => {
    const onKey = ev => { if (ev.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="c-modal-overlay" onClick={onClose}>
      <div className="c-modal-sheet" style={{ maxWidth: 560 }} onClick={ev => ev.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--c-border)' }} />
        </div>

        {/* Cabeçalho */}
        <div style={{ padding: '8px 20px 16px', borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: cat.color + '20', border: `2px solid ${cat.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>
              {cat.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--c-text)', lineHeight: 1.2 }}>{e.titulo}</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, background: cat.color + '15', padding: '2px 8px', borderRadius: 99 }}>
                {cat.label}
              </span>
              {e.status !== 'ativo' && (
                <span style={{
                  marginLeft: 6, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  background: e.status === 'concluido' ? '#dcfce7' : '#fef2f2',
                  color:      e.status === 'concluido' ? '#15803d' : '#dc2626',
                }}>
                  {e.status === 'concluido' ? '✅ Concluído' : '❌ Cancelado'}
                </span>
              )}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--c-text-muted)', padding: '4px', flexShrink: 0, lineHeight: 1 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Data */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px', borderRadius: 10, background: cat.color + '0d', border: `1px solid ${cat.color}20` }}>
            <span style={{ fontSize: 20 }}>📅</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {fmtDisplay(e.data_inicio)}
                {e.data_fim && e.data_fim !== e.data_inicio && ` → ${fmtDisplay(e.data_fim)}`}
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 1 }}>
                {e.dia_inteiro
                  ? 'Dia inteiro'
                  : `${e.hora_inicio?.slice(0,5) ?? ''}${e.hora_fim ? ` → ${e.hora_fim.slice(0,5)}` : ''}`}
              </div>
            </div>
          </div>

          {e.local && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>📍</span>
              <span style={{ fontSize: 13, color: 'var(--c-text)' }}>{e.local}</span>
            </div>
          )}

          {recorrencia && e.recorrencia !== 'nenhuma' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>🔁</span>
              <span style={{ fontSize: 13, color: 'var(--c-text)' }}>{recorrencia.label}</span>
            </div>
          )}

          {lembrete && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>🔔</span>
              <span style={{ fontSize: 13, color: 'var(--c-text)' }}>{lembrete.label}</span>
            </div>
          )}

          {e.descricao && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>Descrição</div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--c-text)', lineHeight: 1.5, background: 'var(--c-surface2)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--c-border)' }}>
                {e.descricao}
              </p>
            </div>
          )}

          {e.notas && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>Observações</div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--c-text)', lineHeight: 1.5, background: 'var(--c-surface2)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--c-border)' }}>
                {e.notas}
              </p>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px 24px', borderTop: '1px solid var(--c-border)', display: 'flex', gap: 10 }}>
          <button className="c-btn c-btn-secondary" style={{ flex: 1 }} onClick={() => { onClose(); onEdit(e) }}>✏️ Editar</button>
          <button className="c-btn c-btn-danger" style={{ flex: 1 }} onClick={() => onDelete(e.id)} disabled={deleting === e.id}>
            {deleting === e.id ? 'Excluindo...' : '🗑️ Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══ EventCard ══════════════════════════════════════════════════════ */
function EventCard({ event: e, onClick }) {
  const cat = getCat(e.categoria)

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
        background: 'var(--c-surface)',
        border: `1.5px solid ${cat.color}25`,
        borderLeft: `4px solid ${cat.color}`,
        transition: 'box-shadow .15s',
        opacity: e.status === 'cancelado' ? 0.5 : 1,
      }}
      onMouseEnter={ev => ev.currentTarget.style.boxShadow = `0 2px 12px ${cat.color}20`}
      onMouseLeave={ev => ev.currentTarget.style.boxShadow = 'none'}
    >
      <span style={{ fontSize: 20, lineHeight: 1, marginTop: 1, flexShrink: 0 }}>{cat.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--c-text)', marginBottom: 2, textDecoration: e.status === 'concluido' ? 'line-through' : 'none' }}>
          {e.titulo}
        </div>
        <div style={{ fontSize: 12, color: 'var(--c-text-muted)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {e.dia_inteiro
            ? 'Dia inteiro'
            : e.hora_inicio ? `${e.hora_inicio.slice(0,5)}${e.hora_fim ? ` → ${e.hora_fim.slice(0,5)}` : ''}` : ''}
          {e.local && <span>📍 {e.local}</span>}
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, background: cat.color + '15', padding: '2px 8px', borderRadius: 99, flexShrink: 0 }}>
        {cat.label}
      </span>
    </div>
  )
}

/* ══ Visualização: Calendário ═══════════════════════════════════════ */
function CalendarioView({ currentDate, setCurrentDate, eventsByDay, onDayClick, selectedDay }) {
  const calDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
    const end   = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const selectedDayStr    = selectedDay ? fmtDate(selectedDay) : null
  const selectedDayEvents = selectedDayStr ? (eventsByDay[selectedDayStr] || []) : []

  return (
    <div>
      {/* Nav mês */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => setCurrentDate(d => subMonths(d, 1))}>‹</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 16, textTransform: 'capitalize' }}>
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
          {!isSameDay(startOfMonth(currentDate), startOfMonth(new Date())) && (
            <button className="c-btn c-btn-secondary c-btn-sm" style={{ fontSize: 11 }} onClick={() => setCurrentDate(new Date())}>
              Hoje
            </button>
          )}
        </div>
        <button className="c-btn c-btn-secondary c-btn-sm" onClick={() => setCurrentDate(d => addMonths(d, 1))}>›</button>
      </div>

      {/* Grid */}
      <div className="c-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Cabeçalho semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--c-surface2)', borderBottom: '1px solid var(--c-border)' }}>
          {DIAS.map(d => (
            <div key={d} style={{ textAlign: 'center', padding: '8px 2px', fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Dias */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {calDays.map((day, idx) => {
            const dayStr      = fmtDate(day)
            const dayEvents   = eventsByDay[dayStr] || []
            const inMonth     = isSameMonth(day, currentDate)
            const todayDay    = isToday(day)
            const isSelected  = selectedDay && isSameDay(day, selectedDay)
            const borderRight = (idx + 1) % 7 !== 0 ? '1px solid var(--c-border)' : 'none'

            return (
              <div
                key={idx}
                onClick={() => onDayClick(isSelected ? null : day)}
                style={{
                  minHeight: 60, padding: '6px 4px 4px', cursor: 'pointer',
                  borderBottom: '1px solid var(--c-border)', borderRight,
                  background: isSelected ? '#ede9fe' : todayDay ? '#fef3c7' : 'transparent',
                  transition: 'background .1s',
                }}
                onMouseEnter={ev => { if (!isSelected) ev.currentTarget.style.background = 'var(--c-surface2)' }}
                onMouseLeave={ev => { if (!isSelected) ev.currentTarget.style.background = isSelected ? '#ede9fe' : todayDay ? '#fef3c7' : 'transparent' }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', margin: '0 auto 4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12.5,
                  fontWeight: todayDay || isSelected ? 800 : inMonth ? 500 : 400,
                  color: isSelected ? '#6366f1' : todayDay ? '#d97706' : inMonth ? 'var(--c-text)' : '#cbd5e1',
                  background: todayDay ? '#fde68a' : 'transparent',
                }}>
                  {format(day, 'd')}
                </div>
                {/* Pontos */}
                <div style={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: getCat(ev.categoria).color }} />
                  ))}
                  {dayEvents.length > 3 && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8' }} />}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Painel do dia selecionado */}
      {selectedDay && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, textTransform: 'capitalize' }}>
            {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h3>
          {selectedDayEvents.length === 0 ? (
            <div className="c-card">
              <div className="c-empty-state" style={{ padding: 24 }}>
                <div className="c-empty-icon">📅</div>
                <h3>Nenhum evento</h3>
                <p>Clique em "+ Evento" para adicionar.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedDayEvents.map(ev => (
                <EventCard key={ev.id} event={ev} onClick={() => {}} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ══ Visualização: Lista ════════════════════════════════════════════ */
function ListaView({ events, onClick }) {
  const groups = useMemo(() => {
    const todayStr    = fmtDate(new Date())
    const tomorrowStr = fmtDate(addDays(new Date(), 1))
    const weekStr     = fmtDate(addDays(new Date(), 7))
    const monthStr    = fmtDate(addDays(new Date(), 30))

    return [
      { label: '☀️ Hoje',         items: events.filter(e => e.data_inicio === todayStr) },
      { label: '📅 Amanhã',       items: events.filter(e => e.data_inicio === tomorrowStr) },
      { label: '📆 Esta semana',  items: events.filter(e => e.data_inicio > tomorrowStr && e.data_inicio <= weekStr) },
      { label: '📋 Este mês',     items: events.filter(e => e.data_inicio > weekStr && e.data_inicio <= monthStr) },
      { label: '⏭ Mais tarde',    items: events.filter(e => e.data_inicio > monthStr) },
    ].filter(g => g.items.length > 0)
  }, [events])

  if (groups.length === 0) return (
    <div className="c-card">
      <div className="c-empty-state">
        <div className="c-empty-icon">📅</div>
        <h3>Nenhum evento encontrado</h3>
        <p>Use o botão "+ Evento" para adicionar.</p>
      </div>
    </div>
  )

  return (
    <div>
      {groups.map(g => (
        <div key={g.label} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
            {g.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {g.items.map(ev => <EventCard key={ev.id} event={ev} onClick={() => onClick(ev)} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ══ Visualização: Meu Dia ══════════════════════════════════════════ */
function MeuDiaView({ events, onClick }) {
  const h        = new Date().getHours()
  const greeting = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
  const todayStr = fmtDate(new Date())

  const hoje     = events.filter(e => e.data_inicio === todayStr)
  const prox7    = events.filter(e => { const d = differenceInDays(parseISO(e.data_inicio), new Date()); return d > 0 && d <= 7 })
  const aniversarios = events.filter(e => {
    if (e.categoria !== 'aniversario') return false
    const d = differenceInDays(parseISO(e.data_inicio), new Date())
    return d >= 0 && d <= 30
  })

  return (
    <div>
      {/* Saudação */}
      <div style={{ marginBottom: 20, padding: '20px 24px', borderRadius: 14, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff' }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>{greeting}! 👋</div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4, textTransform: 'capitalize' }}>
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>
      </div>

      {/* Cards resumo */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        {[
          { icon: '📅', label: 'Hoje',       value: hoje.length,         color: '#6366f1' },
          { icon: '📆', label: 'Próx. 7 dias', value: prox7.length,      color: '#10b981' },
          { icon: '🎂', label: 'Aniversários', value: aniversarios.length, color: '#f59e0b' },
        ].map(c => (
          <div key={c.label} style={{ flex: '1 1 120px', padding: '14px 18px', borderRadius: 12, background: c.color + '12', border: `1.5px solid ${c.color}25` }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: c.color, letterSpacing: '-0.5px' }}>{c.value}</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Hoje */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>📅 Compromissos de hoje</div>
        {hoje.length === 0 ? (
          <div className="c-card" style={{ textAlign: 'center', padding: 20, color: 'var(--c-text-muted)', fontSize: 13 }}>
            Nenhum compromisso hoje. Aproveite! 🎉
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hoje.map(ev => <EventCard key={ev.id} event={ev} onClick={() => onClick(ev)} />)}
          </div>
        )}
      </div>

      {/* Próximos 7 dias */}
      {prox7.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>📆 Próximos 7 dias</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {prox7.slice(0, 6).map(ev => (
              <div key={ev.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', minWidth: 68, textAlign: 'right', textTransform: 'capitalize', flexShrink: 0 }}>
                  {format(parseISO(ev.data_inicio), 'EEE dd/MM', { locale: ptBR })}
                </div>
                <div style={{ flex: 1 }}>
                  <EventCard event={ev} onClick={() => onClick(ev)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aniversários */}
      {aniversarios.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>🎂 Aniversários próximos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {aniversarios.map(ev => {
              const dias = differenceInDays(parseISO(ev.data_inicio), new Date())
              return (
                <div key={ev.id} onClick={() => onClick(ev)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: '#fffbeb', border: '1.5px solid #fde68a', cursor: 'pointer' }}>
                  <span style={{ fontSize: 22 }}>🎂</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{ev.titulo}</div>
                    <div style={{ fontSize: 12, color: 'var(--c-text-muted)', textTransform: 'capitalize' }}>
                      {format(parseISO(ev.data_inicio), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '3px 10px', borderRadius: 99, flexShrink: 0 }}>
                    {dias === 0 ? 'Hoje! 🎉' : `em ${dias} dia${dias !== 1 ? 's' : ''}`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ══ Página principal ═══════════════════════════════════════════════ */
export default function Agenda() {
  const [view, setView]             = useState('meudia')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)
  const [showForm, setShowForm]     = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [deleting, setDeleting]     = useState(null)
  const [filterCat, setFilterCat]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data: ev } = await supabase.from('agenda_eventos').select('*').order('data_inicio').order('hora_inicio')
    setEvents(ev || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!confirm('Excluir este evento?')) return
    setDeleting(id)
    await supabase.from('agenda_eventos').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
    setDeleting(null)
    setSelectedEvent(null)
  }

  function openNew(day) { setEditingEvent(null); setSelectedDay(day ?? null); setShowForm(true) }
  function openEdit(ev) { setEditingEvent(ev); setSelectedEvent(null); setShowForm(true) }
  function afterSave()  { setShowForm(false); setEditingEvent(null); load() }

  const filtered = useMemo(() => {
    if (!filterCat) return events
    return events.filter(e => e.categoria === filterCat)
  }, [events, filterCat])

  const eventsByDay = useMemo(() => {
    const map = {}
    filtered.forEach(e => { (map[e.data_inicio] ??= []).push(e) })
    return map
  }, [filtered])

  const VIEWS = [
    { key: 'meudia',     label: '☀️ Meu Dia'    },
    { key: 'calendario', label: '📆 Calendário' },
    { key: 'lista',      label: '📋 Lista'       },
  ]

  const todayStr = fmtDate(new Date())
  const todayEvents = filtered.filter(e => e.data_inicio === todayStr)
  const nextSevenEvents = filtered.filter(e => {
    const d = differenceInDays(parseISO(e.data_inicio), new Date())
    return d > 0 && d <= 7
  })
  const birthdayEvents = filtered.filter(e => {
    if (e.categoria !== 'aniversario') return false
    const d = differenceInDays(parseISO(e.data_inicio), new Date())
    return d >= 0 && d <= 30
  })

  return (
    <div className="c-agenda-v2-page">
      {/* ── Header ── */}
      <PageHeader
        title="Agenda"
        eyebrow="Família"
        description={`${filtered.length} evento${filtered.length !== 1 ? 's' : ''} na agenda familiar.`}
        actions={(
          <Button icon={<Plus size={16} />} onClick={() => openNew(null)}>Novo evento</Button>
        )}
      />

      <div className="c-agenda-v2-metrics">
        <MetricCard label="Hoje" value={todayEvents.length} description="Compromissos do dia" icon={<Sun size={18} />} tone="accent" />
        <MetricCard label="Próximos 7 dias" value={nextSevenEvents.length} description="Eventos futuros" icon={<CalendarDays size={18} />} tone="success" />
        <MetricCard label="Aniversários" value={birthdayEvents.length} description="Próximos 30 dias" icon={<CalendarDays size={18} />} tone="warning" />
      </div>

      {/* ── Filtros ── */}
      <SectionCard
        className="c-agenda-v2-toolbar"
        title="Visualização"
        description="Alterne entre o dia, o calendário mensal e a lista."
        actions={(
          <div className="c-agenda-v2-view-toggle" role="tablist" aria-label="Visualizações da agenda">
            {VIEWS.map(v => (
              <button
                key={v.key}
                type="button"
                role="tab"
                aria-selected={view === v.key}
                className={view === v.key ? 'is-active' : ''}
                onClick={() => setView(v.key)}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      >
        <div className="c-agenda-v2-filters">
          <Filter size={16} aria-hidden="true" />
          <SelectField value={filterCat} onChange={e => setFilterCat(e.target.value)} aria-label="Filtrar por categoria">
            <option value="">Todas as categorias</option>
            {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
          </SelectField>
          {filterCat && (
            <Button variant="secondary" size="sm" onClick={() => setFilterCat('')}>Limpar</Button>
          )}
        </div>
      </SectionCard>

      {loading ? (
        <div className="c-agenda-v2-loading" aria-label="Carregando agenda">
          <Skeleton height={120} />
          <Skeleton height={260} />
        </div>
      ) : (
        <>
          {view === 'meudia' && (
            <MeuDiaView events={filtered} onClick={setSelectedEvent} />
          )}
          {view === 'calendario' && (
            <CalendarioView
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              eventsByDay={eventsByDay}
              onDayClick={day => {
                setSelectedDay(day)
                if (day) {
                  const ev = eventsByDay[fmtDate(day)]
                  if (ev?.length === 1) setSelectedEvent(ev[0])
                }
              }}
              selectedDay={selectedDay}
            />
          )}
          {view === 'lista' && (
            <ListaView events={filtered} onClick={setSelectedEvent} />
          )}
        </>
      )}

      {showForm && (
        <EventFormModal
          event={editingEvent}
          defaultDate={selectedDay}
          onSave={afterSave}
          onClose={() => { setShowForm(false); setEditingEvent(null) }}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onEdit={openEdit}
          onDelete={handleDelete}
          onClose={() => setSelectedEvent(null)}
          deleting={deleting}
        />
      )}
    </div>
  )
}
