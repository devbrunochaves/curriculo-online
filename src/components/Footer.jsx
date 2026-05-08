'use client'
import { useApp } from '../context/AppContext'

export default function Footer() {
  const { c, t } = useApp()

  return (
    <footer style={{
      padding: '24px',
      borderTop: `1px solid ${c.border}`,
      background: c.bg3,
      textAlign: 'center',
      color: c.dim,
      fontSize: 13,
      transition: 'background 0.3s',
    }}>
      {t.footer.copy}{' '}
      <a
        href="mailto:brunochavesuk@icloud.com"
        style={{ color: c.accent, textDecoration: 'none', transition: 'color 0.2s' }}
        onMouseOver={e => e.currentTarget.style.color = c.primary}
        onMouseOut={e => e.currentTarget.style.color = c.accent}
      >
        brunochavesuk@icloud.com
      </a>
    </footer>
  )
}
