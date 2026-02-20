import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { ArchiveClientUseCase } from '../../application/use-cases/archive-client.usecase';
import { CreateClientUseCase } from '../../application/use-cases/create-client.usecase';
import { GetClientUseCase } from '../../application/use-cases/get-client.usecase';
import { ListClientsUseCase } from '../../application/use-cases/list-clients.usecase';
import { ListClientObjectivesUseCase } from '../../application/use-cases/list-client-objectives.usecase';
import { ResetClientPasswordUseCase } from '../../application/use-cases/reset-client-password.usecase';
import { UpdateClientUseCase } from '../../application/use-cases/update-client.usecase';
import { UploadClientAvatarUseCase } from '../../application/use-cases/upload-client-avatar.usecase';
import type { Client } from '../../domain/client';
import { ClientIdParamDto } from '../dto/client-id-param.dto';
import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import { ClientOwnershipGuard } from '../guards/client-ownership.guard';

type UploadedAvatarFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

@Controller('clients')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class ClientsController {
  constructor(
    private readonly archiveClientUseCase: ArchiveClientUseCase,
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly getClientUseCase: GetClientUseCase,
    private readonly listClientsUseCase: ListClientsUseCase,
    private readonly listClientObjectivesUseCase: ListClientObjectivesUseCase,
    private readonly resetClientPasswordUseCase: ResetClientPasswordUseCase,
    private readonly updateClientUseCase: UpdateClientUseCase,
    private readonly uploadClientAvatarUseCase: UploadClientAvatarUseCase,
  ) {}

  @Post()
  async create(@Body() body: CreateClientDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const result = await this.createClientUseCase.execute(auth, mapCreateDto(body));
    return {
      client: mapClientOutput(result.client),
      credentials: result.credentials,
    };
  }

  @Get()
  async list(@Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const clients = await this.listClientsUseCase.execute(auth);
    return { items: clients.map(mapClientOutput) };
  }

  @Get('catalog/objectives')
  async listObjectives() {
    const items = await this.listClientObjectivesUseCase.execute();
    return { items };
  }

  @Get(':clientId')
  @UseGuards(ClientOwnershipGuard)
  async getOne(@Param() params: ClientIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const client = await this.getClientUseCase.execute(auth, params.clientId);
    const objectiveOptions = await this.listClientObjectivesUseCase.execute();
    return {
      ...mapClientOutput(client),
      objectiveOptions,
    };
  }

  @Patch(':clientId')
  @UseGuards(ClientOwnershipGuard)
  async update(
    @Param() params: ClientIdParamDto,
    @Body() body: UpdateClientDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const updated = await this.updateClientUseCase.execute(
      auth,
      params.clientId,
      mapUpdateDto(body),
    );
    return mapClientOutput(updated);
  }

  @Post(':clientId/avatar')
  @UseGuards(ClientOwnershipGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param() params: ClientIdParamDto,
    @UploadedFile() file: UploadedAvatarFile | undefined,
    @Req() request: HttpAuthRequest,
  ) {
    if (!file) {
      throw new BadRequestException('Missing avatar file');
    }
    const auth = readAuthContext(request);
    return this.uploadClientAvatarUseCase.execute(auth, params.clientId, file);
  }

  @Post(':clientId/reset-password')
  @UseGuards(ClientOwnershipGuard)
  async resetPassword(@Param() params: ClientIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    return this.resetClientPasswordUseCase.execute(auth, params.clientId);
  }

  @Delete(':clientId')
  @UseGuards(ClientOwnershipGuard)
  async archive(@Param() params: ClientIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    await this.archiveClientUseCase.execute(auth, params.clientId);
    return { status: 'archived' };
  }
}

function mapUpdateDto(body: UpdateClientDto) {
  return {
    ...body,
    birthDate:
      body.birthDate === undefined
        ? undefined
        : body.birthDate
          ? new Date(body.birthDate)
          : null,
  };
}

function mapCreateDto(body: CreateClientDto) {
  return {
    ...body,
    birthDate: body.birthDate ? new Date(body.birthDate) : null,
  };
}

function mapClientOutput(client: Client) {
  return {
    avatarUrl: client.avatarUrl ?? resolveDefaultAvatarUrl(client.id),
    birthDate: client.birthDate ? client.birthDate.toISOString().slice(0, 10) : null,
    coachMembershipId: client.coachMembershipId,
    createdAt: client.createdAt.toISOString(),
    email: client.email,
    firstName: client.firstName,
    heightCm: client.heightCm,
    id: client.id,
    lastName: client.lastName,
    notes: client.notes,
    objective: client.objective,
    objectiveId: client.objectiveId,
    organizationId: client.organizationId,
    phone: client.phone,
    sex: client.sex,
    updatedAt: client.updatedAt.toISOString(),
    weightKg: client.weightKg,
  };
}

function resolveDefaultAvatarUrl(clientId: string): string {
  const names = [
    'avatar-01.png',
    'avatar-02.png',
    'avatar-03.png',
    'avatar-04.png',
    'avatar-05.png',
    'avatar-06.png',
    'avatar-07.png',
    'avatar-08.png',
    'pixar-1.png',
    'pixar-2.png',
    'pixar-3.png',
    'pixar-4.png',
    'pixar-5.png',
    'pixar-6.png',
  ];
  const index = hashSeed(clientId) % names.length;
  return `${resolvePublicAssetBaseUrl()}/assets/avatars/${names[index]}`;
}

function resolvePublicAssetBaseUrl(): string {
  return process.env.PUBLIC_ASSET_BASE_URL ?? `http://localhost:${process.env.PORT ?? 8080}`;
}

function hashSeed(input: string): number {
  let value = 0;
  for (let index = 0; index < input.length; index += 1) {
    value = (value * 31 + input.charCodeAt(index)) >>> 0;
  }
  return value;
}
