'use client'
import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import ContasApp from '../../../contas/ContasApp'

// O /contas é um mini-SPA privado (sem necessidade de SSR/SEO).
// Mantemos o react-router-dom interno para zero mudanças nos componentes existentes.
export default function ContasPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="contas-root">
        <div className="c-loading-screen">
          <div className="c-loading-spinner" />
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <ContasApp />
    </BrowserRouter>
  )
}
