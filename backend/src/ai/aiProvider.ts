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

// ─── IBM Granite Provider (watsonx.ai) ────────────────────────────────────────
//
// IBM Cloud API keys CANNOT be used directly as Bearer tokens.
// They must be exchanged for a short-lived IAM access token via:
//   POST https://iam.cloud.ibm.com/identity/token
//
// The watsonx.ai inference endpoint is:
//   https://<region>.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29
//
// Supported regions: us-south, eu-de, eu-gb, jp-tok, au-syd
//
export class GraniteAIProvider implements AIProvider {
  readonly name = 'GraniteAIProvider';

  // IAM token cache — tokens are valid for 1 hour
  private _iamToken: string | null = null;
  private _iamTokenExpiry = 0;

  async isAvailable(): Promise<boolean> {
    const { default: config } = await import('../config');
    return !!(config.granite.apiKey && config.granite.endpoint && config.granite.projectId);
  }

  // ── Exchange IBM Cloud API key for IAM Bearer token ─────────────────────
  private async getIAMToken(): Promise<string> {
    // Return cached token if still valid (with 60s buffer)
    if (this._iamToken && Date.now() < this._iamTokenExpiry - 60_000) {
      return this._iamToken;
    }

    const { default: config } = await import('../config');

    const body = new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: config.granite.apiKey,
    });

    const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`IBM IAM token exchange failed (${res.status}): ${text}`);
    }

    const data = await res.json() as { access_token: string; expires_in: number };
    this._iamToken = data.access_token;
    // expires_in is in seconds; store as ms timestamp
    this._iamTokenExpiry = Date.now() + (data.expires_in * 1000);

    return this._iamToken;
  }

  async detectIntent(query: string): Promise<string> {
    try {
      const response = await this.callGranite(
        `Classify the farmer's intent from this query: "${query}"\n` +
        `Options: SELL_VS_STORE, FIND_BUYERS, MARKET_PRICE, QUALITY, INCOME, STORAGE, GENERAL\n` +
        `Respond with ONLY the intent label, nothing else.`
      );
      const intent = response.trim().toUpperCase().split(/\s+/)[0];
      const valid = ['SELL_VS_STORE', 'FIND_BUYERS', 'MARKET_PRICE', 'QUALITY', 'INCOME', 'STORAGE', 'GENERAL'];
      return valid.includes(intent) ? intent : 'GENERAL';
    } catch {
      // Fallback to keyword-based detection
      return new MockAIProvider().detectIntent(query);
    }
  }

  async generateResponse(prompt: string, language = 'en'): Promise<string> {
    try {
      return await this.callGranite(prompt);
    } catch (error) {
      // Fallback to mock on any Granite failure
      return new MockAIProvider().generateResponse(prompt, language);
    }
  }

  // ── Core watsonx.ai text generation call ─────────────────────────────────
  private async callGranite(prompt: string): Promise<string> {
    const { default: config } = await import('../config');
    const iamToken = await this.getIAMToken();

    // Build the correct watsonx.ai endpoint.
    // The endpoint in .env should be the BASE url:
    //   e.g. https://au-syd.ml.cloud.ibm.com
    // We append the inference path here.
    const baseEndpoint = config.granite.endpoint.replace(/\/$/, '');
    const url = `${baseEndpoint}/ml/v1/text/generation?version=2023-05-29`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${iamToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_id: config.granite.model,
        project_id: config.granite.projectId,
        input: prompt,
        parameters: {
          decoding_method: 'greedy',
          max_new_tokens: 300,
          min_new_tokens: 10,
          stop_sequences: [],
          repetition_penalty: 1.1,
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`Granite inference failed (${res.status}): ${errorText}`);
    }

    const data = await res.json() as {
      results?: Array<{ generated_text?: string }>;
    };
    return data?.results?.[0]?.generated_text?.trim() || '';
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
