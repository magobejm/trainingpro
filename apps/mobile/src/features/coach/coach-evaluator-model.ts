export const EVALUATOR_MAX_BYTES = 20 * 1024 * 1024;
const mimeByExtension: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
};
export function acceptEvaluatorFile(file: { name: string; size?: number; mimeType?: string }): string | null {
  if (!file.size || file.size > EVALUATOR_MAX_BYTES) return null;
  const type = mimeByExtension[file.name.split('.').pop()?.toLowerCase() ?? ''];
  if (!type) return null;
  if (file.mimeType && file.mimeType !== 'application/octet-stream' && file.mimeType !== type) return null;
  return type;
}
export type CoachTechniqueResult = {
  ejercicio: string;
  fase_movimiento: string;
  analisis_puntos_clave: { espalda: string; rango_movimiento: string; alineacion_articulaciones: string };
  errores_detectados: string[];
  correccion_inmediata: string;
  score_seguridad: number;
};
export function isTechniqueResult(value: unknown): value is CoachTechniqueResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as CoachTechniqueResult;
  return (
    typeof result.ejercicio === 'string' &&
    typeof result.fase_movimiento === 'string' &&
    typeof result.correccion_inmediata === 'string' &&
    typeof result.score_seguridad === 'number' &&
    result.score_seguridad >= 0 &&
    result.score_seguridad <= 100 &&
    Array.isArray(result.errores_detectados) &&
    result.errores_detectados.every((item) => typeof item === 'string') &&
    Boolean(result.analisis_puntos_clave) &&
    ['espalda', 'rango_movimiento', 'alineacion_articulaciones'].every(
      (key) => typeof result.analisis_puntos_clave[key as keyof CoachTechniqueResult['analisis_puntos_clave']] === 'string',
    )
  );
}
