import React, { useState } from 'react';
import { Plus, X, Hash } from 'lucide-react';
import type { KeywordVariant } from '../types';

interface KeywordVariantInputProps {
  variants: KeywordVariant[];
  onChange: (variants: KeywordVariant[]) => void;
}

export const KeywordVariantInput: React.FC<KeywordVariantInputProps> = ({
  variants,
  onChange,
}) => {
  const [newVariantText, setNewVariantText] = useState('');
  const [newVariantPriority, setNewVariantPriority] = useState<1 | 2 | 3 | 4 | 5>(3);

  const addVariant = () => {
    if (!newVariantText.trim()) return;

    const newVariant: KeywordVariant = {
      id: Date.now().toString(),
      text: newVariantText.trim(),
      priority: newVariantPriority,
    };

    onChange([...variants, newVariant]);
    setNewVariantText('');
    setNewVariantPriority(3);
  };

  const removeVariant = (id: string) => {
    onChange(variants.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, updates: Partial<KeywordVariant>) => {
    onChange(variants.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const getPriorityColor = (priority: number) => {
    const colors = {
      1: 'priority-1',
      2: 'priority-2',
      3: 'priority-3',
      4: 'priority-4',
      5: 'priority-5',
    };
    return colors[priority as keyof typeof colors] || 'priority-3';
  };

  const getPriorityLabel = (priority: number) => {
    const labels = {
      1: '50%',
      2: '25%',
      3: '15%',
      4: '7%',
      5: '3%',
    };
    return labels[priority as keyof typeof labels] || '15%';
  };

  return (
    <div>
      <h3 className="section-header">Keyword Variants</h3>
      
      {/* Add new variant */}
      <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg border">
        <input
          type="text"
          value={newVariantText}
          onChange={(e) => setNewVariantText(e.target.value)}
          placeholder="Enter keyword variant"
          className="input-field"
          onKeyPress={(e) => e.key === 'Enter' && addVariant()}
        />
        
        <div className="flex items-center space-x-2">
          <select
            value={newVariantPriority}
            onChange={(e) => setNewVariantPriority(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
            className="input-field flex-1"
          >
            <option value={1}>Priority 1 (50%)</option>
            <option value={2}>Priority 2 (25%)</option>
            <option value={3}>Priority 3 (15%)</option>
            <option value={4}>Priority 4 (7%)</option>
            <option value={5}>Priority 5 (3%)</option>
          </select>
          
          <button
            onClick={addVariant}
            disabled={!newVariantText.trim()}
            className="btn-primary flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Existing variants */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {variants.map((variant) => (
          <div key={variant.id} className="variant-item">
            <Hash className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <input
              type="text"
              value={variant.text}
              onChange={(e) => updateVariant(variant.id, { text: e.target.value })}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
            />
            
            <select
              value={variant.priority}
              onChange={(e) => updateVariant(variant.id, { priority: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
            
            <span className={`priority-badge ${getPriorityColor(variant.priority)}`}>
              {getPriorityLabel(variant.priority)}
            </span>
            
            <button
              onClick={() => removeVariant(variant.id)}
              className="btn-danger"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {variants.length === 0 && (
        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No variants added yet</p>
        </div>
      )}
    </div>
  );
};