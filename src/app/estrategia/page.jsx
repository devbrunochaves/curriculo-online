'use client'
import { AppProvider } from '../../context/AppContext'
import Estrategia from '../../components/Estrategia'

export default function EstrategiaPage() {
  return (
    <AppProvider>
      <Estrategia />
    </AppProvider>
  )
}
