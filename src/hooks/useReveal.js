import { useEffect, useRef, useState } from 'react'

/**
 * Hook que retorna [ref, visible].
 * Quando o elemento entra na viewport, `visible` vira true.
 * @param {number} delay - atraso em ms antes de revelar (para stagger)
 */
export function useReveal(delay = 0) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setTimeout(() => setVisible(true), delay)
          observer.disconnect()
          return () => clearTimeout(timer)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -55px 0px' }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [delay])

  return [ref, visible]
}
