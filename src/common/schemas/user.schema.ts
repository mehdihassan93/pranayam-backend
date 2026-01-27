import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  firebaseUid: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop()
  photoUrl: string;

  @Prop({ default: "" })
  bio: string;

  @Prop({ enum: ["MALE", "FEMALE", "OTHER"] })
  gender: string;

  @Prop({
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({ default: false })
  isOnline: boolean;

  @Prop()
  lastSeen: Date;

  @Prop()
  dob: Date; // Date of Birth

  @Prop()
  age: number;

  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop({ type: [String], default: [] })
  fcmTokens: string[];

  @Prop({ type: Object })
  preferences: {
    distance: number; // in km
    ageRange: { min: number; max: number };
    gender: string[];
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ location: "2dsphere" });
UserSchema.index({ gender: 1, "preferences.gender": 1 });
UserSchema.index({ phoneNumber: 1 }, { unique: true });
