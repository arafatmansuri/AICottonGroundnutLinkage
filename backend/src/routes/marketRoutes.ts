import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as marketService from '../services/marketService';
import { paginationSchema, validate } from '../validators/schemas';

const router = Router();

router.get('/crops', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await marketService.getAllCrops();
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/crops/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await marketService.getCropById(req.params.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/mandis', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await marketService.getAllMandis(req.query.district as string);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/prices', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pagination = validate(paginationSchema, req.query);
    const data = await marketService.getMarketPrices({
      cropId: req.query.cropId as string,
      mandiId: req.query.mandiId as string,
      date: req.query.date as string,
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 20,
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/prices/latest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await marketService.getLatestMarketPrices(req.query.cropId as string);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/prices/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cropId = req.query.cropId as string;
    const mandiId = req.query.mandiId as string;
    const days = parseInt(req.query.days as string || '30', 10);
    const data = await marketService.getPriceHistory(cropId, mandiId, days);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/prices/best', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await marketService.getBestCurrentPrice(req.query.cropId as string);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

export default router;
