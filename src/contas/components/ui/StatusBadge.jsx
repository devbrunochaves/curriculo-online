function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function StatusBadge({
  children,
  tone = 'neutral',
  icon,
  size = 'md',
  className = '',
}) {
  return (
    <span className={cx('c-v2-status-badge', `c-v2-status-badge--${tone}`, `c-v2-status-badge--${size}`, className)}>
      {icon && <span className="c-v2-status-badge__icon" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  )
}
