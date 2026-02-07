import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SafetyController } from "./safety.controller";
import { SafetyService } from "./safety.service";
import { Report, ReportSchema } from "../common/schemas/report.schema";
import { Block, BlockSchema } from "../common/schemas/block.schema";
import { User, UserSchema } from "../common/schemas/user.schema";
import {
  Conversation,
  ConversationSchema,
} from "../common/schemas/conversation.schema";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: Block.name, schema: BlockSchema },
      { name: User.name, schema: UserSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  controllers: [SafetyController],
  providers: [SafetyService],
  exports: [SafetyService],
})
export class SafetyModule {}
