function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      className={cx('c-v2-button', `c-v2-button--${variant}`, `c-v2-button--${size}`, loading && 'is-loading', className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="c-v2-button__spinner" aria-hidden="true" />}
      {!loading && icon && iconPosition === 'left' && <span className="c-v2-button__icon" aria-hidden="true">{icon}</span>}
      <span className="c-v2-button__label">{children}</span>
      {!loading && icon && iconPosition === 'right' && <span className="c-v2-button__icon" aria-hidden="true">{icon}</span>}
    </button>
  )
}
