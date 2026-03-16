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
import { CreateIsometricExerciseUseCase } from '../../application/use-cases/create-isometric-exercise.usecase';
import { CreatePlioExerciseUseCase } from '../../application/use-cases/create-plio-exercise.usecase';
import { CreateMobilityExerciseUseCase } from '../../application/use-cases/create-mobility-exercise.usecase';
import { CreateSportUseCase } from '../../application/use-cases/create-sport.usecase';
import { DeleteIsometricExerciseUseCase } from '../../application/use-cases/delete-isometric-exercise.usecase';
import { DeletePlioExerciseUseCase } from '../../application/use-cases/delete-plio-exercise.usecase';
import { DeleteMobilityExerciseUseCase } from '../../application/use-cases/delete-mobility-exercise.usecase';
import { DeleteSportUseCase } from '../../application/use-cases/delete-sport.usecase';
import { ListIsometricExercisesUseCase } from '../../application/use-cases/list-isometric-exercises.usecase';
import { ListIsometricTypesUseCase } from '../../application/use-cases/list-isometric-types.usecase';
import { ListPlioExercisesUseCase } from '../../application/use-cases/list-plio-exercises.usecase';
import { ListPlioTypesUseCase } from '../../application/use-cases/list-plio-types.usecase';
import { ListMobilityExercisesUseCase } from '../../application/use-cases/list-mobility-exercises.usecase';
import { ListMobilityTypesUseCase } from '../../application/use-cases/list-mobility-types.usecase';
import { ListSportsUseCase } from '../../application/use-cases/list-sports.usecase';
import { UpdateIsometricExerciseUseCase } from '../../application/use-cases/update-isometric-exercise.usecase';
import { UpdatePlioExerciseUseCase } from '../../application/use-cases/update-plio-exercise.usecase';
import { UpdateMobilityExerciseUseCase } from '../../application/use-cases/update-mobility-exercise.usecase';
import { UpdateSportUseCase } from '../../application/use-cases/update-sport.usecase';
import { CreateIsometricExerciseDto } from '../dto/create-isometric-exercise.dto';
import { CreatePlioExerciseDto } from '../dto/create-plio-exercise.dto';
import { CreateMobilityExerciseDto } from '../dto/create-mobility-exercise.dto';
import { CreateSportDto } from '../dto/create-sport.dto';
import { LibraryItemIdParamDto } from '../dto/library-item-id-param.dto';
import { UpdateIsometricExerciseDto } from '../dto/update-isometric-exercise.dto';
import { UpdatePlioExerciseDto } from '../dto/update-plio-exercise.dto';
import { UpdateMobilityExerciseDto } from '../dto/update-mobility-exercise.dto';
import { UpdateSportDto } from '../dto/update-sport.dto';
import { toOutput } from './library.controller.helpers';

@Controller('library')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class LibrarySpecializedController {
  constructor(
    private readonly createIsometricExerciseUseCase: CreateIsometricExerciseUseCase,
    private readonly createPlioExerciseUseCase: CreatePlioExerciseUseCase,
    private readonly createMobilityExerciseUseCase: CreateMobilityExerciseUseCase,
    private readonly createSportUseCase: CreateSportUseCase,
    private readonly deleteIsometricExerciseUseCase: DeleteIsometricExerciseUseCase,
    private readonly deletePlioExerciseUseCase: DeletePlioExerciseUseCase,
    private readonly deleteMobilityExerciseUseCase: DeleteMobilityExerciseUseCase,
    private readonly deleteSportUseCase: DeleteSportUseCase,
    private readonly listIsometricExercisesUseCase: ListIsometricExercisesUseCase,
    private readonly listIsometricTypesUseCase: ListIsometricTypesUseCase,
    private readonly listPlioExercisesUseCase: ListPlioExercisesUseCase,
    private readonly listPlioTypesUseCase: ListPlioTypesUseCase,
    private readonly listMobilityTypesUseCase: ListMobilityTypesUseCase,
    private readonly listMobilityExercisesUseCase: ListMobilityExercisesUseCase,
    private readonly listSportsUseCase: ListSportsUseCase,
    private readonly updateIsometricExerciseUseCase: UpdateIsometricExerciseUseCase,
    private readonly updatePlioExerciseUseCase: UpdatePlioExerciseUseCase,
    private readonly updateMobilityExerciseUseCase: UpdateMobilityExerciseUseCase,
    private readonly updateSportUseCase: UpdateSportUseCase,
  ) {}

  @Get('isometrics')
  async listIsometricExercises(
    @Query('query') query: string,
    @Query('isometricType') isometricType: string,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const items = await this.listIsometricExercisesUseCase.execute(auth, { isometricType, query });
    return { items: items.map(toOutput) };
  }

  @Get('catalogs/isometric-types')
  async listIsometricTypes(@Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const items = await this.listIsometricTypesUseCase.execute(auth);
    return { items };
  }

  @Post('isometrics')
  async createIsometricExercise(
    @Body() body: CreateIsometricExerciseDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const item = await this.createIsometricExerciseUseCase.execute(auth, body);
    return toOutput(item);
  }

  @Patch('isometrics/:itemId')
  async updateIsometricExercise(
    @Param() params: LibraryItemIdParamDto,
    @Body() body: UpdateIsometricExerciseDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const item = await this.updateIsometricExerciseUseCase.execute(auth, params.itemId, body);
    return toOutput(item);
  }

  @Delete('isometrics/:itemId')
  async deleteIsometricExercise(
    @Param() params: LibraryItemIdParamDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    await this.deleteIsometricExerciseUseCase.execute(auth, params.itemId);
    return { status: 'ok' };
  }

  @Get('plyometrics')
  async listPlioExercises(
    @Query('query') query: string,
    @Query('plioType') plioType: string,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const items = await this.listPlioExercisesUseCase.execute(auth, { plioType, query });
    return { items: items.map(toOutput) };
  }

  @Get('catalogs/plio-types')
  async listPlioTypes(@Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const items = await this.listPlioTypesUseCase.execute(auth);
    return { items };
  }

  @Get('mobility')
  async listMobilityExercises(
    @Query('query') query: string,
    @Query('mobilityType') mobilityType: string,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const items = await this.listMobilityExercisesUseCase.execute(auth, { mobilityType, query });
    return { items: items.map(toOutput) };
  }

  @Get('catalogs/mobility-types')
  async listMobilityTypes(@Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const items = await this.listMobilityTypesUseCase.execute(auth);
    return { items };
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

  @Post('mobility')
  async createMobilityExercise(
    @Body() body: CreateMobilityExerciseDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const item = await this.createMobilityExerciseUseCase.execute(auth, body);
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

  @Patch('mobility/:itemId')
  async updateMobilityExercise(
    @Param() params: LibraryItemIdParamDto,
    @Body() body: UpdateMobilityExerciseDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const item = await this.updateMobilityExerciseUseCase.execute(auth, params.itemId, body);
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

  @Delete('mobility/:itemId')
  async deleteMobilityExercise(
    @Param() params: LibraryItemIdParamDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    await this.deleteMobilityExerciseUseCase.execute(auth, params.itemId);
    return { status: 'ok' };
  }

  @Delete('sports/:itemId')
  async deleteSport(@Param() params: LibraryItemIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    await this.deleteSportUseCase.execute(auth, params.itemId);
    return { status: 'ok' };
  }
}
