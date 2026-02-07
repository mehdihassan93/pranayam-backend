import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Report extends Document {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  reporterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  reportedUserId: Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      "INAPPROPRIATE_CONTENT",
      "HARASSMENT",
      "FAKE_PROFILE",
      "SPAM",
      "UNDERAGE",
      "OTHER",
    ],
  })
  reason: string;

  @Prop({ default: "" })
  description: string;

  @Prop({ default: "PENDING", enum: ["PENDING", "REVIEWED", "RESOLVED"] })
  status: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
ReportSchema.index({ reporterId: 1, reportedUserId: 1 });
