import React from 'react';
import { Settings } from 'lucide-react';
import type { ProcessingOptions } from '../types';

interface ProcessingSettingsProps {
  options: ProcessingOptions;
  onChange: (options: ProcessingOptions) => void;
}

export const ProcessingSettings: React.FC<ProcessingSettingsProps> = ({
  options,
  onChange,
}) => {
  const updateOption = <K extends keyof ProcessingOptions>(
    key: K,
    value: ProcessingOptions[K]
  ) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="space-y-3">
      {/* Skip Headers */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Skip Headers</span>
        <button
          type="button"
          onClick={() => updateOption('skipHeaders', !options.skipHeaders)}
          className={`toggle-switch ${options.skipHeaders ? 'enabled' : ''}`}
        >
          <span className={`toggle-thumb ${options.skipHeaders ? 'enabled' : ''}`} />
        </button>
      </div>

      {/* Skip Tables */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Skip Tables</span>
        <button
          type="button"
          onClick={() => updateOption('skipTables', !options.skipTables)}
          className={`toggle-switch ${options.skipTables ? 'enabled' : ''}`}
        >
          <span className={`toggle-thumb ${options.skipTables ? 'enabled' : ''}`} />
        </button>
      </div>

      {/* Section Tail Mode */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Tail Mode</span>
        <button
          type="button"
          onClick={() => updateOption('sectionTailMode', !options.sectionTailMode)}
          className={`toggle-switch ${options.sectionTailMode ? 'enabled' : ''}`}
        >
          <span className={`toggle-thumb ${options.sectionTailMode ? 'enabled' : ''}`} />
        </button>
      </div>

      {/* Tail Skip Amount */}
      {options.sectionTailMode && (
        <div className="p-3 bg-gray-50 rounded-lg border">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Skip: {options.tailSkipAmount}%
          </label>
          <input
            type="range"
            min="10"
            max="75"
            step="5"
            value={options.tailSkipAmount}
            onChange={(e) => updateOption('tailSkipAmount', Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};