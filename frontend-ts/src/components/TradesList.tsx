import React, { useState } from 'react';
import axios from 'axios';
import { IndexedTrade, TradeExplanation, StrategyType, StockSymbol } from '../types/api';
import { API_BASE_URL } from '../constants';
import { ChevronDownIcon, ChevronUpIcon, LightbulbIcon } from './Icons';

interface TradesListProps {
  trades: IndexedTrade[];
  strategy: StrategyType | string;
  symbol: StockSymbol | string;
}

const TradesList: React.FC<TradesListProps> = ({ trades, strategy, symbol }) => {
  const [expandedTrade, setExpandedTrade] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState<boolean>(false);

  const handleExplainClick = async (originalIndex: number) => {
    if (expandedTrade === originalIndex) {
      setExpandedTrade(null);
      setExplanation(null);
      return;
    }

    setExpandedTrade(originalIndex);
    setLoadingExplanation(true);

    try {
      const response = await axios.get<TradeExplanation>(
        `${API_BASE_URL}/api/trades/${originalIndex}/explain?strategy=${strategy}&symbol=${symbol}`
      );
      setExplanation(response.data.explanation);
    } catch (err) {
      console.error('Failed to fetch trade explanation:', err);
      setExplanation('Failed to load explanation. Please try again.');
    } finally {
      setLoadingExplanation(false);
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-500">#</th>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-500">Entry Date</th>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-500">Exit Date</th>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-500">Entry Price</th>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-500">Exit Price</th>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-500">P&L</th>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-500">Probability</th>
            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-gray-500">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {trades.map(({ originalIndex, trade }) => (
            <React.Fragment key={originalIndex}>
              <tr
                className={`${
                  trade.pnl > 0
                    ? 'bg-green-50 hover:bg-green-100'
                    : 'bg-red-50 hover:bg-red-100'
                } transition-colors cursor-pointer ${
                  expandedTrade === originalIndex ? 'ring-2 ring-blue-400 ring-inset' : ''
                }`}
                onClick={() => handleExplainClick(originalIndex)}
              >
                <td className="px-4 py-3 text-sm text-gray-500 font-mono">{originalIndex + 1}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{new Date(trade.entry_date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{new Date(trade.exit_date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm text-gray-700 font-mono">${trade.entry_price.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-gray-700 font-mono">${trade.exit_price.toFixed(2)}</td>
                <td className={`px-4 py-3 text-sm font-semibold font-mono ${
                  trade.pnl > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(trade.pnl * 100).toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 font-mono">{(trade.bullish_prob * 100).toFixed(1)}%</td>
                <td className="px-4 py-3">
                  <button
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      expandedTrade === originalIndex
                        ? 'bg-gray-500 text-white hover:bg-gray-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExplainClick(originalIndex);
                    }}
                  >
                    {expandedTrade === originalIndex ? (
                      <>
                        <ChevronUpIcon className="w-4 h-4" />
                        Hide
                      </>
                    ) : (
                      <>
                        <ChevronDownIcon className="w-4 h-4" />
                        Explain
                      </>
                    )}
                  </button>
                </td>
              </tr>

              {expandedTrade === originalIndex && (
                <tr>
                  <td colSpan={8} className="p-0">
                    <div className="animate-slide-down bg-blue-50 border-2 border-blue-200 rounded-xl mx-2 mb-2 p-5">
                      {loadingExplanation ? (
                        <div className="flex items-center justify-center gap-3 py-6 text-gray-500">
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                          <span className="text-sm">Loading explanation...</span>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-3">
                            <h4 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                              <LightbulbIcon className="w-5 h-5 text-blue-600" />
                              AI Analysis
                            </h4>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <span>
                                <strong className="text-gray-700">Entry:</strong>{' '}
                                {new Date(trade.entry_date).toLocaleDateString()}
                              </span>
                              <span>
                                <strong className="text-gray-700">Exit:</strong>{' '}
                                {new Date(trade.exit_date).toLocaleDateString()}
                              </span>
                              <span>
                                <strong className="text-gray-700">Result:</strong>{' '}
                                <span className={`font-semibold ${trade.pnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {(trade.pnl * 100).toFixed(2)}%
                                </span>
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 leading-relaxed bg-white rounded-lg p-4 border-l-4 border-blue-600 whitespace-pre-line">
                            {explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TradesList;
