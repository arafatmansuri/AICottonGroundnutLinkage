import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { aiOrchestrator } from '../orchestrator/aiOrchestrator';
import { mandiPriceForecastingAgent } from '../agents/forecastingAgent';
import { buyerMatchingAgent } from '../agents/buyerMatchingAgent';
import { storageSellingAdvisorAgent } from '../agents/storageAdvisorAgent';
import { qualityGradingAgent } from '../agents/qualityGradingAgent';
import { aiQuerySchema, validate } from '../validators/schemas';
import prisma from '../database/client';
import { generateSignedUpload, deleteImage } from '../services/cloudinaryService';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authenticate);

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
      chatHistory: input.chatHistory,
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

// ── Cloudinary signed-upload URL ────────────────────────────────────────────
// Returns a signed upload URL + public_id so the frontend can upload directly
// to Cloudinary without storing the file on this server.
router.post('/upload-url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const publicId = uuidv4();
    const params = generateSignedUpload(publicId);
    res.json({ success: true, data: params });
  } catch (e) { next(e); }
});

// ── Delete a Cloudinary image by public_id ──────────────────────────────────
router.delete('/image/:publicId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // publicId in the URL is base64-encoded to safely carry slashes
    const publicId = Buffer.from(req.params.publicId, 'base64').toString('utf8');
    await deleteImage(publicId);
    res.json({ success: true });
  } catch (e) { next(e); }
});

// ── Quality grading endpoint (image URL from Cloudinary) ────────────────────
// The frontend uploads the image to Cloudinary directly, then passes the
// secure_url here. No file is stored on this server.
router.post('/quality-grade', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cropType, imageUrl, farmerCropId } = req.body;
    if (!cropType) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'cropType required' } });
      return;
    }

    const result = await qualityGradingAgent.execute({
      cropType,
      imageUrl: imageUrl as string | undefined,
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
          imageUrl: imageUrl ?? undefined,
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
