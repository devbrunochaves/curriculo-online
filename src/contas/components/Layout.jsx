import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const navItems = [
  { to: '/contas/meudia',        icon: '☀️', label: 'Meu Dia',         end: true },
  { to: '/contas/metas',         icon: '🎯', label: 'Metas'            },
  { to: '/contas/agenda',        icon: '📅', label: 'Agenda Familiar'  },
  { to: '/contas/saude',         icon: '❤️', label: 'Saúde'            },
  { to: '/contas/veiculos',      icon: '🚗', label: 'Veículos'         },
  { to: '/contas/cardapio',      icon: '🛒', label: 'Compras de Casa'  },
  { to: '/contas/documentos',    icon: '📁', label: 'Documentos'       },
  { to: '/contas/apartamento',   icon: '🏠', label: 'Apartamento'      },
  { to: '/contas/dashboard',     icon: '📊', label: 'Dashboard'        },
  { to: '/contas/lancamentos',   icon: '📋', label: 'Lançamentos'      },
  { to: '/contas/acertos',       icon: '🤝', label: 'Acertos'          },
  { to: '/contas/entradas',      icon: '📈', label: 'Entradas'         },
  { to: '/contas/fixas',         icon: '🏠', label: 'Contas Fixas'     },
  { to: '/contas/previsao',      icon: '📆', label: 'Previsão'         },
  { to: '/contas/pessoas',       icon: '👥', label: 'Pessoas'          },
  { to: '/contas/configuracoes', icon: '⚙️', label: 'Configurações'   },
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
  const isAgenda = location.pathname.startsWith('/contas/agenda')
  const isApartamento = location.pathname.startsWith('/contas/apartamento')
  const isMeuDia = location.pathname.startsWith('/contas/meudia')
  const isMetas    = location.pathname.startsWith('/contas/metas')
  const isVeiculos = location.pathname.startsWith('/contas/veiculos')
  const isSaude    = location.pathname.startsWith('/contas/saude')
  const isAcertos  = location.pathname.startsWith('/contas/acertos')
  const hideFab = isAgenda || isApartamento || isMeuDia || isMetas || isVeiculos || isSaude || isAcertos

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
        {!hideFab && (
          <button className="c-hamburger" onClick={() => navigate('/contas/nova')} aria-label="Nova compra" style={{ fontSize: 20 }}>
            ➕
          </button>
        )}
        {hideFab && <div style={{ width: 40 }} />}
      </div>

      {/* ── Overlay backdrop ─────────────────────────────────── */}
      {open && <div className="c-sidebar-backdrop" onClick={() => setOpen(false)} />}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className={`c-sidebar ${open ? 'c-sidebar-open' : ''}`}>
        <div className="c-sidebar-logo">
          <h1>💰 Contas</h1>
          <span>Controle Financeiro</span>
        </div>

        {/* ── Botão Nova Compra (desktop sidebar) ── */}
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

      {/* ── FAB Nova Compra (mobile) ──────────────────────────── */}
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
            display: 'none',   // visível só no mobile via CSS
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
