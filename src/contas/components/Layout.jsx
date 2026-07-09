import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const topNavItems = [
  { to: '/contas/meudia',      icon: '☀️', label: 'Meu Dia',        end: true },
  { to: '/contas/metas',       icon: '🐷', label: 'Cofrinhos'       },
  { to: '/contas/agenda',      icon: '📅', label: 'Agenda Familiar' },
  { to: '/contas/saude',       icon: '❤️', label: 'Saúde'           },
  { to: '/contas/veiculos',    icon: '🚗', label: 'Veículos'        },
  { to: '/contas/cardapio',    icon: '🛒', label: 'Compras de Casa' },
  { to: '/contas/documentos',  icon: '📁', label: 'Documentos'      },
  { to: '/contas/apartamento', icon: '🏠', label: 'Apartamento'     },
]

const contasGroup = [
  { to: '/contas/dashboard',   icon: '📊', label: 'Dashboard'    },
  { to: '/contas/lancamentos', icon: '📋', label: 'Lançamentos'  },
  { to: '/contas/acertos',     icon: '🤝', label: 'Acertos'      },
  { to: '/contas/entradas',    icon: '📈', label: 'Entradas'     },
  { to: '/contas/fixas',       icon: '🏠', label: 'Contas Fixas' },
  { to: '/contas/previsao',    icon: '📆', label: 'Previsão'     },
  { to: '/contas/pessoas',     icon: '👥', label: 'Pessoas'      },
]

const bottomNavItems = [
  { to: '/contas/configuracoes', icon: '⚙️', label: 'Configurações' },
]

const allNavItems = [...topNavItems, ...contasGroup, ...bottomNavItems]

export default function Layout({ session, children }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open, setOpen]               = useState(false)
  const [contasOpen, setContasOpen]   = useState(false)
  const [flyoutVisible, setFlyoutVisible] = useState(false)
  const [flyoutTop, setFlyoutTop]     = useState(0)
  const [isMobile, setIsMobile]       = useState(false)

  const sidebarRef  = useRef(null)
  const groupRef    = useRef(null)
  const flyoutTimer = useRef(null)

  // Detecta mobile
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = e => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Fecha o menu ao navegar
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Impede scroll do body quando menu está aberto no mobile
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Abre accordion automaticamente se estiver em uma página do grupo Contas
  const isContasActive = contasGroup.some(item => location.pathname.startsWith(item.to))
  useEffect(() => {
    if (isContasActive) setContasOpen(true)
  }, [isContasActive])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/contas/login')
  }

  // ── Flyout desktop ──
  function handleGroupEnter() {
    if (isMobile) return
    clearTimeout(flyoutTimer.current)
    if (groupRef.current && sidebarRef.current) {
      const groupRect   = groupRef.current.getBoundingClientRect()
      setFlyoutTop(groupRect.top)
    }
    setFlyoutVisible(true)
  }

  function handleGroupLeave() {
    if (isMobile) return
    flyoutTimer.current = setTimeout(() => setFlyoutVisible(false), 120)
  }

  function handleFlyoutEnter() {
    clearTimeout(flyoutTimer.current)
  }

  function handleFlyoutLeave() {
    flyoutTimer.current = setTimeout(() => setFlyoutVisible(false), 120)
  }

  const currentPage = allNavItems.find(n =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
  )

  const isAgenda      = location.pathname.startsWith('/contas/agenda')
  const isApartamento = location.pathname.startsWith('/contas/apartamento')
  const isMeuDia      = location.pathname.startsWith('/contas/meudia')
  const isMetas       = location.pathname.startsWith('/contas/metas')
  const isVeiculos    = location.pathname.startsWith('/contas/veiculos')
  const isSaude       = location.pathname.startsWith('/contas/saude')
  const isAcertos     = location.pathname.startsWith('/contas/acertos')
  const hideFab = isAgenda || isApartamento || isMeuDia || isMetas || isVeiculos || isSaude || isAcertos

  // Sidebar width para posicionar o flyout
  const sidebarWidth = sidebarRef.current?.getBoundingClientRect().right ?? 240

  return (
    <div className="c-app-shell">

      {/* ── Mobile header ── */}
      <div className="c-mobile-header">
        <button className="c-hamburger" onClick={() => setOpen(o => !o)} aria-label="Menu">
          <span className={`c-ham-bar ${open ? 'open' : ''}`} />
          <span className={`c-ham-bar ${open ? 'open' : ''}`} />
          <span className={`c-ham-bar ${open ? 'open' : ''}`} />
        </button>
        <span className="c-mobile-title">
          {currentPage ? `${currentPage.icon} ${currentPage.label}` : '💰 Contas'}
        </span>
        {!hideFab && (
          <button className="c-hamburger" onClick={() => navigate('/contas/nova')} aria-label="Nova compra" style={{ fontSize: 20 }}>
            ➕
          </button>
        )}
        {hideFab && <div style={{ width: 40 }} />}
      </div>

      {/* ── Overlay backdrop ── */}
      {open && <div className="c-sidebar-backdrop" onClick={() => setOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside ref={sidebarRef} className={`c-sidebar ${open ? 'c-sidebar-open' : ''}`}>
        <div className="c-sidebar-logo">
          <h1>💰 Contas</h1>
          <span>Controle Financeiro</span>
        </div>

        {/* ── Botão Nova Compra ── */}
        <div style={{ padding: '0 16px 12px' }}>
          <button
            onClick={() => navigate('/contas/nova')}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 2px 8px rgba(99,102,241,.35)',
              transition: 'opacity .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            ➕ Nova Compra
          </button>
        </div>

        <nav className="c-sidebar-nav">
          {/* ── Itens superiores ── */}
          {topNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="c-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {/* ── Grupo CONTAS ── */}
          <div style={{ margin: '6px 0 2px', height: 1, background: 'rgba(255,255,255,.06)' }} />

          <div
            ref={groupRef}
            onMouseEnter={handleGroupEnter}
            onMouseLeave={handleGroupLeave}
          >
            {/* Trigger */}
            <button
              onClick={() => isMobile && setContasOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: isContasActive ? 'rgba(99,102,241,.15)' : 'transparent',
                color: isContasActive ? '#a5b4fc' : 'var(--c-nav-text, #94a3b8)',
                fontWeight: 600, fontSize: 13, textAlign: 'left',
                transition: 'background .14s, color .14s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!isContasActive) e.currentTarget.style.background = 'rgba(99,102,241,.08)' }}
              onMouseLeave={e => { if (!isContasActive) e.currentTarget.style.background = 'transparent' }}
            >
              {isContasActive && (
                <span style={{
                  position: 'absolute', left: 0, top: 6, bottom: 6,
                  width: 3, background: '#6366f1', borderRadius: '0 3px 3px 0',
                }} />
              )}
              <span className="c-nav-icon">💳</span>
              <span style={{ flex: 1 }}>Contas</span>
              {/* Chevron — só visível no mobile */}
              <svg
                width="14" height="14" viewBox="0 0 20 20" fill="currentColor"
                style={{
                  display: isMobile ? 'block' : 'none',
                  color: '#64748b', flexShrink: 0,
                  transition: 'transform .2s',
                  transform: contasOpen ? 'rotate(180deg)' : 'none',
                }}
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
              </svg>
            </button>

            {/* Accordion (mobile) */}
            {isMobile && contasOpen && (
              <div style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 4 }}>
                {contasGroup.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => isActive ? 'active' : ''}
                    style={{ fontSize: 13 }}
                  >
                    <span className="c-nav-icon">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          <div style={{ margin: '2px 0 6px', height: 1, background: 'rgba(255,255,255,.06)' }} />

          {/* ── Itens inferiores ── */}
          {bottomNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="c-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="c-sidebar-footer">
          <div className="c-sidebar-user">{session?.user?.email}</div>
          <button className="c-btn-logout" onClick={handleLogout}>Sair</button>
        </div>
      </aside>

      {/* ── Flyout desktop (fora do sidebar para evitar clipping) ── */}
      {!isMobile && flyoutVisible && (
        <div
          onMouseEnter={handleFlyoutEnter}
          onMouseLeave={handleFlyoutLeave}
          style={{
            position: 'fixed',
            left: sidebarWidth + 4,
            top: flyoutTop,
            zIndex: 500,
            background: 'var(--c-surface, #161d2e)',
            border: '1px solid var(--c-border, #1e2a40)',
            borderRadius: 12,
            padding: '6px',
            minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '.9px',
            textTransform: 'uppercase', color: '#475569',
            padding: '4px 10px 6px',
          }}>
            Contas
          </div>
          {contasGroup.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setFlyoutVisible(false)}
              className={({ isActive }) => isActive ? 'active' : ''}
              style={{ borderRadius: 8, fontSize: 13 }}
            >
              <span className="c-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      )}

      {/* ── Main content ── */}
      <main className="c-main-content">
        {children}
      </main>

      {/* ── FAB Nova Compra (mobile) ── */}
      {!hideFab && (
        <button
          onClick={() => navigate('/contas/nova')}
          aria-label="Nova Compra"
          style={{
            position: 'fixed', bottom: 24, right: 20, zIndex: 300,
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff', fontSize: 26, fontWeight: 700,
            border: 'none', cursor: 'pointer',
            display: 'none',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99,102,241,.5)',
            transition: 'transform .15s',
          }}
          className="c-fab-nova"
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          +
        </button>
      )}

    </div>
  )
}
