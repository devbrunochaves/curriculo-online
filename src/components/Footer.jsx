import { personal } from '../data/resume'

export default function Footer() {
  return (
    <footer style={{
      padding: '24px',
      borderTop: '1px solid rgba(8,74,138,0.1)',
      background: '#E5DDD0',
      textAlign: 'center',
      color: 'rgba(8,74,138,0.45)',
      fontSize: 13,
    }}>
      © 2025 · {personal.name} · {personal.location} ·{' '}
      <a
        href={`mailto:${personal.email}`}
        style={{ color: '#37a8de', textDecoration: 'none', transition: 'color 0.2s' }}
        onMouseOver={e => e.target.style.color = '#084a8a'}
        onMouseOut={e => e.target.style.color = '#37a8de'}
      >
        {personal.email}
      </a>
    </footer>
  )
}
