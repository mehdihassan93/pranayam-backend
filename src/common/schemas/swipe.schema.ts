import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Swipe extends Document {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  swiperId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  targetId: Types.ObjectId;

  @Prop({ required: true, enum: ["LIKE", "PASS", "SUPERLIKE"] })
  type: string;

  @Prop({ default: false })
  isMatch: boolean;
}

export const SwipeSchema = SchemaFactory.createForClass(Swipe);
SwipeSchema.index({ swiperId: 1, targetId: 1 }, { unique: true });
