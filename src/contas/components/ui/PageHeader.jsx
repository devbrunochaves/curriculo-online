function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function PageHeader({
  title,
  description,
  eyebrow,
  meta,
  actions,
  children,
  sticky = false,
  className = '',
}) {
  return (
    <header className={cx('c-v2-page-header', sticky && 'c-v2-page-header--sticky', className)}>
      <div className="c-v2-page-header__content">
        {eyebrow && <p className="c-v2-page-header__eyebrow">{eyebrow}</p>}
        <div className="c-v2-page-header__title-row">
          {title && <h1 className="c-v2-page-header__title">{title}</h1>}
          {meta && <div className="c-v2-page-header__meta">{meta}</div>}
        </div>
        {description && <p className="c-v2-page-header__description">{description}</p>}
        {children}
      </div>
      {actions && <div className="c-v2-page-header__actions">{actions}</div>}
    </header>
  )
}
