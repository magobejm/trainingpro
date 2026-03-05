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
import { GetClientManagementSectionsUseCase } from '../../application/use-cases/get-client-management-sections.usecase';
import { ListClientsUseCase } from '../../application/use-cases/list-clients.usecase';
import { ListClientObjectivesUseCase } from '../../application/use-cases/list-client-objectives.usecase';
import { ResetClientPasswordUseCase } from '../../application/use-cases/reset-client-password.usecase';
import { SaveClientManagementSectionsUseCase } from '../../application/use-cases/save-client-management-sections.usecase';
import { UpdateClientUseCase } from '../../application/use-cases/update-client.usecase';
import { UploadClientAvatarUseCase } from '../../application/use-cases/upload-client-avatar.usecase';
import type { Client } from '../../domain/client';
import type { ClientManagementSection } from '../../domain/client-management-section';
import { ClientIdParamDto } from '../dto/client-id-param.dto';
import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientManagementSectionsDto } from '../dto/update-client-management-sections.dto';
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
    private readonly getClientManagementSectionsUseCase: GetClientManagementSectionsUseCase,
    private readonly listClientsUseCase: ListClientsUseCase,
    private readonly listClientObjectivesUseCase: ListClientObjectivesUseCase,
    private readonly resetClientPasswordUseCase: ResetClientPasswordUseCase,
    private readonly saveClientManagementSectionsUseCase: SaveClientManagementSectionsUseCase,
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

  @Get(':clientId/management-sections')
  @UseGuards(ClientOwnershipGuard)
  async getManagementSections(@Param() params: ClientIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const items = await this.getClientManagementSectionsUseCase.execute(auth, params.clientId);
    return { items: items.map(mapManagementSection) };
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

  @Patch(':clientId/management-sections')
  @UseGuards(ClientOwnershipGuard)
  async updateManagementSections(
    @Param() params: ClientIdParamDto,
    @Body() body: UpdateClientManagementSectionsDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const items = await this.saveClientManagementSectionsUseCase.execute(
      auth,
      params.clientId,
      body.items,
    );
    return { items: items.map(mapManagementSection) };
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
      body.birthDate === undefined ? undefined : body.birthDate ? new Date(body.birthDate) : null,
  };
}

function mapCreateDto(body: CreateClientDto) {
  return {
    ...body,
    birthDate: body.birthDate ? new Date(body.birthDate) : null,
  };
}

function mapClientOutput(client: Client) {
  return { ...mapClientCoreOutput(client), ...mapClientProfileOutput(client) };
}

function mapManagementSection(item: ClientManagementSection) {
  return {
    archived: item.archived,
    code: item.code,
    sortOrder: item.sortOrder,
  };
}

function mapClientCoreOutput(client: Client) {
  return {
    avatarUrl: client.avatarUrl ?? resolveDefaultAvatarUrl(client.id),
    birthDate: formatDate(client.birthDate),
    coachMembershipId: client.coachMembershipId,
    createdAt: formatIso(client.createdAt),
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
    updatedAt: formatIso(client.updatedAt),
    weightKg: client.weightKg,
    trainingPlanId: client.trainingPlanId,
    trainingPlan: client.trainingPlan,
  };
}

function mapClientProfileOutput(client: Client) {
  return {
    allergies: client.allergies,
    fcMax: client.fcMax,
    fcRest: client.fcRest,
    fitnessLevel: client.fitnessLevel,
    hipCm: client.hipCm,
    injuries: client.injuries,
    secondaryObjectives: client.secondaryObjectives,
    waistCm: client.waistCm,
  };
}

function formatDate(date: Date | null): string | null {
  if (!date) return null;
  if (!(date instanceof Date) || isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function formatIso(date: Date | string): string {
  return (date instanceof Date ? date : new Date(date)).toISOString();
}

function resolveDefaultAvatarUrl(clientId: string): string {
  void clientId;
  return `${resolvePublicAssetBaseUrl()}/assets/avatars/pixar-robot-neutral.svg`;
}

function resolvePublicAssetBaseUrl(): string {
  return process.env.PUBLIC_ASSET_BASE_URL ?? `http://localhost:${process.env.PORT ?? 8080}`;
}
