'use client'
import { useState, useEffect } from 'react'
import DESAFIOS from './desafios'
import './40dias.css'

const STORAGE_KEY = '40dias_progresso'
const STORAGE_INICIO = '40dias_inicio'

function getProgresso() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function salvarProgresso(prog) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prog))
}
function getInicio() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_INICIO)
}
function salvarInicio() {
  if (!localStorage.getItem(STORAGE_INICIO)) {
    localStorage.setItem(STORAGE_INICIO, new Date().toISOString())
  }
}

export default function QuarentaDias() {
  const [progresso, setProgresso]   = useState({})
  const [diaSelecionado, setDia]    = useState(null)
  const [notas, setNotas]           = useState('')
  const [iniciado, setIniciado]     = useState(false)
  const [dataInicio, setDataInicio] = useState(null)
  const [mounted, setMounted]       = useState(false)

  useEffect(() => {
    const p = getProgresso()
    setProgresso(p)
    const ini = getInicio()
    if (ini) { setDataInicio(ini); setIniciado(true) }
    setMounted(true)
  }, [])

  function iniciar() {
    salvarInicio()
    setDataInicio(new Date().toISOString())
    setIniciado(true)
    abrirDia(1)
  }

  function abrirDia(num) {
    setDia(num)
    const p = getProgresso()
    setNotas(p[num]?.notas || '')
  }

  function marcarConcluido() {
    const p = { ...progresso }
    p[diaSelecionado] = { ...p[diaSelecionado], concluido: !p[diaSelecionado]?.concluido, notas }
    setProgresso(p)
    salvarProgresso(p)
  }

  function salvarNotas() {
    const p = { ...progresso }
    p[diaSelecionado] = { ...p[diaSelecionado], notas }
    setProgresso(p)
    salvarProgresso(p)
  }

  function reiniciar() {
    if (!confirm('Tem certeza que deseja reiniciar do Dia 1? Todo o progresso será perdido.')) return
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_INICIO)
    setProgresso({})
    setDataInicio(null)
    setIniciado(false)
    setDia(null)
  }

  /* ── Computed ── */
  const totalConcluidos = Object.values(progresso).filter(d => d?.concluido).length
  const pct = Math.round((totalConcluidos / 40) * 100)
  const proximoDia = Math.min(40, totalConcluidos + 1)
  const dasharray = 2 * Math.PI * 38 // circunferência do círculo r=38
  const dashoffset = dasharray * (1 - totalConcluidos / 40)

  const dataFormatada = dataInicio
    ? new Date(dataInicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''

  /* ── Dia aberto ── */
  if (diaSelecionado) {
    const d = DESAFIOS[diaSelecionado - 1]
    const concluido = !!progresso[diaSelecionado]?.concluido

    return (
      <div className="fd-shell">
        <div className="fd-day-page">
          {/* Voltar */}
          <button className="fd-back" onClick={() => setDia(null)}>
            ← Voltar aos 40 dias
          </button>

          {/* Header */}
          <div className="fd-day-header">
            <div className="fd-day-badge">
              <span className="fd-day-badge-num">{d.dia}</span>
              <span className="fd-day-badge-label">dia</span>
            </div>
            <div>
              <h1 className="fd-day-titulo">{d.titulo}</h1>
              {concluido && <span className="fd-concluido-tag">✓ Concluído</span>}
            </div>
          </div>

          {/* Versículo */}
          <div className="fd-verso-box">
            <p className="fd-verso-texto">"{d.versiculo}"</p>
            <p className="fd-verso-ref">— {d.referencia}</p>
          </div>

          {/* Desafio */}
          <div className="fd-section">
            <h3 className="fd-section-label">Seu desafio de hoje</h3>
            <div className="fd-desafio-box">
              <div className="fd-desafio-icon">🔥</div>
              <p className="fd-desafio-texto">{d.desafio}</p>
            </div>
          </div>

          {/* Notas */}
          <div className="fd-section">
            <h3 className="fd-section-label">Minhas anotações</h3>
            <textarea
              className="fd-notas-input"
              placeholder="Como foi para você hoje? O que você fez? Como a outra pessoa reagiu..."
              value={notas}
              onChange={e => setNotas(e.target.value)}
              onBlur={salvarNotas}
            />
            <p className="fd-notas-hint">As anotações são salvas automaticamente ao sair do campo.</p>
          </div>

          {/* Ações */}
          <div className="fd-day-actions">
            {diaSelecionado > 1 && (
              <button className="fd-btn-ghost" onClick={() => abrirDia(diaSelecionado - 1)}>
                ← Dia anterior
              </button>
            )}
            <button
              className={`fd-btn-done ${concluido ? 'fd-btn-done-undo' : ''}`}
              onClick={marcarConcluido}
            >
              {concluido ? '↩ Desmarcar' : '✓ Marcar como feito'}
            </button>
            {diaSelecionado < 40 && (
              <button className="fd-btn-ghost" onClick={() => abrirDia(diaSelecionado + 1)}>
                Próximo dia →
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── Splash (antes de iniciar) ── */
  if (!iniciado) {
    return (
      <div className="fd-shell">
        <div className="fd-splash">
          <div className="fd-splash-heart">❤️</div>
          <h1 className="fd-splash-titulo">40 Dias — Desafio de Amar</h1>
          <p className="fd-splash-sub">
            Baseado no livro <em>Desafio de Amar</em>, do filme <em>À Prova de Fogo</em>.
            <br />
            40 dias para fortalecer e transformar o seu casamento.
          </p>
          <button className="fd-btn-start" onClick={iniciar}>
            Começar o desafio ❤️
          </button>
          <p className="fd-splash-hint">Você vai avançar um dia por vez, no seu ritmo.</p>
        </div>
      </div>
    )
  }

  /* ── Overview ── */
  return (
    <div className="fd-shell">
      <div className="fd-overview">

        {/* Hero */}
        <div className="fd-hero">
          {/* Anel de progresso */}
          <div className="fd-ring-wrap">
            <svg viewBox="0 0 88 88" className="fd-ring-svg">
              <circle cx="44" cy="44" r="38" className="fd-ring-track" />
              <circle
                cx="44" cy="44" r="38"
                className="fd-ring-fill"
                strokeDasharray={dasharray}
                strokeDashoffset={dashoffset}
                transform="rotate(-90 44 44)"
              />
            </svg>
            <div className="fd-ring-center">
              <span className="fd-ring-num">{totalConcluidos}</span>
              <span className="fd-ring-de">de 40</span>
            </div>
          </div>

          {/* Info */}
          <div className="fd-hero-info">
            <h1 className="fd-hero-titulo">Desafio de Amar</h1>
            <p className="fd-hero-sub">
              {pct}% concluído
              {dataFormatada && <> · Iniciado em {dataFormatada}</>}
            </p>
            <div className="fd-progress-bar-wrap">
              <div className="fd-progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <button
              className="fd-btn-continuar"
              onClick={() => abrirDia(proximoDia)}
            >
              {totalConcluidos === 0
                ? '→ Começar pelo Dia 1'
                : totalConcluidos === 40
                  ? '✓ Desafio concluído!'
                  : `→ Continuar no Dia ${proximoDia}`}
            </button>
          </div>
        </div>

        {/* Grade de dias */}
        <h2 className="fd-grid-titulo">Todos os dias</h2>
        <div className="fd-grid">
          {DESAFIOS.map(d => {
            const concluido = !!progresso[d.dia]?.concluido
            const ehProximo = d.dia === proximoDia && totalConcluidos < 40
            const bloqueado = !concluido && d.dia > proximoDia

            return (
              <button
                key={d.dia}
                className={`fd-dot ${concluido ? 'fd-dot-done' : ''} ${ehProximo ? 'fd-dot-hoje' : ''} ${bloqueado ? 'fd-dot-locked' : ''}`}
                onClick={() => !bloqueado && abrirDia(d.dia)}
                title={`Dia ${d.dia}: ${d.titulo}`}
                disabled={bloqueado}
              >
                {concluido ? '✓' : d.dia}
              </button>
            )
          })}
        </div>

        {/* Lista dos dias */}
        <h2 className="fd-grid-titulo" style={{ marginTop: '2rem' }}>Lista de desafios</h2>
        <div className="fd-lista">
          {DESAFIOS.map(d => {
            const concluido = !!progresso[d.dia]?.concluido
            const bloqueado = !concluido && d.dia > proximoDia

            return (
              <button
                key={d.dia}
                className={`fd-lista-item ${concluido ? 'fd-lista-done' : ''} ${bloqueado ? 'fd-lista-locked' : ''}`}
                onClick={() => !bloqueado && abrirDia(d.dia)}
                disabled={bloqueado}
              >
                <span className={`fd-lista-num ${concluido ? 'fd-lista-num-done' : ''}`}>
                  {concluido ? '✓' : d.dia}
                </span>
                <span className="fd-lista-titulo">{d.titulo}</span>
                {concluido && progresso[d.dia]?.notas && (
                  <span className="fd-lista-nota-icon" title="Você tem anotações neste dia">📝</span>
                )}
              </button>
            )
          })}
        </div>

        <button className="fd-btn-reiniciar" onClick={reiniciar}>
          Reiniciar do zero
        </button>
      </div>
    </div>
  )
}
