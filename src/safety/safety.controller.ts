import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { SafetyService } from "./safety.service";
import { ReportUserDto, BlockUserDto } from "./dto/safety.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("safety")
@UseGuards(JwtAuthGuard)
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post("report")
  async reportUser(@Request() req, @Body() reportDto: ReportUserDto) {
    const userId = req.user.sub;
    return this.safetyService.reportUser(
      userId,
      reportDto.reportedUserId,
      reportDto.reason,
      reportDto.description,
    );
  }

  @Post("block")
  async blockUser(@Request() req, @Body() blockDto: BlockUserDto) {
    const userId = req.user.sub;
    return this.safetyService.blockUser(userId, blockDto.blockedUserId);
  }

  @Delete("block/:userId")
  async unblockUser(@Request() req, @Param("userId") blockedUserId: string) {
    const userId = req.user.sub;
    return this.safetyService.unblockUser(userId, blockedUserId);
  }

  @Get("blocked")
  async getBlockedUsers(@Request() req) {
    const userId = req.user.sub;
    return this.safetyService.getBlockedUsers(userId);
  }
}
