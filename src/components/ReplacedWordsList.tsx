import React from 'react';
import { Eye, ArrowRight, Hash } from 'lucide-react';
import type { ProcessingResult } from '../types';

interface ReplacedWordsListProps {
  stats: ProcessingResult | null;
  mainKeyword: string;
}

export const ReplacedWordsList: React.FC<ReplacedWordsListProps> = ({ stats, mainKeyword }) => {
  if (!stats || !stats.replacements || stats.replacements.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="section-header flex items-center">
          <Eye className="w-5 h-5 mr-2 text-blue-600" />
          Replaced Words
        </h2>
        <div className="text-center py-8 text-gray-500">
          <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No words have been replaced yet</p>
        </div>
      </div>
    );
  }

  // Group replacements by the replacement text
  const groupedReplacements = stats.replacements.reduce((acc, replacement) => {
    const key = replacement.replacement;
    if (!acc[key]) {
      acc[key] = {
        replacement: replacement.replacement,
        original: replacement.original,
        count: 0,
        lines: []
      };
    }
    acc[key].count++;
    acc[key].lines.push(replacement.position); // position is now line number
    return acc;
  }, {} as Record<string, { replacement: string; original: string; count: number; lines: number[] }>);

  const replacementEntries = Object.values(groupedReplacements);

  return (
    <div className="card p-6">
      <h2 className="section-header flex items-center">
        <Eye className="w-5 h-5 mr-2 text-blue-600" />
        Replaced Words
        <span className="ml-auto bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-medium">
          {stats.totalReplacements} total
        </span>
      </h2>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {replacementEntries.map((entry, index) => (
          <div key={index} className="variant-item">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-mono text-sm bg-red-100 text-red-800 px-2 py-1 rounded border">
                  {mainKeyword}
                </span>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <span className="font-mono text-sm bg-green-100 text-green-800 px-2 py-1 rounded border">
                  {entry.replacement}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Lines: {entry.lines.sort((a, b) => a - b).join(', ')}
              </div>
            </div>
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
              {entry.count}x
            </span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="stats-card">
            <div className="stats-number text-red-600">{mainKeyword}</div>
            <div className="stats-label">Original</div>
          </div>
          <div className="stats-card">
            <div className="stats-number text-blue-600">{replacementEntries.length}</div>
            <div className="stats-label">Variants</div>
          </div>
          <div className="stats-card">
            <div className="stats-number text-green-600">{stats.totalReplacements}</div>
            <div className="stats-label">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
};