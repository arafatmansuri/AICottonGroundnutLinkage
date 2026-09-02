import { BaseAgent, AgentInput, AgentOutput } from './baseAgent';
import prisma from '../database/client';

export interface ForecastInput extends AgentInput {
  cropId: string;
  mandiId?: string;
  historicalDays?: number;
}

export interface ForecastOutput extends AgentOutput {
  currentPrice: number;
  forecastRange: { min: number; max: number };
  trend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'VOLATILE';
  signal: 'SELL_NOW' | 'SELL_PARTIALLY' | 'WAIT' | 'STORE';
  confidence: number;
  horizonDays: number;
  explanation: string;
  dataPoints: number;
}

export class MandiPriceForecastingAgent extends BaseAgent<ForecastInput, ForecastOutput> {
  readonly name = 'MandiPriceForecastingAgent';

  validateInput(input: ForecastInput): boolean {
    return !!input.cropId;
  }

  protected async run(input: ForecastInput): Promise<ForecastOutput> {
    const days = input.historicalDays || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: any = { cropId: input.cropId, priceDate: { gte: since } };
    if (input.mandiId) where.mandiId = input.mandiId;

    const prices = await prisma.marketPrice.findMany({
      where,
      orderBy: { priceDate: 'asc' },
    });

    if (prices.length === 0) {
      return {
        agentName: this.name,
        success: false,
        confidence: 0,
        executionMs: 0,
        currentPrice: 0,
        forecastRange: { min: 0, max: 0 },
        trend: 'STABLE',
        signal: 'WAIT',
        horizonDays: 7,
        explanation: 'Insufficient historical data for forecasting.',
        dataPoints: 0,
      };
    }

    const modalPrices = prices.map((p) => p.modalPrice);
    const currentPrice = modalPrices[modalPrices.length - 1];
    const avgPrice = modalPrices.reduce((a, b) => a + b, 0) / modalPrices.length;

    // Simple linear trend
    const n = modalPrices.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i; sumY += modalPrices[i];
      sumXY += i * modalPrices[i]; sumX2 += i * i;
    }
    const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;

    // Volatility
    const variance = modalPrices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const volatility = stdDev / avgPrice;

    // Forecast for next 7 days
    const forecastBase = currentPrice + slope * 7;
    const band = Math.max(stdDev * 1.5, forecastBase * 0.02);

    const trend: ForecastOutput['trend'] =
      volatility > 0.05 ? 'VOLATILE' :
      slope > 10 ? 'INCREASING' :
      slope < -10 ? 'DECREASING' : 'STABLE';

    const confidence = Math.min(0.9, Math.max(0.4, 1 - volatility * 3 - (n < 10 ? 0.3 : 0)));

    const signal: ForecastOutput['signal'] =
      trend === 'INCREASING' && confidence > 0.65 ? 'STORE' :
      trend === 'DECREASING' ? 'SELL_NOW' :
      trend === 'VOLATILE' ? 'SELL_PARTIALLY' : 'WAIT';

    const explanation = `Based on ${n} data points over ${days} days. ` +
      `Price ${trend === 'INCREASING' ? 'showing upward trend' : trend === 'DECREASING' ? 'declining' : 'relatively stable'}. ` +
      `Forecast confidence: ${Math.round(confidence * 100)}%. ` +
      (volatility > 0.05 ? 'Market is volatile — exercise caution.' : '');

    return {
      agentName: this.name,
      success: true,
      currentPrice,
      forecastRange: {
        min: Math.round(Math.max(forecastBase - band, currentPrice * 0.9)),
        max: Math.round(forecastBase + band),
      },
      trend,
      signal,
      confidence: parseFloat(confidence.toFixed(2)),
      horizonDays: 7,
      explanation,
      dataPoints: n,
      executionMs: 0,
    };
  }
}

export const mandiPriceForecastingAgent = new MandiPriceForecastingAgent();
