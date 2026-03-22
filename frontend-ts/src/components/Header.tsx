import React from 'react';
import { TrendingUpIcon, AlertIcon } from './Icons';

interface HeaderProps {
  onTutorialOpen: () => void;
}

const Header: React.FC<HeaderProps> = ({ onTutorialOpen }) => {
  return (
    <header className="bg-white rounded-2xl shadow-xl p-8 mb-5 text-center">
      <div className="flex items-center justify-center gap-3 mb-3">
        <TrendingUpIcon className="w-8 h-8 text-blue-600" />
        <h1 className="text-4xl font-bold text-gray-900">AI Trading Tutor</h1>
        <button
          onClick={onTutorialOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium ml-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Tutorial
        </button>
      </div>
      <p className="text-lg text-gray-600 mb-4">Educational Market Intelligence Platform</p>
      <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-900 px-5 py-2 rounded-lg font-medium">
        <AlertIcon className="w-4 h-4" />
        <span>Educational purposes only - Not financial advice</span>
      </div>
    </header>
  );
};

export default Header;
