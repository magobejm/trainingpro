import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { ListClientLibraryCardioUseCase } from '../../application/use-cases/list-client-library-cardio.usecase';
import { ListClientLibraryExercisesUseCase } from '../../application/use-cases/list-client-library-exercises.usecase';
import { ListClientLibraryIsometricUseCase } from '../../application/use-cases/list-client-library-isometric.usecase';
import { ListClientLibraryMobilityUseCase } from '../../application/use-cases/list-client-library-mobility.usecase';
import { ListClientLibraryPlioUseCase } from '../../application/use-cases/list-client-library-plio.usecase';
import { ListClientLibrarySportsUseCase } from '../../application/use-cases/list-client-library-sports.usecase';
import { ClientLibraryQueryDto } from '../dto/client-library-query.dto';

@Controller('clients')
@UseGuards(AuthGuard, RolesGuard)
@Roles('client')
export class ClientLibraryController {
  constructor(
    private readonly listCardioUseCase: ListClientLibraryCardioUseCase,
    private readonly listExercisesUseCase: ListClientLibraryExercisesUseCase,
    private readonly listIsometricUseCase: ListClientLibraryIsometricUseCase,
    private readonly listMobilityUseCase: ListClientLibraryMobilityUseCase,
    private readonly listPlioUseCase: ListClientLibraryPlioUseCase,
    private readonly listSportsUseCase: ListClientLibrarySportsUseCase,
  ) {}

  @Get('me/library/exercises')
  async listExercises(@Query() query: ClientLibraryQueryDto, @Req() request: HttpAuthRequest) {
    const ctx = readAuthContext(request);
    const { q } = ClientLibraryQueryDto.schema.parse(query);
    return this.listExercisesUseCase.execute(ctx, q);
  }

  @Get('me/library/cardio-methods')
  async listCardioMethods(@Query() query: ClientLibraryQueryDto, @Req() request: HttpAuthRequest) {
    const ctx = readAuthContext(request);
    const { q } = ClientLibraryQueryDto.schema.parse(query);
    return this.listCardioUseCase.execute(ctx, q);
  }

  @Get('me/library/plio-exercises')
  async listPlioExercises(@Query() query: ClientLibraryQueryDto, @Req() request: HttpAuthRequest) {
    const ctx = readAuthContext(request);
    const { q } = ClientLibraryQueryDto.schema.parse(query);
    return this.listPlioUseCase.execute(ctx, q);
  }

  @Get('me/library/mobility-exercises')
  async listMobilityExercises(@Query() query: ClientLibraryQueryDto, @Req() request: HttpAuthRequest) {
    const ctx = readAuthContext(request);
    const { q } = ClientLibraryQueryDto.schema.parse(query);
    return this.listMobilityUseCase.execute(ctx, q);
  }

  @Get('me/library/isometric-exercises')
  async listIsometricExercises(@Query() query: ClientLibraryQueryDto, @Req() request: HttpAuthRequest) {
    const ctx = readAuthContext(request);
    const { q } = ClientLibraryQueryDto.schema.parse(query);
    return this.listIsometricUseCase.execute(ctx, q);
  }

  @Get('me/library/sports')
  async listSports(@Query() query: ClientLibraryQueryDto, @Req() request: HttpAuthRequest) {
    const ctx = readAuthContext(request);
    const { q } = ClientLibraryQueryDto.schema.parse(query);
    return this.listSportsUseCase.execute(ctx, q);
  }
}
