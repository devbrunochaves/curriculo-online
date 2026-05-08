'use client'
import { BrowserRouter } from 'react-router-dom'
import ContasApp from '../../../contas/ContasApp'

// O /contas é um mini-SPA privado (sem necessidade de SSR/SEO).
// Mantemos o react-router-dom interno para zero mudanças nos componentes existentes.
export default function ContasPage() {
  return (
    <BrowserRouter>
      <ContasApp />
    </BrowserRouter>
  )
}
