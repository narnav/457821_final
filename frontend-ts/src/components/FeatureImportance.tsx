import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FeatureImportance as FeatureImportanceType, FeatureImportanceResponse } from '../types/api';
import { API_BASE_URL } from '../constants';

interface ChartDataPoint {
  name: string;
  value: number;
  coefficient: number;
}

const FeatureImportance: React.FC = () => {
  const [data, setData] = useState<FeatureImportanceType[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFeatureImportance = async (): Promise<void> => {
      try {
        const response = await axios.get<FeatureImportanceResponse>(`${API_BASE_URL}/api/feature-importance`);
        setData(response.data.features);
      } catch (err) {
        console.error('Failed to fetch feature importance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatureImportance();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-12 text-gray-500">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-sm">Loading feature importance...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-red-500 font-medium">
        Failed to load feature importance
      </div>
    );
  }

  const chartData: ChartDataPoint[] = data.map(f => ({
    name: f.name.replace(/_/g, ' ').toUpperCase(),
    value: f.abs_importance,
    coefficient: f.coefficient
  }));

  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 11 }}
            />
            <YAxis label={{ value: 'Importance', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Bar dataKey="value" name="Importance" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-500">Feature</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-500">Coefficient</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-500">Importance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((feature, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-700 font-medium capitalize">
                  {feature.name.replace(/_/g, ' ')}
                </td>
                <td className={`px-4 py-3 text-sm font-semibold font-mono ${
                  feature.coefficient > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {feature.coefficient > 0 ? '+' : ''}{feature.coefficient.toFixed(4)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                  {feature.abs_importance.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Interpretation */}
      <div className="bg-blue-50 border-l-4 border-blue-600 rounded-xl p-5">
        <h4 className="text-base font-bold text-gray-900 mb-3">How to Interpret:</h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="text-green-600 font-bold">+</span>
            <span><strong>Positive coefficient:</strong> Higher values increase bullish probability</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-600 font-bold">&minus;</span>
            <span><strong>Negative coefficient:</strong> Higher values decrease bullish probability</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600 font-bold">|x|</span>
            <span><strong>Importance:</strong> Absolute value shows feature's overall impact on predictions</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FeatureImportance;
