import { updateRoutineDayColorSchema } from '@trainerpro/shared';
import { z } from 'zod';
import { ClientIdParamDto } from './client-id-param.dto';

export class RoutineDayColorParamDto extends ClientIdParamDto {
  static schema = ClientIdParamDto.schema.extend({ planDayId: z.string().uuid() });
  planDayId!: string;
}
export class UpdateRoutineDayColorDto {
  static schema = updateRoutineDayColorSchema;
  color!: string;
}
