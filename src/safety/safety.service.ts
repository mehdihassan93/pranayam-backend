import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Report } from "../common/schemas/report.schema";
import { Block } from "../common/schemas/block.schema";
import { User } from "../common/schemas/user.schema";
import { Conversation } from "../common/schemas/conversation.schema";

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);

  constructor(
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel(Block.name) private blockModel: Model<Block>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
  ) {}

  async reportUser(
    reporterId: string,
    reportedUserId: string,
    reason: string,
    description?: string,
  ) {
    this.logger.log(`User ${reporterId} reporting user ${reportedUserId}`);

    const reportedUser = await this.userModel.findById(reportedUserId);
    if (!reportedUser) {
      throw new NotFoundException("Reported user not found");
    }

    const report = new this.reportModel({
      reporterId: new Types.ObjectId(reporterId),
      reportedUserId: new Types.ObjectId(reportedUserId),
      reason,
      description: description || "",
    });

    await report.save();
    return { message: "Report submitted successfully" };
  }

  async blockUser(blockerId: string, blockedUserId: string) {
    this.logger.log(`User ${blockerId} blocking user ${blockedUserId}`);

    const blockedUser = await this.userModel.findById(blockedUserId);
    if (!blockedUser) {
      throw new NotFoundException("User not found");
    }

    const existing = await this.blockModel.findOne({
      blockerId: new Types.ObjectId(blockerId),
      blockedUserId: new Types.ObjectId(blockedUserId),
    });

    if (existing) {
      throw new ConflictException("User is already blocked");
    }

    const block = new this.blockModel({
      blockerId: new Types.ObjectId(blockerId),
      blockedUserId: new Types.ObjectId(blockedUserId),
    });

    await block.save();

    // Remove any conversations between these two users
    await this.conversationModel.deleteMany({
      participants: {
        $all: [
          new Types.ObjectId(blockerId),
          new Types.ObjectId(blockedUserId),
        ],
      },
    });

    return { message: "User blocked successfully" };
  }

  async unblockUser(blockerId: string, blockedUserId: string) {
    const result = await this.blockModel.deleteOne({
      blockerId: new Types.ObjectId(blockerId),
      blockedUserId: new Types.ObjectId(blockedUserId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException("Block not found");
    }

    return { message: "User unblocked successfully" };
  }

  async getBlockedUsers(userId: string) {
    return this.blockModel
      .find({ blockerId: new Types.ObjectId(userId) })
      .populate("blockedUserId", "name photoUrl")
      .sort({ createdAt: -1 });
  }
}
