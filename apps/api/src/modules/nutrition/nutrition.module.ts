import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { LibraryEditPolicy } from '../library/domain/policies/library-edit.policy';
import { NutritionLogService } from './application/nutrition-log.service';
import { NutritionService } from './application/nutrition.service';
import { NutritionLogRepository } from './infra/prisma/nutrition-log.repository';
import { NutritionRepository } from './infra/prisma/nutrition.repository';
import { ClientNutritionController } from './presentation/controllers/client-nutrition.controller';
import { NutritionController } from './presentation/controllers/nutrition.controller';

@Module({
  imports: [AuthModule, FilesModule],
  controllers: [NutritionController, ClientNutritionController],
  providers: [NutritionService, NutritionLogService, NutritionRepository, NutritionLogRepository, LibraryEditPolicy],
})
export class NutritionModule {}
