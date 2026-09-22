import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, IsIn } from 'class-validator'
import { Type, Transform } from 'class-transformer'
export class CatalogQuery {
  @IsOptional() @IsString() @MaxLength(80) @Matches(/^[\p{L}\p{N}\s.-]*$/u) @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value) search?: string
  @IsOptional() @IsIn(['Hatch','Sedã','SUV','Picape','7 lugares']) category?: string
  @IsOptional() @Matches(/^[a-z0-9-]{1,50}$/) family?: string
  @IsOptional() @Type(() => Number) @IsInt() @Min(2020) @Max(2100) year?: number
  @IsOptional() @IsIn(['manual','automática']) transmission?: string
  @IsOptional() @IsIn(['Diesel','Flex','etanol']) fuel?: string
  @IsOptional() @Matches(/^\d{1,9}(\.\d{1,2})?$/) minPrice?: string
  @IsOptional() @Matches(/^\d{1,9}(\.\d{1,2})?$/) maxPrice?: string
}
export class SlugParam { @Matches(/^[a-z0-9-]{1,50}$/) slug!: string }
