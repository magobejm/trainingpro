import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GetMeUseCase } from './application/get-me.usecase';
import { UsersController } from './presentation/users.controller';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [GetMeUseCase],
})
export class UsersModule {}
