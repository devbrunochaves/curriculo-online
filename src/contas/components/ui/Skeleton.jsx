function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  className = '',
}) {
  const style = { width, height }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cx('c-v2-skeleton-stack', className)} aria-hidden="true">
        {Array.from({ length: lines }).map((_, index) => (
          <span
            key={index}
            className="c-v2-skeleton c-v2-skeleton--text"
            style={{ width: index === lines - 1 ? '72%' : width }}
          />
        ))}
      </div>
    )
  }

  return (
    <span
      className={cx('c-v2-skeleton', `c-v2-skeleton--${variant}`, className)}
      style={style}
      aria-hidden="true"
    />
  )
}
