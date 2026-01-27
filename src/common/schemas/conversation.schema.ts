import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { User } from "./user.schema";

@Schema({ timestamps: true })
export class Conversation extends Document {
  @Prop({ type: [{ type: Types.ObjectId, ref: "User" }] })
  participants: Types.ObjectId[] | User[];

  @Prop({ type: Types.ObjectId, ref: "Message" })
  lastMessage: Types.ObjectId;

  @Prop({ type: Map, of: Number, default: {} })
  unreadCounts: Map<string, number>; // userId -> count

  @Prop({ default: false })
  isGroup: boolean;

  @Prop()
  name?: string; // For groups
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
