import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { registerSchema, loginSchema, refreshTokenSchema, validate } from '../validators/schemas';
import { ValidationError } from '../middleware/errorHandler';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validate(registerSchema, req.body);
    const result = await authService.registerUser(input);
    res.status(201).json({ success: true, data: result, message: 'Registration successful' });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validate(loginSchema, req.body);
    const result = await authService.loginUser(input.email, input.password);
    res.json({ success: true, data: result, message: 'Login successful' });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = validate(refreshTokenSchema, req.body);
    const tokens = await authService.refreshTokens(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getCurrentUser(req.user!.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response): void {
  // JWT is stateless; client should discard tokens
  res.json({ success: true, message: 'Logged out successfully' });
}
