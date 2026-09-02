import { BaseAgent, AgentInput, AgentOutput } from './baseAgent';
import prisma from '../database/client';
import { calculateTransportCost } from '../services/transactionService';

export interface BuyerMatchInput extends AgentInput {
  cropId: string;
  quantity: number;
  quality: string;
  farmerDistrict: string;
  expectedPrice?: number;
}

export interface MatchedBuyer {
  buyerOfferId: string;
  buyerProfileId: string;
  companyName: string;
  verificationStatus: string;
  offeredPrice: number;
  maxQuantity: number;
  district: string;
  estimatedTransportCost: number;
  transportCostPerUnit: number;
  estimatedNetRealization: number;
  rating: number;
  score: number;
  isVerified: boolean;
}

export interface BuyerMatchOutput extends AgentOutput {
  matchedBuyers: MatchedBuyer[];
  bestMatch?: MatchedBuyer;
  totalFound: number;
}

export class BuyerMatchingAgent extends BaseAgent<BuyerMatchInput, BuyerMatchOutput> {
  readonly name = 'BuyerMatchingAgent';

  validateInput(input: BuyerMatchInput): boolean {
    return !!input.cropId && input.quantity > 0 && !!input.farmerDistrict;
  }

  protected async run(input: BuyerMatchInput): Promise<BuyerMatchOutput> {
    const offers = await prisma.buyerOffer.findMany({
      where: {
        cropId: input.cropId,
        isActive: true,
        maxQuantity: { gte: input.quantity * 0.5 }, // at least 50% of farmer's quantity
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      include: {
        buyerProfile: true,
        crop: true,
      },
    });

    const matchedBuyers: MatchedBuyer[] = offers.map((offer) => {
      const totalTransport = calculateTransportCost(
        input.farmerDistrict,
        offer.district,
        input.quantity
      );
      const transportPerUnit = totalTransport / input.quantity;
      const netRealization = offer.offeredPrice - transportPerUnit;

      // Scoring: net price + verification bonus + rating
      const verificationBonus = offer.buyerProfile.verificationStatus === 'VERIFIED' ? 200 : 0;
      const ratingBonus = (offer.buyerProfile.rating || 0) * 50;
      const score = netRealization + verificationBonus + ratingBonus;

      return {
        buyerOfferId: offer.id,
        buyerProfileId: offer.buyerProfileId,
        companyName: offer.buyerProfile.companyName,
        verificationStatus: offer.buyerProfile.verificationStatus,
        offeredPrice: offer.offeredPrice,
        maxQuantity: offer.maxQuantity,
        district: offer.district,
        estimatedTransportCost: parseFloat(totalTransport.toFixed(2)),
        transportCostPerUnit: parseFloat(transportPerUnit.toFixed(2)),
        estimatedNetRealization: parseFloat(netRealization.toFixed(2)),
        rating: offer.buyerProfile.rating || 0,
        score: parseFloat(score.toFixed(2)),
        isVerified: offer.buyerProfile.verificationStatus === 'VERIFIED',
      };
    });

    // Sort by score descending — verified buyers with high net realization first
    matchedBuyers.sort((a, b) => b.score - a.score);

    return {
      agentName: this.name,
      success: true,
      confidence: matchedBuyers.length > 0 ? 0.85 : 0.1,
      executionMs: 0,
      matchedBuyers,
      bestMatch: matchedBuyers[0],
      totalFound: matchedBuyers.length,
    };
  }
}

export const buyerMatchingAgent = new BuyerMatchingAgent();
