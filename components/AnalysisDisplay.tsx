
import React from 'react';
import { AnalysisResult } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle, 
  Target, 
  ShieldAlert,
  Activity,
  Layers,
  FileText,
  Map,
  MoveUpRight,
  ArrowUpCircle,
  ArrowDownCircle,
  GanttChartSquare
} from 'lucide-react';

interface Props {
  data: AnalysisResult;
}

const AnalysisDisplay: React.FC<Props> = ({ data }) => {
  // Logic to parse numerical values from potentially formatted strings (e.g., "$1.23", "0.02603")
  const parsePrice = (priceStr: string): number => {
    return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
  };

  const entryVal = parsePrice(data.currentPrice);
  const slVal = parsePrice(data.stopLoss);
  
  // User logic: if stop loss < entry "LONG" else "SHORT"
  // If Sl is 0 (parsing failed or missing), fallback to API provided positionType
  const derivedPosition = slVal > 0 && entryVal > 0 
    ? (slVal < entryVal ? 'LONG' : 'SHORT') 
    : data.positionType;

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'PROCEED': return 'bg-emerald-500 text-white shadow-emerald-500/40';
      case 'ABSTAIN': return 'bg-rose-500 text-white shadow-rose-500/40';
      case 'WAIT': return 'bg-amber-500 text-white shadow-amber-500/40';
      default: return 'bg-slate-700 text-white';
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'bg-emerald-400';
    if (score <= 7) return 'bg-amber-400';
    return 'bg-rose-400';
  };

  const renderPositionBadge = () => {
    if (derivedPosition === 'LONG') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-black uppercase tracking-wider">
          <ArrowUpCircle className="w-3 h-3" /> LONG
        </div>
      );
    }
    if (derivedPosition === 'SHORT') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-xs font-black uppercase tracking-wider">
          <ArrowDownCircle className="w-3 h-3" /> SHORT
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* High Stakes Verdict Header */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <ShieldAlert className="w-32 h-32" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{data.assetName}</h2>
              {renderPositionBadge()}
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs font-mono rounded">{data.timeframe}</span>
              <span className="text-slate-500 font-mono text-lg">{data.currentPrice}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Investment Verdict</span>
            <div className={`px-8 py-3 rounded-2xl text-xl font-black tracking-widest shadow-lg ${getVerdictStyle(data.investmentVerdict)}`}>
              {data.investmentVerdict}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Technical Summary Panel */}
        <div className="lg:col-span-8 space-y-6">
          <section className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-white font-bold">
                <FileText className="w-5 h-5 text-indigo-400" />
                Technical Narrative
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono">Risk Rating:</span>
                <div className="flex gap-1">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-4 rounded-sm ${i < data.riskScore ? getRiskColor(data.riskScore) : 'bg-slate-800'}`} />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm md:text-base border-l-2 border-indigo-500/30 pl-4">
              {data.summary}
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Expected Outcome
              </h4>
              <p className="text-sm text-indigo-100 font-medium">{data.expectedOutcome}</p>
            </div>
            <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <MoveUpRight className="w-4 h-4" /> Recommendation
              </h4>
              <p className="text-sm text-slate-300 italic">"{data.tradingRecommendation}"</p>
            </div>
          </div>

          {/* Trade Execution Plan Card */}
          <div className="overflow-hidden border border-indigo-500/20 rounded-2xl bg-slate-900 shadow-xl">
            <div className={`px-6 py-2 flex items-center justify-between border-b border-white/5 ${
              derivedPosition === 'LONG' ? 'bg-emerald-500/10' : 
              derivedPosition === 'SHORT' ? 'bg-rose-500/10' : 'bg-slate-800/50'
            }`}>
              <div className="flex items-center gap-2">
                <GanttChartSquare className={`w-4 h-4 ${derivedPosition === 'LONG' ? 'text-emerald-400' : derivedPosition === 'SHORT' ? 'text-rose-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Execution Matrix</span>
              </div>
              <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full ${
                derivedPosition === 'LONG' ? 'bg-emerald-500 text-white' : 
                derivedPosition === 'SHORT' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                {derivedPosition} POSITION
              </div>
            </div>

            <div className="p-6 relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                  {derivedPosition === 'LONG' ? <TrendingUp className="text-emerald-400 w-32 h-32" /> : derivedPosition === 'SHORT' ? <TrendingDown className="text-rose-400 w-32 h-32" /> : null}
               </div>
               
               <div className="grid grid-cols-3 gap-8 text-center relative z-10">
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">Entry Zone</span>
                    <div className="text-white font-mono text-xl md:text-2xl font-bold">{data.currentPrice}</div>
                  </div>
                  <div className="space-y-2 border-x border-white/5">
                    <span className="text-[10px] text-rose-500 uppercase font-black tracking-widest block">Stop Loss</span>
                    <div className="text-rose-400 font-mono text-xl md:text-2xl font-bold">{data.stopLoss}</div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-emerald-500 uppercase font-black tracking-widest block">Take Profit</span>
                    <div className="text-emerald-400 font-mono text-xl md:text-2xl font-bold">{data.takeProfit}</div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Naked Forex Zones & Patterns Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Structural Zones
            </h3>
            
            <div className="space-y-6">
              <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                <label className="text-[10px] font-bold text-rose-400 uppercase">Resistance Zone</label>
                <p className="text-sm text-white font-mono mt-1">{data.zones.resistanceZone}</p>
              </div>
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <label className="text-[10px] font-bold text-emerald-400 uppercase">Support Zone</label>
                <p className="text-sm text-white font-mono mt-1">{data.zones.supportZone}</p>
              </div>
            </div>

            <div className="mt-8">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 mb-3">
                <Map className="w-3 h-3" /> Naked Forex Patterns
              </label>
              <div className="flex flex-wrap gap-2">
                {data.nakedForexPatterns.map((p, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-mono">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-indigo-600/10 border border-indigo-600/20 rounded-2xl">
            <h4 className="text-xs font-bold text-indigo-400 uppercase mb-2">Market Sentiment</h4>
            <p className="text-sm text-slate-300 leading-snug">{data.sentiment}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDisplay;
