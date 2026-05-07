import { useState, useEffect, useCallback } from 'react'

const NAV_EVENT = 'app:navigate'

export function useRouter() {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    const sync = () => setPath(window.location.pathname)
    window.addEventListener('popstate', sync)
    window.addEventListener(NAV_EVENT, sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener(NAV_EVENT, sync)
    }
  }, [])

  const navigate = useCallback((to) => {
    window.history.pushState(null, '', to)
    window.dispatchEvent(new Event(NAV_EVENT))
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return { path, navigate }
}
