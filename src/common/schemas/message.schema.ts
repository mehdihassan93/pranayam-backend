import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export enum MessageType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  VOICE = "VOICE",
  SYSTEM = "SYSTEM",
}

export enum MessageStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
}

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, ref: "Conversation", required: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: String, enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Prop()
  mediaUrl?: string;

  @Prop()
  duration?: number; // For voice messages

  @Prop({
    type: [
      {
        userId: { type: Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: MessageStatus,
          default: MessageStatus.SENT,
        },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  deliveryStatus: {
    userId: Types.ObjectId;
    status: MessageStatus;
    updatedAt: Date;
  }[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
