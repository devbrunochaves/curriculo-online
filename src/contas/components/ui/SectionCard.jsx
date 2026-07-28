function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function SectionCard({
  title,
  description,
  actions,
  children,
  variant = 'surface',
  padding = 'md',
  className = '',
}) {
  const hasHeader = title || description || actions

  return (
    <section className={cx('c-v2-section-card', `c-v2-section-card--${variant}`, `c-v2-section-card--pad-${padding}`, className)}>
      {hasHeader && (
        <header className="c-v2-section-card__header">
          <div>
            {title && <h2 className="c-v2-section-card__title">{title}</h2>}
            {description && <p className="c-v2-section-card__description">{description}</p>}
          </div>
          {actions && <div className="c-v2-section-card__actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
