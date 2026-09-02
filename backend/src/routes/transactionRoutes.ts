import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import * as transactionService from '../services/transactionService';
import { transactionSchema, paginationSchema, validate } from '../validators/schemas';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pagination = validate(paginationSchema, req.query);
    const data = await transactionService.getTransactions(req.user!.id, req.user!.role, {
      status: req.query.status as string,
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 20,
    });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = validate(transactionSchema, req.body);
    const data = await transactionService.createTransaction({
      farmerUserId: req.user!.id,
      ...input,
    });
    res.status(201).json({ success: true, data, message: 'Transaction initiated' });
  } catch (e) { next(e); }
});

router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Status is required' } });
      return;
    }
    const data = await transactionService.updateTransactionStatus(
      req.params.id, status, req.user!.id, req.user!.role
    );
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

export default router;
