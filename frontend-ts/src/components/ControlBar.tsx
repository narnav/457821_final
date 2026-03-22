import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StrategyType, StockSymbol } from '../types/api';
import { STOCK_OPTIONS, STRATEGY_PARAMS, STRATEGY_ICONS, STRATEGY_LABELS } from '../constants';
import { ChevronDownIcon } from './Icons';
import { StockIcon } from './StockIcons';
import StockSelector from './StockSelector';
import StrategySelector from './StrategySelector';

interface ControlBarProps {
  stockSymbol: StockSymbol;
  strategyType: StrategyType;
  loading: boolean;
  showBuyHold: boolean;
  onStockChange: (symbol: StockSymbol) => void;
  onStrategyChange: (strategy: StrategyType) => void;
  onShowBuyHoldChange: (show: boolean) => void;
}

const ControlBar: React.FC<ControlBarProps> = ({
  stockSymbol,
  strategyType,
  loading,
  showBuyHold,
  onStockChange,
  onStrategyChange,
  onShowBuyHoldChange,
}) => {
  // 0 = fully expanded, 1 = fully compact
  const [collapseProgress, setCollapseProgress] = useState(0);
  const [stockDropdownOpen, setStockDropdownOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Smooth scroll-linked collapse: measure how far the sentinel has scrolled
  // past its resting position and map it to a 0→1 progress value
  const updateProgress = useCallback(() => {
    const sentinel = sentinelRef.current;
    const expanded = expandedRef.current;
    if (!sentinel || !expanded) return;

    const sentinelRect = sentinel.getBoundingClientRect();
    // How far above the viewport top the sentinel has gone
    const scrolledPast = -sentinelRect.top;
    // Use the expanded panel's height as the transition range
    const expandedHeight = expanded.scrollHeight || 200;
    const progress = Math.max(0, Math.min(1, scrolledPast / expandedHeight));
    setCollapseProgress(progress);
  }, []);

  useEffect(() => {
    // Use passive scroll listener for best performance
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    updateProgress();
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [updateProgress]);

  // Close stock dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStockDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const params = STRATEGY_PARAMS[strategyType];

  // Derived values from progress
  const isCompact = collapseProgress > 0.5;
  const expandedOpacity = 1 - Math.min(collapseProgress * 2, 1);        // fades out over 0→0.5
  const compactOpacity = Math.max((collapseProgress - 0.3) / 0.7, 0);   // fades in over 0.3→1
  const expandedScale = 1 - collapseProgress * 0.03;                     // subtle scale-down

  return (
    <>
      {/* Sentinel: invisible div that sits at the bar's natural position */}
      <div ref={sentinelRef} className="h-0" />

      <div
        ref={barRef}
        className="sticky top-0 z-30 mb-5"
      >
        {/* =================== COMPACT MODE =================== */}
        <div
          className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
          style={{
            opacity: compactOpacity,
            maxHeight: compactOpacity > 0 ? 64 : 0,
            pointerEvents: isCompact ? 'auto' : 'none',
            transition: 'max-height 0.15s ease-out',
          }}
        >
          <div className="flex items-center gap-2 px-4 py-2.5">
            {/* Stock Dropdown (compact) */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => !loading && setStockDropdownOpen(!stockDropdownOpen)}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg hover:border-indigo-400 transition-colors disabled:opacity-50"
              >
                <StockIcon symbol={stockSymbol} className="w-5 h-5" />
                <span className="text-sm font-bold text-indigo-700">{stockSymbol}</span>
                <ChevronDownIcon className={`w-3.5 h-3.5 text-gray-400 transition-transform ${stockDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {stockDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50 w-64 animate-slide-down">
                  {STOCK_OPTIONS.map(stock => (
                    <button
                      key={stock.symbol}
                      onClick={() => {
                        onStockChange(stock.symbol);
                        setStockDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${
                        stock.symbol === stockSymbol
                          ? 'bg-indigo-50 border-l-3 border-indigo-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <StockIcon symbol={stock.symbol} className="w-5 h-5" />
                      <div>
                        <span className="text-sm font-semibold text-gray-900">
                          <span className="text-indigo-600">{stock.symbol}</span> — {stock.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="w-px h-7 bg-gray-200" />

            {/* Strategy Pills */}
            <div className="flex items-center gap-1.5">
              {(['conservative', 'aggressive', 'ultra'] as StrategyType[]).map(id => {
                const Icon = STRATEGY_ICONS[id];
                const isActive = strategyType === id;
                return (
                  <button
                    key={id}
                    onClick={() => onStrategyChange(id)}
                    disabled={loading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
                      isActive
                        ? id === 'ultra'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-blue-600 text-white shadow-sm'
                        : id === 'ultra'
                          ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {STRATEGY_LABELS[id]}
                  </button>
                );
              })}
            </div>

            {/* Separator */}
            <div className="w-px h-7 bg-gray-200" />

            {/* Compact params */}
            <div className="hidden lg:flex items-center gap-2 text-[10px] text-gray-500 font-mono">
              <span className="px-1.5 py-0.5 bg-gray-100 rounded">{params.entry}</span>
              <span className="px-1.5 py-0.5 bg-gray-100 rounded">{params.hold}</span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Buy & Hold Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showBuyHold}
                onChange={(e) => onShowBuyHoldChange(e.target.checked)}
                className="w-3.5 h-3.5 text-green-600 rounded focus:ring-1 focus:ring-green-500"
              />
              <span className="text-xs font-medium text-gray-600 hidden sm:inline">Buy & Hold</span>
            </label>
          </div>
        </div>

        {/* =================== EXPANDED MODE =================== */}
        <div
          ref={expandedRef}
          className="bg-white rounded-2xl shadow-xl overflow-hidden origin-top"
          style={{
            opacity: expandedOpacity,
            transform: `scaleY(${expandedScale})`,
            pointerEvents: isCompact ? 'none' : 'auto',
            position: isCompact ? 'absolute' : 'relative',
            visibility: isCompact ? 'hidden' : 'visible',
            width: '100%',
          }}
        >
          <div className="p-6">
            <StockSelector
              stockSymbol={stockSymbol}
              loading={loading}
              onStockChange={onStockChange}
            />
            <StrategySelector
              strategyType={strategyType}
              loading={loading}
              showBuyHold={showBuyHold}
              onStrategyChange={onStrategyChange}
              onShowBuyHoldChange={onShowBuyHoldChange}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ControlBar;
