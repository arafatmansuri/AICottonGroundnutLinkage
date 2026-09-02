import { aiProvider } from '../ai/aiProvider';
import { mandiPriceForecastingAgent } from '../agents/forecastingAgent';
import { buyerMatchingAgent } from '../agents/buyerMatchingAgent';
import { storageSellingAdvisorAgent } from '../agents/storageAdvisorAgent';
import { qualityGradingAgent } from '../agents/qualityGradingAgent';
import prisma from '../database/client';
import logger from '../utils/logger';

export interface OrchestratorInput {
  userId: string;
  query: string;
  language?: string;
  cropId?: string;
  farmerCropId?: string;
  quantity?: number;
  district?: string;
  riskProfile?: string;
}

export interface OrchestratorResult {
  intent: string;
  agentsUsed: string[];
  recommendation?: {
    decision: string;
    sellNowQuantity?: number;
    holdQuantity?: number;
    confidence: number;
    reasoning: string[];
    riskLevel: string;
  };
  forecast?: object;
  matchedBuyers?: object[];
  netPriceComparison?: object;
  explanation: string;
  dataTimestamp: string;
  executionMs: number;
  provider: string;
}

export class AIOrchestrator {
  async process(input: OrchestratorInput): Promise<OrchestratorResult> {
    const start = Date.now();
    const agentsUsed: string[] = [];

    // 1. Detect intent
    const intent = await aiProvider.detectIntent(input.query);
    logger.info(`AI Intent: ${intent} for user ${input.userId}`);

    let forecast: object | undefined;
    let matchedBuyers: object[] | undefined;
    let netPriceComparison: object | undefined;
    let recommendation: OrchestratorResult['recommendation'];

    // 2. Get farmer context if available
    let farmerCrop: any = null;
    let farmerProfile: any = null;

    if (input.farmerCropId) {
      farmerCrop = await prisma.farmerCrop.findUnique({
        where: { id: input.farmerCropId },
        include: { crop: true, farmerProfile: true },
      });
      if (farmerCrop) {
        farmerProfile = farmerCrop.farmerProfile;
      }
    } else if (input.cropId) {
      // Get from user's profile
      const fp = await prisma.farmerProfile.findUnique({ where: { userId: input.userId } });
      if (fp) {
        farmerProfile = fp;
        farmerCrop = await prisma.farmerCrop.findFirst({
          where: { farmerProfileId: fp.id, cropId: input.cropId, isActive: true },
          include: { crop: true },
        });
      }
    }

    const cropId = farmerCrop?.cropId || input.cropId;
    const quantity = input.quantity || farmerCrop?.availableQuantity || 100;
    const district = input.district || farmerProfile?.district || 'Ahmedabad';
    const riskProfile = input.riskProfile || farmerProfile?.riskProfile || 'MODERATE';

    // 3. Route to agents based on intent
    if (['SELL_VS_STORE', 'FIND_BUYERS', 'MARKET_PRICE', 'GENERAL'].includes(intent) && cropId) {
      // Run forecasting agent
      const forecastResult = await mandiPriceForecastingAgent.execute({ cropId });
      agentsUsed.push(forecastResult.agentName);
      if (forecastResult.success) forecast = forecastResult;

      // Run buyer matching agent
      const buyerResult = await buyerMatchingAgent.execute({
        cropId,
        quantity,
        quality: farmerCrop?.quality || 'GRADE_B',
        farmerDistrict: district,
        expectedPrice: farmerCrop?.expectedPrice,
      });
      agentsUsed.push(buyerResult.agentName);
      if (buyerResult.success) {
        matchedBuyers = buyerResult.matchedBuyers;

        // Net price comparison: mandi vs best buyer
        const fc = forecastResult as any;
        const bestBuyer = buyerResult.bestMatch;
        if (fc?.currentPrice && bestBuyer) {
          netPriceComparison = {
            mandiPrice: fc.currentPrice,
            bestBuyerGrossPrice: bestBuyer.offeredPrice,
            transportCostPerUnit: bestBuyer.transportCostPerUnit,
            bestBuyerNetRealization: bestBuyer.estimatedNetRealization,
            betterOption: bestBuyer.estimatedNetRealization > fc.currentPrice ? 'BUYER' : 'MANDI',
          };
        }

        // Storage advisor
        if (['SELL_VS_STORE', 'STORAGE', 'GENERAL'].includes(intent)) {
          const fc2 = forecastResult as any;
          const storageResult = await storageSellingAdvisorAgent.execute({
            currentPrice: fc2?.currentPrice || 7000,
            forecastMin: fc2?.forecastRange?.min || 7000,
            forecastMax: fc2?.forecastRange?.max || 7200,
            forecastConfidence: fc2?.confidence || 0.6,
            storageCostPerUnit: 50,
            storageDurationDays: 30,
            quantity,
            riskProfile,
            bestBuyerNetPrice: bestBuyer?.estimatedNetRealization,
          });
          agentsUsed.push(storageResult.agentName);

          recommendation = {
            decision: storageResult.recommendation,
            sellNowQuantity: storageResult.sellNowQuantity,
            holdQuantity: storageResult.storeQuantity,
            confidence: storageResult.confidence,
            reasoning: storageResult.reasoning,
            riskLevel: storageResult.riskLevel,
          };
        }
      }
    }

    // 4. Build structured prompt for Granite
    const structuredContext = {
      intent,
      crop: farmerCrop?.crop?.name || 'crop',
      quantity,
      district,
      forecast: (forecast as any)?.trend,
      forecastConfidence: (forecast as any)?.confidence,
      recommendation: recommendation?.decision,
      netRealization: (netPriceComparison as any)?.bestBuyerNetRealization,
      bestBuyerPrice: matchedBuyers?.[0] ? (matchedBuyers[0] as any).offeredPrice : undefined,
    };

    const promptText =
      `FARMER QUERY: "${input.query}"\n` +
      `INTENT: ${intent}\n` +
      `CONTEXT: ${JSON.stringify(structuredContext)}\n` +
      `RECOMMENDATION: ${recommendation?.decision || 'GENERAL_INQUIRY'}\n` +
      `LANGUAGE: ${input.language || 'en'}\n\n` +
      `Generate a concise, farmer-friendly explanation (2–4 sentences) based on the above data. ` +
      `Do not invent prices or buyers not in the context. ` +
      `Always include a note that this is AI-assisted guidance, not a guaranteed financial outcome.`;

    // 5. Generate explanation via AI provider
    const explanation = await aiProvider.generateResponse(promptText, input.language || 'en');

    // 6. Save AI request to database
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

      // Save recommendation if generated
      if (recommendation && cropId) {
        await prisma.aIRecommendation.create({
          data: {
            farmerCropId: input.farmerCropId || undefined,
            userId: input.userId,
            decision: recommendation.decision as any,
            recommendedSellQty: recommendation.sellNowQuantity,
            recommendedHoldQty: recommendation.holdQuantity,
            confidence: recommendation.confidence,
            riskLevel: recommendation.riskLevel as any,
            reasoning: recommendation.reasoning,
            explanation,
            agentsUsed,
            inputContext: structuredContext,
            dataTimestamp: new Date(),
            aiProvider: aiProvider.name,
          },
        });
      }
    } catch (err) {
      logger.error('Failed to save AI request:', err);
    }

    return {
      intent,
      agentsUsed,
      recommendation,
      forecast,
      matchedBuyers: matchedBuyers?.slice(0, 5),
      netPriceComparison,
      explanation,
      dataTimestamp: new Date().toISOString(),
      executionMs: Date.now() - start,
      provider: aiProvider.name,
    };
  }

  async getAgentStatus() {
    const agents = [
      { name: 'MandiPriceForecastingAgent', status: 'ACTIVE' },
      { name: 'BuyerMatchingAgent', status: 'ACTIVE' },
      { name: 'StorageSellingAdvisorAgent', status: 'ACTIVE' },
      { name: 'QualityGradingAgent', status: 'ACTIVE' },
      { name: 'AIOrchestrator', status: 'ACTIVE' },
    ];

    const recentRequests = await prisma.aIRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { agentsUsed: true, success: true, executionMs: true, createdAt: true },
    });

    return agents.map((agent) => {
      const agentRequests = recentRequests.filter((r) =>
        (r.agentsUsed as string[]).includes(agent.name)
      );
      const successRate =
        agentRequests.length > 0
          ? agentRequests.filter((r) => r.success).length / agentRequests.length
          : 1;
      const avgExecution =
        agentRequests.length > 0
          ? agentRequests.reduce((s, r) => s + (r.executionMs || 0), 0) / agentRequests.length
          : 0;

      return {
        ...agent,
        lastExecution: agentRequests[0]?.createdAt || null,
        executionCount: agentRequests.length,
        successRate: parseFloat(successRate.toFixed(2)),
        avgExecutionMs: Math.round(avgExecution),
      };
    });
  }
}

export const aiOrchestrator = new AIOrchestrator();
