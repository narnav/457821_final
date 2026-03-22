import React from 'react';
import { BacktestResponse, StrategyType } from '../types/api';
import MetricsCard from './MetricsCard';
import EquityCurveChart from './EquityCurveChart';
import { CheckCircleIcon, XCircleIcon, TargetIcon, ChartIcon } from './Icons';

interface OverviewTabProps {
  backtestData: BacktestResponse;
  strategyType: StrategyType;
  showBuyHold: boolean;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ backtestData, strategyType, showBuyHold }) => {
  const totalTrades = backtestData.metrics.num_trades || 0;
  const winRate = totalTrades > 0
    ? (backtestData.winning_trades / totalTrades) * 100
    : 0;

  const SUMMARY_STATS = [
    {
      label: 'Total Trades',
      value: totalTrades,
      icon: ChartIcon,
      color: 'blue' as const,
      subtitle: 'positions opened',
    },
    {
      label: 'Winning',
      value: backtestData.winning_trades,
      icon: CheckCircleIcon,
      color: 'green' as const,
      subtitle: 'profitable trades',
    },
    {
      label: 'Losing',
      value: backtestData.losing_trades,
      icon: XCircleIcon,
      color: 'red' as const,
      subtitle: 'unprofitable trades',
    },
    {
      label: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      icon: TargetIcon,
      color: (winRate >= 50 ? 'green' : 'red') as 'green' | 'red',
      subtitle: winRate >= 50 ? 'above breakeven' : 'below breakeven',
    },
  ];

  const colorMap = {
    blue: {
      ring: 'ring-blue-200',
      bg: 'bg-blue-50',
      icon: 'text-blue-600 bg-blue-100',
      value: 'text-blue-700',
      bar: 'bg-blue-500',
    },
    green: {
      ring: 'ring-green-200',
      bg: 'bg-green-50',
      icon: 'text-green-600 bg-green-100',
      value: 'text-green-700',
      bar: 'bg-green-500',
    },
    red: {
      ring: 'ring-red-200',
      bg: 'bg-red-50',
      icon: 'text-red-600 bg-red-100',
      value: 'text-red-700',
      bar: 'bg-red-500',
    },
  };

  return (
    <>
      {/* Performance Metrics */}
      <section className="mb-8">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ChartIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Performance Metrics</h2>
            <p className="text-xs text-gray-500">Strategy vs benchmark comparison</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <MetricsCard
            title={`ML Strategy (${strategyType.charAt(0).toUpperCase() + strategyType.slice(1)})`}
            metrics={backtestData.metrics}
            type="strategy"
          />
          {showBuyHold && (
            <MetricsCard
              title="Buy & Hold (Benchmark)"
              metrics={backtestData.buy_hold_metrics}
              type="baseline"
            />
          )}
        </div>
      </section>

      {/* Equity Curve */}
      <section className="mb-8">
        <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Equity Curve</h2>
            <p className="text-xs text-gray-500 mt-0.5">Portfolio value over time &mdash; starting from $10,000</p>
          </div>
          <div className="p-4">
            <EquityCurveChart
              data={backtestData.equity_curve}
              showBuyHold={showBuyHold}
            />
          </div>
        </div>
      </section>

      {/* Trade Summary */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <TargetIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Trade Summary</h2>
            <p className="text-xs text-gray-500">Overview of all positions taken</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SUMMARY_STATS.map(({ label, value, icon: Icon, color, subtitle }) => {
            const c = colorMap[color];
            // For the proportion bar: what fraction of total does this stat represent
            const barWidth = label === 'Win Rate'
              ? winRate
              : label === 'Total Trades'
                ? 100
                : totalTrades > 0
                  ? (Number(value) / totalTrades) * 100
                  : 0;

            return (
              <div
                key={label}
                className={`relative overflow-hidden rounded-2xl ${c.bg} ring-1 ${c.ring} p-5 text-center transition-all hover:shadow-md`}
              >
                <div className={`inline-flex items-center justify-center p-2 rounded-xl ${c.icon} mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-3xl font-bold ${c.value} font-mono`}>{value}</p>
                <p className="text-[10px] text-gray-400 mt-1">{subtitle}</p>

                {/* Proportion bar */}
                <div className="mt-3 h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${c.bar} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(barWidth, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
};

export default OverviewTab;
