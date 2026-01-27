import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { DiscoveryService } from "./discovery.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SwipeDto } from "./dto/discovery.dto";

@Controller("discovery")
@UseGuards(JwtAuthGuard)
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  /**
   * Fetches potential matches for the user
   */
  @Get("recommendations")
  async getRecommendations(
    @Request() req,
    @Query("lat") lat?: string,
    @Query("long") long?: string,
    @Query("distance") distance?: string,
  ) {
    const userId = req.user.sub;
    // Parse and validate numeric params (NaN becomes undefined)
    const parsedLat = lat ? parseFloat(lat) : NaN;
    const parsedLong = long ? parseFloat(long) : NaN;
    const parsedDistance = distance ? parseInt(distance, 10) : NaN;

    return this.discoveryService.getRecommendedProfiles(
      userId,
      !isNaN(parsedLat) ? parsedLat : undefined,
      !isNaN(parsedLong) ? parsedLong : undefined,
      !isNaN(parsedDistance) ? parsedDistance : undefined,
    );
  }

  /**
   * Process a Like or Pass action
   */
  @Post("swipe")
  async swipe(@Request() req, @Body() swipeDto: SwipeDto) {
    const userId = req.user.sub;
    return this.discoveryService.handleSwipe(
      userId,
      swipeDto.targetId,
      swipeDto.type,
    );
  }
}
