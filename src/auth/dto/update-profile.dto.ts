import {
  IsString,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from "class-validator";
import { Type } from "class-transformer";

class GeoPointDto {
  @IsString()
  type: "Point";

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates: number[]; // [longitude, latitude]
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsEnum(["MALE", "FEMALE", "OTHER"])
  @IsOptional()
  gender?: string;

  @IsDateString()
  @IsOptional()
  dob?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];

  @IsNumber()
  @Min(1)
  @Max(500)
  @IsOptional()
  distancePreference?: number;

  @IsArray()
  @IsEnum(["MALE", "FEMALE", "OTHER"], { each: true })
  @IsOptional()
  genderPreference?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  location?: GeoPointDto;
}
