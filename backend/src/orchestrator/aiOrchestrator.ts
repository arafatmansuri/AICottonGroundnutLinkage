// ─── Agentic AI Orchestrator — watsonx.ai Chat API with ReAct tool-calling loop ─

import {
  aiProvider,
  type ChatMessage,
  type ToolDefinition,
  type ToolCall,
} from '../ai/aiProvider';
import { mandiPriceForecastingAgent } from '../agents/forecastingAgent';
import { buyerMatchingAgent } from '../agents/buyerMatchingAgent';
import { storageSellingAdvisorAgent } from '../agents/storageAdvisorAgent';
import type { ForecastOutput } from '../agents/forecastingAgent';
import type { BuyerMatchOutput, MatchedBuyer } from '../agents/buyerMatchingAgent';
import type { StorageAdvisorOutput } from '../agents/storageAdvisorAgent';
import prisma from '../database/client';
import logger from '../utils/logger';

// ── Public input / output contracts ───────────────────────────────────────────

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface OrchestratorInput {
  userId: string;
  query: string;
  language?: string;
  cropId?: string;
  farmerCropId?: string;
  quantity?: number;
  district?: string;
  riskProfile?: string;
  /** Previous turns to give the model conversation context */
  chatHistory?: ConversationTurn[];
}

export type RecommendationDecision = 'SELL_NOW' | 'STORE' | 'SELL_PARTIALLY' | 'WAIT_AND_MONITOR';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type PriceTrend = 'INCREASING' | 'DECREASING' | 'STABLE' | 'VOLATILE';

export interface OrchestratorRecommendation {
  decision: RecommendationDecision;
  sellNowQuantity: number;
  holdQuantity: number;
  confidence: number;
  reasoning: string[];
  riskLevel: RiskLevel;
}

export interface NetPriceComparison {
  mandiPrice: number;
  bestBuyerGrossPrice: number;
  transportCostPerUnit: number;
  bestBuyerNetRealization: number;
  betterOption: 'BUYER' | 'MANDI';
}

/** One step the agent took during the ReAct loop */
export interface AgentStep {
  toolName: string;
  toolCallId: string;
  inputArgs: Record<string, unknown>;
  outputSummary: string;
  durationMs: number;
}

export interface OrchestratorResult {
  intent: string;
  agentsUsed: string[];
  agentSteps: AgentStep[];
  recommendation?: OrchestratorRecommendation;
  forecast?: ForecastOutput;
  matchedBuyers?: MatchedBuyer[];
  netPriceComparison?: NetPriceComparison;
  explanation: string;
  dataTimestamp: string;
  executionMs: number;
  provider: string;
}

// ── Farmer/crop context ────────────────────────────────────────────────────────

interface FarmerContext {
  cropId: string | undefined;
  quantity: number;
  district: string;
  riskProfile: string;
  quality: string;
  expectedPrice: number | undefined;
  cropName: string;
  /** All crops from DB — injected into system prompt so the AI can identify crop IDs */
  allCrops: Array<{ id: string; name: string; nameHi?: string | null; nameGu?: string | null }>;
}

// ── Tool definitions for Granite ──────────────────────────────────────────────

const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'get_price_forecast',
      description: 'Fetches 7-day mandi price forecast for a crop using historical data. Returns current price, trend, forecast range, and confidence score.',
      parameters: {
        type: 'object',
        properties: {
          cropId: { type: 'string', description: 'UUID of the crop to forecast' },
          mandiId: { type: 'string', description: 'Optional: restrict to a specific mandi UUID' },
          historicalDays: { type: 'number', description: 'Number of past days to analyse (default 30)' },
        },
        required: ['cropId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_buyers',
      description: 'Finds and ranks verified buyers for a crop by net realization after transport costs.',
      parameters: {
        type: 'object',
        properties: {
          cropId: { type: 'string', description: 'UUID of the crop' },
          quantity: { type: 'number', description: 'Quantity in quintals the farmer wants to sell' },
          quality: { type: 'string', enum: ['GRADE_A', 'GRADE_B', 'GRADE_C', 'UNGRADED'], description: 'Crop quality grade' },
          farmerDistrict: { type: 'string', description: 'Farmer district for transport cost calculation' },
          expectedPrice: { type: 'number', description: 'Farmer expected price per quintal (optional)' },
        },
        required: ['cropId', 'quantity', 'farmerDistrict'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'storage_advisor',
      description: 'Analyses whether the farmer should sell now, store, or sell partially. Uses forecast data and risk profile.',
      parameters: {
        type: 'object',
        properties: {
          currentPrice: { type: 'number', description: 'Current modal mandi price per quintal' },
          forecastMin: { type: 'number', description: 'Lower bound of 7-day forecast' },
          forecastMax: { type: 'number', description: 'Upper bound of 7-day forecast' },
          forecastConfidence: { type: 'number', description: 'Confidence score between 0 and 1' },
          storageCostPerUnit: { type: 'number', description: 'Storage cost per quintal per day' },
          storageDurationDays: { type: 'number', description: 'Duration to evaluate storage for (days)' },
          quantity: { type: 'number', description: 'Quantity in quintals' },
          riskProfile: { type: 'string', enum: ['LOW', 'MODERATE', 'HIGH'], description: "Farmer's risk appetite" },
          bestBuyerNetPrice: { type: 'number', description: 'Best buyer net price per quintal (optional)' },
        },
        required: ['currentPrice', 'forecastMin', 'forecastMax', 'forecastConfidence', 'storageCostPerUnit', 'storageDurationDays', 'quantity'],
      },
    },
  },
];

// ── Tool argument types (parsed from JSON) ────────────────────────────────────

interface ForecastToolArgs {
  cropId: string;
  mandiId?: string;
  historicalDays?: number;
}

interface FindBuyersToolArgs {
  cropId: string;
  quantity: number;
  quality?: string;
  farmerDistrict: string;
  expectedPrice?: number;
}

interface StorageAdvisorToolArgs {
  currentPrice: number;
  forecastMin: number;
  forecastMax: number;
  forecastConfidence: number;
  storageCostPerUnit: number;
  storageDurationDays: number;
  quantity: number;
  riskProfile?: string;
  bestBuyerNetPrice?: number;
}

// ── Tool dispatcher ────────────────────────────────────────────────────────────

interface DispatchResult {
  output: ForecastOutput | BuyerMatchOutput | StorageAdvisorOutput;
  summary: string;
}

async function dispatchTool(
  toolCall: ToolCall,
  accumulator: {
    forecastResult: ForecastOutput | null;
    buyerResult: BuyerMatchOutput | null;
    storageResult: StorageAdvisorOutput | null;
    agentsUsed: string[];
    agentSteps: AgentStep[];
  }
): Promise<string> {
  const stepStart = Date.now();
  let args: Record<string, unknown>;

  try {
    args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
  } catch {
    return JSON.stringify({ error: 'Failed to parse tool arguments' });
  }

  let dispatchResult: DispatchResult | null = null;

  switch (toolCall.function.name) {
    case 'get_price_forecast': {
      const typedArgs = args as unknown as ForecastToolArgs;
      const result = await mandiPriceForecastingAgent.execute({
        cropId: typedArgs.cropId,
        mandiId: typedArgs.mandiId,
        historicalDays: typedArgs.historicalDays,
      });
      accumulator.forecastResult = result;
      accumulator.agentsUsed.push(result.agentName);
      dispatchResult = {
        output: result,
        summary: `Forecast: ${result.trend} trend, current ₹${result.currentPrice}/qtl, confidence ${Math.round(result.confidence * 100)}%`,
      };
      break;
    }

    case 'find_buyers': {
      const typedArgs = args as unknown as FindBuyersToolArgs;
      const result = await buyerMatchingAgent.execute({
        cropId: typedArgs.cropId,
        quantity: typedArgs.quantity,
        quality: typedArgs.quality ?? 'GRADE_B',
        farmerDistrict: typedArgs.farmerDistrict,
        expectedPrice: typedArgs.expectedPrice,
      });
      accumulator.buyerResult = result;
      accumulator.agentsUsed.push(result.agentName);
      dispatchResult = {
        output: result,
        summary: `Found ${result.totalFound} buyer(s). Best net: ₹${result.bestMatch?.estimatedNetRealization ?? 'N/A'}/qtl from ${result.bestMatch?.companyName ?? 'N/A'}`,
      };
      break;
    }

    case 'storage_advisor': {
      const typedArgs = args as unknown as StorageAdvisorToolArgs;
      const result = await storageSellingAdvisorAgent.execute({
        currentPrice: typedArgs.currentPrice,
        forecastMin: typedArgs.forecastMin,
        forecastMax: typedArgs.forecastMax,
        forecastConfidence: typedArgs.forecastConfidence,
        storageCostPerUnit: typedArgs.storageCostPerUnit,
        storageDurationDays: typedArgs.storageDurationDays,
        quantity: typedArgs.quantity,
        riskProfile: typedArgs.riskProfile,
        bestBuyerNetPrice: typedArgs.bestBuyerNetPrice,
      });
      accumulator.storageResult = result;
      accumulator.agentsUsed.push(result.agentName);
      dispatchResult = {
        output: result,
        summary: `Recommendation: ${result.recommendation}, sell ${result.sellNowQuantity} qtl now, store ${result.storeQuantity} qtl`,
      };
      break;
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolCall.function.name}` });
  }

  const durationMs = Date.now() - stepStart;

  accumulator.agentSteps.push({
    toolName: toolCall.function.name,
    toolCallId: toolCall.id,
    inputArgs: args,
    outputSummary: dispatchResult.summary,
    durationMs,
  });

  return JSON.stringify(dispatchResult.output);
}

// ── Main Orchestrator ──────────────────────────────────────────────────────────

export class AIOrchestrator {
  private readonly MAX_ITERATIONS = 6;

  async process(input: OrchestratorInput): Promise<OrchestratorResult> {
    const start = Date.now();

    const accumulator: {
      forecastResult: ForecastOutput | null;
      buyerResult: BuyerMatchOutput | null;
      storageResult: StorageAdvisorOutput | null;
      agentsUsed: string[];
      agentSteps: AgentStep[];
    } = {
      forecastResult: null,
      buyerResult: null,
      storageResult: null,
      agentsUsed: [],
      agentSteps: [],
    };

    // 1. Resolve farmer context from DB
    const ctx = await this.resolveFarmerContext(input);

    // 2. Build system prompt with available context
    const systemPrompt = this.buildSystemPrompt(ctx, input.language ?? 'en');
    const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

    // Inject previous conversation turns for context (max last 6 turns = 3 exchanges)
    if (input.chatHistory && input.chatHistory.length > 0) {
      const historySlice = input.chatHistory.slice(-6);
      for (const turn of historySlice) {
        messages.push({ role: turn.role, content: turn.content });
      }
    }

    messages.push({ role: 'user', content: input.query });

    // 3. ReAct loop — Granite decides which tools to call, we execute them
    let iterations = 0;

    while (iterations < this.MAX_ITERATIONS) {
      iterations++;

      const assistantMsg = await aiProvider.chat(messages, TOOL_DEFINITIONS, 'auto');
      messages.push(assistantMsg);

      // If no tool calls, Granite has produced the final answer
      if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
        break;
      }

      logger.info(`[Orchestrator] iteration ${iterations}: ${assistantMsg.tool_calls.map(tc => tc.function.name).join(', ')}`);

      // Execute all tool calls in this turn and add results to messages
      for (const toolCall of assistantMsg.tool_calls) {
        const toolOutput = await dispatchTool(toolCall, accumulator);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolOutput,
        });
      }
    }

    // 4. Extract final explanation from last assistant message
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant' && !m.tool_calls?.length);
    const explanation = typeof lastAssistantMsg?.content === 'string'
      ? lastAssistantMsg.content
      : '★ AI-assisted guidance — not a guaranteed financial outcome.';

    // 5. Build structured result from accumulated agent outputs
    const recommendation = this.buildRecommendation(accumulator.storageResult, ctx.quantity);
    const netPriceComparison = this.buildNetPriceComparison(
      accumulator.forecastResult,
      accumulator.buyerResult,
    );

    const intent = this.inferIntent(input.query);

    // 6. Persist to DB
    await this.persistToDatabase(input, intent, accumulator.agentsUsed, explanation, recommendation, ctx, start);

    return {
      intent,
      agentsUsed: [...new Set(accumulator.agentsUsed)],
      agentSteps: accumulator.agentSteps,
      recommendation,
      forecast: accumulator.forecastResult ?? undefined,
      matchedBuyers: accumulator.buyerResult?.matchedBuyers?.slice(0, 5),
      netPriceComparison,
      explanation,
      dataTimestamp: new Date().toISOString(),
      executionMs: Date.now() - start,
      provider: aiProvider.name,
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async resolveFarmerContext(input: OrchestratorInput): Promise<FarmerContext> {
    // Always fetch all crops for system prompt context
    const allCrops = await prisma.crop.findMany({
      select: { id: true, name: true, nameHi: true, nameGu: true },
    });

    if (input.farmerCropId) {
      const farmerCrop = await prisma.farmerCrop.findUnique({
        where: { id: input.farmerCropId },
        include: { crop: true, farmerProfile: true },
      });
      if (farmerCrop) {
        return {
          cropId: farmerCrop.cropId,
          quantity: input.quantity ?? farmerCrop.quantity,
          district: input.district ?? farmerCrop.farmerProfile.district,
          riskProfile: input.riskProfile ?? farmerCrop.farmerProfile.riskProfile,
          quality: farmerCrop.quality,
          expectedPrice: farmerCrop.expectedPrice ?? undefined,
          cropName: farmerCrop.crop.name,
          allCrops,
        };
      }
    }

    if (input.cropId) {
      const fp = await prisma.farmerProfile.findUnique({ where: { userId: input.userId } });
      if (fp) {
        const farmerCrop = await prisma.farmerCrop.findFirst({
          where: { farmerProfileId: fp.id, cropId: input.cropId, isActive: true },
          include: { crop: true },
        });
        if (farmerCrop) {
          return {
            cropId: input.cropId,
            quantity: input.quantity ?? farmerCrop.quantity,
            district: input.district ?? fp.district,
            riskProfile: input.riskProfile ?? fp.riskProfile,
            quality: farmerCrop.quality,
            expectedPrice: farmerCrop.expectedPrice ?? undefined,
            cropName: farmerCrop.crop.name,
            allCrops,
          };
        }
        // cropId provided but no active farmer crop — still resolve crop name
        const crop = await prisma.crop.findUnique({ where: { id: input.cropId } });
        const fp2 = fp;
        return {
          cropId: input.cropId,
          quantity: input.quantity ?? 100,
          district: input.district ?? fp2.district,
          riskProfile: input.riskProfile ?? fp2.riskProfile,
          quality: 'GRADE_B',
          expectedPrice: undefined,
          cropName: crop?.name ?? 'crop',
          allCrops,
        };
      }
    }

    // No explicit crop context — try to resolve from query text using chat history
    const queryText = [
      ...(input.chatHistory ?? []).map(t => t.content),
      input.query,
    ].join(' ').toLowerCase();

    const fp = await prisma.farmerProfile.findUnique({ where: { userId: input.userId } });
    const matchedCrop = allCrops.find(c =>
      queryText.includes(c.name.toLowerCase()) ||
      (c.nameHi && queryText.includes(c.nameHi.toLowerCase())) ||
      (c.nameGu && queryText.includes(c.nameGu.toLowerCase()))
    );

    return {
      cropId: matchedCrop?.id ?? input.cropId,
      quantity: input.quantity ?? 100,
      district: input.district ?? fp?.district ?? 'Ahmedabad',
      riskProfile: input.riskProfile ?? fp?.riskProfile ?? 'MODERATE',
      quality: 'GRADE_B',
      expectedPrice: undefined,
      cropName: matchedCrop?.name ?? 'crop',
      allCrops,
    };
  }

  private buildSystemPrompt(ctx: FarmerContext, language: string): string {
    const cropCatalog = ctx.allCrops
      .map(c => `${c.name} (id: ${c.id})`)
      .join(', ');
    return [
      'You are KisanMitra AI, an expert agricultural market advisor for farmers in Gujarat, India.',
      'You have access to three tools: get_price_forecast, find_buyers, and storage_advisor.',
      'Use them as needed to answer the farmer\'s question. Call multiple tools if the query requires it.',
      'When the farmer asks about a crop, identify the correct cropId from the crop catalog below and pass it to tools.',
      'After receiving tool results, provide a concise 2-4 sentence farmer-friendly explanation.',
      'NEVER invent prices, buyer names, or quantities not returned by the tools.',
      'Always end with: ★ AI-assisted guidance — not a guaranteed financial outcome.',
      `Language for final response: ${language}`,
      `Farmer context: ${JSON.stringify({
        cropId: ctx.cropId,
        cropName: ctx.cropName,
        quantity: ctx.quantity,
        district: ctx.district,
        riskProfile: ctx.riskProfile,
        quality: ctx.quality,
        expectedPrice: ctx.expectedPrice,
      })}`,
      `Available crops (use exact id values in tool calls): ${cropCatalog}`,
    ].join('\n');
  }

  private inferIntent(query: string): string {
    const q = query.toLowerCase();
    if (q.includes('sell') || q.includes('vech') || q.includes('becho')) return 'SELL_VS_STORE';
    if (q.includes('buyer') || q.includes('kharido') || q.includes('kharnidar')) return 'FIND_BUYERS';
    if (q.includes('price') || q.includes('bhav') || q.includes('rato')) return 'MARKET_PRICE';
    if (q.includes('quality') || q.includes('grade') || q.includes('gunvatta')) return 'QUALITY';
    if (q.includes('income') || q.includes('aavak') || q.includes('profit')) return 'INCOME';
    if (q.includes('store') || q.includes('rakho') || q.includes('bhandar')) return 'STORAGE';
    return 'GENERAL';
  }

  private buildRecommendation(
    storageResult: StorageAdvisorOutput | null,
    quantity: number,
  ): OrchestratorRecommendation | undefined {
    if (!storageResult) return undefined;
    return {
      decision: storageResult.recommendation as RecommendationDecision,
      sellNowQuantity: storageResult.sellNowQuantity,
      holdQuantity: storageResult.storeQuantity,
      confidence: storageResult.confidence,
      reasoning: storageResult.reasoning,
      riskLevel: storageResult.riskLevel as RiskLevel,
    };
  }

  private buildNetPriceComparison(
    forecastResult: ForecastOutput | null,
    buyerResult: BuyerMatchOutput | null,
  ): NetPriceComparison | undefined {
    if (!forecastResult || !buyerResult?.bestMatch) return undefined;
    const best = buyerResult.bestMatch;
    return {
      mandiPrice: forecastResult.currentPrice,
      bestBuyerGrossPrice: best.offeredPrice,
      transportCostPerUnit: best.transportCostPerUnit,
      bestBuyerNetRealization: best.estimatedNetRealization,
      betterOption: best.estimatedNetRealization > forecastResult.currentPrice ? 'BUYER' : 'MANDI',
    };
  }

  private async persistToDatabase(
    input: OrchestratorInput,
    intent: string,
    agentsUsed: string[],
    explanation: string,
    recommendation: OrchestratorRecommendation | undefined,
    ctx: FarmerContext,
    start: number,
  ): Promise<void> {
    try {
      await prisma.aIRequest.create({
        data: {
          userId: input.userId,
          query: input.query,
          intent,
          agentsUsed,
          response: explanation,
          executionMs: Date.now() - start,
          success: true,
        },
      });

      if (recommendation && ctx.cropId) {
        await prisma.aIRecommendation.create({
          data: {
            farmerCropId: input.farmerCropId ?? undefined,
            userId: input.userId,
            decision: recommendation.decision,
            recommendedSellQty: recommendation.sellNowQuantity,
            recommendedHoldQty: recommendation.holdQuantity,
            confidence: recommendation.confidence,
            riskLevel: recommendation.riskLevel,
            reasoning: recommendation.reasoning,
            explanation,
            agentsUsed,
            inputContext: { cropId: ctx.cropId, quantity: ctx.quantity, district: ctx.district },
            dataTimestamp: new Date(),
            aiProvider: aiProvider.name,
          },
        });
      }
    } catch (err) {
      logger.error('Failed to persist AI request:', err);
    }
  }

  async getAgentStatus(): Promise<AgentStatusEntry[]> {
    const agentNames = [
      'MandiPriceForecastingAgent',
      'BuyerMatchingAgent',
      'StorageSellingAdvisorAgent',
      'QualityGradingAgent',
      'AIOrchestrator',
    ];

    const recentRequests = await prisma.aIRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { agentsUsed: true, success: true, executionMs: true, createdAt: true },
    });

    return agentNames.map((agentName) => {
      const agent = { name: agentName, status: 'ACTIVE' };
      const agentRequests = recentRequests.filter(r =>
        (r.agentsUsed as string[]).includes(agentName)
      );
      const successRate = agentRequests.length > 0
        ? agentRequests.filter(r => r.success).length / agentRequests.length
        : 1;
      const avgExecution = agentRequests.length > 0
        ? agentRequests.reduce((s, r) => s + (r.executionMs ?? 0), 0) / agentRequests.length
        : 0;

      return {
        name: agent.name,
        status: agent.status,
        lastExecution: agentRequests[0]?.createdAt ?? null,
        executionCount: agentRequests.length,
        successRate: parseFloat(successRate.toFixed(2)),
        avgExecutionMs: Math.round(avgExecution),
      };
    });
  }
}

export interface AgentStatusEntry {
  name: string;
  status: string;
  lastExecution: Date | null;
  executionCount: number;
  successRate: number;
  avgExecutionMs: number;
}

export const aiOrchestrator = new AIOrchestrator();
