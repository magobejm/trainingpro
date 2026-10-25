import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { NutritionLogService } from '../../application/nutrition-log.service';
import { NutritionSubstituteService } from '../../application/nutrition-substitute.service';
import { NutritionService } from '../../application/nutrition.service';
import {
  BarcodeParamDto,
  FoodSearchQueryDto,
  MealLogIdParamDto,
  MealLogRangeDto,
  SubstituteQueryDto,
  UpsertMealLogDto,
} from '../dto/meal-log.dto';

@Controller('clients')
@UseGuards(AuthGuard, RolesGuard)
@Roles('client')
export class ClientNutritionController {
  constructor(
    private readonly nutritionService: NutritionService,
    private readonly logs: NutritionLogService,
    private readonly substitutes: NutritionSubstituteService,
  ) {}

  @Get('me/nutrition')
  async getMyNutrition(@Req() request: HttpAuthRequest) {
    return this.nutritionService.getClientNutrition(readAuthContext(request));
  }

  @Get('me/nutrition/foods')
  async searchFoods(@Query() query: FoodSearchQueryDto, @Req() request: HttpAuthRequest) {
    return this.logs.searchFoods(readAuthContext(request), query.query);
  }

  @Get('me/nutrition/logs')
  async listLogs(@Query() query: MealLogRangeDto, @Req() request: HttpAuthRequest) {
    return { items: await this.logs.listMine(readAuthContext(request), query.from, query.to) };
  }

  @Get('me/nutrition/substitutes')
  async listSubstitutes(@Query() query: SubstituteQueryDto, @Req() request: HttpAuthRequest) {
    return this.substitutes.list(readAuthContext(request), query.foodId, query.grams);
  }

  @Put('me/nutrition/logs')
  async saveLog(@Body() body: UpsertMealLogDto, @Req() request: HttpAuthRequest) {
    return this.logs.saveMine(readAuthContext(request), body);
  }

  @Delete('me/nutrition/logs/:id')
  async removeLog(@Param() params: MealLogIdParamDto, @Req() request: HttpAuthRequest) {
    await this.logs.removeMine(readAuthContext(request), params.id);
    return { deleted: true };
  }

  @Post('me/nutrition/logs/photo')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 4_000_000, files: 1 } }))
  async uploadPhoto(@UploadedFile() file: Express.Multer.File | undefined, @Req() request: HttpAuthRequest) {
    if (!file) throw new BadRequestException('Unsupported meal photo');
    return this.logs.uploadPhoto(readAuthContext(request), file);
  }

  @Post('me/nutrition/logs/photo/estimate')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 4_000_000, files: 1 } }))
  async uploadPhotoWithEstimate(@UploadedFile() file: Express.Multer.File | undefined, @Req() request: HttpAuthRequest) {
    if (!file) throw new BadRequestException('Unsupported meal photo');
    return this.logs.uploadPhotoWithEstimate(readAuthContext(request), file);
  }

  @Get('me/nutrition/foods/barcode/:code')
  async foodByBarcode(@Param() params: BarcodeParamDto, @Req() request: HttpAuthRequest) {
    const food = await this.logs.foodByBarcode(readAuthContext(request), params.code);
    if (!food) throw new NotFoundException('Product not found');
    return food;
  }

  @Post('me/nutrition/foods/label')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 4_000_000, files: 1 } }))
  async foodFromLabel(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('barcode') barcode: string | undefined,
    @Req() request: HttpAuthRequest,
  ) {
    if (!file) throw new BadRequestException('Unsupported label photo');
    const safeBarcode = barcode && /^\d{6,14}$/.test(barcode) ? barcode : undefined;
    const food = await this.logs.foodFromLabel(readAuthContext(request), file, safeBarcode);
    if (!food) throw new NotFoundException('Label could not be read');
    return food;
  }
}
