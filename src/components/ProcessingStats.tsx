import React from 'react';
import { BarChart3, Clock, Target, Layers } from 'lucide-react';
import type { ProcessingResult } from '../types';

interface ProcessingStatsProps {
  stats: ProcessingResult;
}

export const ProcessingStats: React.FC<ProcessingStatsProps> = ({ stats }) => {
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
      1: 'Highest',
      2: 'High', 
      3: 'Medium',
      4: 'Low',
      5: 'Lowest',
    };
    return labels[priority as keyof typeof labels] || 'Unknown';
  };

  const replacementRate = stats.totalMatches > 0 
    ? Math.round((stats.totalReplacements / stats.totalMatches) * 100)
    : 0;

  return (
    <div className="card p-6">
      <h2 className="section-header flex items-center">
        <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
        Processing Statistics
      </h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="stats-card text-center">
          <div className="stats-number text-blue-600">{stats.totalMatches}</div>
          <div className="stats-label">Total Matches</div>
        </div>
        
        <div className="stats-card text-center">
          <div className="stats-number text-green-600">{stats.totalReplacements}</div>
          <div className="stats-label">Replacements Made</div>
          <div className="text-xs text-gray-500 mt-1">{replacementRate}% of matches</div>
        </div>
        
        <div className="stats-card text-center">
          <div className="stats-number text-purple-600">{stats.sectionsProcessed}</div>
          <div className="stats-label">Sections Processed</div>
        </div>
        
        <div className="stats-card text-center">
          <div className="stats-number text-orange-600">{Math.round(stats.processingTime)}ms</div>
          <div className="stats-label">Processing Time</div>
        </div>
      </div>
      
      {/* Priority Breakdown */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <Target className="w-4 h-4 mr-1" />
          Replacements by Priority
        </h3>
        <div className="space-y-2">
          {Object.entries(stats.replacementsByPriority)
            .filter(([_, count]) => count > 0)
            .map(([priority, count]) => {
              const priorityNum = parseInt(priority);
              const percentage = stats.totalReplacements > 0 
                ? Math.round((count / stats.totalReplacements) * 100)
                : 0;
              
              return (
                <div key={priority} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span className={`priority-badge ${getPriorityColor(priorityNum)}`}>
                      Priority {priority}
                    </span>
                    <span className="text-sm text-gray-600">
                      ({getPriorityLabel(priorityNum)})
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {count} ({percentage}%)
                  </div>
                </div>
              );
            })}
        </div>
        
        {Object.values(stats.replacementsByPriority).every(count => count === 0) && (
          <div className="text-center py-4 text-gray-500">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No replacements were made</p>
          </div>
        )}
      </div>
    </div>
  );
};