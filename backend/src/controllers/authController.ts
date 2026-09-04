import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import {
  registerSchema, loginSchema, refreshTokenSchema,
  changePasswordSchema, forgotPasswordSchema, resetPasswordSchema,
  validate,
} from '../validators/schemas';
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

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { currentPassword, newPassword } = validate(changePasswordSchema, req.body);
    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = validate(forgotPasswordSchema, req.body);
    const result = await authService.forgotPassword(email);
    // Always return 200 to avoid email enumeration
    res.json({
      success: true,
      message: 'If that email exists, a reset token has been sent.',
      ...(result.resetToken ? { data: { resetToken: result.resetToken } } : {}),
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, newPassword } = validate(resetPasswordSchema, req.body);
    await authService.resetPassword(token, newPassword);
    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    next(err);
  }
}
