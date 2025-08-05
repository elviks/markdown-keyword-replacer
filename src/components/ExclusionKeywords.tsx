import React, { useState } from 'react';
import { Shield, Plus, X } from 'lucide-react';

interface ExclusionKeywordsProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
}

export const ExclusionKeywords: React.FC<ExclusionKeywordsProps> = ({
  keywords,
  onChange,
}) => {
  const [newKeyword, setNewKeyword] = useState('');

  const addKeyword = () => {
    if (!newKeyword.trim() || keywords.includes(newKeyword.trim())) return;
    
    onChange([...keywords, newKeyword.trim()]);
    setNewKeyword('');
  };

  const removeKeyword = (keyword: string) => {
    onChange(keywords.filter(k => k !== keyword));
  };

  return (
    <div>
      <h3 className="section-header">Exclusion Keywords</h3>
      
      {/* Add new keyword */}
      <div className="flex space-x-2 mb-4 p-3 bg-gray-50 rounded-lg border">
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          placeholder="Enter exclusion keyword"
          className="input-field flex-1"
          onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
        />
        <button
          onClick={addKeyword}
          disabled={!newKeyword.trim() || keywords.includes(newKeyword.trim())}
          className="btn-primary flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {/* Existing keywords */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {keywords.map((keyword) => (
          <div key={keyword} className="variant-item">
            <Shield className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-gray-800 flex-1">{keyword}</span>
            <button
              onClick={() => removeKeyword(keyword)}
              className="btn-danger"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {keywords.length === 0 && (
        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No exclusions added</p>
        </div>
      )}
    </div>
  );
};