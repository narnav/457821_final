import React from 'react';
import { BacktestResponse } from '../types/api';
import FeatureComparison from './FeatureComparison';
import FeatureImportance from './FeatureImportance';

interface FeaturesTabProps {
  backtestData: BacktestResponse;
}

const FeaturesTab: React.FC<FeaturesTabProps> = ({ backtestData }) => {
  return (
    <>
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-4 border-blue-600">
          Winning vs Losing Trade Features
        </h2>
        <FeatureComparison data={backtestData.feature_comparison} />
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-4 border-blue-600">
          Feature Importance
        </h2>
        <FeatureImportance />
      </section>
    </>
  );
};

export default FeaturesTab;
