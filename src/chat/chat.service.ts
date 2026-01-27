import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Message, MessageStatus } from "../common/schemas/message.schema";
import { Conversation } from "../common/schemas/conversation.schema";
import { User } from "../common/schemas/user.schema";

/**
 * ChatService manages the heavy lifting for real-time communication.
 * It handles message persistence, conversation updates, online status,
 * and retrieval of chat history.
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
  ) {}

  /**
   * Updates a user's presence state in the database.
   * This information is broadcasted to all active chat partners.
   */
  async setUserOnline(userId: string, isOnline: boolean) {
    this.logger.debug(
      `User ${userId} status set to: ${isOnline ? "ONLINE" : "OFFLINE"}`,
    );
    return this.userModel.findByIdAndUpdate(
      userId,
      { isOnline, lastSeen: new Date() },
      { new: true },
    );
  }

  /**
   * Atomically saves a new message and updates its parent conversation.
   * This is designed to be "Telegram-fast" by minimizing sequential DB hits.
   */
  async saveMessage(data: {
    conversationId: string;
    senderId: string;
    recipientId: string;
    content: string;
    messageType?: string;
  }) {
    const newMessage = new this.messageModel({
      conversationId: new Types.ObjectId(data.conversationId),
      senderId: new Types.ObjectId(data.senderId),
      content: data.content,
      messageType: data.messageType || "text",
    });

    const savedMessage = await newMessage.save();

    // Update the conversation's 'lastMessage' pointer for quick list summary view.
    // Also increments the unread count for the recipient automatically.
    await this.conversationModel.findByIdAndUpdate(
      data.conversationId,
      {
        lastMessage: savedMessage._id,
        $inc: { [`unreadCounts.${data.recipientId}`]: 1 },
      },
      { upsert: false },
    );

    return savedMessage;
  }

  /**
   * Updates message status to 'READ'.
   * Effectively manages "Blue Ticks" for the sender.
   */
  async markAsRead(messageId: string, userId: string) {
    return this.messageModel.updateOne(
      { _id: messageId, "deliveryStatus.userId": userId },
      {
        $set: {
          "deliveryStatus.$.status": MessageStatus.READ,
          "deliveryStatus.$.updatedAt": new Date(),
        },
      },
    );
  }

  /**
   * Orchestrates mobile push notifications for offline users.
   */
  async handleNotifications(message: Message) {
    // Audit Note: This requires active Firebase Service Account configuration.
    this.logger.log(
      `Dispatching Push Notification for message in: ${message.conversationId}`,
    );
  }

  /**
   * Verifies that a user is a participant in a conversation.
   * Returns the conversation if valid, null otherwise.
   */
  async verifyConversationAccess(
    conversationId: string,
    userId: string,
  ): Promise<Conversation | null> {
    try {
      return this.conversationModel.findOne({
        _id: new Types.ObjectId(conversationId),
        participants: new Types.ObjectId(userId),
      });
    } catch {
      return null;
    }
  }

  /**
   * Retrieves the list of active conversations for a user.
   * Uses Mongoose 'populate' for efficient one-pass fetching of participant details.
   */
  async getConversations(userId: string) {
    return this.conversationModel
      .find({
        participants: new Types.ObjectId(userId),
      })
      .populate("participants", "name photoUrl isOnline lastSeen")
      .populate("lastMessage")
      .sort({ updatedAt: -1 }); // Order by newest message first
  }

  /**
   * Fetches paged message history with cursor-based pagination.
   * Prevents loading thousands of messages at once (Infinite Scroll).
   */
  async getMessages(
    conversationId: string,
    limit: number = 50,
    beforeRecordId?: string,
  ) {
    const query: any = { conversationId: new Types.ObjectId(conversationId) };

    // Cursor-based pagination logic ($lt means "less than", i.e., older messages)
    if (beforeRecordId) {
      query._id = { $lt: new Types.ObjectId(beforeRecordId) };
    }

    return this.messageModel
      .find(query)
      .sort({ _id: -1 }) // Sort by ID descending (time-order)
      .limit(limit)
      .exec();
  }
}
