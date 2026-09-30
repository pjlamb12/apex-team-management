import { Controller, Get, Post, Patch, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, seconds } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Post('signup')
  @Throttle({ default: { limit: 10, ttl: seconds(60) } })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: seconds(60) } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  refresh(@Request() req: { user: JwtPayload }) {
    // Passport attaches validated payload to req.user
    return this.authService.refresh(req.user.sub, req.user.email);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Request() req: { user: JwtPayload }) {
    return this.authService.getProfile(req.user.sub);
  }

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  updateProfile(
    @Request() req: { user: JwtPayload },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.sub, dto);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  changePassword(
    @Request() req: { user: JwtPayload },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Delete('account')
  @UseGuards(AuthGuard('jwt'))
  deleteAccount(@Request() req: { user: JwtPayload }) {
    return this.authService.deleteAccount(req.user.sub);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  forgotPassword(@Body('email') email: string) {
    return this.passwordResetService.createResetToken(email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.passwordResetService.resetPassword(token, newPassword);
  }
}
