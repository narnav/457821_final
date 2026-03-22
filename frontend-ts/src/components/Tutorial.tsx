import React, { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
  TrendingUpIcon,
  ChartIcon,
  BoltIcon,
  ShieldIcon,
  RocketIcon,
  AlertIcon,
  LightbulbIcon,
  CurrencyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ScaleIcon,
  BrainIcon,
  TargetIcon,
  SignalIcon,
  HourglassIcon,
} from './Icons';

interface TutorialProps {
  onClose: () => void;
}

/* ── Framer-motion variant factories ── */

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
};

const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerContainerSlow = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18 } },
};

/* ── Feature data ── */

const FEATURES = [
  { key: 'return_5d', name: '5-Day Momentum', desc: 'Short-term price direction over 5 trading days', icon: TrendingUpIcon, color: 'from-blue-500 to-blue-600' },
  { key: 'return_20d', name: '20-Day Trend', desc: 'Medium-term momentum capturing monthly moves', icon: TrendingUpIcon, color: 'from-indigo-500 to-indigo-600' },
  { key: 'ma_ratio', name: 'MA Ratio', desc: 'Price relative to its 20-day moving average', icon: ChartIcon, color: 'from-purple-500 to-purple-600' },
  { key: 'trend_slope', name: 'Trend Acceleration', desc: 'How fast the moving average is changing direction', icon: BoltIcon, color: 'from-cyan-500 to-cyan-600' },
  { key: 'rsi', name: 'RSI (14)', desc: 'Overbought / oversold gauge ranging 0–100', icon: ChartIcon, color: 'from-amber-500 to-amber-600' },
  { key: 'atr', name: 'True Range', desc: 'Average daily price swing — raw volatility', icon: AlertIcon, color: 'from-rose-500 to-rose-600' },
  { key: 'volatility', name: '20-Day Volatility', desc: 'Rolling standard deviation measuring risk', icon: AlertIcon, color: 'from-red-500 to-red-600' },
  { key: 'regime', name: 'Stress Detector', desc: 'Binary flag: 1 when volatility exceeds the 70th percentile', icon: ShieldIcon, color: 'from-orange-500 to-orange-600' },
  { key: 'rel_strength', name: 'SPY Relative Strength', desc: 'Performance compared to the S&P 500 benchmark', icon: CurrencyIcon, color: 'from-emerald-500 to-emerald-600' },
];

/* ── Pipeline stages ── */

const PIPELINE = [
  { label: '9 Features', sub: 'Raw market data', icon: ChartIcon },
  { label: 'StandardScaler', sub: 'Normalize values', icon: ScaleIcon },
  { label: 'Logistic Regression', sub: 'Binary classifier', icon: BrainIcon },
  { label: 'Probability', sub: '0 – 100% bullish', icon: TargetIcon },
];

/* ── Strategy data ── */

const STRATEGIES = [
  { name: 'Conservative', icon: ShieldIcon, threshold: '65%', hold: '5 days', vol: '0.45', cooldown: 'Yes', gradient: 'from-blue-500 to-blue-700', border: 'border-blue-400' },
  { name: 'Aggressive', icon: BoltIcon, threshold: '52%', hold: '7 days', vol: '0.65', cooldown: 'Yes', gradient: 'from-amber-500 to-orange-600', border: 'border-amber-400' },
  { name: 'Ultra', icon: RocketIcon, threshold: '48%', hold: '15 days', vol: 'None', cooldown: 'No', gradient: 'from-red-500 to-red-700', border: 'border-red-400' },
];

/* ── Timeline steps ── */

const TRADE_STEPS = [
  { step: 1, title: 'Signal', desc: 'Model outputs a bullish probability above the strategy threshold', icon: SignalIcon },
  { step: 2, title: 'Entry', desc: 'Buy the stock/ETF at the current market price', icon: CheckCircleIcon },
  { step: 3, title: 'Hold', desc: 'Wait N days based on the chosen strategy\'s hold period', icon: HourglassIcon },
  { step: 4, title: 'Exit', desc: 'Sell the position and calculate profit or loss', icon: XCircleIcon },
];

/* ═══════════════════════════ COMPONENT ═══════════════════════════ */

const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const scaleX = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* ── Progress bar ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-500 origin-left z-[60]"
        style={{ scaleX }}
      />

      {/* ── Skip button ── */}
      <button
        onClick={onClose}
        className="fixed bottom-6 right-6 z-[60] px-5 py-2.5 bg-white/10 backdrop-blur-md text-white rounded-full border border-white/20 hover:bg-white/20 transition-all text-sm font-medium shadow-lg"
      >
        Skip Tutorial &rarr;
      </button>

      {/* ── Scrollable container ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
      >
        {/* ══════════ Section 1: Hero ══════════ */}
        <section className="min-h-screen flex flex-col items-center justify-center p-8 relative">
          {/* Candlestick SVG decoration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <svg viewBox="0 0 400 200" className="w-full max-w-2xl h-auto">
              {/* Candle 1 – green */}
              <rect x="60" y="80" width="16" height="60" rx="2" fill="#22c55e" className="origin-bottom animate-draw-candle" style={{ animationDelay: '0.2s' }} />
              <line x1="68" y1="60" x2="68" y2="80" stroke="#22c55e" strokeWidth="2" />
              <line x1="68" y1="140" x2="68" y2="160" stroke="#22c55e" strokeWidth="2" />
              {/* Candle 2 – red */}
              <rect x="120" y="60" width="16" height="80" rx="2" fill="#ef4444" className="origin-bottom animate-draw-candle" style={{ animationDelay: '0.5s' }} />
              <line x1="128" y1="40" x2="128" y2="60" stroke="#ef4444" strokeWidth="2" />
              <line x1="128" y1="140" x2="128" y2="170" stroke="#ef4444" strokeWidth="2" />
              {/* Candle 3 – green */}
              <rect x="180" y="70" width="16" height="50" rx="2" fill="#22c55e" className="origin-bottom animate-draw-candle" style={{ animationDelay: '0.8s' }} />
              <line x1="188" y1="50" x2="188" y2="70" stroke="#22c55e" strokeWidth="2" />
              <line x1="188" y1="120" x2="188" y2="140" stroke="#22c55e" strokeWidth="2" />
              {/* Candle 4 – green */}
              <rect x="240" y="50" width="16" height="70" rx="2" fill="#22c55e" className="origin-bottom animate-draw-candle" style={{ animationDelay: '1.1s' }} />
              <line x1="248" y1="30" x2="248" y2="50" stroke="#22c55e" strokeWidth="2" />
              <line x1="248" y1="120" x2="248" y2="145" stroke="#22c55e" strokeWidth="2" />
              {/* Candle 5 – red */}
              <rect x="300" y="65" width="16" height="55" rx="2" fill="#ef4444" className="origin-bottom animate-draw-candle" style={{ animationDelay: '1.4s' }} />
              <line x1="308" y1="45" x2="308" y2="65" stroke="#ef4444" strokeWidth="2" />
              <line x1="308" y1="120" x2="308" y2="150" stroke="#ef4444" strokeWidth="2" />
            </svg>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center relative z-10"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
              How AI Reads the Market
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-12">
              Scroll down to learn how machine learning turns raw market data into trading signals
            </p>
          </motion.div>

          {/* Bouncing arrow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-12 animate-bounce-arrow"
          >
            <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </section>

        {/* ══════════ Section 2: The 9 Features ══════════ */}
        <section className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-6xl w-full">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <span className="inline-block px-4 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium mb-4 border border-blue-500/30">
                Feature Engineering
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                The 9 Signals the AI Watches
              </h2>
              <p className="text-lg text-slate-400 max-w-xl mx-auto">
                Every trading day, the model evaluates these features to assess market conditions
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {FEATURES.map((f) => (
                <motion.div
                  key={f.key}
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                  className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${f.color} mb-3`}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-base mb-1">{f.name}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                  <span className="block mt-2 text-xs font-mono text-slate-500">{f.key}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════════ Section 3: The Model Pipeline ══════════ */}
        <section className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-5xl w-full">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium mb-4 border border-purple-500/30">
                ML Pipeline
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                From Data to Prediction
              </h2>
              <p className="text-lg text-slate-400 max-w-xl mx-auto">
                Raw features flow through a pipeline that outputs a single probability
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainerSlow}
              className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0"
            >
              {PIPELINE.map((stage, i) => (
                <React.Fragment key={stage.label}>
                  <motion.div
                    variants={fadeLeft}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 w-full md:w-44 text-center"
                  >
                    <stage.icon className="w-8 h-8 text-blue-400 mb-3" />
                    <h3 className="text-white font-bold text-sm mb-1">{stage.label}</h3>
                    <p className="text-xs text-slate-400">{stage.sub}</p>
                  </motion.div>
                  {i < PIPELINE.length - 1 && (
                    <motion.div
                      variants={fadeLeft}
                      transition={{ duration: 0.3 }}
                      className="hidden md:flex items-center px-2"
                    >
                      <div className="w-8 border-t-2 border-dashed border-blue-400/50" />
                      <svg className="w-4 h-4 text-blue-400/50 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                  {i < PIPELINE.length - 1 && (
                    <motion.div variants={fadeUp} className="flex md:hidden items-center py-1">
                      <svg className="w-5 h-5 text-blue-400/50 rotate-90" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                </React.Fragment>
              ))}
            </motion.div>

            {/* Extra callout */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5 text-center max-w-lg mx-auto"
            >
              <p className="text-indigo-300 text-sm">
                <strong>Logistic Regression</strong> is a simple but interpretable model — its coefficients tell you <em>exactly</em> which features push the prediction bullish or bearish.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ══════════ Section 4: Three Strategies ══════════ */}
        <section className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-5xl w-full">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <span className="inline-block px-4 py-1.5 bg-amber-500/20 text-amber-300 rounded-full text-sm font-medium mb-4 border border-amber-500/30">
                Strategy Design
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Three Risk Personalities
              </h2>
              <p className="text-lg text-slate-400 max-w-xl mx-auto">
                Same model, different rules — see how risk appetite changes outcomes
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {STRATEGIES.map((s) => (
                <motion.div
                  key={s.name}
                  variants={scaleIn}
                  transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
                  className={`bg-gradient-to-br ${s.gradient} rounded-2xl p-6 text-white border ${s.border} border-opacity-30`}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <s.icon className="w-8 h-8" />
                    <h3 className="text-xl font-bold">{s.name}</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between bg-white/10 rounded-lg px-3 py-2">
                      <span className="opacity-80">Entry Threshold</span>
                      <span className="font-bold">{s.threshold}</span>
                    </div>
                    <div className="flex justify-between bg-white/10 rounded-lg px-3 py-2">
                      <span className="opacity-80">Hold Period</span>
                      <span className="font-bold">{s.hold}</span>
                    </div>
                    <div className="flex justify-between bg-white/10 rounded-lg px-3 py-2">
                      <span className="opacity-80">Vol Filter</span>
                      <span className="font-bold">{s.vol}</span>
                    </div>
                    <div className="flex justify-between bg-white/10 rounded-lg px-3 py-2">
                      <span className="opacity-80">Cooldown</span>
                      <span className="font-bold">{s.cooldown}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══════════ Section 5: Anatomy of a Trade ══════════ */}
        <section className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-3xl w-full">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <span className="inline-block px-4 py-1.5 bg-green-500/20 text-green-300 rounded-full text-sm font-medium mb-4 border border-green-500/30">
                Trade Lifecycle
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Anatomy of a Trade
              </h2>
              <p className="text-lg text-slate-400 max-w-lg mx-auto">
                From signal to settlement in four steps
              </p>
            </motion.div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 md:-translate-x-0.5" />

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={staggerContainerSlow}
                className="space-y-10"
              >
                {TRADE_STEPS.map((step, i) => (
                  <motion.div
                    key={step.step}
                    variants={i % 2 === 0 ? fadeLeft : fadeRight}
                    transition={{ duration: 0.5 }}
                    className={`relative flex items-start gap-5 ${
                      i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    {/* Dot on line */}
                    <div className="absolute left-6 md:left-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-slate-900 -translate-x-1/2 mt-1 z-10 animate-pulse-glow" />

                    {/* Card */}
                    <div className={`ml-14 md:ml-0 md:w-[calc(50%-2rem)] ${i % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8'} bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5`}>
                      <step.icon className="w-7 h-7 text-blue-400 mb-2" />
                      <h3 className="text-white font-bold text-lg mb-1">
                        Step {step.step}: {step.title}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══════════ Section 6: Risk Management ══════════ */}
        <section className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-5xl w-full">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <span className="inline-block px-4 py-1.5 bg-red-500/20 text-red-300 rounded-full text-sm font-medium mb-4 border border-red-500/30">
                Risk Controls
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Why Most Traders Lose
              </h2>
              <p className="text-lg text-slate-400 max-w-xl mx-auto">
                Without risk controls, a losing streak can wipe out all gains
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {/* Cooldown Mechanism */}
              <motion.div
                variants={fadeLeft}
                transition={{ duration: 0.5 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <AlertIcon className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Cooldown Mechanism</h3>
                    <p className="text-xs text-slate-400">Stops revenge trading</p>
                  </div>
                </div>

                {/* Loss streak visualisation */}
                <div className="space-y-3 mb-5">
                  {['Loss 1', 'Loss 2', 'Loss 3'].map((label, i) => (
                    <motion.div
                      key={label}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(i + 1) * 33}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.2 }}
                      className="h-8 bg-gradient-to-r from-red-500/60 to-red-600/60 rounded-lg flex items-center px-3"
                    >
                      <span className="text-xs text-white font-medium whitespace-nowrap">{label}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
                  <p className="text-orange-300 text-sm font-medium">
                    After 3 consecutive losses → position size drops to <strong>30%</strong> for 30 days
                  </p>
                </div>
              </motion.div>

              {/* Volatility Filter */}
              <motion.div
                variants={fadeRight}
                transition={{ duration: 0.5 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center animate-pulse-glow">
                    <ShieldIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Volatility Filter</h3>
                    <p className="text-xs text-slate-400">Avoids chaotic markets</p>
                  </div>
                </div>

                {/* Volatility gauge */}
                <div className="relative h-6 bg-slate-700 rounded-full mb-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '45%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.5 }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                  />
                  <div className="absolute inset-y-0 left-[45%] right-0 bg-gradient-to-r from-yellow-500/40 to-red-500/40 rounded-r-full" />
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-bold">
                    Safe Zone ← | → High Volatility
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Conservative: only trades below <strong className="text-white">0.45</strong> volatility</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>Aggressive: allows up to <strong className="text-white">0.65</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Ultra: <strong className="text-white">no filter</strong> — trades in any condition</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ══════════ Section 7: The Big Lesson ══════════ */}
        <section className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-4xl w-full text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block px-4 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-6 border border-emerald-500/30">
                The Big Takeaway
              </span>
              <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8">
                The #1 Lesson
              </h2>
            </motion.div>

            <motion.blockquote
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.2, type: 'spring', bounce: 0.3 }}
              className="text-2xl md:text-3xl font-light italic text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              "Time in the market beats timing the market"
            </motion.blockquote>

            {/* Bar comparison */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={staggerContainer}
              className="flex flex-col sm:flex-row items-end justify-center gap-8 mb-14 h-56"
            >
              <motion.div
                variants={fadeUp}
                className="flex flex-col items-center"
              >
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: 200 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.4, type: 'spring', bounce: 0.2 }}
                  className="w-24 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl"
                />
                <span className="mt-3 text-white font-bold text-sm">Buy & Hold</span>
                <span className="text-emerald-400 text-xs">Passive</span>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="flex flex-col items-center"
              >
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: 120 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.6, type: 'spring', bounce: 0.2 }}
                  className="w-24 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-xl"
                />
                <span className="mt-3 text-white font-bold text-sm">ML Strategy</span>
                <span className="text-blue-400 text-xs">Active</span>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="space-y-4"
            >
              <p className="text-slate-400 text-base max-w-lg mx-auto mb-8">
                Even sophisticated ML models often struggle to beat simple buy-and-hold in bull markets. The real value is <strong className="text-white">understanding how markets work</strong> — not trying to outsmart them.
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow"
              >
                <LightbulbIcon className="w-5 h-5 inline-block mr-2 -mt-0.5" />
                Start Exploring
              </motion.button>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Tutorial;
