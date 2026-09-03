// AI Provider abstraction — enables IBM Granite or Mock
export interface AIProvider {
  name: string;
  generateResponse(prompt: string, language?: string): Promise<string>;
  detectIntent(query: string): Promise<string>;
  isAvailable(): Promise<boolean>;
}

export interface AgentContext {
  userId?: string;
  cropName?: string;
  quantity?: number;
  currentPrice?: number;
  bestBuyerPrice?: number;
  forecastSummary?: string;
  recommendation?: string;
  netRealization?: number;
  language?: string;
}

// Mock AI Provider — deterministic, realistic responses
export class MockAIProvider implements AIProvider {
  readonly name = 'MockAIProvider';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async detectIntent(query: string): Promise<string> {
    const q = query.toLowerCase();
    if (q.includes('sell') || q.includes('vech') || q.includes('becho')) return 'SELL_VS_STORE';
    if (q.includes('buyer') || q.includes('kharido') || q.includes('kharnidar')) return 'FIND_BUYERS';
    if (q.includes('price') || q.includes('bhav') || q.includes('rato')) return 'MARKET_PRICE';
    if (q.includes('quality') || q.includes('grade') || q.includes('gunvatta')) return 'QUALITY';
    if (q.includes('income') || q.includes('aavak') || q.includes('profit')) return 'INCOME';
    if (q.includes('store') || q.includes('rakho') || q.includes('bhandar')) return 'STORAGE';
    return 'GENERAL';
  }

  async generateResponse(prompt: string, language = 'en'): Promise<string> {
    // Parse the structured context from the prompt
    if (prompt.includes('SELL_VS_STORE') || prompt.includes('RECOMMENDATION')) {
      if (language === 'gu') {
        return 'AI ભલામણ: માર્કેટ ડેટા અને ખરીદદારોની ઑફર આધારે, અત્યારે ભાગ વેચો અને ભાગ સ્ટોર કરો. ★ Note: This is AI-assisted guidance — not a guaranteed financial outcome.';
      }
      if (language === 'hi') {
        return 'AI अनुशंसा: बाजार डेटा और खरीदार ऑफर के आधार पर, अभी कुछ बेचें और कुछ स्टोर करें। ★ Note: This is AI-assisted guidance — not a guaranteed financial outcome.';
      }
      return 'Based on current market data and buyer offers, a partial selling strategy is advisable. Consider selling now at the best buyer offer to secure immediate returns while monitoring market trends for the remainder. ★ This is AI-assisted guidance — not a guaranteed financial outcome.';
    }

    if (prompt.includes('FIND_BUYERS')) {
      return 'I found verified buyers matching your crop profile. Comparing net realizations after transport costs — see the comparison table below. Verified buyers offer better reliability. ★ Always verify buyer credentials independently.';
    }

    if (prompt.includes('MARKET_PRICE')) {
      return 'Current mandi prices have been fetched from the latest available data. Please check the Market Prices section for real-time information. Prices vary by mandi and crop grade.';
    }

    return 'I have analyzed the current market conditions and your crop data. Please review the detailed recommendations in the respective sections. ★ This is AI-assisted guidance.';
  }
}

// IBM Granite Provider
export class GraniteAIProvider implements AIProvider {
  readonly name = 'GraniteAIProvider';

  async isAvailable(): Promise<boolean> {
    const { default: config } = await import('../config');
    return !!(config.granite.apiKey && config.granite.endpoint);
  }

  async detectIntent(query: string): Promise<string> {
    // Use Granite for intent detection
    try {
      const response = await this.callGranite(
        `Classify the farmer's intent from this query: "${query}"\n` +
        `Options: SELL_VS_STORE, FIND_BUYERS, MARKET_PRICE, QUALITY, INCOME, STORAGE, GENERAL\n` +
        `Respond with just the intent label.`
      );
      return response.trim().toUpperCase() || 'GENERAL';
    } catch {
      const mock = new MockAIProvider();
      return mock.detectIntent(query);
    }
  }

  async generateResponse(prompt: string, language = 'en'): Promise<string> {
    try {
      return await this.callGranite(prompt);
    } catch (error) {
      // Fallback to mock
      const mock = new MockAIProvider();
      return mock.generateResponse(prompt, language);
    }
  }

  private async callGranite(prompt: string): Promise<string> {
    const { default: config } = await import('../config');
    // IBM watsonx.ai API call
    const response = await fetch(
      `${config.granite.endpoint}/ml/v1/text/generation?version=2023-05-29`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.granite.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_id: config.granite.model,
          project_id: config.granite.projectId,
          input: prompt,
          parameters: {
            decoding_method: 'greedy',
            max_new_tokens: 300,
            temperature: 0.3,
          },
        }),
      }
    );
    console.log(response);
    if (!response.ok) {
      throw new Error(`Granite API error: ${response.status}`);
    }

    const data = await response.json() as { results?: Array<{ generated_text?: string }> };
    return data?.results?.[0]?.generated_text || '';
  }
}

export function createAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'MOCK';
  if (provider === 'GRANITE') {
    return new GraniteAIProvider();
  }
  return new MockAIProvider();
}

export const aiProvider = createAIProvider();
