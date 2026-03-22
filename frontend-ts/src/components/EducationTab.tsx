import React from 'react';
import {
  TrophyIcon,
  LightbulbIcon,
  ClockIcon,
  SparklesIcon,
  CurrencyIcon,
  HeartIcon,
  ShieldIcon,
  BoltIcon,
  RocketIcon,
  CheckCircleIcon,
  AlertIcon,
  BookOpenIcon,
} from './Icons';

const BUY_HOLD_BENEFITS = [
  { icon: ClockIcon, title: 'Time in the Market Beats Timing', desc: 'Buy & Hold captures every day of growth, including surprise rallies that active traders often miss.', color: 'text-amber-600' },
  { icon: SparklesIcon, title: 'Compound Growth', desc: 'Every dollar compounds continuously. Even small daily gains snowball over years into significant wealth.', color: 'text-amber-600' },
  { icon: CurrencyIcon, title: 'Zero Trading Costs', desc: 'No commissions, no bid-ask spread, no slippage. Every friction avoided is money kept.', color: 'text-amber-600' },
  { icon: HeartIcon, title: 'Emotional Simplicity', desc: 'No daily stress, no second-guessing, no watching charts. You set it and let the market work.', color: 'text-amber-600' },
  { icon: ShieldIcon, title: 'Tax Efficiency', desc: 'Long-term capital gains are taxed at lower rates than short-term trades. Patience is literally rewarded.', color: 'text-amber-600' },
];

const STRATEGIES = [
  {
    icon: ShieldIcon,
    name: 'Conservative',
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    stats: [
      { label: 'Threshold', value: '65%' },
      { label: 'Hold Period', value: '5 days' },
      { label: 'Vol. Limit', value: '0.45' },
      { label: 'Cooldown', value: 'Yes' },
    ],
    desc: 'High conviction only. Enters when the model is most confident and volatility is low.',
  },
  {
    icon: BoltIcon,
    name: 'Aggressive',
    color: 'from-purple-500 to-purple-600',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    stats: [
      { label: 'Threshold', value: '52%' },
      { label: 'Hold Period', value: '7 days' },
      { label: 'Vol. Limit', value: '0.65' },
      { label: 'Cooldown', value: 'Yes' },
    ],
    desc: 'Takes more signals with wider volatility tolerance. More trades, more risk.',
  },
  {
    icon: RocketIcon,
    name: 'Ultra',
    color: 'from-red-500 to-red-600',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    stats: [
      { label: 'Threshold', value: '48%' },
      { label: 'Hold Period', value: '15 days' },
      { label: 'Vol. Limit', value: 'None' },
      { label: 'Cooldown', value: 'No' },
    ],
    desc: 'Maximum exposure. No volatility filter, no cooldown. Designed to try to match Buy & Hold.',
  },
];

const KEY_LESSONS = [
  { icon: ClockIcon, text: 'Patience wins', detail: 'Buy & Hold requires discipline but rewards it handsomely' },
  { icon: AlertIcon, text: 'Activity \u2260 Profit', detail: 'More trades don\'t mean more money \u2014 often the opposite' },
  { icon: SparklesIcon, text: 'Time in market', detail: 'Being invested beats trying to pick the perfect entry' },
  { icon: BookOpenIcon, text: 'Past \u2260 Future', detail: 'Historical patterns are guides, not guarantees' },
];

const EducationTab: React.FC = () => {
  return (
    <section className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-4 border-blue-600">
        Understanding the Results
      </h2>

      {/* Buy & Hold Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-200 shadow-lg">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/40 to-transparent rounded-bl-full" />

        <div className="relative p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-md">
              <TrophyIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">The Power of Buy & Hold</h3>
              <p className="text-sm text-amber-700 font-medium">Why patience consistently wins</p>
            </div>
          </div>

          <p className="text-gray-700 mb-6 leading-relaxed text-sm max-w-2xl">
            One of the most important lessons from this analysis: <strong>Buy & Hold typically
            outperforms active trading strategies</strong>, especially over the long term.
          </p>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {BUY_HOLD_BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-3 bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-0.5">{title}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Key Insight Callout */}
          <div className="flex gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 border-l-4 border-amber-500">
            <LightbulbIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong className="text-gray-900">Key Insight:</strong>
              <span className="text-gray-700"> Buy & Hold shows higher returns with fewer decisions and lower stress.
              <strong> Patience pays.</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Comparison Cards */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ChartIcon className="w-5 h-5 text-blue-600" />
          Strategy Comparison
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STRATEGIES.map(({ icon: Icon, name, color, borderColor, bgColor, textColor, stats, desc }) => (
            <div
              key={name}
              className={`rounded-2xl border-2 ${borderColor} overflow-hidden hover:shadow-lg transition-shadow duration-200`}
            >
              {/* Strategy Header */}
              <div className={`bg-gradient-to-r ${color} px-5 py-3.5 flex items-center gap-2.5`}>
                <Icon className="w-5 h-5 text-white" />
                <span className="text-white font-bold">{name}</span>
              </div>

              {/* Stats Grid */}
              <div className={`${bgColor} grid grid-cols-2 gap-px`}>
                {stats.map(({ label, value }) => (
                  <div key={label} className="bg-white px-4 py-2.5 first:rounded-none">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{label}</p>
                    <p className={`text-sm font-bold ${textColor} font-mono`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="px-5 py-4 bg-white">
                <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Lessons */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
          <LightbulbIcon className="w-5 h-5 text-blue-600" />
          Key Lessons
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {KEY_LESSONS.map(({ icon: Icon, text, detail }) => (
            <div key={text} className="flex gap-3 bg-white rounded-xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200">
              <div className="flex-shrink-0 p-2 bg-blue-50 rounded-lg">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  {text}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Philosophy Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-xl">
        {/* Decorative floating circles */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full" />

        <div className="relative p-8">
          <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5" />
            Project Philosophy
          </h3>
          <blockquote className="text-lg italic bg-white/10 backdrop-blur-sm rounded-xl p-5 mb-5 text-center border border-white/10">
            "The goal is not to beat the market &mdash; the goal is to understand it."
          </blockquote>
          <p className="leading-relaxed text-sm text-indigo-100 max-w-2xl">
            Even with machine learning, beating Buy & Hold in a bull market is incredibly difficult.
            This project exists to help you <strong className="text-white">learn how trading strategies work</strong>, not to
            encourage active trading. <strong className="text-white">Active trading is exciting, but patience is profitable.</strong>
          </p>
        </div>
      </div>
    </section>
  );
};

// Small inline icon for the strategy header — avoids importing ChartIcon at top level
const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
);

export default EducationTab;
