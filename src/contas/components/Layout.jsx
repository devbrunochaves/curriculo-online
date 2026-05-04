import { NavLink, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/contas/login')
  }

  return (
    <div className="c-app-shell">
      <aside className="c-sidebar">
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

      <main className="c-main-content">
        {children}
      </main>
    </div>
  )
}
