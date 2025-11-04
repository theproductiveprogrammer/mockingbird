import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Tag } from '../ui/Tag';

export function FilterBar() {
  const { filters, addFilter, removeFilter, clearFilters } = useAppStore();
  const [inputValue, setInputValue] = useState('');

  const handleAddFilter = () => {
    if (inputValue.trim()) {
      addFilter(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddFilter();
    }
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-6 py-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 font-normal">Filters:</span>

        {filters.map((filter) => (
          <Tag key={filter} onRemove={() => removeFilter(filter)}>
            {filter}
          </Tag>
        ))}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add filter..."
          className="px-2 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent"
        />

        {filters.length > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
