import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { LibraryUnifiedService, UnifiedExerciseDto } from '../../application/library-unified.service';

@Controller('library')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class LibraryUnifiedController {
  constructor(private readonly service: LibraryUnifiedService) {}

  @Get('catalogs')
  async listAllCatalogs() {
    return this.service.listAllCatalogs();
  }

  @Get('exercises/all')
  async listAllExercises(@Query() filters: Record<string, string>) {
    return this.service.listAllExercises(filters);
  }

  @Post('exercises/unified')
  async createUnifiedItem(@Body() dto: UnifiedExerciseDto, @Req() req: HttpAuthRequest) {
    return this.service.createUnifiedItem(dto, readAuthContext(req).subject);
  }

  @Patch('exercises/unified/:id')
  async updateUnifiedItem(@Param('id') id: string, @Body() dto: UnifiedExerciseDto, @Req() req: HttpAuthRequest) {
    return this.service.updateUnifiedItem(id, dto, readAuthContext(req).subject);
  }

  @Post('seed-biomechanics')
  async seedBiomechanics() {
    return this.service.seedBiomechanics();
  }

  @Post('seed-mobility-library')
  async seedMobilityLibrary() {
    return this.service.seedMobilityLibrary();
  }

  @Post('seed-sports-library')
  async seedSportsLibrary() {
    return this.service.seedSportsLibrary();
  }
}
