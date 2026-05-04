import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const navItems = [
  { to: '/contas/',              icon: '📊', label: 'Dashboard',    end: true },
  { to: '/contas/nova',          icon: '➕', label: 'Nova Compra'  },
  { to: '/contas/lancamentos',   icon: '📋', label: 'Lançamentos'  },
  { to: '/contas/previsao',      icon: '📆', label: 'Previsão'     },
  { to: '/contas/pessoas',       icon: '👥', label: 'Pessoas'      },
  { to: '/contas/cartoes',       icon: '💳', label: 'Cartões'      },
  { to: '/contas/configuracoes', icon: '⚙️', label: 'Configurações' },
]

export default function Layout({ session, children }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open, setOpen] = useState(false)

  // Fecha o menu ao navegar
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Impede scroll do body quando menu está aberto no mobile
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/contas/login')
  }

  const currentPage = navItems.find(n => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))

  return (
    <div className="c-app-shell">

      {/* ── Mobile header ────────────────────────────────────── */}
      <div className="c-mobile-header">
        <button className="c-hamburger" onClick={() => setOpen(o => !o)} aria-label="Menu">
          <span className={`c-ham-bar ${open ? 'open' : ''}`} />
          <span className={`c-ham-bar ${open ? 'open' : ''}`} />
          <span className={`c-ham-bar ${open ? 'open' : ''}`} />
        </button>
        <span className="c-mobile-title">
          {currentPage ? `${currentPage.icon} ${currentPage.label}` : '💰 Contas'}
        </span>
        <button className="c-hamburger" onClick={() => navigate('/contas/nova')} aria-label="Nova compra" style={{ fontSize: 20 }}>
          ➕
        </button>
      </div>

      {/* ── Overlay backdrop ─────────────────────────────────── */}
      {open && <div className="c-sidebar-backdrop" onClick={() => setOpen(false)} />}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className={`c-sidebar ${open ? 'c-sidebar-open' : ''}`}>
        <div className="c-sidebar-logo">
          <h1>💰 Contas</h1>
          <span>Controle Financeiro</span>
        </div>

        <nav className="c-sidebar-nav">
          {navItems.map(item => (
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
        </nav>

        <div className="c-sidebar-footer">
          <div className="c-sidebar-user">{session?.user?.email}</div>
          <button className="c-btn-logout" onClick={handleLogout}>Sair</button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="c-main-content">
        {children}
      </main>

    </div>
  )
}
