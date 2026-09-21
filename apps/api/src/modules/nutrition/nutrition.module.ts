import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LibraryEditPolicy } from '../library/domain/policies/library-edit.policy';
import { NutritionService } from './application/nutrition.service';
import { NutritionRepository } from './infra/prisma/nutrition.repository';
import { ClientNutritionController } from './presentation/controllers/client-nutrition.controller';
import { NutritionController } from './presentation/controllers/nutrition.controller';

@Module({
  imports: [AuthModule],
  controllers: [NutritionController, ClientNutritionController],
  providers: [NutritionService, NutritionRepository, LibraryEditPolicy],
})
export class NutritionModule {}
