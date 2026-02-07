import {
  Controller,
  Post,
  Body,
  UseGuards,
  Put,
  Delete,
  Req,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RequestOtpDto, VerifyOtpDto } from "./dto/auth.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ThrottlerGuard } from "@nestjs/throttler";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(ThrottlerGuard)
  @Post("send-otp")
  async sendOtp(@Body() requestOtpDto: RequestOtpDto) {
    return this.authService.sendOtp(requestOtpDto.phoneNumber);
  }

  @UseGuards(ThrottlerGuard)
  @Post("verify-otp")
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(
      verifyOtpDto.phoneNumber,
      verifyOtpDto.otp,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put("profile")
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    const userId = req.user.sub;
    return this.authService.updateProfile(userId, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("account")
  async deleteAccount(@Req() req) {
    const userId = req.user.sub;
    return this.authService.deleteAccount(userId);
  }
}
