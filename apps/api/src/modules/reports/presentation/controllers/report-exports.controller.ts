import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { readAuthContext } from '../../../../common/auth-context/read-auth-context';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { AuthGuard } from '../../../auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { HttpAuthRequest } from '../../../auth/presentation/http-auth-request';
import { ExportWeeklyPdfUseCase } from '../../application/use-cases/export-weekly-pdf.usecase';
import { ExportWeeklyPdfQueryDto } from '../dto/export-weekly-pdf-query.dto';

@Controller('reports/export')
@UseGuards(AuthGuard, RolesGuard)
@Roles('coach')
export class ReportExportsController {
  constructor(private readonly exportWeeklyPdfUseCase: ExportWeeklyPdfUseCase) {}

  @Get('pdf')
  async exportPdf(
    @Query() query: ExportWeeklyPdfQueryDto,
    @Req() request: HttpAuthRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const auth = readAuthContext(request);
    const file = await this.exportWeeklyPdfUseCase.execute(auth, {
      clientId: query.clientId,
      from: new Date(query.from),
      to: new Date(query.to),
    });
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    response.setHeader('Content-Type', 'application/pdf');
    return new StreamableFile(file.data);
  }
}
