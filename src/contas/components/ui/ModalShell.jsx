import { useEffect, useRef } from 'react'

import IconButton from './IconButton'

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function ModalShell({
  open,
  title,
  description,
  children,
  actions,
  onClose,
  size = 'md',
  closeOnBackdrop = true,
  showCloseButton = true,
  className = '',
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.setTimeout(() => dialogRef.current?.focus(), 0)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="c-v2-modal"
      role="presentation"
      onMouseDown={event => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose?.()
      }}
    >
      <section
        ref={dialogRef}
        className={cx('c-v2-modal__dialog', `c-v2-modal__dialog--${size}`, className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'c-v2-modal-title' : undefined}
        aria-describedby={description ? 'c-v2-modal-description' : undefined}
        tabIndex={-1}
      >
        {(title || description || showCloseButton) && (
          <header className="c-v2-modal__header">
            <div>
              {title && <h2 id="c-v2-modal-title" className="c-v2-modal__title">{title}</h2>}
              {description && <p id="c-v2-modal-description" className="c-v2-modal__description">{description}</p>}
            </div>
            {showCloseButton && <IconButton icon={<span>x</span>} label="Fechar" variant="ghost" size="sm" onClick={onClose} />}
          </header>
        )}
        <div className="c-v2-modal__body">{children}</div>
        {actions && <footer className="c-v2-modal__actions">{actions}</footer>}
      </section>
    </div>
  )
}
