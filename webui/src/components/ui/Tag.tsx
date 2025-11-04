interface TagProps {
  children: React.ReactNode;
  variant?: 'method' | 'status' | 'type' | 'service' | 'default';
  onRemove?: () => void;
  onClick?: () => void;
}

export function Tag({ children, variant = 'default', onRemove, onClick }: TagProps) {
  const variantClasses = {
    method: 'bg-blue-100 text-blue-700 border-blue-200',
    status: 'bg-gray-100 text-gray-700 border-gray-200',
    type: 'bg-purple-100 text-purple-700 border-purple-200',
    service: 'bg-green-100 text-green-700 border-green-200',
    default: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${variantClasses[variant]} ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      }`}
      onClick={onClick}
    >
      {children}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:text-red-600"
        >
          ×
        </button>
      )}
    </span>
  );
}
