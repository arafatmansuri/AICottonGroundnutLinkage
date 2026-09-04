import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['FARMER', 'BUYER']),
  name: z.string().min(2, 'Name is required'),
  district: z.string().min(2, 'District is required'),
  // optional farmer fields
  village: z.string().optional(),
  taluka: z.string().optional(),
  // optional buyer fields
  companyName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const farmerCropSchema = z.object({
  cropId: z.string().uuid(),
  totalQuantity: z.number().positive('Quantity must be positive'),
  unit: z.string().default('quintal'),
  quality: z.enum(['GRADE_A', 'GRADE_B', 'GRADE_C', 'UNGRADED']).default('UNGRADED'),
  harvestDate: z.string().optional(),
  storageStatus: z.enum(['NOT_STORED', 'IN_STORAGE', 'PARTIALLY_STORED']).default('NOT_STORED'),
  expectedPrice: z.number().positive().optional(),
  location: z.string().min(1, 'Location is required'),
  district: z.string().min(1, 'District is required'),
  notes: z.string().optional(),
});

export const buyerOfferSchema = z.object({
  cropId: z.string().uuid(),
  offeredPrice: z.number().positive(),
  minQuantity: z.number().positive(),
  maxQuantity: z.number().positive(),
  quality: z.enum(['GRADE_A', 'GRADE_B', 'GRADE_C', 'UNGRADED']).default('GRADE_B'),
  district: z.string().min(1),
  state: z.string().default('Gujarat'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const transactionSchema = z.object({
  buyerOfferId: z.string().uuid(),
  farmerCropId: z.string().uuid(),
  quantity: z.number().positive(),
});

export const conversationTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(2000),
});

export const aiQuerySchema = z.object({
  query: z.string().min(1, 'Query is required').max(500),
  cropId: z.string().uuid().optional(),
  farmerCropId: z.string().uuid().optional(),
  language: z.enum(['en', 'hi', 'gu']).default('en'),
  chatHistory: z.array(conversationTurnSchema).max(20).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
  }
  return result.data;
}
