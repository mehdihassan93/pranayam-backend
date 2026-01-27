import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DiscoveryController } from "./discovery.controller";
import { DiscoveryService } from "./discovery.service";
import { User, UserSchema } from "../common/schemas/user.schema";
import { Swipe, SwipeSchema } from "../common/schemas/swipe.schema";
import {
  Conversation,
  ConversationSchema,
} from "../common/schemas/conversation.schema";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Swipe.name, schema: SwipeSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
    AuthModule,
  ],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
})
export class DiscoveryModule {}
