'use client';

import { PopulationData } from '@/lib/population-data';

interface AgeDistributionChartProps {
  data: PopulationData;
}

export default function AgeDistributionChart({ data }: AgeDistributionChartProps) {
  const ageGroups = [
    { key: '0-24' as keyof PopulationData, label: '0-24', color: 'bg-blue-500' },
    { key: '25-34' as keyof PopulationData, label: '25-34', color: 'bg-green-500' },
    { key: '35-44' as keyof PopulationData, label: '35-44', color: 'bg-yellow-500' },
    { key: '45-69' as keyof PopulationData, label: '45-69', color: 'bg-orange-500' },
    { key: '70-79' as keyof PopulationData, label: '70-79', color: 'bg-red-500' },
    { key: '80+' as keyof PopulationData, label: '80+', color: 'bg-purple-500' }
  ];

  // Calculate percentages
  const total = data.SUM;
  const percentages = ageGroups.map(group => ({
    ...group,
    value: data[group.key] || 0,
    percentage: total > 0 ? ((data[group.key] || 0) / total) * 100 : 0
  }));

  return (
    <div className="mt-4">
      <div className="text-sm text-gray-600 mb-3">Aldersfordeling</div>
      <div className="space-y-2">
        {percentages.map((group) => (
          <div key={group.key} className="flex items-center space-x-3">
            <div className="w-12 text-xs text-gray-600">{group.label}</div>
            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${group.color} transition-all duration-300`}
                style={{ width: `${group.percentage}%` }}
              />
            </div>
            <div className="w-12 text-xs text-gray-600 text-right">
              {group.percentage.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
