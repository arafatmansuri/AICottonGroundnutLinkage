import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { aiOrchestrator } from '../orchestrator/aiOrchestrator';
import { mandiPriceForecastingAgent } from '../agents/forecastingAgent';
import { buyerMatchingAgent } from '../agents/buyerMatchingAgent';
import { storageSellingAdvisorAgent } from '../agents/storageAdvisorAgent';
import { qualityGradingAgent } from '../agents/qualityGradingAgent';
import { aiQuerySchema, validate } from '../validators/schemas';
import prisma from '../database/client';
import multer from 'multer';
import path from 'path';
import config from '../config';

const router = Router();
router.use(authenticate);

const upload = multer({
  dest: config.upload.dir,
  limits: { fileSize: config.upload.maxSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP allowed.'));
    }
  },
});

// Main AI assistant endpoint
router.post('/query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = validate(aiQuerySchema, req.body);
    const result = await aiOrchestrator.process({
      userId: req.user!.id,
      query: input.query,
      language: input.language,
      cropId: input.cropId,
      farmerCropId: input.farmerCropId,
    });
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

// Forecast endpoint
router.get('/forecast', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cropId, mandiId, days } = req.query;
    if (!cropId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'cropId required' } });
      return;
    }
    const result = await mandiPriceForecastingAgent.execute({
      cropId: cropId as string,
      mandiId: mandiId as string,
      historicalDays: days ? parseInt(days as string) : 30,
    });
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

// Buyer matching endpoint
router.post('/match-buyers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cropId, quantity, quality, district } = req.body;
    const result = await buyerMatchingAgent.execute({
      cropId,
      quantity: Number(quantity),
      quality: quality || 'GRADE_B',
      farmerDistrict: district,
    });
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

// Storage advisor endpoint
router.post('/storage-advisor', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await storageSellingAdvisorAgent.execute(req.body);
    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

// Quality grading endpoint (image upload)
router.post('/quality-grade', upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cropType, farmerCropId } = req.body;
    if (!cropType) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'cropType required' } });
      return;
    }

    const result = await qualityGradingAgent.execute({
      cropType,
      imagePath: req.file?.path,
    });

    // Save assessment if farmerCropId provided
    if (farmerCropId && result.success) {
      await prisma.qualityAssessment.create({
        data: {
          farmerCropId,
          estimatedGrade: result.estimatedGrade,
          confidence: result.confidence,
          priceRangeMin: result.estimatedPriceRange.min,
          priceRangeMax: result.estimatedPriceRange.max,
          observations: result.observations,
          imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
          warning: result.warning,
        },
      });
    }

    res.json({ success: true, data: result });
  } catch (e) { next(e); }
});

// Conversation history
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await prisma.aIRequest.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, query: true, intent: true, response: true, createdAt: true, agentsUsed: true },
    });
    res.json({ success: true, data: history });
  } catch (e) { next(e); }
});

// Recommendations
router.get('/recommendations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recs = await prisma.aIRecommendation.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { farmerCrop: { include: { crop: true } } },
    });
    res.json({ success: true, data: recs });
  } catch (e) { next(e); }
});

export default router;
