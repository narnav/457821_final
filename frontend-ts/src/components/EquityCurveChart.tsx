import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EquityPoint } from '../types/api';

interface EquityCurveChartProps {
  data: EquityPoint[];
  showBuyHold?: boolean;
}

const EquityCurveChart: React.FC<EquityCurveChartProps> = ({ data, showBuyHold = true }) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const chartKey = React.useMemo(() => {
    return data.length > 0 ? `${data[0].equity}-${data[data.length - 1].equity}-${showBuyHold}` : 'chart';
  }, [data, showBuyHold]);

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart 
          key={chartKey}
          data={data} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            stroke="#666"
          />
          <YAxis 
            tickFormatter={formatCurrency}
            stroke="#666"
          />
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="equity" 
            stroke="#2563eb" 
            strokeWidth={2}
            name="ML Strategy"
            dot={false}
            isAnimationActive={true}
          />
          {showBuyHold && (
            <Line 
              type="monotone" 
              dataKey="buy_hold" 
              stroke="#059669" 
              strokeWidth={2}
              name="Buy & Hold"
              dot={false}
              strokeDasharray="5 5"
              isAnimationActive={true}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EquityCurveChart;