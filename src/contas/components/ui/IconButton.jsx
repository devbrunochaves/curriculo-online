function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function IconButton({
  icon,
  label,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  if (!label) {
    console.warn('IconButton requires a label prop for accessibility.')
  }

  return (
    <button
      type="button"
      className={cx('c-v2-icon-button', `c-v2-icon-button--${variant}`, `c-v2-icon-button--${size}`, className)}
      aria-label={label}
      title={label}
      disabled={disabled}
      {...props}
    >
      <span className="c-v2-icon-button__icon" aria-hidden="true">{icon}</span>
    </button>
  )
}
