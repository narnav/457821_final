import React, { useState, useRef, useEffect } from 'react';
import { StockSymbol } from '../types/api';
import { STOCK_OPTIONS } from '../constants';
import { TrendingUpIcon, LightbulbIcon, ChevronDownIcon } from './Icons';
import { StockIcon } from './StockIcons';

interface StockSelectorProps {
  stockSymbol: StockSymbol;
  loading: boolean;
  onStockChange: (symbol: StockSymbol) => void;
}

const StockSelector: React.FC<StockSelectorProps> = ({ stockSymbol, loading, onStockChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedStock = STOCK_OPTIONS.find(s => s.symbol === stockSymbol);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (symbol: StockSymbol) => {
    onStockChange(symbol);
    setIsOpen(false);
  };

  return (
    <section className="bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-300 rounded-2xl p-6 mb-4">
      <div className="text-center mb-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <TrendingUpIcon className="w-5 h-5" />
          Select Stock/ETF
        </h3>
        <p className="text-sm text-gray-700">Choose different stocks to see how the ML strategy performs</p>
      </div>

      {/* Custom dropdown */}
      <div className="flex justify-center mb-4" ref={dropdownRef}>
        <div className="w-full max-w-2xl relative">
          {/* Trigger button */}
          <button
            onClick={() => !loading && setIsOpen(!isOpen)}
            disabled={loading}
            className={`w-full flex items-center justify-between px-5 py-3 bg-white border-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isOpen
                ? 'border-indigo-600 shadow-lg ring-2 ring-indigo-200'
                : 'border-indigo-400 hover:border-indigo-600 hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white shadow-sm border border-gray-200">
                <StockIcon symbol={stockSymbol} className="w-7 h-7" />
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">
                  <span className="text-indigo-600 font-bold">{selectedStock?.symbol}</span> — {selectedStock?.name}
                </p>
                <p className="text-xs text-gray-500">{selectedStock?.description}</p>
              </div>
            </div>
            <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown options */}
          {isOpen && (
            <div className="absolute z-20 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden animate-slide-down">
              {STOCK_OPTIONS.map(stock => (
                <button
                  key={stock.symbol}
                  onClick={() => handleSelect(stock.symbol)}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                    stock.symbol === stockSymbol
                      ? 'bg-indigo-50 border-l-4 border-indigo-600'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${
                    stock.symbol === stockSymbol
                      ? 'bg-indigo-100 shadow-sm border border-indigo-300'
                      : 'bg-white shadow-sm border border-gray-200'
                  }`}>
                    <StockIcon symbol={stock.symbol} className="w-7 h-7" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      <span className="text-indigo-600 font-bold">{stock.symbol}</span> — {stock.name}
                    </p>
                    <p className="text-xs text-gray-500">{stock.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 bg-white/80 rounded-lg p-3 text-gray-700">
        <LightbulbIcon className="w-4 h-4 text-yellow-600" />
        <span className="text-sm">Higher volatility stocks (like TSLA) show bigger differences between strategies</span>
      </div>
    </section>
  );
};

export default StockSelector;
