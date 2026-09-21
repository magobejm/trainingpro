import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PhysicalTestsSeedService } from './application/physical-tests-seed.service';
import { PhysicalTestsService } from './application/physical-tests.service';
import { PhysicalTestsRepository } from './infra/prisma/physical-tests.repository';
import { ClientPhysicalTestsController } from './presentation/controllers/client-physical-tests.controller';
import { PhysicalTestsController } from './presentation/controllers/physical-tests.controller';

@Module({
  imports: [AuthModule],
  controllers: [PhysicalTestsController, ClientPhysicalTestsController],
  providers: [PhysicalTestsSeedService, PhysicalTestsRepository, PhysicalTestsService],
  exports: [PhysicalTestsService],
})
export class PhysicalTestsModule {}
