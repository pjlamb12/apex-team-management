import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async createResetToken(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email } });
    // Always return success to avoid email enumeration attacks
    if (!user) return { message: 'If that email exists, a reset link has been sent.' };
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour (D-10)
    user.passwordResetToken = token;
    user.passwordResetExpiry = expiry;
    await this.userRepo.save(user);
    // TODO: replace with email provider (D-11)
    // Injectable EmailService interface goes here
    const resetUrl = `http://localhost:4200/reset-password?token=${token}`;
    console.log(`[PasswordResetService] Reset URL: ${resetUrl}`);
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({
      where: { passwordResetToken: token },
    });
    if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    await this.userRepo.save(user);
    return { message: 'Password reset successful' };
  }
}
