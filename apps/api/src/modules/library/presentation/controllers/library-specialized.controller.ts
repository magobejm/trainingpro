import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { CreatePlioExerciseUseCase } from '../../application/use-cases/create-plio-exercise.usecase';
import { CreateWarmupExerciseUseCase } from '../../application/use-cases/create-warmup-exercise.usecase';
import { CreateSportUseCase } from '../../application/use-cases/create-sport.usecase';
import { DeletePlioExerciseUseCase } from '../../application/use-cases/delete-plio-exercise.usecase';
import { DeleteWarmupExerciseUseCase } from '../../application/use-cases/delete-warmup-exercise.usecase';
import { DeleteSportUseCase } from '../../application/use-cases/delete-sport.usecase';
import { ListPlioExercisesUseCase } from '../../application/use-cases/list-plio-exercises.usecase';
import { ListWarmupExercisesUseCase } from '../../application/use-cases/list-warmup-exercises.usecase';
import { ListSportsUseCase } from '../../application/use-cases/list-sports.usecase';
import { UpdatePlioExerciseUseCase } from '../../application/use-cases/update-plio-exercise.usecase';
import { UpdateWarmupExerciseUseCase } from '../../application/use-cases/update-warmup-exercise.usecase';
import { UpdateSportUseCase } from '../../application/use-cases/update-sport.usecase';
import { CreatePlioExerciseDto } from '../dto/create-plio-exercise.dto';
import { CreateWarmupExerciseDto } from '../dto/create-warmup-exercise.dto';
import { CreateSportDto } from '../dto/create-sport.dto';
import { LibraryItemIdParamDto } from '../dto/library-item-id-param.dto';
import { UpdatePlioExerciseDto } from '../dto/update-plio-exercise.dto';
import { UpdateWarmupExerciseDto } from '../dto/update-warmup-exercise.dto';
import { UpdateSportDto } from '../dto/update-sport.dto';
import { toOutput } from './library.controller.helpers';

@Controller('library')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class LibrarySpecializedController {
  constructor(
    private readonly createPlioExerciseUseCase: CreatePlioExerciseUseCase,
    private readonly createWarmupExerciseUseCase: CreateWarmupExerciseUseCase,
    private readonly createSportUseCase: CreateSportUseCase,
    private readonly deletePlioExerciseUseCase: DeletePlioExerciseUseCase,
    private readonly deleteWarmupExerciseUseCase: DeleteWarmupExerciseUseCase,
    private readonly deleteSportUseCase: DeleteSportUseCase,
    private readonly listPlioExercisesUseCase: ListPlioExercisesUseCase,
    private readonly listWarmupExercisesUseCase: ListWarmupExercisesUseCase,
    private readonly listSportsUseCase: ListSportsUseCase,
    private readonly updatePlioExerciseUseCase: UpdatePlioExerciseUseCase,
    private readonly updateWarmupExerciseUseCase: UpdateWarmupExerciseUseCase,
    private readonly updateSportUseCase: UpdateSportUseCase,
  ) {}

  @Get('plyometrics')
  async listPlioExercises(@Query('query') query: string, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const items = await this.listPlioExercisesUseCase.execute(auth, { query });
    return { items: items.map(toOutput) };
  }

  @Get('warmup')
  async listWarmupExercises(@Query('query') query: string, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const items = await this.listWarmupExercisesUseCase.execute(auth, { query });
    return { items: items.map(toOutput) };
  }

  @Get('sports')
  async listSports(@Query('query') query: string, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const items = await this.listSportsUseCase.execute(auth, query);
    return { items: items.map(toOutput) };
  }

  @Post('plyometrics')
  async createPlioExercise(@Body() body: CreatePlioExerciseDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const item = await this.createPlioExerciseUseCase.execute(auth, body);
    return toOutput(item);
  }

  @Post('warmup')
  async createWarmupExercise(
    @Body() body: CreateWarmupExerciseDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const item = await this.createWarmupExerciseUseCase.execute(auth, body);
    return toOutput(item);
  }

  @Post('sports')
  async createSport(@Body() body: CreateSportDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const item = await this.createSportUseCase.execute(auth, body);
    return toOutput(item);
  }

  @Patch('plyometrics/:itemId')
  async updatePlioExercise(
    @Param() params: LibraryItemIdParamDto,
    @Body() body: UpdatePlioExerciseDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const item = await this.updatePlioExerciseUseCase.execute(auth, params.itemId, body);
    return toOutput(item);
  }

  @Patch('warmup/:itemId')
  async updateWarmupExercise(
    @Param() params: LibraryItemIdParamDto,
    @Body() body: UpdateWarmupExerciseDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const item = await this.updateWarmupExerciseUseCase.execute(auth, params.itemId, body);
    return toOutput(item);
  }

  @Patch('sports/:itemId')
  async updateSport(
    @Param() params: LibraryItemIdParamDto,
    @Body() body: UpdateSportDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const item = await this.updateSportUseCase.execute(auth, params.itemId, body);
    return toOutput(item);
  }

  @Delete('plyometrics/:itemId')
  async deletePlioExercise(
    @Param() params: LibraryItemIdParamDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    await this.deletePlioExerciseUseCase.execute(auth, params.itemId);
    return { status: 'ok' };
  }

  @Delete('warmup/:itemId')
  async deleteWarmupExercise(
    @Param() params: LibraryItemIdParamDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    await this.deleteWarmupExerciseUseCase.execute(auth, params.itemId);
    return { status: 'ok' };
  }

  @Delete('sports/:itemId')
  async deleteSport(@Param() params: LibraryItemIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    await this.deleteSportUseCase.execute(auth, params.itemId);
    return { status: 'ok' };
  }
}
