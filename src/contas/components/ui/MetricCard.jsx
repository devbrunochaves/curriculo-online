function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function MetricCard({
  label,
  value,
  description,
  delta,
  tone = 'neutral',
  icon,
  badge,
  children,
  className = '',
}) {
  return (
    <section className={cx('c-v2-metric-card', `c-v2-metric-card--${tone}`, className)}>
      <div className="c-v2-metric-card__top">
        {icon && <span className="c-v2-metric-card__icon" aria-hidden="true">{icon}</span>}
        {badge && <span className="c-v2-metric-card__badge">{badge}</span>}
      </div>
      {label && <p className="c-v2-metric-card__label">{label}</p>}
      <div className="c-v2-metric-card__value">{value}</div>
      {(description || delta) && (
        <div className="c-v2-metric-card__meta">
          {delta && <span className="c-v2-metric-card__delta">{delta}</span>}
          {description && <span>{description}</span>}
        </div>
      )}
      {children}
    </section>
  )
}
