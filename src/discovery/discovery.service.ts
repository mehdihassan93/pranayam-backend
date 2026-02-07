import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User } from "../common/schemas/user.schema";
import { Swipe } from "../common/schemas/swipe.schema";
import { Conversation } from "../common/schemas/conversation.schema";

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Swipe.name) private swipeModel: Model<Swipe>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
  ) {}

  /**
   * The Core Matchmaking Algorithm
   * 1. Filters by Geo-spatial distance (MongoDB 2dsphere)
   * 2. Filters by Age range preferences
   * 3. Filters by Gender preferences
   * 4. Excludes users already swiped
   */
  async getRecommendedProfiles(
    userId: string,
    lat?: number,
    lng?: number,
    maxDistance?: number,
    limit: number = 20,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }

    // Get IDs of people this user has already swiped on
    const swipedUserIds = await this.swipeModel
      .find({ swiperId: user._id })
      .distinct("targetId");

    // Always exclude certain users (self, and already swiped)
    const excludeIds = [user._id, ...swipedUserIds];

    const query: any = {
      _id: { $nin: excludeIds },
    };

    // Apply gender filter if user has preferences
    if (user.preferences?.gender && user.preferences.gender.length > 0) {
      query.gender = { $in: user.preferences.gender };
    }

    // Apply age filter if user has preferences
    if (user.preferences?.ageRange) {
      query.age = {
        $gte: user.preferences.ageRange.min || 18,
        $lte: user.preferences.ageRange.max || 50,
      };
    }

    // Apply interests filter if user has interests
    if (user.interests && user.interests.length > 0) {
      query.interests = { $in: user.interests };
    }

    // Geo-spatial query - use provided coordinates or user's saved location
    const coordinates =
      lat && lng
        ? [lng, lat] // Note: GeoJSON uses [longitude, latitude]
        : user.location?.coordinates;

    const distance = maxDistance || user.preferences?.distance || 100;

    if (coordinates && coordinates.length === 2) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: coordinates,
          },
          $maxDistance: distance * 1000, // Convert km to meters
        },
      };
    }

    this.logger.log(`Fetching recommendations for ${userId}`);

    try {
      const profiles = await this.userModel.find(query).limit(limit).exec();

      // Transform to frontend-friendly format
      return profiles.map((p) => ({
        id: p._id,
        name: p.name,
        age: p.age,
        photos: p.photos?.length ? p.photos : (p.photoUrl ? [p.photoUrl] : []),
        bio: p.bio,
        gender: p.gender,
        city: p.city,
        height: p.height,
        jobTitle: p.jobTitle,
        company: p.company,
        education: p.education,
        college: p.college,
        lookingFor: p.lookingFor,
        drinking: p.drinking,
        smoking: p.smoking,
        workout: p.workout,
        religion: p.religion,
        languages: p.languages || [],
        prompts: p.prompts || [],
        interests: p.interests || [],
        isVerified: p.isVerified || false,
        distance: 0, // Would need to calculate from coordinates
      }));
    } catch (error) {
      // If geo query fails (no 2dsphere index or bad data), fall back to non-geo query
      this.logger.warn(
        `Geo query failed, falling back to simple query: ${error.message}`,
      );
      delete query.location;
      const profiles = await this.userModel.find(query).limit(limit).exec();
      return profiles.map((p) => ({
        id: p._id,
        name: p.name,
        age: p.age,
        photos: p.photos?.length ? p.photos : (p.photoUrl ? [p.photoUrl] : []),
        bio: p.bio,
        gender: p.gender,
        city: p.city,
        height: p.height,
        jobTitle: p.jobTitle,
        company: p.company,
        education: p.education,
        college: p.college,
        lookingFor: p.lookingFor,
        drinking: p.drinking,
        smoking: p.smoking,
        workout: p.workout,
        religion: p.religion,
        languages: p.languages || [],
        prompts: p.prompts || [],
        interests: p.interests || [],
        isVerified: p.isVerified || false,
        distance: 0,
      }));
    }
  }

  /**
   * Returns a limited set of profiles for guest users
   * Sensitive data is redacted to encourage sign-up
   */
  async getGuestProfiles(limit: number = 3) {
    this.logger.log("Fetching guest profiles");

    try {
      // Get random profiles (no filters for guests)
      const profiles = await this.userModel
        .aggregate([{ $sample: { size: limit } }])
        .exec();

      // Transform to guest-friendly format with redacted data
      return profiles.map((p) => ({
        id: p._id,
        name: "???",
        age: null,
        photos: p.photos?.length ? p.photos : p.photoUrl ? [p.photoUrl] : [],
        bio: null,
        gender: null,
        city: null,
        height: null,
        jobTitle: "???",
        company: null,
        education: null,
        college: null,
        lookingFor: null,
        drinking: null,
        smoking: null,
        workout: null,
        religion: null,
        languages: [],
        prompts: [],
        interests: [],
        isVerified: p.isVerified || false,
        hasVideo: !!p.videoUrl,
        distance: null,
        isGuestProfile: true,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch guest profiles: ${error.message}`);
      return [];
    }
  }

  /**
   * Handles the 'Like' action and checks for a mutual match
   */
  async handleSwipe(
    swiperId: string,
    targetId: string,
    type: "LIKE" | "PASS" | "SUPERLIKE",
  ) {
    const swiperOid = new Types.ObjectId(swiperId);
    const targetOid = new Types.ObjectId(targetId);

    // Save the swipe
    const swipe = await this.swipeModel.findOneAndUpdate(
      { swiperId: swiperOid, targetId: targetOid },
      { type, updatedAt: new Date() },
      { upsert: true, new: true },
    );

    if (type === "PASS") return { isMatch: false };

    // Check if the target user has already liked the current swiper
    const mutualSwipe = await this.swipeModel.findOne({
      swiperId: targetOid,
      targetId: swiperOid,
      type: { $in: ["LIKE", "SUPERLIKE"] },
    });

    if (mutualSwipe) {
      // IT'S A MATCH!
      swipe.isMatch = true;
      mutualSwipe.isMatch = true;
      await Promise.all([swipe.save(), mutualSwipe.save()]);

      // Provision a new conversation for them
      const conversation = new this.conversationModel({
        participants: [swiperOid, targetOid],
        unreadCounts: new Map([
          [swiperId, 0],
          [targetId, 0],
        ]),
      });
      await conversation.save();

      return { isMatch: true, conversationId: conversation._id };
    }

    return { isMatch: false };
  }
}
