import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
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
import { FILE_STORAGE, type FileStoragePort } from '../../../files/domain/file-storage.port';
import { ArchiveClientUseCase } from '../../application/use-cases/archive-client.usecase';
import { CreateClientProgressPhotoUseCase } from '../../application/use-cases/create-client-progress-photo.usecase';
import { CreateClientUseCase } from '../../application/use-cases/create-client.usecase';
import { DeleteClientProgressPhotoUseCase } from '../../application/use-cases/delete-client-progress-photo.usecase';
import { GetClientUseCase } from '../../application/use-cases/get-client.usecase';
import { GetClientManagementSectionsUseCase } from '../../application/use-cases/get-client-management-sections.usecase';
import { ListClientProgressPhotosUseCase } from '../../application/use-cases/list-client-progress-photos.usecase';
import { ListClientsUseCase } from '../../application/use-cases/list-clients.usecase';
import { ListClientObjectivesUseCase } from '../../application/use-cases/list-client-objectives.usecase';
import { ResetClientPasswordUseCase } from '../../application/use-cases/reset-client-password.usecase';
import { SaveClientManagementSectionsUseCase } from '../../application/use-cases/save-client-management-sections.usecase';
import { SetClientProgressPhotoArchivedUseCase } from '../../application/use-cases/set-client-progress-photo-archived.usecase';
import { UpdateClientUseCase } from '../../application/use-cases/update-client.usecase';
import { UploadClientAvatarUseCase } from '../../application/use-cases/upload-client-avatar.usecase';
import { UploadClientProgressPhotoUseCase } from '../../application/use-cases/upload-client-progress-photo.usecase';
import { ClientProgressPhotoIdParamDto } from '../dto/client-progress-photo-id-param.dto';
import { ClientIdParamDto } from '../dto/client-id-param.dto';
import { CreateClientProgressPhotoDto } from '../dto/create-client-progress-photo.dto';
import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientProgressPhotoStatusDto } from '../dto/update-client-progress-photo-status.dto';
import { UpdateClientManagementSectionsDto } from '../dto/update-client-management-sections.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import { ClientOwnershipGuard } from '../guards/client-ownership.guard';
import {
  mapClientOutput,
  mapCreateDto,
  mapManagementSection,
  mapProgressPhotoOutput,
  mapUpdateDto,
} from './clients.controller.mappers';

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
    private readonly createClientProgressPhotoUseCase: CreateClientProgressPhotoUseCase,
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly deleteClientProgressPhotoUseCase: DeleteClientProgressPhotoUseCase,
    private readonly getClientUseCase: GetClientUseCase,
    private readonly getClientManagementSectionsUseCase: GetClientManagementSectionsUseCase,
    private readonly listClientProgressPhotosUseCase: ListClientProgressPhotosUseCase,
    private readonly listClientsUseCase: ListClientsUseCase,
    private readonly listClientObjectivesUseCase: ListClientObjectivesUseCase,
    private readonly resetClientPasswordUseCase: ResetClientPasswordUseCase,
    private readonly saveClientManagementSectionsUseCase: SaveClientManagementSectionsUseCase,
    private readonly setClientProgressPhotoArchivedUseCase: SetClientProgressPhotoArchivedUseCase,
    private readonly updateClientUseCase: UpdateClientUseCase,
    private readonly uploadClientAvatarUseCase: UploadClientAvatarUseCase,
    private readonly uploadClientProgressPhotoUseCase: UploadClientProgressPhotoUseCase,
    @Inject(FILE_STORAGE)
    private readonly storage: FileStoragePort,
  ) {}

  @Post()
  async create(@Body() body: CreateClientDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const result = await this.createClientUseCase.execute(auth, mapCreateDto(body));
    return {
      client: mapClientOutput(result.client, this.storage),
      credentials: result.credentials,
    };
  }

  @Get()
  async list(@Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const clients = await this.listClientsUseCase.execute(auth);
    return { items: clients.map((client) => mapClientOutput(client, this.storage)) };
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
      ...mapClientOutput(client, this.storage),
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
    return mapClientOutput(updated, this.storage);
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

  @Get(':clientId/progress-photos')
  @UseGuards(ClientOwnershipGuard)
  async listProgressPhotos(@Param() params: ClientIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const items = await this.listClientProgressPhotosUseCase.execute(auth, params.clientId);
    return { items: items.map((item) => mapProgressPhotoOutput(item, this.storage)) };
  }

  @Post(':clientId/progress-photos')
  @UseGuards(ClientOwnershipGuard)
  async createProgressPhoto(
    @Param() params: ClientIdParamDto,
    @Body() body: CreateClientProgressPhotoDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const created = await this.createClientProgressPhotoUseCase.execute(
      auth,
      params.clientId,
      body.imageUrl,
    );
    return mapProgressPhotoOutput(created, this.storage);
  }

  @Post(':clientId/progress-photos/upload')
  @UseGuards(ClientOwnershipGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadProgressPhoto(
    @Param() params: ClientIdParamDto,
    @UploadedFile() file: UploadedAvatarFile | undefined,
    @Req() request: HttpAuthRequest,
  ) {
    if (!file) {
      throw new BadRequestException('Missing progress photo file');
    }
    const auth = readAuthContext(request);
    const uploaded = await this.uploadClientProgressPhotoUseCase.execute(
      auth,
      params.clientId,
      file,
    );
    return mapProgressPhotoOutput(uploaded, this.storage);
  }

  @Patch(':clientId/progress-photos/:photoId')
  @UseGuards(ClientOwnershipGuard)
  async updateProgressPhotoStatus(
    @Param() params: ClientProgressPhotoIdParamDto,
    @Body() body: UpdateClientProgressPhotoStatusDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const updated = await this.setClientProgressPhotoArchivedUseCase.execute(
      auth,
      params.clientId,
      params.photoId,
      body.archived,
    );
    return mapProgressPhotoOutput(updated, this.storage);
  }

  @Delete(':clientId/progress-photos/:photoId')
  @UseGuards(ClientOwnershipGuard)
  async deleteProgressPhoto(
    @Param() params: ClientProgressPhotoIdParamDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    await this.deleteClientProgressPhotoUseCase.execute(auth, params.clientId, params.photoId);
    return { status: 'deleted' };
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
