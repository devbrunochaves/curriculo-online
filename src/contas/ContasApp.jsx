import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NovaCompra from './pages/NovaCompra'
import Lancamentos from './pages/Lancamentos'
import Pessoas from './pages/Pessoas'
import Configuracoes from './pages/Configuracoes'
import Previsao from './pages/Previsao'
import ContasFixas from './pages/ContasFixas'
import Agenda from './pages/Agenda'
import Cardapio from './pages/Cardapio'
import Documentos from './pages/Documentos'
import Apartamento from './pages/Apartamento'
import MeuDia from './pages/MeuDia'
import Metas from './pages/Metas'
import Veiculos from './pages/Veiculos'
import Saude from './pages/Saude'
import Acertos from './pages/Acertos'
import './styles/contas.css'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/contas/login" replace />
  return children
}

export default function ContasApp() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="contas-root">
      <div className="c-loading-screen">
        <div className="c-loading-spinner" />
        <p>Carregando...</p>
      </div>
    </div>
  )

  return (
    <div className="contas-root">
      <Routes>
        <Route path="/contas/login" element={session ? <Navigate to="/contas/" replace /> : <Login />} />
        <Route path="/contas/*" element={
          <ProtectedRoute session={session}>
            <Layout session={session}>
              <Routes>
                <Route index element={<Navigate to="/contas/meudia" replace />} />
                <Route path="meudia" element={<MeuDia />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="metas" element={<Metas />} />
                <Route path="veiculos" element={<Veiculos />} />
                <Route path="saude" element={<Saude />} />
                <Route path="nova" element={<NovaCompra />} />
                <Route path="lancamentos" element={<Lancamentos />} />
                <Route path="acertos" element={<Acertos />} />
                <Route path="fixas" element={<ContasFixas />} />
                <Route path="pessoas" element={<Pessoas />} />
                <Route path="previsao" element={<Previsao />} />
                <Route path="cartoes" element={<Navigate to="/contas/configuracoes" replace />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="lista" element={<Navigate to="/contas/cardapio" replace />} />
                <Route path="cardapio" element={<Cardapio />} />
                <Route path="documentos" element={<Documentos />} />
                <Route path="apartamento" element={<Apartamento />} />
                <Route path="configuracoes" element={<Configuracoes />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/contas/" replace />} />
      </Routes>
    </div>
  )
}
