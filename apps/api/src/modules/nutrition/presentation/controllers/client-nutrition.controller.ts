import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
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
import { NutritionService } from '../../application/nutrition.service';
import { MealLogIdParamDto, MealLogRangeDto, UpsertMealLogDto } from '../dto/meal-log.dto';

@Controller('clients')
@UseGuards(AuthGuard, RolesGuard)
@Roles('client')
export class ClientNutritionController {
  constructor(
    private readonly nutritionService: NutritionService,
    private readonly logs: NutritionLogService,
  ) {}

  @Get('me/nutrition')
  async getMyNutrition(@Req() request: HttpAuthRequest) {
    return this.nutritionService.getClientNutrition(readAuthContext(request));
  }

  @Get('me/nutrition/logs')
  async listLogs(@Query() query: MealLogRangeDto, @Req() request: HttpAuthRequest) {
    return { items: await this.logs.listMine(readAuthContext(request), query.from, query.to) };
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
}
