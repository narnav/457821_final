import React from 'react';
import { Metrics } from '../types/api';
import { TrendingUpIcon, AlertIcon, ChartIcon } from './Icons';

interface MetricsCardProps {
  title: string;
  metrics: Metrics;
  type: 'strategy' | 'baseline';
}

const MetricsCard: React.FC<MetricsCardProps> = ({ title, metrics, type }) => {
  const formatPercent = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getColorClass = (value: number, metric: string): string => {
    if (metric === 'total_return') return value > 0 ? 'text-green-600' : 'text-red-600';
    if (metric === 'max_drawdown') return 'text-red-600';
    if (metric === 'sharpe_ratio') return value > 1 ? 'text-green-600' : value > 0 ? 'text-yellow-600' : 'text-red-600';
    return 'text-gray-900';
  };

  const isStrategy = type === 'strategy';

  const headerGradient = isStrategy
    ? 'from-blue-600 to-indigo-700'
    : 'from-green-600 to-emerald-700';

  const ROWS = [
    { label: 'Total Return', key: 'total_return' as const, icon: TrendingUpIcon, format: formatPercent },
    { label: 'Max Drawdown', key: 'max_drawdown' as const, icon: AlertIcon, format: formatPercent },
    { label: 'Sharpe Ratio', key: 'sharpe_ratio' as const, icon: ChartIcon, format: (v: number) => v.toFixed(2) },
  ];

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className={`bg-gradient-to-r ${headerGradient} px-5 py-3.5 flex items-center gap-2.5`}>
        {isStrategy ? (
          <ChartIcon className="w-5 h-5 text-white/80" />
        ) : (
          <TrendingUpIcon className="w-5 h-5 text-white/80" />
        )}
        <h3 className="text-white font-bold text-sm">{title}</h3>
      </div>

      {/* Metrics rows */}
      <div className="divide-y divide-gray-100">
        {ROWS.map(({ label, key, icon: Icon, format }) => {
          const value = metrics[key];
          return (
            <div key={key} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{label}</span>
              </div>
              <span className={`text-base font-bold font-mono ${getColorClass(value, key)}`}>
                {format(value)}
              </span>
            </div>
          );
        })}

        {metrics.num_trades != null && (
          <div className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 flex items-center justify-center text-gray-400 text-xs font-bold">#</span>
              <span className="text-sm text-gray-600">Number of Trades</span>
            </div>
            <span className="text-base font-bold font-mono text-gray-900">
              {metrics.num_trades}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsCard;
