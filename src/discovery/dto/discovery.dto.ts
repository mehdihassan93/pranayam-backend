import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from "class-validator";

export class SwipeDto {
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsEnum(["LIKE", "PASS", "SUPERLIKE"])
  @IsNotEmpty()
  type: "LIKE" | "PASS" | "SUPERLIKE";
}

export class GetRecommendationsQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  long?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  distance?: number;
}
