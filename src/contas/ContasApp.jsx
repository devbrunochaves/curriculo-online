import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NovaCompra from './pages/NovaCompra'
import Lancamentos from './pages/Lancamentos'
import Pessoas from './pages/Pessoas'
import Cartoes from './pages/Cartoes'
import Configuracoes from './pages/Configuracoes'
import Previsao from './pages/Previsao'
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
      <BrowserRouter>
        <Routes>
          <Route path="/contas/login" element={session ? <Navigate to="/contas/" replace /> : <Login />} />
          <Route path="/contas/*" element={
            <ProtectedRoute session={session}>
              <Layout session={session}>
                <Routes>
                  <Route index element={<Dashboard />} />
                  <Route path="nova" element={<NovaCompra />} />
                  <Route path="lancamentos" element={<Lancamentos />} />
                  <Route path="pessoas" element={<Pessoas />} />
                  <Route path="previsao" element={<Previsao />} />
                  <Route path="cartoes" element={<Cartoes />} />
                  <Route path="configuracoes" element={<Configuracoes />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/contas/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}
