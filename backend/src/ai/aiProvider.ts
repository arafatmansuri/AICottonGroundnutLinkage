// ─── Typed AI Provider — watsonx.ai Chat API with Tool Calling ────────────────

// ── Watsonx Chat API types ─────────────────────────────────────────────────────

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface TextContentPart {
  type: 'text';
  text: string;
}

export interface ChatMessage {
  role: ChatRole;
  content: string | TextContentPart[];
  tool_call_id?: string;   // required when role === 'tool'
  tool_calls?: ToolCall[]; // present on assistant messages that invoke tools
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, ToolParameterProperty>;
      required?: string[];
    };
  };
}

export interface ToolParameterProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[];
  items?: { type: string };
}

export type ToolChoiceOption = 'auto' | 'none';

// ── Watsonx API response types ─────────────────────────────────────────────────

interface WatsonxChatChoice {
  index: number;
  message: {
    role: 'assistant';
    content: string | null;
    tool_calls?: ToolCall[];
  };
  finish_reason: 'stop' | 'tool_calls' | 'length' | 'error';
}

interface WatsonxChatResponse {
  id: string;
  model_id: string;
  choices: WatsonxChatChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ── IAM token exchange ─────────────────────────────────────────────────────────

interface IamTokenResponse {
  access_token: string;
  expires_in: number;
}

// ── AIProvider interface ───────────────────────────────────────────────────────

export interface AIProvider {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  /**
   * Send a multi-turn conversation with optional tool definitions.
   * Returns the full assistant message (may include tool_calls).
   */
  chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    toolChoice?: ToolChoiceOption,
  ): Promise<ChatMessage>;
  /** Simple text generation — used for intent detection fallback */
  generate(prompt: string): Promise<string>;
}

// ── Tool invocation result ─────────────────────────────────────────────────────

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

// ── Mock Provider ──────────────────────────────────────────────────────────────

export class MockAIProvider implements AIProvider {
  readonly name = 'MockAIProvider';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generate(prompt: string): Promise<string> {
    const q = prompt.toLowerCase();
    if (q.includes('intent') || q.includes('classify')) {
      if (q.includes('sell') || q.includes('vech') || q.includes('becho')) return 'SELL_VS_STORE';
      if (q.includes('buyer') || q.includes('kharido')) return 'FIND_BUYERS';
      if (q.includes('price') || q.includes('bhav')) return 'MARKET_PRICE';
      if (q.includes('quality') || q.includes('grade')) return 'QUALITY';
      if (q.includes('income') || q.includes('profit')) return 'INCOME';
      if (q.includes('store') || q.includes('rakho')) return 'STORAGE';
      return 'GENERAL';
    }
    return 'Based on the market data and buyer offers, a partial selling strategy is advisable. ★ AI-assisted guidance — not a guaranteed financial outcome.';
  }

  async chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    _toolChoice?: ToolChoiceOption,
  ): Promise<ChatMessage> {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const userText = typeof lastUserMessage?.content === 'string'
      ? lastUserMessage.content
      : (lastUserMessage?.content as TextContentPart[] | undefined)
          ?.map(p => p.text).join(' ') ?? '';

    // If tools are provided, simulate tool calling on first pass
    if (tools && tools.length > 0 && !messages.some(m => m.role === 'tool')) {
      const q = userText.toLowerCase();
      const toolsToCall: ToolCall[] = [];

      const forecastTool = tools.find(t => t.function.name === 'get_price_forecast');
      const buyerTool = tools.find(t => t.function.name === 'find_buyers');
      const storageTool = tools.find(t => t.function.name === 'storage_advisor');

      // Extract cropId from context messages
      const systemMsg = messages.find(m => m.role === 'system');
      const systemText = typeof systemMsg?.content === 'string' ? systemMsg.content : '';
      const cropIdMatch = systemText.match(/"cropId":"([^"]+)"/);
      const cropId = cropIdMatch?.[1] ?? '';
      const quantityMatch = systemText.match(/"quantity":(\d+)/);
      const quantity = quantityMatch?.[1] ?? '100';
      const districtMatch = systemText.match(/"district":"([^"]+)"/);
      const district = districtMatch?.[1] ?? 'Ahmedabad';

      if (forecastTool && cropId && (q.includes('price') || q.includes('sell') || q.includes('store') || q.includes('market'))) {
        toolsToCall.push({
          id: `call_forecast_${Date.now()}`,
          type: 'function',
          function: { name: 'get_price_forecast', arguments: JSON.stringify({ cropId }) },
        });
      }
      if (buyerTool && cropId && (q.includes('buyer') || q.includes('sell') || q.includes('who'))) {
        toolsToCall.push({
          id: `call_buyers_${Date.now()}`,
          type: 'function',
          function: {
            name: 'find_buyers',
            arguments: JSON.stringify({ cropId, quantity: parseInt(quantity), farmerDistrict: district }),
          },
        });
      }
      if (storageTool && (q.includes('store') || q.includes('sell') || q.includes('wait'))) {
        toolsToCall.push({
          id: `call_storage_${Date.now()}`,
          type: 'function',
          function: {
            name: 'storage_advisor',
            arguments: JSON.stringify({ currentPrice: 7000, forecastMin: 6900, forecastMax: 7300, forecastConfidence: 0.7, storageCostPerUnit: 50, storageDurationDays: 30, quantity: parseInt(quantity), riskProfile: 'MODERATE' }),
          },
        });
      }

      if (toolsToCall.length > 0) {
        return { role: 'assistant', content: null as unknown as string, tool_calls: toolsToCall };
      }
    }

    // Final answer generation (after tools have been called)
    const systemContent = messages.find(m => m.role === 'system');
    const systemText = typeof systemContent?.content === 'string' ? systemContent.content : '';
    const language = systemText.includes('gu') ? 'gu' : systemText.includes('hi') ? 'hi' : 'en';

    if (language === 'gu') {
      return { role: 'assistant', content: 'AI ભલામણ: બજાર ડેટા અને ખરીદદારોની ઑફર આધારે, અત્યારે ભાગ વેચો અને ભાગ સ્ટોર કરો. ★ AI-assisted guidance — not a guaranteed financial outcome.' };
    }
    if (language === 'hi') {
      return { role: 'assistant', content: 'AI अनुशंसा: बाजार डेटा और खरीदार ऑफर के आधार पर, अभी कुछ बेचें और कुछ स्टोर करें। ★ AI-assisted guidance — not a guaranteed financial outcome.' };
    }
    return {
      role: 'assistant',
      content: 'Based on current market data and verified buyer offers, a partial selling strategy is advisable. Secure immediate returns while monitoring the market for remaining stock. ★ AI-assisted guidance — not a guaranteed financial outcome.',
    };
  }
}

// ── IBM Granite Provider ───────────────────────────────────────────────────────

export class GraniteAIProvider implements AIProvider {
  readonly name = 'GraniteAIProvider';

  private _iamToken: string | null = null;
  private _iamTokenExpiry = 0;

  async isAvailable(): Promise<boolean> {
    const { default: config } = await import('../config');
    return !!(config.granite.apiKey && config.granite.endpoint && config.granite.projectId);
  }

  private async getIAMToken(): Promise<string> {
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
    const data = await res.json() as IamTokenResponse;
    this._iamToken = data.access_token;
    this._iamTokenExpiry = Date.now() + data.expires_in * 1000;
    return this._iamToken;
  }

  async generate(prompt: string): Promise<string> {
    try {
      const msg = await this.chat([{ role: 'user', content: prompt }]);
      return typeof msg.content === 'string' ? msg.content : '';
    } catch {
      return new MockAIProvider().generate(prompt);
    }
  }

  async chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    toolChoice: ToolChoiceOption = 'auto',
  ): Promise<ChatMessage> {
    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 1000; // 429 reset-after is 500 ms; start at 1 s to be safe

    try {
      const { default: config } = await import('../config');
      const baseEndpoint = config.granite.endpoint.replace(/\/$/, '');
      const url = `${baseEndpoint}/ml/v1/text/chat?version=2024-05-31`;

      const body: Record<string, unknown> = {
        model_id: config.granite.model,
        project_id: config.granite.projectId,
        messages,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.1,
        },
      };

      if (tools && tools.length > 0) {
        body.tools = tools;
        body.tool_choice_option = toolChoice;
      }

      let lastError: Error | null = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const iamToken = await this.getIAMToken();
        const res = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${iamToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        console.log('Result: ', res);

        if (res.status === 429) {
          // Respect the server's reset-after header when present, otherwise back off exponentially.
          const resetAfterMs = parseInt(res.headers.get('x-requests-limit-reset-after') ?? '0', 10);
          const delayMs = resetAfterMs > 0 ? resetAfterMs + 100 : BASE_DELAY_MS * Math.pow(2, attempt);
          const errText = await res.text().catch(() => '');
          lastError = new Error(`Granite chat API failed (429): ${errText}`);
          console.warn(
            `Granite rate limit hit (attempt ${attempt + 1}/${MAX_RETRIES}). ` +
            `Retrying in ${delayMs} ms...`,
          );
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          // 404 means the model_id is not available in this region.
          // granite-4-h-small requires us-south or eu-de.
          // granite-3-8b-instruct works in all regions (deprecated, withdrawn 22 Feb 2026).
          const hint = res.status === 404
            ? ` | HINT: model "${config.granite.model}" is not available at ${config.granite.endpoint}. ` +
              `granite-4-h-small requires us-south or eu-de. ` +
              `granite-3-8b-instruct works in all regions (deprecated, withdrawn 22 Feb 2026). ` +
              `List available models: GET ${baseEndpoint}/ml/v1/foundation_model_specs?version=2024-10-10&filters=task_function_calling`
            : '';
          throw new Error(`Granite chat API failed (${res.status}): ${errText}${hint}`);
        }

        const data = await res.json() as WatsonxChatResponse;
        const choice = data.choices?.[0];
        if (!choice) throw new Error('No choices in Granite response');

        return {
          role: 'assistant',
          content: choice.message.content ?? '',
          tool_calls: choice.message.tool_calls,
        };
      }

      // All retries exhausted — rethrow the last 429 error.
      throw lastError ?? new Error('Granite chat API failed: max retries exceeded');
    } catch (error) {
      console.error('Granite chat failed, falling back to mock:', error);
      return new MockAIProvider().chat(messages, tools, toolChoice);
    }
  }
}

export function createAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? 'MOCK';
  if (provider === 'GRANITE') return new GraniteAIProvider();
  return new MockAIProvider();
}

export const aiProvider = createAIProvider();
