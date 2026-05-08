'use client'
import { useReveal } from '../hooks/useReveal'

/**
 * Wrapper de scroll-reveal.
 * Envolva qualquer elemento com <Reveal> para ele aparecer suavemente ao rolar.
 *
 * @param {number}  delay     - atraso em ms (útil para efeito stagger)
 * @param {string}  className - classes extras
 */
export default function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useReveal(delay)

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'visible' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
