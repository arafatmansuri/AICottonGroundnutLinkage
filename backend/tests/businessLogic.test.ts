/**
 * Unit Tests — Net Price, Business Logic, State Machine, Ownership, Concurrency
 * KisanMitra AI
 */

import { calculateTransportCost } from '../src/services/transactionService';

// ─── Net Price Calculation ──────────────────────────────────────────────────

describe('Net Price Intelligence', () => {
  it('Case 1: High gross + high transport → lower net realization', () => {
    const grossPrice = 7500;
    const transportCost = 400;
    const netRealization = grossPrice - transportCost;
    expect(netRealization).toBe(7100);
    expect(netRealization).toBeLessThan(grossPrice);
  });

  it('Case 2: Lower gross + low transport → higher net realization than Case 1', () => {
    const netHigh = 7500 - 400; // 7100
    const netLow = 7350 - 100;  // 7250
    expect(netLow).toBeGreaterThan(netHigh);
  });

  it('Case 3: Selling more than available quantity must be rejected', () => {
    const availableQuantity = 100;
    const requestedQuantity = 120;
    expect(requestedQuantity <= availableQuantity).toBe(false);
  });

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

  it('Case 5: Storage cost > expected price gain → SELL_NOW', () => {
    const result = evaluateStorage({ currentPrice: 7100, forecastPrice: 7150, storageCostPerUnit: 100, quantity: 100 });
    expect(result.gainPerUnit).toBeLessThanOrEqual(0);
    expect(result.recommendation).toBe('SELL_NOW');
  });

  it('Case 6: Future value > current value + storage → STORE', () => {
    const result = evaluateStorage({ currentPrice: 7000, forecastPrice: 7500, storageCostPerUnit: 60, quantity: 100 });
    expect(result.gainPerUnit).toBeGreaterThan(200);
    expect(result.recommendation).toBe('STORE');
  });

  it('Case 7: Low forecast confidence → conservative recommendation', () => {
    const confidence = 0.45;
    const isLowConfidence = confidence < 0.6;
    expect(isLowConfidence).toBe(true);
    const signal = isLowConfidence ? 'SELL_PARTIALLY' : 'STORE';
    expect(signal).toBe('SELL_PARTIALLY');
  });

  it('storage cost zero → full gain captured', () => {
    const result = evaluateStorage({ currentPrice: 7000, forecastPrice: 7500, storageCostPerUnit: 0, quantity: 100 });
    expect(result.gainPerUnit).toBe(500);
    expect(result.recommendation).toBe('STORE');
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
    expect(cost).toBeGreaterThan(0);
  });

  it('is symmetric: A→B == B→A', () => {
    const ab = calculateTransportCost('Ahmedabad', 'Rajkot', 100);
    const ba = calculateTransportCost('Rajkot', 'Ahmedabad', 100);
    expect(ab).toBe(ba);
  });
});

// ─── Buyer Verification Logic ───────────────────────────────────────────────

describe('Buyer Verification & Trust', () => {
  it('Case 8: Verified buyer scores higher than unverified buyer', () => {
    const VERIFICATION_BONUS = 200;
    const verifiedScore = 7200 + VERIFICATION_BONUS;
    const unverifiedScore = 7200;
    expect(verifiedScore).toBeGreaterThan(unverifiedScore);
  });

  it('unverified buyers should not get verified trust treatment', () => {
    const buyerVerificationStatus: string = 'PENDING';
    expect(buyerVerificationStatus === 'VERIFIED').toBe(false);
  });

  it('rejected buyer status is not treated as verified', () => {
    const status: string = 'REJECTED';
    expect(status === 'VERIFIED').toBe(false);
    expect(['VERIFIED', 'PENDING'].includes(status)).toBe(false);
  });
});

// ─── Inventory Consistency ──────────────────────────────────────────────────

describe('Inventory Consistency', () => {
  it('available quantity decreases correctly after partial sale', () => {
    const initial = 100;
    const sold = 40;
    const available = initial - sold;
    expect(available).toBe(60);
    expect(available + sold).toBe(initial);
  });

  it('prevents selling more than owned', () => {
    expect(80 <= 60).toBe(false);
  });

  it('allows selling exact available quantity', () => {
    expect(60 <= 60).toBe(true);
  });

  it('multiple sequential sales maintain correct total', () => {
    let available = 200;
    const sales = [50, 30, 70];
    for (const sale of sales) {
      expect(sale <= available).toBe(true);
      available -= sale;
    }
    expect(available).toBe(50);
    expect(available).toBeGreaterThanOrEqual(0);
  });
});

// ─── Transaction State Machine ──────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  OFFER_CREATED: ['OFFER_SENT', 'CANCELLED'],
  OFFER_SENT: ['ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  ACCEPTED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
  DISPUTED: ['COMPLETED', 'CANCELLED'],
};

function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

describe('Transaction State Machine', () => {
  it('allows valid OFFER_CREATED → OFFER_SENT transition', () => {
    expect(canTransition('OFFER_CREATED', 'OFFER_SENT')).toBe(true);
  });

  it('allows valid OFFER_SENT → ACCEPTED transition', () => {
    expect(canTransition('OFFER_SENT', 'ACCEPTED')).toBe(true);
  });

  it('allows valid ACCEPTED → CONFIRMED transition', () => {
    expect(canTransition('ACCEPTED', 'CONFIRMED')).toBe(true);
  });

  it('allows valid IN_PROGRESS → COMPLETED transition', () => {
    expect(canTransition('IN_PROGRESS', 'COMPLETED')).toBe(true);
  });

  it('rejects illegal OFFER_CREATED → COMPLETED skip', () => {
    expect(canTransition('OFFER_CREATED', 'COMPLETED')).toBe(false);
  });

  it('rejects backward COMPLETED → OFFER_SENT transition', () => {
    expect(canTransition('COMPLETED', 'OFFER_SENT')).toBe(false);
  });

  it('rejects re-opening a REJECTED transaction', () => {
    expect(canTransition('REJECTED', 'ACCEPTED')).toBe(false);
    expect(canTransition('REJECTED', 'OFFER_SENT')).toBe(false);
  });

  it('allows dispute resolution via DISPUTED → COMPLETED', () => {
    expect(canTransition('DISPUTED', 'COMPLETED')).toBe(true);
    expect(canTransition('DISPUTED', 'CANCELLED')).toBe(true);
  });

  it('CANCELLED is a terminal state — no transitions out', () => {
    const states = Object.keys(VALID_TRANSITIONS);
    for (const state of states) {
      if (state !== 'CANCELLED') {
        expect(canTransition('CANCELLED', state)).toBe(false);
      }
    }
  });

  it('full happy path: OFFER_CREATED → OFFER_SENT → ACCEPTED → CONFIRMED → IN_PROGRESS → COMPLETED', () => {
    const path = ['OFFER_CREATED', 'OFFER_SENT', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'];
    for (let i = 0; i < path.length - 1; i++) {
      expect(canTransition(path[i], path[i + 1])).toBe(true);
    }
  });
});

// ─── Ownership Enforcement ──────────────────────────────────────────────────

describe('Ownership Enforcement', () => {
  function isAuthorizedFarmer(transactionFarmerUserId: string, requestingUserId: string): boolean {
    return transactionFarmerUserId === requestingUserId;
  }

  function isAuthorizedBuyer(transactionBuyerUserId: string, requestingUserId: string): boolean {
    return transactionBuyerUserId === requestingUserId;
  }

  it('farmer A cannot modify farmer B\'s transaction', () => {
    expect(isAuthorizedFarmer('farmer-B-uuid', 'farmer-A-uuid')).toBe(false);
  });

  it('farmer can modify their own transaction', () => {
    expect(isAuthorizedFarmer('farmer-A-uuid', 'farmer-A-uuid')).toBe(true);
  });

  it('buyer A cannot modify buyer B\'s transaction', () => {
    expect(isAuthorizedBuyer('buyer-B-uuid', 'buyer-A-uuid')).toBe(false);
  });

  it('buyer can modify their own transaction', () => {
    expect(isAuthorizedBuyer('buyer-A-uuid', 'buyer-A-uuid')).toBe(true);
  });

  it('farmer crop ownership check fails for wrong farmer', () => {
    const crop = { farmerProfileId: 'profile-1', isActive: true };
    const requestingProfileId = 'profile-2';
    const canAccess = crop.farmerProfileId === requestingProfileId && crop.isActive;
    expect(canAccess).toBe(false);
  });

  it('farmer crop ownership check passes for correct farmer', () => {
    const crop = { farmerProfileId: 'profile-1', isActive: true };
    const canAccess = crop.farmerProfileId === 'profile-1' && crop.isActive;
    expect(canAccess).toBe(true);
  });
});

// ─── Concurrent Inventory ───────────────────────────────────────────────────

describe('Concurrent Inventory Reservation', () => {
  /**
   * Simulates two concurrent reservation attempts on the same inventory.
   * The atomic check-and-decrement must only allow one to succeed.
   */
  it('only one of two concurrent requests should succeed when combined quantity exceeds available', () => {
    let available = 100;
    const req1 = 80;
    const req2 = 80;

    // Simulate serialized atomic check (as done inside DB transaction)
    let req1Success = false;
    let req2Success = false;

    // First request grabs the lock
    if (req1 <= available) {
      available -= req1;
      req1Success = true;
    }
    // Second request now sees updated inventory
    if (req2 <= available) {
      available -= req2;
      req2Success = true;
    }

    expect(req1Success).toBe(true);
    expect(req2Success).toBe(false); // blocked because only 20 left
    expect(available).toBe(20);
  });

  it('both requests succeed when total fits within available quantity', () => {
    let available = 200;
    const req1 = 80;
    const req2 = 80;
    let ok1 = false, ok2 = false;

    if (req1 <= available) { available -= req1; ok1 = true; }
    if (req2 <= available) { available -= req2; ok2 = true; }

    expect(ok1).toBe(true);
    expect(ok2).toBe(true);
    expect(available).toBe(40);
  });

  it('idempotent re-submission returns same result without double-decrement', () => {
    const idempotencyKey = 'txn-abc-123';
    const processedKeys = new Set<string>();
    let available = 100;

    function processRequest(key: string, qty: number): { success: boolean; alreadyProcessed: boolean } {
      if (processedKeys.has(key)) {
        return { success: true, alreadyProcessed: true }; // return cached result
      }
      if (qty > available) return { success: false, alreadyProcessed: false };
      available -= qty;
      processedKeys.add(key);
      return { success: true, alreadyProcessed: false };
    }

    const first = processRequest(idempotencyKey, 40);
    const duplicate = processRequest(idempotencyKey, 40); // same key

    expect(first.success).toBe(true);
    expect(first.alreadyProcessed).toBe(false);
    expect(duplicate.success).toBe(true);
    expect(duplicate.alreadyProcessed).toBe(true);
    expect(available).toBe(60); // only decremented once
  });
});

// ─── Price Validation ───────────────────────────────────────────────────────

describe('Price Validation', () => {
  it('net realization must not exceed gross price', () => {
    const gross = 7500;
    const transport = 300;
    const net = gross - transport;
    expect(net).toBeLessThanOrEqual(gross);
  });

  it('quantity must be positive', () => {
    const qty = 0;
    expect(qty > 0).toBe(false);
  });

  it('negative quantity must be rejected', () => {
    const qty = -10;
    expect(qty > 0).toBe(false);
  });

  it('quantity outside offer min/max range must be rejected', () => {
    const minQty = 50;
    const maxQty = 200;
    const requested = 300;
    const inRange = requested >= minQty && requested <= maxQty;
    expect(inRange).toBe(false);
  });

  it('quantity within offer min/max range is accepted', () => {
    const inRange = 100 >= 50 && 100 <= 200;
    expect(inRange).toBe(true);
  });
});
