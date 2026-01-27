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

  // Multiple photos support
  @Prop({ type: [String], default: [] })
  photos: string[];

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

  @Prop()
  city: string;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop()
  lastSeen: Date;

  @Prop()
  dob: Date; // Date of Birth

  @Prop()
  age: number;

  // Height in cm
  @Prop()
  height: number;

  // Professional Info
  @Prop()
  jobTitle: string;

  @Prop()
  company: string;

  @Prop()
  education: string;

  @Prop()
  college: string;

  // Relationship Intent
  @Prop({ enum: ["LONG_TERM", "SHORT_TERM", "FRIENDS", "CASUAL", "NOT_SURE"] })
  lookingFor: string;

  // Lifestyle
  @Prop({ enum: ["NEVER", "SOMETIMES", "OFTEN"] })
  drinking: string;

  @Prop({ enum: ["NEVER", "SOMETIMES", "OFTEN"] })
  smoking: string;

  @Prop({ enum: ["NEVER", "SOMETIMES", "OFTEN"] })
  workout: string;

  // Religion & Background
  @Prop()
  religion: string;

  @Prop({ type: [String], default: [] })
  languages: string[];

  // Prompts - conversation starters
  @Prop({ type: [Object], default: [] })
  prompts: {
    question: string;
    answer: string;
  }[];

  @Prop({ type: [String], default: [] })
  interests: string[];

  @Prop({ type: [String], default: [] })
  fcmTokens: string[];

  @Prop({ default: false })
  isVerified: boolean;

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
