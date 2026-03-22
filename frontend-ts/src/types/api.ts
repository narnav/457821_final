// Type definitions for API responses

export interface Trade {
  entry_date: string;
  exit_date: string;
  entry_price: number;
  exit_price: number;
  pnl: number;
  bullish_prob: number;
  features: {
    [key: string]: number;
  };
}

export interface Metrics {
  total_return: number;
  max_drawdown: number;
  sharpe_ratio: number;
  num_trades?: number;
}

export interface EquityPoint {
  date: string;
  equity: number;
  buy_hold: number;
}

export interface FeatureComparison {
  [featureName: string]: {
    winning: number;
    losing: number;
  };
}

export interface BacktestResponse {
  equity_curve: EquityPoint[];
  metrics: Metrics;
  trades: Trade[];
  winning_trades: number;
  losing_trades: number;
  feature_comparison: FeatureComparison;
  max_drawdown_explanation: string;
  buy_hold_metrics: Metrics;
  strategy_type?: string;
  symbol?: string;
}

export type StockSymbol = 'SPY' | 'QQQ' | 'TSLA' | 'NVDA' | 'AMD' | 'AAPL';

export interface TradeExplanation {
  trade: Trade;
  explanation: string;
}

export interface TradeComparison {
  winning_trade: Trade;
  losing_trade: Trade;
  comparison: string;
}

export interface FeatureImportance {
  name: string;
  coefficient: number;
  abs_importance: number;
}

export interface FeatureImportanceResponse {
  features: FeatureImportance[];
}

export type TabType = 'overview' | 'trades' | 'features' | 'education';

export type StrategyType = 'conservative' | 'aggressive' | 'ultra';

export interface IndexedTrade {
  originalIndex: number;
  trade: Trade;
}

export interface PricePoint {
  date: string;
  close: number;
}

export interface PriceDataResponse {
  prices: PricePoint[];
  symbol: string;
}

export type TradeFilter = 'all' | 'best' | 'worst';