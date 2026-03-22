import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { FeatureComparison as FeatureComparisonType } from '../types/api';
import { ArrowUpIcon, ArrowDownIcon, LightbulbIcon } from './Icons';

interface FeatureComparisonProps {
  data: FeatureComparisonType;
}

interface ChartDataPoint {
  feature: string;
  featureKey: string;
  winning: number;
  losing: number;
  diff: number;
  diffPercent: number;
}

const FEATURE_LABELS: Record<string, string> = {
  return_5d: '5-Day Return',
  return_20d: '20-Day Return',
  ma_ratio: 'MA Ratio',
  trend_slope_20d: 'Trend Slope',
  rsi: 'RSI',
  atr: 'Norm. ATR',
  volatility_20d: '20-Day Volatility',
  regime_stress: 'Stress Flag',
  relative_strength_spy: 'Rel. Strength vs SPY',
};

const FeatureComparison: React.FC<FeatureComparisonProps> = ({ data }) => {
  const chartData: ChartDataPoint[] = Object.entries(data).map(([feature, values]) => {
    const diff = values.winning - values.losing;
    const diffPercent = (diff / Math.abs(values.losing || 1)) * 100;
    return {
      feature: FEATURE_LABELS[feature] || feature.replace(/_/g, ' '),
      featureKey: feature,
      winning: values.winning,
      losing: values.losing,
      diff,
      diffPercent,
    };
  });

  // Sort insights by absolute diff magnitude for most impactful first
  const sortedInsights = [...chartData].sort((a, b) => Math.abs(b.diffPercent) - Math.abs(a.diffPercent));

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Average Feature Values at Entry</h4>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="feature"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 11, fill: '#6b7280' }}
            />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                padding: '12px 16px',
              }}
              formatter={(value: number, name: string) => [
                value.toFixed(4),
                name === 'winning' ? 'Winning Trades' : 'Losing Trades',
              ]}
              labelStyle={{ fontWeight: 700, marginBottom: 4 }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 16 }}
              formatter={(value: string) => (
                <span className="text-sm font-medium text-gray-700">
                  {value === 'winning' ? 'Winning Trades' : 'Losing Trades'}
                </span>
              )}
            />
            <Bar dataKey="winning" name="winning" radius={[6, 6, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`win-${index}`} fill="#059669" fillOpacity={0.85} />
              ))}
            </Bar>
            <Bar dataKey="losing" name="losing" radius={[6, 6, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`lose-${index}`} fill="#dc2626" fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insights Cards */}
      <div>
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <LightbulbIcon className="w-4 h-4 text-blue-600" />
          Feature Insights (sorted by impact)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedInsights.map(({ feature, featureKey, winning, losing, diff, diffPercent }) => {
            const isHigher = diff > 0;
            return (
              <div
                key={featureKey}
                className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${
                  isHigher
                    ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:border-green-300'
                    : 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50 hover:border-red-300'
                }`}
              >
                {/* Top row: icon + feature name */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1 rounded-md ${isHigher ? 'bg-green-100' : 'bg-red-100'}`}>
                    {isHigher ? (
                      <ArrowUpIcon className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <ArrowDownIcon className="w-3.5 h-3.5 text-red-600" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-900">{feature}</span>
                </div>

                {/* Values row */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <div>
                    <span className="text-gray-400 font-medium">Win: </span>
                    <span className="font-mono font-semibold text-green-700">{winning.toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Lose: </span>
                    <span className="font-mono font-semibold text-red-700">{losing.toFixed(4)}</span>
                  </div>
                </div>

                {/* Difference badge */}
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  isHigher ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {isHigher ? '+' : ''}{diffPercent.toFixed(1)}% in winners
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interpretation Footer */}
      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
        <div className="flex gap-3">
          <LightbulbIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700 leading-relaxed">
            <strong className="text-gray-900">How to read this:</strong> Features with large percentage differences
            between winning and losing trades are the strongest predictors. Green cards indicate
            features that tend to be <strong>higher</strong> when the model wins; red cards indicate features that
            tend to be <strong>lower</strong>. The chart and cards show <em>averages</em> &mdash; individual trades will vary.
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureComparison;
