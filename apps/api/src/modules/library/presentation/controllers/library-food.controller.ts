import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { CreateFoodUseCase } from '../../application/use-cases/create-food.usecase';
import { DeleteFoodUseCase } from '../../application/use-cases/delete-food.usecase';
import { ListFoodsUseCase } from '../../application/use-cases/list-foods.usecase';
import { UpdateFoodUseCase } from '../../application/use-cases/update-food.usecase';
import { CreateFoodDto } from '../dto/create-food.dto';
import { LibraryItemIdParamDto } from '../dto/library-item-id-param.dto';
import { ListFoodsQueryDto } from '../dto/list-foods-query.dto';
import { UpdateFoodDto } from '../dto/update-food.dto';
import { toOutput } from './library.controller.helpers';

@Controller('library/foods')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class LibraryFoodController {
  constructor(
    private readonly createFoodUseCase: CreateFoodUseCase,
    private readonly deleteFoodUseCase: DeleteFoodUseCase,
    private readonly listFoodsUseCase: ListFoodsUseCase,
    private readonly updateFoodUseCase: UpdateFoodUseCase,
  ) {}

  @Get()
  async listFoods(@Query() query: ListFoodsQueryDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const items = await this.listFoodsUseCase.execute(auth, query);
    return { items: items.map(toOutput) };
  }

  @Post()
  async createFood(@Body() body: CreateFoodDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    const item = await this.createFoodUseCase.execute(auth, body);
    return toOutput(item);
  }

  @Patch(':itemId')
  async updateFood(
    @Param() params: LibraryItemIdParamDto,
    @Body() body: UpdateFoodDto,
    @Req() request: HttpAuthRequest,
  ) {
    const auth = readAuthContext(request);
    const item = await this.updateFoodUseCase.execute(auth, params.itemId, body);
    return toOutput(item);
  }

  @Delete(':itemId')
  async deleteFood(@Param() params: LibraryItemIdParamDto, @Req() request: HttpAuthRequest) {
    const auth = readAuthContext(request);
    await this.deleteFoodUseCase.execute(auth, params.itemId);
    return { status: 'ok' };
  }
}
