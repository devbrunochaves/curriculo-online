import { useId } from 'react'

import FormField from './FormField'

export default function SelectField({
  label,
  value,
  options = [],
  placeholder,
  onChange,
  error,
  help,
  disabled = false,
  required = false,
  name,
  id,
  className = '',
}) {
  const generatedId = useId()
  const fieldId = id || `select-${generatedId}`

  return (
    <FormField label={label} htmlFor={fieldId} help={help} error={error} required={required} className={className}>
      <select
        id={fieldId}
        name={name}
        className="c-v2-select-field"
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}
