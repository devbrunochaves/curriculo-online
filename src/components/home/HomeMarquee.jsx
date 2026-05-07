import { hc } from '../../data/homeColors'
import { MARQUEE_ITEMS } from '../../data/homeData'

export default function HomeMarquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]

  return (
    <div style={{
      background: hc.dark,
      padding: '18px 0',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        animation: 'homeMarquee 24s linear infinite',
        width: 'max-content',
      }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '0 36px', whiteSpace: 'nowrap',
              color: 'rgba(255,255,255,0.50)',
              fontSize: 13, fontWeight: 600,
              letterSpacing: '1px', textTransform: 'uppercase',
            }}
          >
            {item}
            <span style={{ color: hc.accent, fontSize: 8 }}>●</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes homeMarquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .home-marquee-track { animation: none; }
        }
      `}</style>
    </div>
  )
}
