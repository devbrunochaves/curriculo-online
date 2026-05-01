import { createContext, useContext, useState, useEffect } from 'react'
import { getTranslations } from '../data/translations'

const AppContext = createContext(null)

export const lightColors = {
  bg1:          '#F2EBDF',
  bg2:          '#EBE4D2',
  bg3:          '#E5DDD0',
  primary:      '#084a8a',
  accent:       '#37a8de',
  card:         '#ffffff',
  muted:        'rgba(8,74,138,0.65)',
  muted2:       'rgba(8,74,138,0.55)',
  dim:          'rgba(8,74,138,0.45)',
  faint:        'rgba(8,74,138,0.35)',
  border:       'rgba(8,74,138,0.10)',
  borderLight:  'rgba(8,74,138,0.07)',
  navSolid:     'rgba(242,235,223,0.93)',
  label:        '#37a8de',
  expCardBg:    '#ffffff',
}

export const darkColors = {
  bg1:          '#0f172a',
  bg2:          '#111827',
  bg3:          '#0a1120',
  primary:      '#e2e8f0',
  accent:       '#38bdf8',
  card:         '#1e293b',
  muted:        'rgba(226,232,240,0.70)',
  muted2:       'rgba(226,232,240,0.55)',
  dim:          'rgba(226,232,240,0.42)',
  faint:        'rgba(226,232,240,0.28)',
  border:       'rgba(226,232,240,0.10)',
  borderLight:  'rgba(226,232,240,0.06)',
  navSolid:     'rgba(15,23,42,0.96)',
  label:        '#38bdf8',
  expCardBg:    '#1e293b',
}

export function AppProvider({ children }) {
  const [isDark, setIsDark] = useState(false)
  const [lang,   setLang]   = useState('pt')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  const c = isDark ? darkColors : lightColors
  const t = getTranslations(lang)

  return (
    <AppContext.Provider value={{ c, t, isDark, toggleDark: () => setIsDark(d => !d), lang, setLang }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
