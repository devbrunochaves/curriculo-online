import { useEffect, useRef, useState } from 'react'

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function DropdownMenu({
  open,
  anchorRef,
  items = [],
  onClose,
  align = 'end',
  className = '',
}) {
  const menuRef = useRef(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!open) return undefined

    const anchor = anchorRef?.current
    if (anchor) {
      const rect = anchor.getBoundingClientRect()
      const menuWidth = 220
      setPosition({
        top: rect.bottom + 8,
        left: align === 'start' ? rect.left : Math.max(12, rect.right - menuWidth),
      })
    }

    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose?.()
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const buttons = Array.from(menuRef.current?.querySelectorAll('button:not(:disabled)') || [])
        if (!buttons.length) return
        const currentIndex = buttons.indexOf(document.activeElement)
        const direction = event.key === 'ArrowDown' ? 1 : -1
        const nextIndex = currentIndex === -1
          ? 0
          : (currentIndex + direction + buttons.length) % buttons.length
        buttons[nextIndex]?.focus()
      }
    }

    const handlePointerDown = event => {
      if (!menuRef.current?.contains(event.target) && !anchorRef?.current?.contains(event.target)) {
        onClose?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    window.setTimeout(() => menuRef.current?.querySelector('button:not(:disabled)')?.focus(), 0)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [open, anchorRef, align, onClose])

  if (!open) return null

  return (
    <div
      ref={menuRef}
      className={cx('c-v2-dropdown-menu', `c-v2-dropdown-menu--${align}`, className)}
      style={position}
      role="menu"
    >
      {items.map((item, index) => (
        <button
          key={`${item.label}-${index}`}
          type="button"
          className={cx('c-v2-dropdown-menu__item', item.danger && 'is-danger')}
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            item.onClick?.()
            onClose?.()
          }}
        >
          {item.icon && <span className="c-v2-dropdown-menu__icon" aria-hidden="true">{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}
