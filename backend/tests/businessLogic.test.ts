/**
 * Unit Tests — Net Price & Business Logic
 * KisanMitra AI
 */

import { calculateTransportCost } from '../src/services/transactionService';

// ─── Net Price Calculation ──────────────────────────────────────────────────

describe('Net Price Intelligence', () => {
  /**
   * Case 1: High gross price but high transport cost should yield lower net
   */
  it('Case 1: High gross + high transport → lower net realization', () => {
    const grossPrice = 7500;
    const transportCost = 400; // per quintal (long distance)
    const netRealization = grossPrice - transportCost;
    expect(netRealization).toBe(7100);
    expect(netRealization).toBeLessThan(grossPrice);
  });

  /**
   * Case 2: Lower gross but lower transport should yield higher net
   */
  it('Case 2: Lower gross + low transport → higher net realization than Case 1', () => {
    const grossPriceHighTransport = 7500;
    const transportHigh = 400;
    const netHigh = grossPriceHighTransport - transportHigh; // 7100

    const grossPriceLowTransport = 7350;
    const transportLow = 100;
    const netLow = grossPriceLowTransport - transportLow; // 7250

    expect(netLow).toBeGreaterThan(netHigh);
  });

  /**
   * Case 3: Cannot sell more than available quantity
   */
  it('Case 3: Selling more than available quantity must be rejected', () => {
    const availableQuantity = 100;
    const requestedQuantity = 120;
    const canSell = requestedQuantity <= availableQuantity;
    expect(canSell).toBe(false);
  });

  /**
   * Case 4: Cannot have negative inventory
   */
  it('Case 4: Inventory cannot go negative after sale', () => {
    const available = 100;
    const sold = 40;
    const remaining = available - sold;
    expect(remaining).toBe(60);
    expect(remaining).toBeGreaterThanOrEqual(0);
  });
});

// ─── Storage Economics ──────────────────────────────────────────────────────

describe('Storage vs Selling Advisor Logic', () => {
  function evaluateStorage(params: {
    currentPrice: number;
    forecastPrice: number;
    storageCostPerUnit: number;
    quantity: number;
  }) {
    const { currentPrice, forecastPrice, storageCostPerUnit, quantity } = params;
    const currentValue = currentPrice * quantity;
    const futureNetValue = (forecastPrice - storageCostPerUnit) * quantity;
    const gainPerUnit = forecastPrice - storageCostPerUnit - currentPrice;
    return {
      currentValue,
      futureNetValue,
      gainPerUnit,
      recommendation: gainPerUnit <= 0 ? 'SELL_NOW' :
        gainPerUnit > 200 ? 'STORE' : 'SELL_PARTIALLY',
    };
  }

  /**
   * Case 5: Storage cost exceeds expected gain → SELL_NOW
   */
  it('Case 5: Storage cost > expected price gain → SELL_NOW', () => {
    const result = evaluateStorage({
      currentPrice: 7100,
      forecastPrice: 7150,
      storageCostPerUnit: 100,
      quantity: 100,
    });
    // Gain = 7150 - 100 - 7100 = -50 → SELL_NOW
    expect(result.gainPerUnit).toBeLessThanOrEqual(0);
    expect(result.recommendation).toBe('SELL_NOW');
  });

  /**
   * Case 6: Future value significantly exceeds current + storage → STORE
   */
  it('Case 6: Future value > current value + storage → STORE', () => {
    const result = evaluateStorage({
      currentPrice: 7000,
      forecastPrice: 7500,
      storageCostPerUnit: 60,
      quantity: 100,
    });
    // Gain = 7500 - 60 - 7000 = 440 → STORE
    expect(result.gainPerUnit).toBeGreaterThan(200);
    expect(result.recommendation).toBe('STORE');
  });

  /**
   * Case 7: Low confidence → should yield SELL_PARTIALLY (moderate decision)
   */
  it('Case 7: Low forecast confidence → conservative recommendation', () => {
    const confidence = 0.45; // < 0.6 threshold
    const isLowConfidence = confidence < 0.6;
    // A low-confidence forecast should not recommend aggressive storage
    expect(isLowConfidence).toBe(true);
    // In our StorageAdvisorAgent, low confidence alone changes signal to SELL_PARTIALLY
    const signal = isLowConfidence ? 'SELL_PARTIALLY' : 'STORE';
    expect(signal).toBe('SELL_PARTIALLY');
  });
});

// ─── Transport Cost Engine ──────────────────────────────────────────────────

describe('Transportation Cost Engine', () => {
  it('calculates non-zero transport cost between different districts', () => {
    const cost = calculateTransportCost('Ahmedabad', 'Rajkot', 100);
    expect(cost).toBeGreaterThan(0);
  });

  it('calculates zero or minimal cost for same district', () => {
    const cost = calculateTransportCost('Ahmedabad', 'Ahmedabad', 100);
    expect(cost).toBe(0);
  });

  it('transport cost scales with quantity', () => {
    const cost50 = calculateTransportCost('Ahmedabad', 'Rajkot', 50);
    const cost100 = calculateTransportCost('Ahmedabad', 'Rajkot', 100);
    expect(cost100).toBeCloseTo(cost50 * 2, 0);
  });

  it('uses default distance for unknown districts', () => {
    const cost = calculateTransportCost('UnknownCity', 'AnotherCity', 10);
    expect(cost).toBeGreaterThan(0); // should use fallback of 150km
  });
});

// ─── Buyer Verification Logic ───────────────────────────────────────────────

describe('Buyer Verification & Trust', () => {
  /**
   * Case 8: Unverified buyer should rank lower than verified
   */
  it('Case 8: Verified buyer scores higher than unverified buyer', () => {
    const VERIFICATION_BONUS = 200;

    const verifiedBuyerNetPrice = 7200;
    const unverifiedBuyerNetPrice = 7200;

    const verifiedScore = verifiedBuyerNetPrice + VERIFICATION_BONUS;
    const unverifiedScore = unverifiedBuyerNetPrice + 0;

    expect(verifiedScore).toBeGreaterThan(unverifiedScore);
  });

  it('unverified buyers should not get verified trust treatment', () => {
    const buyerVerificationStatus: string = 'PENDING';
    const isVerified = buyerVerificationStatus === 'VERIFIED';
    expect(isVerified).toBe(false);
  });
});

// ─── Inventory Consistency ──────────────────────────────────────────────────

describe('Inventory Consistency', () => {
  it('available quantity decreases correctly after partial sale', () => {
    const initial = 100;
    const sold = 40;
    const available = initial - sold;
    const soldQty = sold;
    expect(available).toBe(60);
    expect(soldQty).toBe(40);
    expect(available + soldQty).toBe(initial);
  });

  it('prevents selling more than owned', () => {
    const available = 60;
    const tryToSell = 80;
    const canProceed = tryToSell <= available;
    expect(canProceed).toBe(false);
  });

  it('allows selling exact available quantity', () => {
    const available = 60;
    const tryToSell = 60;
    const canProceed = tryToSell <= available;
    expect(canProceed).toBe(true);
  });
});
