import { BaseAgent, AgentInput, AgentOutput } from './baseAgent';
import { aiProvider } from '../ai/aiProvider';

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

    // Pre-compute numeric context to provide AI with factual grounding
    const bestCurrentPrice = Math.max(currentPrice, bestBuyerNetPrice || 0);
    const forecastMid = (forecastMin + forecastMax) / 2;
    const storageCost = storageCostPerUnit * storageDurationDays;
    const currentNetValue = bestCurrentPrice * quantity;
    const expectedFutureNetValue = (forecastMid - storageCost) * quantity;
    const potentialGain = expectedFutureNetValue - currentNetValue;
    const gainPerUnit = forecastMid - storageCost - bestCurrentPrice;

    // Build the AI prompt with all computed facts
    const systemPrompt = `You are an expert agricultural market advisor for Indian farmers.
Analyze the sell-vs-store decision and respond with ONLY valid JSON — no markdown, no extra text.

JSON schema:
{
  "recommendation": "SELL_NOW" | "STORE" | "SELL_PARTIALLY" | "WAIT_AND_MONITOR",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "reasoning": [string, string, ...],   // 2–4 concise bullet points
  "explanation": string                 // one paragraph summary
}

Guidelines:
- SELL_NOW if gainPerUnit <= 0 or riskProfile is LOW and confidence < 0.65
- STORE if gainPerUnit > 200 and confidence >= 0.7 and riskProfile is not LOW
- SELL_PARTIALLY if gainPerUnit is modest (0–200) or confidence is moderate
- WAIT_AND_MONITOR when market signals are mixed but positive
- riskLevel HIGH when confidence < 0.6 or price range spread > 10% of midpoint
- riskLevel LOW when confidence >= 0.75 and spread <= 10%
- Otherwise riskLevel MEDIUM`;

    const userPrompt = `Market data for storage decision:
- Current mandi price: ₹${currentPrice}/qtl
- Best buyer net price: ₹${bestCurrentPrice}/qtl
- Forecast range (30-day): ₹${forecastMin}–₹${forecastMax}/qtl (mid ₹${forecastMid.toFixed(0)})
- Forecast confidence: ${Math.round(forecastConfidence * 100)}%
- Storage cost: ₹${storageCostPerUnit}/qtl/day × ${storageDurationDays} days = ₹${storageCost.toFixed(0)}/qtl total
- Quantity: ${quantity} quintals
- Farmer risk profile: ${riskProfile}
- Gain per quintal if stored: ₹${gainPerUnit.toFixed(0)}
- Current net value: ₹${currentNetValue.toFixed(0)}
- Expected future net value: ₹${expectedFutureNetValue.toFixed(0)}
- Potential total gain: ₹${potentialGain.toFixed(0)}
${bestBuyerNetPrice && bestBuyerNetPrice > currentPrice ? `- A verified buyer is offering ₹${bestBuyerNetPrice.toFixed(0)}/qtl — better than mandi price.` : ''}

Provide your JSON recommendation.`;

    let recommendation: StorageAdvisorOutput['recommendation'] = 'SELL_PARTIALLY';
    let riskLevel: StorageAdvisorOutput['riskLevel'] = 'MEDIUM';
    let reasoning: string[] = [];
    let explanation = '';

    try {
      const aiMessage = await aiProvider.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      const raw = typeof aiMessage.content === 'string' ? aiMessage.content.trim() : '';
      // Strip any markdown fences the model may add
      const jsonText = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(jsonText);

      recommendation = parsed.recommendation ?? recommendation;
      riskLevel = parsed.riskLevel ?? riskLevel;
      reasoning = Array.isArray(parsed.reasoning) ? parsed.reasoning : [];
      explanation = typeof parsed.explanation === 'string' ? parsed.explanation : '';
    } catch {
      // Fallback: derive from computed numbers if AI fails
      if (gainPerUnit <= 0) {
        recommendation = 'SELL_NOW';
        riskLevel = 'HIGH';
        reasoning = [
          'Expected future value is lower than current selling value after storage costs.',
          `Storage cost of ₹${storageCost.toFixed(0)}/qtl eliminates any expected price increase.`,
        ];
      } else if (gainPerUnit > 200 && forecastConfidence >= 0.7 && riskProfile !== 'LOW') {
        recommendation = 'STORE';
        riskLevel = forecastConfidence >= 0.75 ? 'LOW' : 'MEDIUM';
        reasoning = [
          `Expected price increase of ₹${gainPerUnit.toFixed(0)}/qtl covers storage cost with surplus.`,
          `Forecast confidence: ${Math.round(forecastConfidence * 100)}%.`,
        ];
      } else {
        recommendation = 'SELL_PARTIALLY';
        riskLevel = 'MEDIUM';
        reasoning = [
          'Moderate potential gain — partial selling reduces risk while capturing some upside.',
          `Potential gain of ₹${gainPerUnit.toFixed(0)}/qtl is modest.`,
        ];
      }
      explanation = `Recommendation: ${recommendation.replace(/_/g, ' ')}. ${reasoning.join(' ')}`;
    }

    const sellNowQuantity =
      recommendation === 'SELL_NOW' ? quantity :
      recommendation === 'STORE' ? 0 :
      recommendation === 'SELL_PARTIALLY' ? Math.round(quantity * 0.6) : 0;

    const storeQuantity = quantity - sellNowQuantity;

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
