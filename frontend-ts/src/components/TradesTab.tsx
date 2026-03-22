import React, { useState, useMemo } from 'react';
import { BacktestResponse, IndexedTrade, TradeFilter } from '../types/api';
import TradesList from './TradesList';
import { LightbulbIcon, TrendingUpIcon, AlertIcon } from './Icons';

interface TradesTabProps {
  backtestData: BacktestResponse;
}

const FILTER_OPTIONS: { value: TradeFilter; label: (count: number) => string; icon: React.FC<{ className?: string }> }[] = [
  { value: 'all', label: (n) => `All Trades (${n})`, icon: LightbulbIcon },
  { value: 'best', label: () => 'Best 10', icon: TrendingUpIcon },
  { value: 'worst', label: () => 'Worst 10', icon: AlertIcon },
];

const TradesTab: React.FC<TradesTabProps> = ({ backtestData }) => {
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>('all');

  const strategy = backtestData.strategy_type || 'conservative';
  const symbol = backtestData.symbol || 'SPY';

  const filteredTrades: IndexedTrade[] = useMemo(() => {
    const indexed = backtestData.trades.map((trade, i) => ({ originalIndex: i, trade }));

    if (tradeFilter === 'best') {
      return [...indexed].sort((a, b) => b.trade.pnl - a.trade.pnl).slice(0, 10);
    } else if (tradeFilter === 'worst') {
      return [...indexed].sort((a, b) => a.trade.pnl - b.trade.pnl).slice(0, 10);
    }
    return indexed;
  }, [backtestData.trades, tradeFilter]);

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-4 border-blue-600">
        All Trades
      </h2>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-5">
        {FILTER_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTradeFilter(value)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tradeFilter === value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label(backtestData.trades.length)}
          </button>
        ))}
      </div>

      <TradesList
        trades={filteredTrades}
        strategy={strategy}
        symbol={symbol}
      />
    </section>
  );
};

export default TradesTab;
