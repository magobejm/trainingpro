import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { absolutizeAssetPaths, resolvePublicAssetBaseUrl } from './public-asset-url';

@Injectable()
export class PublicAssetUrlInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((body: unknown) => absolutizeAssetPaths(body, resolvePublicAssetBaseUrl())));
  }
}
