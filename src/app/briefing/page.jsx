'use client'
import { AppProvider } from '../../context/AppContext'
import Briefing from '../../pages/Briefing'

export default function BriefingPage() {
  return (
    <AppProvider>
      <Briefing />
    </AppProvider>
  )
}
