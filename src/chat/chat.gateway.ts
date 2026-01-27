import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { WsJwtGuard } from "../auth/guards/ws-jwt.guard";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import {
  SendMessageDto,
  JoinConversationDto,
  TypingDto,
  MessageReadDto,
} from "./dto/chat.dto";

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : process.env.NODE_ENV === "production"
        ? false
        : true,
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Prefer Authorization header over query param (query params get logged)
      const token =
        client.handshake.headers.authorization?.split(" ")[1] ||
        (client.handshake.query?.token as string);

      if (!token) {
        this.logger.warn("No token provided, disconnecting client");
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });

      const userId = payload.sub;
      client["user"] = payload;

      await client.join(userId);
      await this.chatService.setUserOnline(userId, true);
      this.server.emit("user_status", { userId, isOnline: true });
      this.logger.log(`Authenticated connection: ${userId}`);
    } catch (e) {
      this.logger.error("WS Auth failure, disconnecting client");
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    // Use the verified user from JWT attached during handleConnection
    const user = client["user"];
    if (user?.sub) {
      await this.chatService.setUserOnline(user.sub, false);
      this.server.emit("user_status", {
        userId: user.sub,
        isOnline: false,
        lastSeen: new Date(),
      });
    }
  }

  @SubscribeMessage("send_message")
  async handleMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    // Use verified user from JWT, not client-provided data
    const user = client["user"];
    if (!user?.sub) {
      this.logger.warn("Unauthorized message attempt");
      return { error: "Unauthorized" };
    }

    // Verify user is a participant in this conversation
    const hasAccess = await this.chatService.verifyConversationAccess(
      data.conversationId,
      user.sub,
    );
    if (!hasAccess) {
      this.logger.warn(
        `User ${user.sub} attempted to message unauthorized conversation`,
      );
      return { error: "Access denied" };
    }

    const messageData = {
      ...data,
      senderId: user.sub, // Always use verified user ID
    };

    const message = await this.chatService.saveMessage(messageData);

    // Broadcast to the conversation room
    this.server.to(data.conversationId).emit("new_message", message);

    // Also notify participants who are not in the room (Push Notifications logic)
    await this.chatService.handleNotifications(message);

    return { success: true };
  }

  @SubscribeMessage("join_conversation")
  async handleJoinConversation(
    @MessageBody() data: JoinConversationDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client["user"];
    if (!user?.sub) {
      return { error: "Unauthorized" };
    }

    // Verify user is a participant before allowing them to join the room
    const hasAccess = await this.chatService.verifyConversationAccess(
      data.conversationId,
      user.sub,
    );
    if (!hasAccess) {
      this.logger.warn(
        `User ${user.sub} attempted to join unauthorized conversation`,
      );
      return { error: "Access denied" };
    }

    client.join(data.conversationId);
    return { success: true };
  }

  @SubscribeMessage("typing")
  async handleTyping(
    @MessageBody() data: TypingDto,
    @ConnectedSocket() client: Socket,
  ) {
    // Use verified user from JWT
    const user = client["user"];
    if (!user?.sub) return { error: "Unauthorized" };

    // Verify user is a participant
    const hasAccess = await this.chatService.verifyConversationAccess(
      data.conversationId,
      user.sub,
    );
    if (!hasAccess) return { error: "Access denied" };

    this.server.to(data.conversationId).emit("user_typing", {
      conversationId: data.conversationId,
      userId: user.sub, // Use verified user ID
      isTyping: data.isTyping,
    });

    return { success: true };
  }

  @SubscribeMessage("message_read")
  async handleMessageRead(
    @MessageBody() data: MessageReadDto,
    @ConnectedSocket() client: Socket,
  ) {
    // Use verified user from JWT, not client-provided userId
    const user = client["user"];
    if (!user?.sub) {
      this.logger.warn("Unauthorized read receipt attempt");
      return { error: "Unauthorized" };
    }

    // Verify user is a participant
    const hasAccess = await this.chatService.verifyConversationAccess(
      data.conversationId,
      user.sub,
    );
    if (!hasAccess) return { error: "Access denied" };

    await this.chatService.markAsRead(data.messageId, user.sub);
    this.server.to(data.conversationId).emit("message_status_update", {
      messageId: data.messageId,
      userId: user.sub,
      status: "READ",
    });

    return { success: true };
  }
}
