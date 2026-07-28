import { cloneElement, isValidElement, useId } from 'react'

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function FormField({
  label,
  htmlFor,
  help,
  error,
  required = false,
  children,
  className = '',
}) {
  const generatedId = useId()
  const fieldId = htmlFor || children?.props?.id || `field-${generatedId}`
  const descriptionId = help || error ? `${fieldId}-description` : undefined

  const child = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id || fieldId,
        'aria-describedby': descriptionId,
        'aria-invalid': error ? true : children.props['aria-invalid'],
      })
    : children

  return (
    <div className={cx('c-v2-form-field', error && 'has-error', className)}>
      {label && (
        <label className="c-v2-form-field__label" htmlFor={fieldId}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      {child}
      {(error || help) && (
        <p id={descriptionId} className={cx('c-v2-form-field__message', error && 'is-error')}>
          {error || help}
        </p>
      )}
    </div>
  )
}
