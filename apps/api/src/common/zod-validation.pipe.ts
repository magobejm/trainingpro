import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { ZodError, type ZodIssue, type ZodSchema } from 'zod';

type ZodDtoClass = {
  schema?: ZodSchema<unknown>;
};

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue: ZodIssue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
    .join('; ');
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const metatype = metadata.metatype as ZodDtoClass | undefined;
    const schema = metatype?.schema;
    if (!schema) {
      return value;
    }
    try {
      return schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException(formatZodError(error));
      }
      throw error;
    }
  }
}
