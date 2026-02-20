import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
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
import { CreateCardioMethodUseCase } from '../../application/use-cases/create-cardio-method.usecase';
import { CreateExerciseUseCase } from '../../application/use-cases/create-exercise.usecase';
import { CreateFoodUseCase } from '../../application/use-cases/create-food.usecase';
import { DeleteCardioMethodUseCase } from '../../application/use-cases/delete-cardio-method.usecase';
import { DeleteExerciseUseCase } from '../../application/use-cases/delete-exercise.usecase';
import { ListCardioMethodTypesUseCase } from '../../application/use-cases/list-cardio-method-types.usecase';
import { ListCardioMethodsUseCase } from '../../application/use-cases/list-cardio-methods.usecase';
import { ListExerciseMuscleGroupsUseCase } from '../../application/use-cases/list-exercise-muscle-groups.usecase';
import { ListExercisesUseCase } from '../../application/use-cases/list-exercises.usecase';
import { ListFoodsUseCase } from '../../application/use-cases/list-foods.usecase';
import { UploadLibraryMediaImageUseCase } from '../../application/use-cases/upload-library-media-image.usecase';
import { UpdateCardioMethodUseCase } from '../../application/use-cases/update-cardio-method.usecase';
import { UpdateExerciseUseCase } from '../../application/use-cases/update-exercise.usecase';
import { UpdateFoodUseCase } from '../../application/use-cases/update-food.usecase';
import { CreateCardioMethodDto } from '../dto/create-cardio-method.dto';
import { CreateExerciseDto } from '../dto/create-exercise.dto';
import { CreateFoodDto } from '../dto/create-food.dto';
import { LibraryItemIdParamDto } from '../dto/library-item-id-param.dto';
import { ListCardioMethodsQueryDto } from '../dto/list-cardio-methods-query.dto';
import { ListExercisesQueryDto } from '../dto/list-exercises-query.dto';
import { ListFoodsQueryDto } from '../dto/list-foods-query.dto';
import { UpdateCardioMethodDto } from '../dto/update-cardio-method.dto';
import { UpdateExerciseDto } from '../dto/update-exercise.dto';
import { UpdateFoodDto } from '../dto/update-food.dto';

@Controller('library')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class LibraryController {
  constructor(
    private readonly createCardioMethodUseCase: CreateCardioMethodUseCase,
    private readonly createExerciseUseCase: CreateExerciseUseCase,
    private readonly createFoodUseCase: CreateFoodUseCase,
    private readonly deleteCardioMethodUseCase: DeleteCardioMethodUseCase,
    private readonly deleteExerciseUseCase: DeleteExerciseUseCase,
    private readonly listCardioMethodTypesUseCase: ListCardioMethodTypesUseCase,
    private readonly listCardioMethodsUseCase: ListCardioMethodsUseCase,
    private readonly listExerciseMuscleGroupsUseCase: ListExerciseMuscleGroupsUseCase,
    private readonly listExercisesUseCase: ListExercisesUseCase,
    private readonly listFoodsUseCase: ListFoodsUseCase,
    private readonly updateCardioMethodUseCase: UpdateCardioMethodUseCase,
    private readonly updateExerciseUseCase: UpdateExerciseUseCase,
    private readonly updateFoodUseCase: UpdateFoodUseCase,
    private readonly uploadLibraryMediaImageUseCase: UploadLibraryMediaImageUseCase,
  ) {}

  @Get('catalogs/cardio-method-types')
  async listCardioMethodTypes() {
    const items = await this.listCardioMethodTypesUseCase.execute();
    return { items };
  }

  @Get('catalogs/muscle-groups')
  async listExerciseMuscleGroups() {
    const items = await this.listExerciseMuscleGroupsUseCase.execute();
    return { items };
  }

  @Get('cardio-methods')
  async listCardioMethods(
    @Query() query: ListCardioMethodsQueryDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const items = await this.listCardioMethodsUseCase.execute(auth, query);
    return { items: items.map(toOutput) };
  }

  @Get('exercises')
  async listExercises(@Query() query: ListExercisesQueryDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const items = await this.listExercisesUseCase.execute(auth, query);
    return { items: items.map(toOutput) };
  }

  @Get('foods')
  async listFoods(@Query() query: ListFoodsQueryDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const items = await this.listFoodsUseCase.execute(auth, query);
    return { items: items.map(toOutput) };
  }

  @Post('cardio-methods')
  async createCardioMethod(@Body() body: CreateCardioMethodDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const item = await this.createCardioMethodUseCase.execute(auth, body);
    return toOutput(item);
  }

  @Post('exercises')
  async createExercise(@Body() body: CreateExerciseDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const item = await this.createExerciseUseCase.execute(auth, body);
    return toOutput(item);
  }

  @Post('foods')
  async createFood(@Body() body: CreateFoodDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const item = await this.createFoodUseCase.execute(auth, body);
    return toOutput(item);
  }

  @Post('media-image')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file'))
  async uploadMediaImage(
    @Req() request: HttpAuthRequest,
    @UploadedFile() file?: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
  ) {
    const auth = readAuthContext(request);
    if (!file) {
      return { imageUrl: null };
    }
    return this.uploadLibraryMediaImageUseCase.execute(auth, file);
  }

  @Patch('cardio-methods/:itemId')
  async updateCardioMethod(
    @Param() params: LibraryItemIdParamDto,
    @Body() body: UpdateCardioMethodDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const item = await this.updateCardioMethodUseCase.execute(auth, params.itemId, body);
    return toOutput(item);
  }

  @Patch('exercises/:itemId')
  async updateExercise(
    @Param() params: LibraryItemIdParamDto,
    @Body() body: UpdateExerciseDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const item = await this.updateExerciseUseCase.execute(auth, params.itemId, body);
    return toOutput(item);
  }

  @Patch('foods/:itemId')
  async updateFood(
    @Param() params: LibraryItemIdParamDto,
    @Body() body: UpdateFoodDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const item = await this.updateFoodUseCase.execute(auth, params.itemId, body);
    return toOutput(item);
  }

  @Delete('cardio-methods/:itemId')
  async deleteCardioMethod(
    @Param() params: LibraryItemIdParamDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    await this.deleteCardioMethodUseCase.execute(auth, params.itemId);
    return { status: 'ok' };
  }

  @Delete('exercises/:itemId')
  async deleteExercise(@Param() params: LibraryItemIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    await this.deleteExerciseUseCase.execute(auth, params.itemId);
    return { status: 'ok' };
  }
}

function toOutput(item: Record<string, unknown>) {
  const createdAt =
    item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt;
  const updatedAt =
    item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt;
  return {
    ...item,
    createdAt,
    updatedAt,
  };
}
