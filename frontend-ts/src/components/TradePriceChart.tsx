import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Trade, PricePoint } from '../types/api';
import { API_BASE_URL } from '../constants';

interface TradePriceChartProps {
  trade: Trade;
  symbol: string;
}

const TradePriceChart: React.FC<TradePriceChartProps> = ({ trade, symbol }) => {
  const [priceData, setPriceData] = useState<PricePoint[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      try {
        const entryDate = new Date(trade.entry_date);
        const exitDate = new Date(trade.exit_date);
        const start = new Date(entryDate.getTime() - 20 * 24 * 60 * 60 * 1000);
        const end = new Date(exitDate.getTime() + 20 * 24 * 60 * 60 * 1000);

        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        const response = await axios.get(
          `${API_BASE_URL}/api/price-data?symbol=${symbol}&start=${startStr}&end=${endStr}`
        );
        setPriceData(response.data.prices);
      } catch (err) {
        console.error('Failed to fetch price data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, [trade.entry_date, trade.exit_date, symbol]);

  if (loading) {
    return (
      <div className="mt-4 h-[200px] flex items-center justify-center text-gray-500 text-sm bg-white rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          Loading price chart...
        </div>
      </div>
    );
  }

  if (!priceData || priceData.length === 0) return null;

  // Normalize trade dates to YYYY-MM-DD for ReferenceLine matching
  const entryDateStr = trade.entry_date.split('T')[0];
  const exitDateStr = trade.exit_date.split('T')[0];

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Price Action Around Trade</h4>
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={priceData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={(d: string) => {
                const date = new Date(d);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
              stroke="#9ca3af"
              fontSize={11}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              stroke="#9ca3af"
              fontSize={11}
              width={55}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Close']}
              labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke="#6366f1"
              fill="#eef2ff"
              strokeWidth={2}
            />
            <ReferenceLine
              x={entryDateStr}
              stroke="#16a34a"
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{
                value: `Entry $${trade.entry_price.toFixed(2)}`,
                position: 'top',
                fontSize: 10,
                fill: '#16a34a',
                fontWeight: 600,
              }}
            />
            <ReferenceLine
              x={exitDateStr}
              stroke="#dc2626"
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{
                value: `Exit $${trade.exit_price.toFixed(2)}`,
                position: 'top',
                fontSize: 10,
                fill: '#dc2626',
                fontWeight: 600,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TradePriceChart;
