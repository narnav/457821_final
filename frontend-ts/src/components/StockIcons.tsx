import React from 'react';
import { StockSymbol } from '../types/api';

interface StockIconProps {
  className?: string;
}

// S&P 500 ETF — bar chart icon representing broad market index
export const SPYIcon: React.FC<StockIconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <rect x="4" y="18" width="5" height="10" rx="1" fill="#3b82f6" />
    <rect x="11" y="12" width="5" height="16" rx="1" fill="#2563eb" />
    <rect x="18" y="8" width="5" height="20" rx="1" fill="#1d4ed8" />
    <rect x="25" y="4" width="5" height="24" rx="1" fill="#1e40af" />
    <path d="M4 28h28" stroke="#94a3b8" strokeWidth="1.5" />
  </svg>
);

// Nasdaq-100 ETF — tech/circuit board style Q
export const QQQIcon: React.FC<StockIconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="14" r="10" stroke="#7c3aed" strokeWidth="2.5" fill="#ede9fe" />
    <path d="M20 18l6 8" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="12" cy="12" r="1.5" fill="#7c3aed" />
    <circle cx="16" cy="10" r="1.5" fill="#7c3aed" />
    <circle cx="20" cy="12" r="1.5" fill="#7c3aed" />
    <circle cx="16" cy="16" r="1.5" fill="#7c3aed" />
    <path d="M12 12h4M16 10v6M16 12h4" stroke="#7c3aed" strokeWidth="0.8" />
  </svg>
);

// Tesla — lightning bolt / electric symbol
export const TSLAIcon: React.FC<StockIconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" fill="#fee2e2" stroke="#dc2626" strokeWidth="1.5" />
    <path d="M18 4L10 18h6l-2 10 10-14h-6l2-10z" fill="#dc2626" />
  </svg>
);

// Nvidia — GPU/chip style icon
export const NVDAIcon: React.FC<StockIconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <rect x="6" y="6" width="20" height="20" rx="3" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.5" />
    <rect x="10" y="10" width="12" height="12" rx="1.5" fill="#16a34a" />
    <rect x="13" y="13" width="6" height="6" rx="1" fill="#dcfce7" />
    {/* Chip pins */}
    <rect x="12" y="3" width="2" height="4" rx="0.5" fill="#16a34a" />
    <rect x="18" y="3" width="2" height="4" rx="0.5" fill="#16a34a" />
    <rect x="12" y="25" width="2" height="4" rx="0.5" fill="#16a34a" />
    <rect x="18" y="25" width="2" height="4" rx="0.5" fill="#16a34a" />
    <rect x="3" y="12" width="4" height="2" rx="0.5" fill="#16a34a" />
    <rect x="3" y="18" width="4" height="2" rx="0.5" fill="#16a34a" />
    <rect x="25" y="12" width="4" height="2" rx="0.5" fill="#16a34a" />
    <rect x="25" y="18" width="4" height="2" rx="0.5" fill="#16a34a" />
  </svg>
);

// AMD — another chip, distinct diamond/angular style
export const AMDIcon: React.FC<StockIconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <rect x="4" y="4" width="24" height="24" rx="2" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
    <polygon points="16,8 24,16 16,24 8,16" fill="#d97706" />
    <polygon points="16,12 20,16 16,20 12,16" fill="#fef3c7" />
  </svg>
);

// Apple — simplified apple shape
export const AAPLIcon: React.FC<StockIconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <path
      d="M16 8c2-3 5-4 5-4s0.5 2.5-1.5 5c0 0 3-1 6 3s-1 10-4 14c-1.5 2-3 3-4.5 3s-2.5-1-4.5-1-3 1-4.5 1-3-1-4.5-3c-3-4-7-11-4-14s6-3 6-3c-2-2.5-1.5-5-1.5-5s3 1 5 4z"
      fill="#6b7280"
    />
    <path d="M16 8c0-2 1-5 3.5-6" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <ellipse cx="18" cy="3" rx="2" ry="1.5" fill="#16a34a" transform="rotate(-20 18 3)" />
  </svg>
);

// Map symbol to component
const STOCK_ICON_MAP: Record<StockSymbol, React.FC<StockIconProps>> = {
  SPY: SPYIcon,
  QQQ: QQQIcon,
  TSLA: TSLAIcon,
  NVDA: NVDAIcon,
  AMD: AMDIcon,
  AAPL: AAPLIcon,
};

export const StockIcon: React.FC<{ symbol: StockSymbol; className?: string }> = ({ symbol, className }) => {
  const Icon = STOCK_ICON_MAP[symbol];
  return <Icon className={className} />;
};
