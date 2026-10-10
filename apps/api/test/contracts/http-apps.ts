import type { INestApplication } from '@nestjs/common';
import type { Provider, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import { ZodValidationPipe } from '../../src/common/zod-validation.pipe';
import { AuthGuard } from '../../src/modules/auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../src/modules/auth/presentation/guards/roles.guard';
import { ListChatMessagesUseCase } from '../../src/modules/chat/application/use-cases/list-chat-messages.usecase';
import { ResolveChatThreadUseCase } from '../../src/modules/chat/application/use-cases/resolve-chat-thread.usecase';
import { SendChatMessageUseCase } from '../../src/modules/chat/application/use-cases/send-chat-message.usecase';
import { ChatController } from '../../src/modules/chat/presentation/controllers/chat.controller';
import { ArchiveClientUseCase } from '../../src/modules/clients/application/use-cases/archive-client.usecase';
import { CreateClientProgressPhotoUseCase } from '../../src/modules/clients/application/use-cases/create-client-progress-photo.usecase';
import { CreateClientUseCase } from '../../src/modules/clients/application/use-cases/create-client.usecase';
import { DeleteClientProgressPhotoUseCase } from '../../src/modules/clients/application/use-cases/delete-client-progress-photo.usecase';
import { GetClientManagementSectionsUseCase } from '../../src/modules/clients/application/use-cases/get-client-management-sections.usecase';
import { GetClientUseCase } from '../../src/modules/clients/application/use-cases/get-client.usecase';
import { ListClientObjectivesUseCase } from '../../src/modules/clients/application/use-cases/list-client-objectives.usecase';
import { ListClientProgressPhotosUseCase } from '../../src/modules/clients/application/use-cases/list-client-progress-photos.usecase';
import { ListClientWellnessUseCase } from '../../src/modules/clients/application/use-cases/list-client-wellness.usecase';
import { ListClientsUseCase } from '../../src/modules/clients/application/use-cases/list-clients.usecase';
import { ResetClientPasswordUseCase } from '../../src/modules/clients/application/use-cases/reset-client-password.usecase';
import { SaveClientManagementSectionsUseCase } from '../../src/modules/clients/application/use-cases/save-client-management-sections.usecase';
import { SetClientProgressPhotoArchivedUseCase } from '../../src/modules/clients/application/use-cases/set-client-progress-photo-archived.usecase';
import { UpdateClientUseCase } from '../../src/modules/clients/application/use-cases/update-client.usecase';
import { UploadClientAvatarUseCase } from '../../src/modules/clients/application/use-cases/upload-client-avatar.usecase';
import { UploadClientProgressPhotoUseCase } from '../../src/modules/clients/application/use-cases/upload-client-progress-photo.usecase';
import { ClientsController } from '../../src/modules/clients/presentation/controllers/clients.controller';
import { ClientOwnershipGuard } from '../../src/modules/clients/presentation/guards/client-ownership.guard';
import { FILE_STORAGE } from '../../src/modules/files/domain/file-storage.port';
import { PrivateMediaUrlSigner } from '../../src/modules/files/domain/private-media-url-signer';
import { CreateTemplateUseCase } from '../../src/modules/plans/application/use-cases/create-template.usecase';
import { DeleteTemplateUseCase } from '../../src/modules/plans/application/use-cases/delete-template.usecase';
import { GetTemplateUseCase } from '../../src/modules/plans/application/use-cases/get-template.usecase';
import { ListTemplatesUseCase } from '../../src/modules/plans/application/use-cases/list-templates.usecase';
import { UpdateTemplateUseCase } from '../../src/modules/plans/application/use-cases/update-template.usecase';
import { PlansController } from '../../src/modules/plans/presentation/controllers/plans.controller';
import { PlanOwnershipGuard } from '../../src/modules/plans/presentation/guards/plan-ownership.guard';
import { EnsureSessionUseCase } from '../../src/modules/sessions/application/use-cases/ensure-session.usecase';
import { FinishSessionUseCase } from '../../src/modules/sessions/application/use-cases/finish-session.usecase';
import { GetSessionUseCase } from '../../src/modules/sessions/application/use-cases/get-session.usecase';
import { LogIntervalUseCase } from '../../src/modules/sessions/application/use-cases/log-interval.usecase';
import { LogIsometricSetUseCase } from '../../src/modules/sessions/application/use-cases/log-isometric-set.usecase';
import { LogMobilitySetUseCase } from '../../src/modules/sessions/application/use-cases/log-mobility-set.usecase';
import { LogPlioSetUseCase } from '../../src/modules/sessions/application/use-cases/log-plio-set.usecase';
import { LogSetUseCase } from '../../src/modules/sessions/application/use-cases/log-set.usecase';
import { LogSportSetUseCase } from '../../src/modules/sessions/application/use-cases/log-sport-set.usecase';
import { LogSportUseCase } from '../../src/modules/sessions/application/use-cases/log-sport.usecase';
import { StartSessionUseCase } from '../../src/modules/sessions/application/use-cases/start-session.usecase';
import { SessionsController } from '../../src/modules/sessions/presentation/controllers/sessions.controller';
import { chatMessageFixture, clientFixture, planTemplateFixture, sessionFixture } from './fixtures';

export async function createClientsApp(): Promise<INestApplication> {
  return compile(ClientsController, [
    ...stub(
      ArchiveClientUseCase,
      CreateClientProgressPhotoUseCase,
      CreateClientUseCase,
      DeleteClientProgressPhotoUseCase,
      GetClientManagementSectionsUseCase,
      GetClientUseCase,
      ListClientObjectivesUseCase,
      ListClientProgressPhotosUseCase,
      ListClientWellnessUseCase,
      ResetClientPasswordUseCase,
      SaveClientManagementSectionsUseCase,
      SetClientProgressPhotoArchivedUseCase,
      UpdateClientUseCase,
      UploadClientAvatarUseCase,
      UploadClientProgressPhotoUseCase,
    ),
    { provide: ListClientsUseCase, useValue: { execute: async () => [clientFixture()] } },
    {
      provide: FILE_STORAGE,
      useValue: { delete: async () => undefined, getPublicUrl: () => '', upload: async () => ({ path: '' }) },
    },
    { provide: PrivateMediaUrlSigner, useValue: { sign: (filePath: string) => filePath } },
  ]);
}

export async function createPlansApp(): Promise<INestApplication> {
  return compile(PlansController, [
    ...stub(CreateTemplateUseCase, DeleteTemplateUseCase, GetTemplateUseCase, UpdateTemplateUseCase),
    { provide: ListTemplatesUseCase, useValue: { execute: async () => [planTemplateFixture()] } },
  ]);
}

export async function createSessionApp(): Promise<INestApplication> {
  return compile(SessionsController, [
    ...stub(
      EnsureSessionUseCase,
      FinishSessionUseCase,
      LogIntervalUseCase,
      LogIsometricSetUseCase,
      LogMobilitySetUseCase,
      LogPlioSetUseCase,
      LogSetUseCase,
      LogSportSetUseCase,
      LogSportUseCase,
      StartSessionUseCase,
    ),
    { provide: GetSessionUseCase, useValue: { execute: async () => sessionFixture() } },
  ]);
}

export async function createChatApp(): Promise<INestApplication> {
  return compile(ChatController, [
    ...stub(ResolveChatThreadUseCase, SendChatMessageUseCase),
    { provide: ListChatMessagesUseCase, useValue: { execute: async () => [chatMessageFixture()] } },
  ]);
}

function stub(...tokens: Type[]): Provider[] {
  return tokens.map((token) => ({ provide: token, useValue: {} }));
}

async function compile(controller: Type, providers: Provider[]): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ controllers: [controller], providers })
    .overrideGuard(AuthGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(ClientOwnershipGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(PlanOwnershipGuard)
    .useValue({ canActivate: () => true })
    .compile();
  const app = moduleRef.createNestApplication();
  app.use(attachCoach);
  app.useGlobalPipes(new ZodValidationPipe());
  await app.init();
  return app;
}

function attachCoach(request: Request, _response: Response, next: NextFunction): void {
  Object.assign(request, {
    activeRole: 'coach',
    user: { email: 'coach@example.com', roles: ['coach'], subject: 'subject-1' },
  });
  next();
}
