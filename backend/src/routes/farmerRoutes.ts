import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as farmerService from '../services/farmerService';
import { farmerCropSchema, paginationSchema, validate } from '../validators/schemas';
import { Request, Response, NextFunction } from 'express';

const router = Router();
router.use(authenticate, authorize('FARMER'));

router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await farmerService.getFarmerProfile(req.user!.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.put('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await farmerService.updateFarmerProfile(req.user!.id, req.body);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get('/crops', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await farmerService.getFarmerCrops(req.user!.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/crops', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = validate(farmerCropSchema, req.body);
    const input = {
      cropId: raw.cropId,
      totalQuantity: raw.totalQuantity,
      unit: raw.unit || 'quintal',
      quality: raw.quality || 'UNGRADED',
      harvestDate: raw.harvestDate,
      storageStatus: raw.storageStatus || 'NOT_STORED',
      expectedPrice: raw.expectedPrice,
      location: raw.location,
      district: raw.district,
      notes: raw.notes,
    };
    const data = await farmerService.addFarmerCrop(req.user!.id, input);
    res.status(201).json({ success: true, data, message: 'Crop added successfully' });
  } catch (e) { next(e); }
});

router.get('/crops/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await farmerService.getFarmerCropById(req.user!.id, req.params.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.put('/crops/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await farmerService.updateFarmerCrop(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.delete('/crops/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await farmerService.deleteFarmerCrop(req.user!.id, req.params.id);
    res.json({ success: true, message: 'Crop removed' });
  } catch (e) { next(e); }
});

router.get('/income', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await farmerService.getIncomeSummary(req.user!.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

export default router;
