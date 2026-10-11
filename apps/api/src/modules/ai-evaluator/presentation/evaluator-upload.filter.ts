import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';
import { MulterError } from 'multer';
import { readRequestContext } from '../../../common/logging/request-context';

@Catch(MulterError)
export class EvaluatorUploadFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const requestId = readRequestContext(request).requestId;
    const tooLarge = exception.code === 'LIMIT_FILE_SIZE';
    response.status(400).json({
      error: 'Bad Request',
      message: tooLarge ? 'El archivo no puede superar 20 MB.' : 'No se pudo leer el archivo.',
      requestId,
      statusCode: 400,
    });
  }
}
