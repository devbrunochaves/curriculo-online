import Button from './Button'
import ModalShell from './ModalShell'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <ModalShell
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      size="sm"
      actions={(
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      )}
    />
  )
}
