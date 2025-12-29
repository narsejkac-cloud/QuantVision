
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  MessageSquare, 
  BrainCircuit, 
  Image as ImageIcon,
  X,
  Loader2,
  Send,
  ChartBarIcon,
  Download,
  History,
  ShieldCheck,
  AlertCircle,
  Hash,
  Search,
  ChevronRight,
  Globe,
  ClipboardCheck
} from 'lucide-react';
import { analyzeChart, analyzePairByText, chatAboutChart } from './services/geminiService';
import { AnalysisResult, ChatMessage } from './types';
import AnalysisDisplay from './components/AnalysisDisplay';

type InputMode = 'image' | 'text';

const App: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>('image');
  const [image, setImage] = useState<string | null>(null);
  const [pairText, setPairText] = useState('');
  const [timeframe, setTimeframe] = useState('Daily');
  
  // Controls transition from landing screen to analysis view
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle global paste event
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            // Optionally clear the error if it was a file type error
            setError(null);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImage(base64String);
        setAnalysis(null);
        setChatMessages([]);
        setError(null);
        setInputMode('image');
        setIsSessionActive(true);
      };
      reader.readAsDataURL(file);
    } else {
      setError("Invalid file type. Please upload or paste an image.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const startAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      let result;
      if (inputMode === 'image' && image) {
        result = await analyzeChart(image);
      } else if (inputMode === 'text' && pairText) {
        result = await analyzePairByText(pairText, timeframe);
      } else {
        throw new Error("No input data provided.");
      }
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setError("Analysis failed. Ensure the input is a valid trading pair or clear chart image.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim() || isChatting) return;

    const currentInput = userInput;
    setUserInput('');
    const timestamp = new Date().toLocaleTimeString();
    setChatMessages(prev => [...prev, { role: 'user', content: currentInput, timestamp }]);
    setIsChatting(true);

    try {
      const response = await chatAboutChart(
        image, 
        chatMessages, 
        currentInput, 
        analysis ? `Asset: ${analysis.assetName}, Verdict: ${analysis.investmentVerdict}` : undefined
      );
      setChatMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date().toLocaleTimeString() }]);
    } catch (err) {
      setError("Communication failed. Re-trying...");
    } finally {
      setIsChatting(false);
    }
  };

  const downloadReport = () => {
    if (!analysis) return;
    const reportContent = `
QUANTVISION NAKED FOREX DECISION REPORT
---------------------------------------
Date: ${new Date().toLocaleString()}
Asset: ${analysis.assetName} (${analysis.timeframe})
Current Price: ${analysis.currentPrice}

INVESTMENT VERDICT: ${analysis.investmentVerdict}
Risk Score: ${analysis.riskScore}/10
Trend: ${analysis.trend}
Expected Outcome: ${analysis.expectedOutcome}

TECHNICAL ZONES:
- Resistance: ${analysis.zones.resistanceZone}
- Support: ${analysis.zones.supportZone}

TRADING PLAN:
- Stop Loss: ${analysis.stopLoss}
- Take Profit: ${analysis.takeProfit}
- Recommendation: ${analysis.tradingRecommendation}

SUMMARY:
${analysis.summary}

CONVERSATION LOG:
${chatMessages.map(m => `[${m.timestamp}] ${m.role.toUpperCase()}: ${m.content}`).join('\n')}
---------------------------------------
CONFIDENTIAL ANALYSIS DOCUMENT
    `;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QuantVision_${analysis.assetName}_Report.txt`;
    a.click();
  };

  const clearSession = () => {
    setImage(null);
    setPairText('');
    setAnalysis(null);
    setChatMessages([]);
    setError(null);
    setIsSessionActive(false);
  };

  const isReadyForAnalysis = (inputMode === 'image' && image) || (inputMode === 'text' && pairText.trim().length > 0);

  const initializeTextProtocol = () => {
    setInputMode('text');
    setIsSessionActive(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tighter leading-none uppercase">QuantVision Elite</h1>
              <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">Naked Forex Protocol v2.8</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {analysis && (
              <button 
                onClick={downloadReport}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Download className="w-4 h-4" />
                Export Decision Report
              </button>
            )}
            {isSessionActive && (
              <button onClick={clearSession} className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1">RESET</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-center gap-3 animate-in slide-in-from-top-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isSessionActive ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center max-w-4xl mx-auto animate-in fade-in duration-700">
            <div className="mb-6 p-4 bg-indigo-500/10 rounded-3xl border border-indigo-500/20">
              <BrainCircuit className="w-16 h-16 text-indigo-500" />
            </div>
            <h2 className="text-5xl font-black text-white mb-6 tracking-tight leading-none uppercase">
              NAKED FOREX <br/><span className="text-indigo-500">ANALYSIS ENGINE</span>
            </h2>
            <p className="text-slate-400 mb-10 text-lg leading-relaxed max-w-2xl mx-auto">
              Choose your entry protocol. Our high-conviction system decodes price action through visual upload, clipboard paste, or real-time pair grounding.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Image Option with Drag and Drop & Paste */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => { setInputMode('image'); fileInputRef.current?.click(); }}
                className={`flex flex-col items-center gap-4 p-8 bg-slate-900 border rounded-[2.5rem] transition-all group relative cursor-pointer ${
                  isDragging ? 'border-indigo-500 ring-4 ring-indigo-500/20 scale-[1.02]' : 'border-slate-800'
                } hover:border-indigo-500/50 hover:bg-slate-900/80`}
              >
                <div className={`p-5 rounded-2xl transition-colors shadow-lg ${isDragging ? 'bg-indigo-600 scale-110' : 'bg-slate-800 group-hover:bg-indigo-600'}`}>
                  {isDragging ? <Upload className="w-10 h-10 text-white animate-bounce" /> : <ImageIcon className="w-10 h-10 text-white" />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Visual Analysis</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Deconstruct structural zones directly from chart screenshots.</p>
                  <div className="flex gap-3 justify-center mt-2">
                    <span className="text-[10px] font-mono text-indigo-400/60 uppercase border border-indigo-400/20 px-2 py-0.5 rounded">Drag & Drop</span>
                    <span className="text-[10px] font-mono text-emerald-400/60 uppercase border border-emerald-400/20 px-2 py-0.5 rounded flex items-center gap-1">
                      <ClipboardCheck className="w-3 h-3" /> Ctrl+V Paste
                    </span>
                  </div>
                </div>
                <div className="mt-4 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  Initialize Upload
                </div>
              </div>

              {/* Text Option Card */}
              <div 
                className="flex flex-col items-center gap-4 p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all group relative cursor-pointer"
                onClick={initializeTextProtocol}
              >
                <div className="p-5 rounded-2xl bg-slate-800 group-hover:bg-indigo-600 transition-colors shadow-lg">
                  <Globe className="w-10 h-10 text-white" />
                </div>
                <div className="w-full">
                  <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Asset Protocol</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6">Real-time search grounding for any global trading pair.</p>
                </div>
                <div className="mt-4 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  Enter Trading Pair
                </div>
              </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Control Sidebar */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              {/* Input Switcher/Display */}
              <div className="rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Input Metadata</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setInputMode('image')} 
                      className={`p-1.5 rounded-lg transition-colors ${inputMode === 'image' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setInputMode('text')} 
                      className={`p-1.5 rounded-lg transition-colors ${inputMode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {inputMode === 'image' ? (
                  <div className="space-y-4">
                    {image ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-700">
                        <img src={`data:image/png;base64,${image}`} alt="Chart" className="w-full h-auto max-h-[300px] object-contain bg-black" />
                        <button onClick={() => setImage(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur rounded-full hover:bg-rose-600 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-12 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center gap-3 text-slate-600 hover:border-slate-600 hover:text-slate-400 transition-all"
                      >
                        <Upload className="w-8 h-8" />
                        <span className="text-xs font-bold uppercase tracking-wider">Upload or Paste Chart</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Trading Pair</label>
                      <div className="relative">
                        <input 
                          autoFocus
                          value={pairText}
                          onChange={(e) => setPairText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && isReadyForAnalysis && startAnalysis()}
                          placeholder="e.g. BTC/USDT, EUR/USD, Gold"
                          className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 transition-all outline-none text-white font-bold uppercase tracking-wider"
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Timeframe</label>
                      <select 
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 transition-all outline-none appearance-none font-bold uppercase tracking-widest text-slate-400"
                      >
                        {['1m', '5m', '15m', '1h', '4h', 'Daily', 'Weekly'].map(tf => (
                          <option key={tf} value={tf}>{tf}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

                {!analysis && (
                  <button 
                    onClick={startAnalysis}
                    disabled={analyzing || !isReadyForAnalysis}
                    className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 disabled:opacity-30 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                  >
                    {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    {analyzing ? "DECODING DATA..." : "RUN FULL AUDIT"}
                  </button>
                )}
              </div>

              {/* Advanced Chat Panel */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[400px]">
                <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Audit Inquiry</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                      <MessageSquare className="w-10 h-10 mb-4" />
                      <p className="text-xs text-center max-w-[200px]">Query the analyst on specific candle structures or risk thresholds.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1`}>
                        <span className="text-[9px] font-mono text-slate-600">{msg.timestamp}</span>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200 border border-slate-700'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                  {isChatting && <div className="text-xs text-indigo-400 animate-pulse font-mono">ANALYST IS COMPUTING...</div>}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 bg-slate-900">
                  <div className="relative group">
                    <input 
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Input query..."
                      className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 pr-12 text-sm focus:border-indigo-500 transition-all outline-none"
                    />
                    <button type="submit" disabled={!userInput.trim() || isChatting} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 rounded-lg disabled:opacity-30">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Analysis Result Area */}
            <div className="lg:col-span-8">
              {analysis ? (
                <div className="space-y-6">
                  <AnalysisDisplay data={analysis} />
                  <div className="md:hidden">
                    <button onClick={downloadReport} className="w-full py-4 bg-slate-800 rounded-2xl font-bold flex items-center justify-center gap-2">
                       <Download className="w-5 h-5" /> Export Report
                    </button>
                  </div>
                </div>
              ) : analyzing ? (
                <div className="h-[600px] flex flex-col items-center justify-center bg-slate-900/20 border border-slate-800 border-dashed rounded-[2rem] text-center">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                    <Loader2 className="w-20 h-20 text-indigo-500 animate-spin relative z-10" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Processing Market Logic</h3>
                  <p className="text-slate-500 max-w-xs mx-auto text-sm">Identifying structural zones and evaluating candlestick momentum using real-time search grounding...</p>
                </div>
              ) : (
                <div className="h-[600px] flex flex-col items-center justify-center bg-slate-900/20 border border-slate-800 border-dashed rounded-[2rem] text-center grayscale opacity-50">
                  <ChartBarIcon className="w-20 h-20 mb-6" />
                  <h3 className="text-xl font-bold text-slate-400">AUDIT STANDBY</h3>
                  <p className="text-slate-600 text-sm">Waiting for analytical protocol initialization.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 mt-20 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between opacity-40">
          <div className="text-[10px] font-mono tracking-[0.2em] text-slate-400">QUANTVISION // ELITE // NAKED FOREX PROTOCOL</div>
          <div className="flex gap-4">
             <button className="text-[9px] hover:text-white transition-colors">SECURE NODE</button>
             <button className="text-[9px] hover:text-white transition-colors">PROTOCOL DOCS</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
