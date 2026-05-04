import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email ou senha incorretos.')
    setLoading(false)
  }

  return (
    <div className="c-login-page">
      <div className="c-login-card">
        <h2>💰 Contas</h2>
        <p>Controle financeiro familiar</p>

        {error && <div className="c-alert c-alert-danger c-mb-3">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="c-form-group">
            <label className="c-form-label">Email</label>
            <input type="email" className="c-form-input" placeholder="seu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="c-form-group">
            <label className="c-form-label">Senha</label>
            <input type="password" className="c-form-input" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="c-btn c-btn-primary c-btn-full c-mt-2" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
