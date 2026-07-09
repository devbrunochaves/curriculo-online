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

// Item do flyout com hover via estado local
function FlyoutLink({ item, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 8,
        fontSize: 13, fontWeight: 500, textDecoration: 'none',
        color: isActive ? '#a5b4fc' : hovered ? '#c7d2fe' : '#94a3b8',
        background: isActive ? 'rgba(99,102,241,.18)' : hovered ? 'rgba(99,102,241,.1)' : 'transparent',
        transition: 'background .13s, color .13s',
        position: 'relative',
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
      {item.label}
    </NavLink>
  )
}

export default function Layout({ session, children }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open, setOpen]                   = useState(false)
  const [contasOpen, setContasOpen]       = useState(false)
  const [flyoutVisible, setFlyoutVisible] = useState(false)
  const [flyoutTop, setFlyoutTop]         = useState(0)
  const [isMobile, setIsMobile]           = useState(false)

  const sidebarRef  = useRef(null)
  const groupRef    = useRef(null)
  const flyoutTimer = useRef(null)

  // Detecta breakpoint mobile
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = e => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Fecha drawer ao navegar
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Trava scroll do body quando drawer está aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Abre accordion se estiver em rota do grupo
  const isContasActive = contasGroup.some(item => location.pathname.startsWith(item.to))
  useEffect(() => {
    if (isContasActive) setContasOpen(true)
  }, [isContasActive])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/contas/login')
  }

  // Flyout desktop
  function handleGroupEnter() {
    if (isMobile) return
    clearTimeout(flyoutTimer.current)
    if (groupRef.current) {
      const rect              = groupRef.current.getBoundingClientRect()
      const estimatedHeight   = contasGroup.length * 37 + 44 // itens + header + padding
      const maxTop            = window.innerHeight - estimatedHeight - 8
      setFlyoutTop(Math.max(8, Math.min(rect.top, maxTop)))
    }
    setFlyoutVisible(true)
  }
  function handleGroupLeave() {
    if (isMobile) return
    flyoutTimer.current = setTimeout(() => setFlyoutVisible(false), 120)
  }
  function handleFlyoutEnter() { clearTimeout(flyoutTimer.current) }
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

  const sidebarRight = sidebarRef.current?.getBoundingClientRect().right ?? 244

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

      {/* ── Backdrop mobile ── */}
      {open && <div className="c-sidebar-backdrop" onClick={() => setOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside ref={sidebarRef} className={`c-sidebar ${open ? 'c-sidebar-open' : ''}`}>
        <div className="c-sidebar-logo">
          <h1>💰 Contas</h1>
          <span>Controle Financeiro</span>
        </div>

        {/* Botão Nova Compra */}
        <div style={{ padding: '0 16px 12px' }}>
          <button
            onClick={() => navigate('/contas/nova')}
            style={{
              width: '100%', padding: '11px 0', borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 2px 8px rgba(99,102,241,.35)', transition: 'opacity .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            ➕ Nova Compra
          </button>
        </div>

        <nav className="c-sidebar-nav">
          {/* Itens normais superiores */}
          {topNavItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="c-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {/* Divisor */}
          <div style={{ margin: '6px 4px', height: 1, background: 'rgba(255,255,255,.07)' }} />

          {/* Grupo Contas */}
          <div
            ref={groupRef}
            onMouseEnter={handleGroupEnter}
            onMouseLeave={handleGroupLeave}
          >
            <button
              onClick={() => isMobile && setContasOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, border: 'none',
                cursor: isMobile ? 'pointer' : 'default',
                background: isContasActive ? 'rgba(99,102,241,.15)' : 'transparent',
                color: isContasActive ? '#a5b4fc' : '#94a3b8',
                fontWeight: 600, fontSize: 13, textAlign: 'left',
                transition: 'background .14s, color .14s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!isContasActive && !isMobile) e.currentTarget.style.background = 'rgba(99,102,241,.08)' }}
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
              {/* Seta: para baixo no mobile, para a direita no desktop */}
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"
                style={{
                  color: isContasActive ? '#818cf8' : '#64748b', flexShrink: 0,
                  transition: 'transform .2s',
                  transform: isMobile && contasOpen ? 'rotate(180deg)' : 'none',
                }}>
                {isMobile
                  ? <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
                  : <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.17 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" />
                }
              </svg>
            </button>

            {/* Accordion mobile */}
            {isMobile && contasOpen && (
              <div style={{ paddingLeft: 12, paddingBottom: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {contasGroup.map(item => (
                  <NavLink key={item.to} to={item.to}
                    className={({ isActive }) => isActive ? 'active' : ''}>
                    <span className="c-nav-icon">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Divisor */}
          <div style={{ margin: '6px 4px', height: 1, background: 'rgba(255,255,255,.07)' }} />

          {/* Itens inferiores */}
          {bottomNavItems.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => isActive ? 'active' : ''}>
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

      {/* ── Flyout desktop — posicionado com fixed para não ser cortado pelo sidebar ── */}
      {!isMobile && flyoutVisible && (
        <div
          onMouseEnter={handleFlyoutEnter}
          onMouseLeave={handleFlyoutLeave}
          style={{
            position: 'fixed',
            left: sidebarRight + 6,
            top: flyoutTop,
            zIndex: 500,
            /* Cores fixas dark para o flyout sempre combinar com o sidebar */
            background: '#1a1f2e',
            border: '1px solid #2a3047',
            borderRadius: 12,
            padding: '6px',
            minWidth: 210,
            maxHeight: 'calc(100vh - 16px)',
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,.55), 0 2px 8px rgba(0,0,0,.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '.9px',
            textTransform: 'uppercase', color: '#374151',
            padding: '4px 10px 6px',
          }}>
            Contas
          </div>
          {contasGroup.map(item => (
            <FlyoutLink key={item.to} item={item} onClick={() => setFlyoutVisible(false)} />
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
