import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateCardioTemplateUseCase } from './application/use-cases/create-cardio-template.usecase';
import { CreateTemplateUseCase } from './application/use-cases/create-template.usecase';
import { ListCardioTemplatesUseCase } from './application/use-cases/list-cardio-templates.usecase';
import { ListTemplatesUseCase } from './application/use-cases/list-templates.usecase';
import { UpdateCardioTemplateUseCase } from './application/use-cases/update-cardio-template.usecase';
import { UpdateTemplateUseCase } from './application/use-cases/update-template.usecase';
import { CardioRulesService } from './domain/cardio-rules.service';
import { PLANS_REPOSITORY } from './domain/plans-repository.port';
import { PlansRulesService } from './domain/plans-rules.service';
import { PlansRepositoryPrisma } from './infra/prisma/plans.repository.prisma';
import { PlansCardioController } from './presentation/controllers/plans-cardio.controller';
import { PlansController } from './presentation/controllers/plans.controller';

@Module({
  imports: [AuthModule],
  controllers: [PlansController, PlansCardioController],
  providers: [
    CreateCardioTemplateUseCase,
    CreateTemplateUseCase,
    ListCardioTemplatesUseCase,
    ListTemplatesUseCase,
    UpdateCardioTemplateUseCase,
    UpdateTemplateUseCase,
    CardioRulesService,
    PlansRulesService,
    PlansRepositoryPrisma,
    {
      provide: PLANS_REPOSITORY,
      useExisting: PlansRepositoryPrisma,
    },
  ],
})
export class PlansModule {}
