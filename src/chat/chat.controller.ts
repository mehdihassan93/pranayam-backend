import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("chat")
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("conversations")
  async getConversations(@Request() req) {
    const userId = req.user.sub;
    return this.chatService.getConversations(userId);
  }

  @Get("messages/:conversationId")
  async getMessages(
    @Request() req,
    @Param("conversationId") conversationId: string,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("before") before?: string,
  ) {
    const userId = req.user.sub;

    // Verify user is a participant in this conversation (IDOR protection)
    const conversation = await this.chatService.verifyConversationAccess(
      conversationId,
      userId,
    );
    if (!conversation) {
      throw new ForbiddenException(
        "You do not have access to this conversation",
      );
    }

    return this.chatService.getMessages(conversationId, limit, before);
  }
}
