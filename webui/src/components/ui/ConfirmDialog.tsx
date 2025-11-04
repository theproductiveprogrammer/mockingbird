import { Button } from './Button';

interface ConfirmDialogProps {
  title: string;
  message: string;
  details?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  title,
  message,
  details,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg w-full max-w-md">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <h2 className="text-sm font-medium text-gray-900">{title}</h2>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-700 mb-3">{message}</p>
          {details && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
              <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                {details}
              </pre>
            </div>
          )}
          <p className="text-xs text-gray-500 italic">This cannot be undone.</p>
        </div>

        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className={variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
