function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className = '',
}) {
  return (
    <div className={cx('c-v2-empty-state', compact && 'c-v2-empty-state--compact', className)} role="status">
      {icon && <div className="c-v2-empty-state__icon" aria-hidden="true">{icon}</div>}
      {title && <h2 className="c-v2-empty-state__title">{title}</h2>}
      {description && <p className="c-v2-empty-state__description">{description}</p>}
      {(action || secondaryAction) && (
        <div className="c-v2-empty-state__actions">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}
