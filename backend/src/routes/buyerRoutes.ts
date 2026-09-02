import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as buyerService from '../services/buyerService';
import { buyerOfferSchema, paginationSchema, validate } from '../validators/schemas';

const router = Router();

// Public marketplace endpoints
router.get('/marketplace', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pagination = validate(paginationSchema, req.query);
    const data = await buyerService.getMarketplaceOffers({
      cropId: req.query.cropId as string,
      district: req.query.district as string,
      quality: req.query.quality as string,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      verifiedOnly: req.query.verifiedOnly === 'true',
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 20,
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// Protected buyer endpoints
router.get('/profile', authenticate, authorize('BUYER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await buyerService.getBuyerProfile(req.user!.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.put('/profile', authenticate, authorize('BUYER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await buyerService.updateBuyerProfile(req.user!.id, req.body);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/offers', authenticate, authorize('BUYER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await buyerService.getBuyerOffers(req.user!.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/offers', authenticate, authorize('BUYER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = validate(buyerOfferSchema, req.body);
    const input = {
      cropId: raw.cropId,
      offeredPrice: raw.offeredPrice,
      minQuantity: raw.minQuantity,
      maxQuantity: raw.maxQuantity,
      quality: raw.quality || 'GRADE_B',
      district: raw.district,
      state: raw.state || 'Gujarat',
      latitude: raw.latitude,
      longitude: raw.longitude,
      notes: raw.notes,
      expiresAt: raw.expiresAt,
    };
    const data = await buyerService.createBuyerOffer(req.user!.id, input);
    res.status(201).json({ success: true, data, message: 'Offer created successfully' });
  } catch (e) { next(e); }
});

router.put('/offers/:id', authenticate, authorize('BUYER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await buyerService.updateBuyerOffer(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

export default router;
