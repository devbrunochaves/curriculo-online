// ── Cores do site de serviços (brunochaves.design) ────────────────────────────
export const hc = {
  bg:      '#F5F1EA',
  bg2:     '#EDE8DE',
  bg3:     '#E6E0D2',
  dark:    '#050D1A',
  dark2:   '#091428',
  dark3:   '#0d1c36',
  blue:    '#084a8a',
  accent:  '#37a8de',
  accent2: '#5bc4f5',
  white:   '#ffffff',
  muted:   'rgba(5,13,26,0.55)',
  border:  'rgba(8,74,138,0.10)',
  borderDark: 'rgba(255,255,255,0.08)',
  green:   '#25D366',
}

// Easing padrão (equivale ao ease de Framer Motion)
export const ease = [0.22, 1, 0.36, 1]

// Variantes reutilizáveis para Framer Motion
export const fadeUp = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
}

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease } },
}

export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease } },
}

export const staggerChildren = (stagger = 0.12) => ({
  hidden:  {},
  visible: { transition: { staggerChildren: stagger } },
})
