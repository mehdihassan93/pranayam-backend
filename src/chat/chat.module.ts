import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ChatGateway } from "./chat.gateway";
import { ChatService } from "./chat.service";
import { Message, MessageSchema } from "../common/schemas/message.schema";
import {
  Conversation,
  ConversationSchema,
} from "../common/schemas/conversation.schema";
import { User, UserSchema } from "../common/schemas/user.schema";
import { ChatController } from "./chat.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
