import React from 'react';
import { StrategyType } from '../types/api';
import { STRATEGY_PARAMS } from '../constants';
import { ShieldIcon, BoltIcon, RocketIcon, ChartIcon } from './Icons';

interface StrategySelectorProps {
  strategyType: StrategyType;
  loading: boolean;
  showBuyHold: boolean;
  onStrategyChange: (strategy: StrategyType) => void;
  onShowBuyHoldChange: (show: boolean) => void;
}

const STRATEGIES: {
  id: StrategyType;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'conservative', label: 'Conservative', description: 'Lowest risk, selective', icon: ShieldIcon },
  { id: 'aggressive', label: 'Aggressive', description: 'Moderate risk, more trades', icon: BoltIcon },
  { id: 'ultra', label: 'Ultra Aggressive', description: 'Highest risk, max trades', icon: RocketIcon },
];

const StrategySelector: React.FC<StrategySelectorProps> = ({
  strategyType,
  loading,
  showBuyHold,
  onStrategyChange,
  onShowBuyHoldChange,
}) => {
  const params = STRATEGY_PARAMS[strategyType];

  const getButtonClasses = (id: StrategyType, isActive: boolean): string => {
    if (id === 'ultra') {
      return isActive
        ? 'bg-gradient-to-br from-red-600 to-red-700 text-white border-red-800 shadow-xl'
        : 'bg-gradient-to-br from-yellow-400 to-orange-500 border-orange-600 text-white hover:shadow-lg';
    }
    return isActive
      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-800 shadow-xl'
      : 'bg-white border-gray-300 text-gray-700 hover:border-blue-600 hover:shadow-lg';
  };

  return (
    <section className="bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300 rounded-2xl p-6">
      <div className="text-center mb-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <ChartIcon className="w-5 h-5" />
          Strategy Comparison
        </h3>
        <p className="text-sm text-gray-700">Compare three different trading strategies</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {STRATEGIES.map(strategy => (
          <button
            key={strategy.id}
            onClick={() => onStrategyChange(strategy.id)}
            disabled={loading}
            className={`p-5 rounded-xl border-2 transition-all ${getButtonClasses(
              strategy.id,
              strategyType === strategy.id
            )} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex flex-col items-center gap-2">
              <strategy.icon className="w-6 h-6" />
              <span className="text-lg font-bold">{strategy.label}</span>
              <span className="text-xs opacity-80">{strategy.description}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3 p-4 bg-white rounded-xl border border-gray-300 mb-4">
        <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700">Entry: {params.entry}</span>
        <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700">Hold: {params.hold}</span>
        <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700">Vol: {params.vol}</span>
        <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700">Cooldown: {params.cooldown}</span>
      </div>

      {/* Buy & Hold Toggle */}
      <div className="p-4 bg-white rounded-xl border-2 border-gray-300 text-center">
        <label className="flex items-center justify-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showBuyHold}
            onChange={(e) => onShowBuyHoldChange(e.target.checked)}
            className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
          />
          <span className="text-base font-medium text-gray-900">Show Buy & Hold Benchmark</span>
        </label>
        <p className="mt-2 text-xs text-gray-600 italic">
          Buy & Hold represents simply purchasing and holding the stock/ETF with no trading
        </p>
      </div>
    </section>
  );
};

export default StrategySelector;
