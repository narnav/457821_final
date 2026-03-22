import React from 'react';
import { RefreshIcon } from './Icons';

interface FooterProps {
  onRefresh: () => void;
}

const Footer: React.FC<FooterProps> = ({ onRefresh }) => {
  return (
    <footer className="bg-white rounded-2xl shadow-xl p-5 mt-5 flex flex-col md:flex-row justify-between items-center gap-4">
      <p className="text-gray-600 text-sm">AI Trading Tutor v1.0 | Educational Platform</p>
      <button
        onClick={onRefresh}
        className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
      >
        <RefreshIcon className="w-4 h-4" />
        Refresh Data
      </button>
    </footer>
  );
};

export default Footer;
