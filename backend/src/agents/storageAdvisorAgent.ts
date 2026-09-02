import { BaseAgent, AgentInput, AgentOutput } from './baseAgent';

export interface StorageAdvisorInput extends AgentInput {
  currentPrice: number;
  forecastMin: number;
  forecastMax: number;
  forecastConfidence: number;
  storageCostPerUnit: number;
  storageDurationDays: number;
  quantity: number;
  riskProfile?: string; // 'LOW' | 'MODERATE' | 'HIGH'
  bestBuyerNetPrice?: number;
}

export interface StorageAdvisorOutput extends AgentOutput {
  recommendation: 'SELL_NOW' | 'STORE' | 'SELL_PARTIALLY' | 'WAIT_AND_MONITOR';
  sellNowQuantity: number;
  storeQuantity: number;
  reasoning: string[];
  currentNetValue: number;
  expectedFutureNetValue: number;
  storageCost: number;
  potentialGain: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
}

export class StorageSellingAdvisorAgent extends BaseAgent<StorageAdvisorInput, StorageAdvisorOutput> {
  readonly name = 'StorageSellingAdvisorAgent';

  validateInput(input: StorageAdvisorInput): boolean {
    return input.currentPrice > 0 && input.quantity > 0;
  }

  protected async run(input: StorageAdvisorInput): Promise<StorageAdvisorOutput> {
    const {
      currentPrice,
      forecastMin,
      forecastMax,
      forecastConfidence,
      storageCostPerUnit,
      storageDurationDays,
      quantity,
      riskProfile = 'MODERATE',
      bestBuyerNetPrice,
    } = input;

    const bestCurrentPrice = Math.max(currentPrice, bestBuyerNetPrice || 0);
    const forecastMid = (forecastMin + forecastMax) / 2;
    const storageCost = storageCostPerUnit * storageDurationDays;

    const currentNetValue = bestCurrentPrice * quantity;
    const expectedFutureNetValue = (forecastMid - storageCost) * quantity;
    const potentialGain = expectedFutureNetValue - currentNetValue;

    // Risk factors
    const isLowConfidence = forecastConfidence < 0.6;
    const isHighVolatility = (forecastMax - forecastMin) / forecastMid > 0.1;
    const gainPerUnit = forecastMid - storageCost - bestCurrentPrice;

    const reasoning: string[] = [];
    let recommendation: StorageAdvisorOutput['recommendation'];
    let riskLevel: StorageAdvisorOutput['riskLevel'];

    // Determine risk level
    if (isLowConfidence || isHighVolatility) {
      riskLevel = 'HIGH';
    } else if (forecastConfidence >= 0.75 && !isHighVolatility) {
      riskLevel = 'LOW';
    } else {
      riskLevel = 'MEDIUM';
    }

    // Decision logic
    if (gainPerUnit <= 0) {
      recommendation = 'SELL_NOW';
      reasoning.push('Expected future value is lower than or equal to current selling value after storage costs.');
      reasoning.push(`Storage cost of ₹${storageCost.toFixed(0)}/quintal eliminates expected price increase.`);
    } else if (gainPerUnit > 200 && forecastConfidence >= 0.7 && riskProfile !== 'LOW') {
      recommendation = 'STORE';
      reasoning.push(`Expected price increase of ₹${gainPerUnit.toFixed(0)}/quintal covers storage cost with surplus.`);
      reasoning.push(`Forecast confidence: ${Math.round(forecastConfidence * 100)}%`);
    } else if (gainPerUnit > 0 && gainPerUnit <= 200) {
      recommendation = 'SELL_PARTIALLY';
      reasoning.push('Moderate potential gain — partial selling reduces risk while capturing some upside.');
      reasoning.push(`Potential gain of ₹${gainPerUnit.toFixed(0)}/quintal is modest.`);
    } else if (isLowConfidence) {
      recommendation = 'SELL_PARTIALLY';
      reasoning.push(`Forecast confidence is low (${Math.round(forecastConfidence * 100)}%). Partial selling is safer.`);
    } else {
      recommendation = 'WAIT_AND_MONITOR';
      reasoning.push('Market conditions are mixed. Monitor for 1–2 days before deciding.');
    }

    if (isLowConfidence) reasoning.push('⚠ Low forecast confidence — treat this as guidance, not certainty.');
    if (bestBuyerNetPrice && bestBuyerNetPrice > currentPrice) {
      reasoning.push(`A verified buyer is offering ₹${bestBuyerNetPrice.toFixed(0)}/quintal net — better than mandi.`);
    }

    const sellNowQuantity = recommendation === 'SELL_NOW' ? quantity :
      recommendation === 'STORE' ? 0 :
      recommendation === 'SELL_PARTIALLY' ? Math.round(quantity * 0.6) : 0;

    const storeQuantity = quantity - sellNowQuantity;

    const explanation =
      `Recommendation: ${recommendation.replace(/_/g, ' ')}. ` +
      reasoning.join(' ');

    return {
      agentName: this.name,
      success: true,
      confidence: forecastConfidence,
      executionMs: 0,
      recommendation,
      sellNowQuantity,
      storeQuantity,
      reasoning,
      currentNetValue: parseFloat(currentNetValue.toFixed(2)),
      expectedFutureNetValue: parseFloat(expectedFutureNetValue.toFixed(2)),
      storageCost: parseFloat(storageCost.toFixed(2)),
      potentialGain: parseFloat(potentialGain.toFixed(2)),
      riskLevel,
      explanation,
    };
  }
}

export const storageSellingAdvisorAgent = new StorageSellingAdvisorAgent();
