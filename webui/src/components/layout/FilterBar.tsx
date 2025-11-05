import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Tag } from '../ui/Tag';
import { Button } from '../ui/Button';

export function FilterBar() {
  const { traffic, filters, addFilter, removeFilter, clearTraffic, selectedServices, toggleService } = useAppStore();
  const [inputValue, setInputValue] = useState('');

  // Extract unique service names from traffic
  const serviceNames = useMemo(() => {
    const services = new Set(traffic.map(entry => entry.service));
    return Array.from(services).sort();
  }, [traffic]);

  // Initialize only NEW services as selected (don't re-initialize existing ones)
  useEffect(() => {
    // Find services that are in serviceNames but not yet in selectedServices
    const newServices = serviceNames.filter(service => !selectedServices.has(service));

    // Only add new services, don't touch existing selections
    if (newServices.length > 0) {
      newServices.forEach(service => toggleService(service));
    }
  }, [serviceNames.join(',')]);

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
          {serviceNames.map((service) => {
            const isSelected = selectedServices.has(service);
            return (
              <span
                key={service}
                onClick={() => toggleService(service)}
                className={`inline-flex items-center px-1.5 py-0 text-xs font-normal rounded border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-white text-gray-700 border-gray-400 hover:bg-gray-50'
                    : 'bg-gray-100 text-gray-500 border-gray-300 italic hover:bg-gray-200'
                }`}
              >
                {service}
              </span>
            );
          })}

          {filters.map((filter) => {
            // Determine filter type for styling
            const isNegative = filter.startsWith('-');
            const isRegex = filter.startsWith('/') && filter.endsWith('/') && filter.length > 2;
            const isUrl = filter.startsWith('/') && !filter.endsWith('/');

            let bgColor = 'bg-blue-50';
            let textColor = 'text-blue-700';
            let borderColor = 'border-blue-300';

            if (isNegative) {
              bgColor = 'bg-red-50';
              textColor = 'text-red-700';
              borderColor = 'border-red-300';
            } else if (isRegex) {
              bgColor = 'bg-purple-50';
              textColor = 'text-purple-700';
              borderColor = 'border-purple-300';
            } else if (isUrl) {
              bgColor = 'bg-green-50';
              textColor = 'text-green-700';
              borderColor = 'border-green-300';
            }

            return (
              <span
                key={filter}
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${bgColor} ${textColor} ${borderColor}`}
              >
                {filter}
                <button
                  onClick={() => removeFilter(filter)}
                  className="hover:opacity-70"
                >
                  ×
                </button>
              </span>
            );
          })}
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
