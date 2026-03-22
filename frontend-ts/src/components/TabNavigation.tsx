import React from 'react';
import { TabType } from '../types/api';
import { ChartIcon, CurrencyIcon, LightbulbIcon, BookOpenIcon } from './Icons';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: ChartIcon },
  { id: 'trades', label: 'Trades Analysis', icon: CurrencyIcon },
  { id: 'features', label: 'Feature Insights', icon: LightbulbIcon },
  { id: 'education', label: 'Learning', icon: BookOpenIcon },
];

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="bg-white rounded-2xl shadow-xl p-3 mb-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm md:text-base">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default TabNavigation;
