import { IsString, IsNotEmpty, IsBoolean, IsOptional } from "class-validator";

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsString()
  @IsOptional()
  messageType?: string;
}

export class JoinConversationDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;
}

export class TypingDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsBoolean()
  isTyping: boolean;
}

export class MessageReadDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  conversationId: string;
}
