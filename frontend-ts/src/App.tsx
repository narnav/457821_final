import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BacktestResponse, TabType, StrategyType, StockSymbol } from './types/api';
import { API_BASE_URL, STOCK_OPTIONS, STRATEGY_PARAMS, STRATEGY_ICONS, STRATEGY_COLORS } from './constants';
import { AlertIcon, ChartIcon } from './components/Icons';
import { StockIcon } from './components/StockIcons';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import ControlBar from './components/ControlBar';
import OverviewTab from './components/OverviewTab';
import TradesTab from './components/TradesTab';
import FeaturesTab from './components/FeaturesTab';
import EducationTab from './components/EducationTab';
import Footer from './components/Footer';
import Tutorial from './components/Tutorial';

const App: React.FC = () => {
  const [backtestData, setBacktestData] = useState<BacktestResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [strategyType, setStrategyType] = useState<StrategyType>('conservative');
  const [stockSymbol, setStockSymbol] = useState<StockSymbol>('SPY');
  const [showBuyHold, setShowBuyHold] = useState<boolean>(true);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  const fetchBacktest = async (
    strategy: StrategyType = strategyType,
    symbol: StockSymbol = stockSymbol
  ): Promise<void> => {
    // Update state immediately so the loading screen shows the correct values
    setStrategyType(strategy);
    setStockSymbol(symbol);
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<BacktestResponse>(
        `${API_BASE_URL}/api/backtest?strategy=${strategy}&symbol=${symbol}`
      );
      setBacktestData(response.data);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch backtest data');
    } finally {
      setLoading(false);
    }
  };

  const handleStrategyToggle = (newStrategy: StrategyType) => {
    fetchBacktest(newStrategy, stockSymbol);
  };

  const handleStockChange = (newSymbol: StockSymbol) => {
    fetchBacktest(strategyType, newSymbol);
  };

  useEffect(() => {
    fetchBacktest();
  }, []);

  if (loading) {
    const StratIcon = STRATEGY_ICONS[strategyType];
    const stratColor = STRATEGY_COLORS[strategyType];
    const stockInfo = STOCK_OPTIONS.find(s => s.symbol === stockSymbol);
    const params = STRATEGY_PARAMS[strategyType];

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-5">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden min-h-[480px] relative">
            {/* Decorative background shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-50 rounded-full opacity-60" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-50 rounded-full opacity-60" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full opacity-30" />
            </div>

            <div className="relative flex flex-col items-center justify-center py-16 px-8">
              {/* Animated chart icon with pulsing ring */}
              <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-20" style={{ animationDuration: '2s' }} />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <ChartIcon className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Running Backtest</h2>
              <p className="text-sm text-gray-500 mb-8">Analyzing historical data and generating signals</p>

              {/* Stock & Strategy badges */}
              <div className="flex items-center gap-3 mb-8">
                {/* Stock badge */}
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 rounded-xl ring-1 ring-gray-200">
                  <StockIcon symbol={stockSymbol} className="w-7 h-7" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{stockSymbol}</p>
                    <p className="text-[10px] text-gray-500">{stockInfo?.name}</p>
                  </div>
                </div>

                {/* Animated connector */}
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>

                {/* Strategy badge */}
                <div className={`flex items-center gap-2.5 px-4 py-2.5 ${stratColor.bg} rounded-xl ring-1 ${stratColor.ring}`}>
                  <StratIcon className={`w-5 h-5 ${stratColor.text}`} />
                  <div>
                    <p className={`text-sm font-bold ${stratColor.text}`}>
                      {strategyType.charAt(0).toUpperCase() + strategyType.slice(1)}
                    </p>
                    <p className="text-[10px] text-gray-500">strategy</p>
                  </div>
                </div>
              </div>

              {/* Strategy params */}
              <div className="flex items-center gap-3 mb-8">
                {[
                  { label: 'Entry', value: params.entry },
                  { label: 'Hold', value: params.hold },
                  { label: 'Vol Filter', value: params.vol },
                ].map(p => (
                  <div key={p.label} className="text-center px-3 py-1.5 bg-gray-50 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{p.label}</p>
                    <p className="text-xs font-bold text-gray-700 font-mono">{p.value}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="w-64 mb-3">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    style={{
                      animation: 'loadingBar 30s ease-out forwards',
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">This may take 30-60 seconds</p>

              {/* Inline keyframes */}
              <style>{`
                @keyframes loadingBar {
                  0% { width: 0%; }
                  30% { width: 45%; }
                  60% { width: 70%; }
                  80% { width: 85%; }
                  100% { width: 95%; }
                }
              `}</style>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-5">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
            <div className="text-red-500 mb-4">
              <AlertIcon className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => fetchBacktest()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!backtestData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-5">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
            <p className="text-xl text-gray-700 mb-6">No data available</p>
            <button
              onClick={() => fetchBacktest()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Load Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-5">
      <div className="max-w-7xl mx-auto">
        <Header onTutorialOpen={() => setShowTutorial(true)} />
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <ControlBar
          stockSymbol={stockSymbol}
          strategyType={strategyType}
          loading={loading}
          showBuyHold={showBuyHold}
          onStockChange={handleStockChange}
          onStrategyChange={handleStrategyToggle}
          onShowBuyHoldChange={setShowBuyHold}
        />

        <div className="bg-white rounded-2xl shadow-xl p-8 min-h-[500px]">
          {activeTab === 'overview' && (
            <OverviewTab
              backtestData={backtestData}
              strategyType={strategyType}
              showBuyHold={showBuyHold}
            />
          )}
          {activeTab === 'trades' && (
            <TradesTab backtestData={backtestData} />
          )}
          {activeTab === 'features' && (
            <FeaturesTab backtestData={backtestData} />
          )}
          {activeTab === 'education' && (
            <EducationTab />
          )}
        </div>

        <Footer onRefresh={() => fetchBacktest(strategyType, stockSymbol)} />
      </div>

      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
    </div>
  );
};

export default App;
