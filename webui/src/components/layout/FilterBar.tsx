import { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Tag } from '../ui/Tag';
import { Button } from '../ui/Button';

export function FilterBar() {
  const { traffic, filters, addFilter, removeFilter, clearTraffic } = useAppStore();
  const [inputValue, setInputValue] = useState('');

  // Extract unique service names from traffic
  const serviceNames = useMemo(() => {
    const services = new Set(traffic.map(entry => entry.service));
    return Array.from(services).sort();
  }, [traffic]);

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

  const handleClear = () => {
    if (confirm('Clear all traffic history? This will remove all entries from view.')) {
      clearTraffic();
    }
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-6 py-2">
      <div className="flex items-center justify-between gap-4">
        {/* Left side: Service names and active filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {serviceNames.map((service) => (
            <Tag
              key={service}
              variant="service"
              onClick={() => addFilter(service)}
            >
              {service}
            </Tag>
          ))}

          {filters.map((filter) => (
            <Tag key={filter} onRemove={() => removeFilter(filter)}>
              {filter}
            </Tag>
          ))}
        </div>

        {/* Right side: Filter input and Clear button */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add filter..."
            className="px-2 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent"
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
