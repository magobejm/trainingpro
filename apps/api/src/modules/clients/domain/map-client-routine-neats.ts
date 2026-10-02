import type { ClientRoutineNeat } from './client-routine';

type ClientRoutineNeatRow = {
  description?: null | string;
  id: string;
  title: string;
};

export function mapClientRoutineNeats(rows: ClientRoutineNeatRow[]): ClientRoutineNeat[] {
  return rows.map((row) => {
    const description = row.description?.trim() ?? '';
    return {
      id: row.id,
      title: row.title,
      description: description.length > 0 ? description : null,
    };
  });
}
