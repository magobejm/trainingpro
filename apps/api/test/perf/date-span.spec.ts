import { ListCalendarEventsQueryDto } from '../../src/modules/calendar/presentation/dto/list-calendar-events-query.dto';
import {
  ClientCalendarQueryDto,
  ClientWellnessQueryDto,
} from '../../src/modules/clients/presentation/dto/client-calendar-query.dto';
import { GetProgressQueryDto } from '../../src/modules/progress/presentation/dto/get-progress-query.dto';
import { inclusiveUtcDays } from '../../src/common/dates/date-span';

const clientId = '11111111-1111-4111-8111-111111111111';

describe('inclusive date span', () => {
  test('counts both ends and rejects an inverted range', () => {
    expect(inclusiveUtcDays('2026-01-01', '2026-01-01')).toBe(1);
    expect(inclusiveUtcDays('2026-01-01', '2026-03-03')).toBe(62);
    expect(inclusiveUtcDays('2026-03-02', '2026-01-01')).toBeNull();
  });
});

describe('calendar range limits', () => {
  test('accepts 62 days and rejects 63', () => {
    expect(ListCalendarEventsQueryDto.schema.safeParse(span('2026-01-01', '2026-03-03')).success).toBe(true);
    expect(ListCalendarEventsQueryDto.schema.safeParse(span('2026-01-01', '2026-03-04')).success).toBe(false);
    expect(ClientCalendarQueryDto.schema.safeParse(span('2026-01-01', '2026-03-03')).success).toBe(true);
    expect(ClientCalendarQueryDto.schema.safeParse(span('2026-01-01', '2026-03-04')).success).toBe(false);
  });
});

describe('wellness range limit', () => {
  test('accepts 93 days and rejects 94', () => {
    expect(ClientWellnessQueryDto.schema.safeParse(span('2026-01-01', '2026-04-03')).success).toBe(true);
    expect(ClientWellnessQueryDto.schema.safeParse(span('2026-01-01', '2026-04-04')).success).toBe(false);
  });
});

describe('progress range limit', () => {
  test('accepts 400 days and rejects 401', () => {
    const accepted = GetProgressQueryDto.schema.safeParse({ clientId, from: '2026-01-01', to: '2027-02-04' });
    const rejected = GetProgressQueryDto.schema.safeParse({ clientId, from: '2026-01-01', to: '2027-02-05' });
    expect(accepted.success).toBe(true);
    expect(rejected.success).toBe(false);
  });
});

function span(dateFrom: string, dateTo: string) {
  return { dateFrom, dateTo };
}
