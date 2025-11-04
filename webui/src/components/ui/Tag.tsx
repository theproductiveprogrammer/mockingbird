interface TagProps {
  children: React.ReactNode;
  variant?: 'method' | 'status' | 'type' | 'service' | 'default';
  onRemove?: () => void;
  onClick?: () => void;
}

export function Tag({ children, variant = 'default', onRemove, onClick }: TagProps) {
  const variantClasses = {
    method: 'bg-transparent text-gray-500 border-gray-300',
    status: 'bg-transparent text-gray-500 border-gray-300',
    type: 'bg-transparent text-gray-500 border-gray-300',
    service: 'bg-transparent text-gray-500 border-gray-300',
    default: 'bg-transparent text-gray-500 border-gray-300',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0 text-xs font-normal rounded border ${variantClasses[variant]} ${
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
