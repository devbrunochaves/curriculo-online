import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  BadgeDollarSign,
  Banknote,
  BarChart3,
  CalendarDays,
  Car,
  ChevronDown,
  CreditCard,
  FileText,
  HeartPulse,
  Home,
  Landmark,
  ListChecks,
  LogOut,
  Menu,
  MoreHorizontal,
  PiggyBank,
  Plus,
  ReceiptText,
  Settings,
  Users,
  X,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

const navGroups = [
  {
    label: 'Home',
    items: [
      { to: '/contas/meudia', icon: Home, label: 'Meu Dia', end: true },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { to: '/contas/dashboard', icon: BarChart3, label: 'Dashboard' },
      { to: '/contas/lancamentos', icon: ReceiptText, label: 'Lançamentos' },
      { to: '/contas/fixas', icon: Landmark, label: 'Contas Fixas' },
      { to: '/contas/entradas', icon: Banknote, label: 'Entradas' },
      { to: '/contas/acertos', icon: BadgeDollarSign, label: 'Acertos' },
      { to: '/contas/previsao', icon: CalendarDays, label: 'Previsão' },
      { to: '/contas/pessoas', icon: Users, label: 'Pessoas' },
    ],
  },
  {
    label: 'Família',
    items: [
      { to: '/contas/agenda', icon: CalendarDays, label: 'Agenda' },
      { to: '/contas/saude', icon: HeartPulse, label: 'Saúde' },
      { to: '/contas/metas', icon: PiggyBank, label: 'Cofrinhos' },
    ],
  },
  {
    label: 'Casa',
    items: [
      { to: '/contas/apartamento', icon: Home, label: 'Apartamento' },
      { to: '/contas/veiculos', icon: Car, label: 'Veículos' },
      { to: '/contas/cardapio', icon: ListChecks, label: 'Compras' },
      { to: '/contas/documentos', icon: FileText, label: 'Documentos' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/contas/configuracoes', icon: Settings, label: 'Configurações' },
    ],
  },
]

const bottomNavItems = [
  { to: '/contas/meudia', icon: Home, label: 'Meu Dia', end: true },
  { to: '/contas/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/contas/lancamentos', icon: ReceiptText, label: 'Lançamentos' },
  { to: '/contas/agenda', icon: CalendarDays, label: 'Agenda' },
]

const allNavItems = navGroups.flatMap(group => group.items)

function initialsFromEmail(email = '') {
  const [name = ''] = email.split('@')
  const parts = name.split(/[.\-_]/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return (name.slice(0, 2) || 'BC').toUpperCase()
}

function NavItem({ item, onClick }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) => `c-v2-nav-item${isActive ? ' active' : ''}`}
    >
      <Icon aria-hidden="true" />
      <span>{item.label}</span>
    </NavLink>
  )
}

function NavGroups({ onNavigate, financeOpen = true }) {
  return (
    <nav className="c-v2-sidebar-nav" aria-label="Navegacao principal">
      {navGroups.map(group => (
        <section className="c-v2-nav-group" key={group.label}>
          <h2 className="c-v2-nav-label">{group.label}</h2>
          <div className={`c-v2-nav-list${group.label === 'Financeiro' && !financeOpen ? ' is-collapsed' : ''}`}>
            {group.items.map(item => (
              <NavItem key={item.to} item={item} onClick={onNavigate} />
            ))}
          </div>
        </section>
      ))}
    </nav>
  )
}

export default function Layout({ session, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [contasOpen, setContasOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 980px)')
    setIsMobile(mq.matches)
    const handler = e => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => { setOpen(false) }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = event => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const isContasActive = navGroups
    .find(group => group.label === 'Financeiro')
    ?.items.some(item => location.pathname.startsWith(item.to))

  useEffect(() => {
    if (isContasActive) setContasOpen(true)
  }, [isContasActive])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/contas/login')
  }

  const currentPage = allNavItems.find(item =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  )

  const isAgenda = location.pathname.startsWith('/contas/agenda')
  const isApartamento = location.pathname.startsWith('/contas/apartamento')
  const isMeuDia = location.pathname.startsWith('/contas/meudia')
  const isMetas = location.pathname.startsWith('/contas/metas')
  const isVeiculos = location.pathname.startsWith('/contas/veiculos')
  const isSaude = location.pathname.startsWith('/contas/saude')
  const isAcertos = location.pathname.startsWith('/contas/acertos')
  const hideFab = isAgenda || isApartamento || isMeuDia || isMetas || isVeiculos || isSaude || isAcertos
  const userEmail = session?.user?.email || 'Sessão ativa'
  const userInitials = initialsFromEmail(session?.user?.email)
  const drawerHidden = !open || !isMobile

  return (
    <div className="c-v2-app-shell">
      <aside className="c-v2-sidebar" aria-label="Menu lateral">
        <div className="c-v2-brand">
          <div className="c-v2-brand-mark" aria-hidden="true">C</div>
          <div>
            <div className="c-v2-brand-name">Contas</div>
            <div className="c-v2-brand-subtitle">Life OS pessoal</div>
          </div>
        </div>

        <button
          type="button"
          className="c-v2-sidebar-action"
          onClick={() => navigate('/contas/nova')}
        >
          <Plus aria-hidden="true" />
          Nova Compra
        </button>

        <div className="c-v2-sidebar-scroll">
          <NavGroups />
        </div>

        <div className="c-v2-sidebar-footer">
          <div className="c-v2-user-pill">
            <div className="c-v2-user-avatar" aria-hidden="true">{userInitials}</div>
            <div className="c-v2-user-copy">
              <div className="c-v2-user-name">Bruno Chaves</div>
              <div className="c-v2-user-email">{userEmail}</div>
            </div>
          </div>
          <button type="button" className="c-v2-logout-button" onClick={handleLogout}>
            <LogOut aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      <div className="c-v2-main-shell">
        <header className="c-v2-mobile-header">
          <button
            type="button"
            className="c-v2-mobile-icon-button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={open}
          >
            <Menu aria-hidden="true" />
          </button>
          <div className="c-v2-mobile-title-wrap">
            <span className="c-v2-mobile-kicker">Contas</span>
            <span className="c-v2-mobile-title">{currentPage?.label || 'Meu Dia'}</span>
          </div>
          {!hideFab ? (
            <button
              type="button"
              className="c-v2-mobile-icon-button"
              onClick={() => navigate('/contas/nova')}
              aria-label="Nova compra"
            >
              <Plus aria-hidden="true" />
            </button>
          ) : (
            <span className="c-v2-mobile-header-spacer" aria-hidden="true" />
          )}
        </header>

        <main className="c-v2-main-content">
          {children}
        </main>
      </div>

      {open && (
        <div className="c-v2-drawer-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <aside className={`c-v2-mobile-drawer ${open ? 'is-open' : ''}`} aria-label="Menu mobile" aria-hidden={drawerHidden}>
        <div className="c-v2-drawer-header">
          <div className="c-v2-brand">
            <div className="c-v2-brand-mark" aria-hidden="true">C</div>
            <div>
              <div className="c-v2-brand-name">Contas</div>
              <div className="c-v2-brand-subtitle">Life OS pessoal</div>
            </div>
          </div>
          <button
            type="button"
            className="c-v2-mobile-icon-button"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          className="c-v2-sidebar-action"
          onClick={() => navigate('/contas/nova')}
        >
          <Plus aria-hidden="true" />
          Nova Compra
        </button>

        <div className="c-v2-drawer-scroll">
          <button
            type="button"
            className={`c-v2-mobile-group-toggle${contasOpen ? ' is-open' : ''}`}
            onClick={() => setContasOpen(value => !value)}
            aria-expanded={contasOpen}
          >
            <CreditCard aria-hidden="true" />
            <span>Financeiro</span>
            <ChevronDown aria-hidden="true" />
          </button>
          <NavGroups onNavigate={() => setOpen(false)} financeOpen={contasOpen} />
        </div>

        <div className="c-v2-sidebar-footer">
          <div className="c-v2-user-pill">
            <div className="c-v2-user-avatar" aria-hidden="true">{userInitials}</div>
            <div className="c-v2-user-copy">
              <div className="c-v2-user-name">Bruno Chaves</div>
              <div className="c-v2-user-email">{userEmail}</div>
            </div>
          </div>
          <button type="button" className="c-v2-logout-button" onClick={handleLogout}>
            <LogOut aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      <nav className="c-v2-bottom-nav" aria-label="Navegacao inferior">
        {bottomNavItems.map(item => {
          const Icon = item.icon
          const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
          return (
            <button
              key={item.to}
              type="button"
              className={`c-v2-bottom-item${isActive ? ' active' : ''}`}
              onClick={() => navigate(item.to)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          )
        })}
        <button
          type="button"
          className="c-v2-bottom-item"
          onClick={() => setOpen(true)}
          aria-label="Abrir mais opcoes"
          aria-expanded={open}
        >
          <MoreHorizontal aria-hidden="true" />
          <span>Mais</span>
        </button>
      </nav>

      {!hideFab && (
        <button
          type="button"
          onClick={() => navigate('/contas/nova')}
          aria-label="Nova Compra"
          className="c-v2-fab-nova"
        >
          <Plus aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
