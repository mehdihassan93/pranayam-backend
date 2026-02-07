import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User } from "../common/schemas/user.schema";
import { Swipe } from "../common/schemas/swipe.schema";
import { Conversation } from "../common/schemas/conversation.schema";
import { Message } from "../common/schemas/message.schema";
import { Report } from "../common/schemas/report.schema";
import { Block } from "../common/schemas/block.schema";
import { JwtService } from "@nestjs/jwt";
import { firstValueFrom } from "rxjs";

/**
 * AuthService handles the core authentication flow for the application.
 * It integrates with MSG91 for SMS OTP delivery and verification,
 * and manages user profile creation and JWT issuance.
 */
@Injectable()
export class AuthService {
  private readonly authKey: string;
  private readonly templateId: string;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Swipe.name) private swipeModel: Model<Swipe>,
    @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel(Block.name) private blockModel: Model<Block>,
  ) {
    // Load MSG91 credentials from environment variables
    this.authKey = this.configService.get<string>("MSG91_AUTH_KEY") || "";
    this.templateId =
      this.configService.get<string>("MSG91_OTP_TEMPLATE_ID") || "";

    // Safety check: ensure required environment variables are present
    if (!this.authKey || !this.templateId) {
      this.logger.error(
        "CRITICAL: MSG91 credentials (AUTH_KEY or TEMPLATE_ID) are missing from .env",
      );
    }
  }

  /**
   * Triggers an OTP SMS to the provided phone number via MSG91.
   * @param phoneNumber International format phone number (e.g., 919876543210)
   */
  async sendOtp(phoneNumber: string) {
    this.logger.log(
      `Requesting OTP for phone ending in: ***${phoneNumber.slice(-4)}`,
    );

    const isProduction =
      this.configService.get<string>("NODE_ENV") === "production";

    // DEV MODE ONLY: Allow test phone number without real SMS
    if (
      !isProduction &&
      (phoneNumber === "9999999999" || phoneNumber === "+919999999999")
    ) {
      this.logger.log(`DEV MODE: Test OTP sent for test number`);
      return { type: "success", message: "OTP sent (DEV MODE)" };
    }

    // In production, MSG91 must be configured
    if (!this.authKey || !this.templateId) {
      if (isProduction) {
        this.logger.error("CRITICAL: MSG91 not configured in production!");
        throw new HttpException(
          "SMS service unavailable",
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      this.logger.warn(`MSG91 not configured - DEV MODE enabled`);
      return { type: "success", message: "OTP sent (DEV MODE)" };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://control.msg91.com/api/v5/otp`, {
          params: {
            authkey: this.authKey,
            template_id: this.templateId,
            mobile: phoneNumber,
          },
        }),
      );

      // MSG91 returns type="success" on successful request
      if (response.data.type === "error") {
        this.logger.error(`MSG91 Error: ${response.data.message}`);
        throw new HttpException(response.data.message, HttpStatus.BAD_REQUEST);
      }

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to send OTP to ${phoneNumber}: ${error.message}`,
      );
      throw new HttpException(
        error.message || "Internal error during OTP delivery",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Verifies the OTP entered by the user.
   * If successful, it proceeds to log the user in or create a new account.
   */
  async verifyOtp(phoneNumber: string, otp: string) {
    this.logger.log(
      `Verifying OTP for phone ending in: ***${phoneNumber.slice(-4)}`,
    );

    const isProduction =
      this.configService.get<string>("NODE_ENV") === "production";
    const isDevMode = !isProduction && (!this.authKey || !this.templateId);
    const isTestPhone =
      !isProduction &&
      (phoneNumber === "9999999999" || phoneNumber === "+919999999999");

    // DEV MODE ONLY: Accept test OTP
    if ((isDevMode || isTestPhone) && otp === "123456") {
      this.logger.log(`DEV MODE: OTP verified`);
      return this.handleUserLogin(phoneNumber);
    }

    // In production, MSG91 must be configured
    if (!this.authKey || !this.templateId) {
      if (isProduction) {
        this.logger.error("CRITICAL: MSG91 not configured in production!");
        throw new HttpException(
          "SMS service unavailable",
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw new HttpException("Invalid OTP", HttpStatus.BAD_REQUEST);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://control.msg91.com/api/v5/otp/verify`, {
          params: {
            authkey: this.authKey,
            mobile: phoneNumber,
            otp: otp,
          },
        }),
      );

      // Logical verification check
      if (response.data.type === "success") {
        this.logger.log(`OTP Verified successfully for ${phoneNumber}`);
        return this.handleUserLogin(phoneNumber);
      } else {
        this.logger.warn(`Invalid OTP attempt for ${phoneNumber}`);
        throw new HttpException(
          "The code you entered is incorrect or expired",
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(
        `Verification error for ${phoneNumber}: ${error.message}`,
      );
      throw new HttpException(
        error.response?.data?.message ||
          "Verification service temporarily unavailable",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * internal: Orchestrates the user session after successful phone verification.
   * Implements "Lazy Account Creation" – users are created automatically on first success.
   */
  private async handleUserLogin(phoneNumber: string) {
    // Check if user already exists in our MongoDB
    let user = await this.userModel.findOne({ phoneNumber });

    if (!user) {
      this.logger.log(`Provisioning new account for: ${phoneNumber}`);
      // Apple-Standard: We only collect minimum necessary data (Phone) initially
      user = new this.userModel({
        phoneNumber,
        name: "New User", // Placeholder until onboarding is finished
        firebaseUid: `msg91_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique internal ID
        isOnline: true,
        lastSeen: new Date(),
      });
      await user.save();
    } else {
      // Update last login / online status
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save();
    }

    // Generate stateless JWT for mobile client
    const payload = { sub: user._id, phoneNumber: user.phoneNumber };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
      },
    };
  }

  /**
   * Updates user profile data during onboarding or settings change.
   * Automatically calculates age and manages preference objects.
   */
  async updateProfile(userId: string, updateData: any) {
    this.logger.log(`Updating profile for user: ${userId}`);

    const update: any = { ...updateData };

    if (updateData.dob) {
      const birth = new Date(updateData.dob);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      update.age = age;
    }

    // Handle nested preferences
    if (updateData.distancePreference || updateData.genderPreference) {
      update.preferences = {
        distance: updateData.distancePreference || 50,
        gender: updateData.genderPreference || ["FEMALE"],
        ageRange: { min: 18, max: 50 }, // Default range
      };
    }

    return this.userModel.findByIdAndUpdate(userId, update, { new: true });
  }

  /**
   * Permanently deletes a user account and all associated data.
   * Required for GDPR compliance and app store approval.
   */
  async deleteAccount(userId: string) {
    this.logger.log(`Deleting account for user: ${userId}`);

    const userObjectId = new Types.ObjectId(userId);

    // Find all conversations the user is part of
    const conversations = await this.conversationModel.find({
      participants: userObjectId,
    });
    const conversationIds = conversations.map((c) => c._id);

    // Delete all messages in those conversations
    if (conversationIds.length > 0) {
      await this.messageModel.deleteMany({
        conversationId: { $in: conversationIds },
      });
    }

    // Delete conversations, swipes, reports, blocks, and user in parallel
    await Promise.all([
      this.conversationModel.deleteMany({ participants: userObjectId }),
      this.swipeModel.deleteMany({
        $or: [{ swiperId: userObjectId }, { targetId: userObjectId }],
      }),
      this.reportModel.deleteMany({
        $or: [
          { reporterId: userObjectId },
          { reportedUserId: userObjectId },
        ],
      }),
      this.blockModel.deleteMany({
        $or: [
          { blockerId: userObjectId },
          { blockedUserId: userObjectId },
        ],
      }),
      this.userModel.findByIdAndDelete(userId),
    ]);

    return { message: "Account deleted successfully" };
  }
}
