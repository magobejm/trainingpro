import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateCardioTemplateUseCase } from './application/use-cases/create-cardio-template.usecase';
import { CreateRoutineTemplateUseCase } from './application/use-cases/create-routine-template.usecase';
import { CreateTemplateUseCase } from './application/use-cases/create-template.usecase';
import { DeleteCardioTemplateUseCase } from './application/use-cases/delete-cardio-template.usecase';
import { DeleteRoutineTemplateUseCase } from './application/use-cases/delete-routine-template.usecase';
import { DeleteTemplateUseCase } from './application/use-cases/delete-template.usecase';
import { ListCardioTemplatesUseCase } from './application/use-cases/list-cardio-templates.usecase';
import { ListRoutineTemplatesUseCase } from './application/use-cases/list-routine-templates.usecase';
import { ListTemplatesUseCase } from './application/use-cases/list-templates.usecase';
import { UpdateCardioTemplateUseCase } from './application/use-cases/update-cardio-template.usecase';
import { UpdateRoutineTemplateUseCase } from './application/use-cases/update-routine-template.usecase';
import { UpdateTemplateUseCase } from './application/use-cases/update-template.usecase';
import { GetCardioTemplateUseCase } from './application/use-cases/get-cardio-template.usecase';
import { GetRoutineTemplateUseCase } from './application/use-cases/get-routine-template.usecase';
import { GetTemplateUseCase } from './application/use-cases/get-template.usecase';
import { CardioRulesService } from './domain/cardio-rules.service';
import { PLANS_REPOSITORY } from './domain/plans-repository.port';
import { PlansRulesService } from './domain/plans-rules.service';
import { PlansRepositoryPrisma } from './infra/prisma/plans.repository.prisma';
import { PlansCardioController } from './presentation/controllers/plans-cardio.controller';
import { PlansRoutineController } from './presentation/controllers/plans-routine.controller';
import { PlansController } from './presentation/controllers/plans.controller';
import { PlanAccessPolicy } from './domain/policies/plan-access.policy';
import { PlanOwnershipGuard } from './presentation/guards/plan-ownership.guard';

@Module({
  imports: [AuthModule],
  controllers: [PlansController, PlansCardioController, PlansRoutineController],
  providers: [
    CreateCardioTemplateUseCase,
    CreateRoutineTemplateUseCase,
    CreateTemplateUseCase,
    DeleteCardioTemplateUseCase,
    DeleteRoutineTemplateUseCase,
    DeleteTemplateUseCase,
    ListCardioTemplatesUseCase,
    ListRoutineTemplatesUseCase,
    ListTemplatesUseCase,
    UpdateCardioTemplateUseCase,
    UpdateRoutineTemplateUseCase,
    UpdateTemplateUseCase,
    GetCardioTemplateUseCase,
    GetRoutineTemplateUseCase,
    GetTemplateUseCase,
    CardioRulesService,
    PlansRulesService,
    PlansRepositoryPrisma,
    PlanAccessPolicy,
    PlanOwnershipGuard,
    {
      provide: PLANS_REPOSITORY,
      useExisting: PlansRepositoryPrisma,
    },
  ],
})
export class PlansModule {}
