
export interface AnalysisResult {
  assetName: string;
  timeframe: string;
  currentPrice: string;
  positionType: 'LONG' | 'SHORT' | 'N/A';
  trend: 'Bullish' | 'Bearish' | 'Neutral' | 'Unknown';
  sentiment: string;
  zones: {
    resistanceZone: string;
    supportZone: string;
  };
  nakedForexPatterns: string[];
  expectedOutcome: string;
  investmentVerdict: 'PROCEED' | 'ABSTAIN' | 'WAIT';
  riskScore: number; // 1-10
  summary: string;
  tradingRecommendation: string;
  stopLoss: string;
  takeProfit: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
