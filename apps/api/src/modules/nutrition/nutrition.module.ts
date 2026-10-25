import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { LibraryEditPolicy } from '../library/domain/policies/library-edit.policy';
import { NutritionAiService } from './application/nutrition-ai.service';
import { NutritionLogService } from './application/nutrition-log.service';
import { NutritionSubstituteService } from './application/nutrition-substitute.service';
import { NutritionService } from './application/nutrition.service';
import { NutritionLogRepository } from './infra/prisma/nutrition-log.repository';
import { NutritionRepository } from './infra/prisma/nutrition.repository';
import { ClientNutritionController } from './presentation/controllers/client-nutrition.controller';
import { NutritionController } from './presentation/controllers/nutrition.controller';

@Module({
  imports: [AiModule, AuthModule, FilesModule],
  controllers: [NutritionController, ClientNutritionController],
  exports: [NutritionService],
  providers: [
    NutritionService,
    NutritionAiService,
    NutritionLogService,
    NutritionSubstituteService,
    NutritionRepository,
    NutritionLogRepository,
    LibraryEditPolicy,
  ],
})
export class NutritionModule {}
