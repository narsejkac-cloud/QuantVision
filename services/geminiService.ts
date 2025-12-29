
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const NAKED_FOREX_SYSTEM_INSTRUCTION = `You are a Senior Quantitative Analyst specializing in "Naked Forex" methodology.
Your approach is strictly focused on:
1. Support and Resistance ZONES (not single lines).
2. Pure Price Action and Candlestick Analysis (Big Shadows, Kangaroo Tails, Last Kiss, Trend Belts).
3. Trend assessment without lagging indicators.

RULES:
- Be extremely strict and professional. 
- Do not provide financial advice, but offer a definitive "PROCEED", "ABSTAIN", or "WAIT" recommendation based on the technical setup.
- Identify the Expected Outcome (e.g., "Reversal at major zone" or "Trend continuation").
- Determine the Position Type: "LONG" if buying, "SHORT" if selling, or "N/A" if abstaining.
- Use available data to identify structures.
- Always define a clear Stop Loss and Take Profit level.
- Provide a Risk Score from 1 (Safe) to 10 (Extremely Risky).`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    assetName: { type: Type.STRING },
    timeframe: { type: Type.STRING },
    currentPrice: { type: Type.STRING },
    positionType: { type: Type.STRING, enum: ['LONG', 'SHORT', 'N/A'] },
    trend: { type: Type.STRING, enum: ['Bullish', 'Bearish', 'Neutral', 'Unknown'] },
    sentiment: { type: Type.STRING },
    zones: {
      type: Type.OBJECT,
      properties: {
        resistanceZone: { type: Type.STRING },
        supportZone: { type: Type.STRING },
      },
      required: ["resistanceZone", "supportZone"]
    },
    nakedForexPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
    expectedOutcome: { type: Type.STRING },
    investmentVerdict: { type: Type.STRING, enum: ['PROCEED', 'ABSTAIN', 'WAIT'] },
    riskScore: { type: Type.NUMBER },
    summary: { type: Type.STRING },
    tradingRecommendation: { type: Type.STRING },
    stopLoss: { type: Type.STRING },
    takeProfit: { type: Type.STRING },
  },
  required: [
    "assetName", "timeframe", "currentPrice", "positionType", "trend", 
    "sentiment", "zones", "nakedForexPatterns", "expectedOutcome",
    "investmentVerdict", "riskScore", "summary", "tradingRecommendation",
    "stopLoss", "takeProfit"
  ],
};

export const analyzeChart = async (base64Image: string): Promise<AnalysisResult> => {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image,
          },
        },
        { text: "Analyze this chart using Naked Forex principles. Provide the analysis in JSON format." },
      ],
    },
    config: {
      systemInstruction: NAKED_FOREX_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  if (!response.text) throw new Error("No analysis generated");
  return JSON.parse(response.text.trim()) as AnalysisResult;
};

export const analyzePairByText = async (pair: string, timeframe: string): Promise<AnalysisResult> => {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: `Search for the current price and recent price action (last 30-100 candles) of the trading pair ${pair} on the ${timeframe} timeframe. Perform a detailed Naked Forex analysis based on the found data. Return the findings in JSON format.`,
    config: {
      systemInstruction: NAKED_FOREX_SYSTEM_INSTRUCTION + "\nUse Google Search to find real-time data for the requested pair.",
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  if (!response.text) throw new Error("No analysis generated");
  return JSON.parse(response.text.trim()) as AnalysisResult;
};

export const chatAboutChart = async (
  base64Image: string | null, 
  previousMessages: { role: string; content: string }[],
  userMessage: string,
  assetContext?: string
): Promise<string> => {
  const model = "gemini-3-flash-preview";
  const historyText = previousMessages.map(m => `${m.role}: ${m.content}`).join('\n');
  
  const parts: any[] = [];
  if (base64Image) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: base64Image,
      },
    });
  }
  
  parts.push({ text: `Context: ${assetContext || 'Current chart analysis session'}\n\nConversation history:\n${historyText}\n\nUser: ${userMessage}\nAssistant:` });

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction: NAKED_FOREX_SYSTEM_INSTRUCTION + "\nContinue the conversation with the user as their professional analyst. Be critical and objective. If no image is provided, rely on search grounding for current market data.",
      tools: [{ googleSearch: {} }]
    }
  });

  return response.text || "I'm sorry, I couldn't analyze that request.";
};
