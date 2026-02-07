import { IsString, IsNotEmpty, IsEnum, IsOptional } from "class-validator";

export class ReportUserDto {
  @IsString()
  @IsNotEmpty()
  reportedUserId: string;

  @IsEnum([
    "INAPPROPRIATE_CONTENT",
    "HARASSMENT",
    "FAKE_PROFILE",
    "SPAM",
    "UNDERAGE",
    "OTHER",
  ])
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class BlockUserDto {
  @IsString()
  @IsNotEmpty()
  blockedUserId: string;
}
