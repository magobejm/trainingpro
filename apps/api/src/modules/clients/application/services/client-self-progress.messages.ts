import type { MeasurementDraft } from '../../domain/client-measurement';
import type { ProgressPose } from '../../domain/client-progress-photo';

const POSE_LABEL: Record<ProgressPose, string> = {
  back: 'espalda',
  front: 'frente',
  side: 'perfil',
};

export function progressPhotoNotice(pose: ProgressPose): string {
  return `He subido una foto de progreso (${POSE_LABEL[pose]}).`;
}

export function measurementNotice(input: MeasurementDraft): string {
  const parts = [
    metric(input.weightKg, 'peso', 'kg'),
    metric(input.waistCm, 'cintura', 'cm'),
    metric(input.hipCm, 'cadera', 'cm'),
    metric(input.heightCm, 'altura', 'cm'),
  ].filter((part): part is string => part !== null);
  return `He actualizado mis medidas: ${parts.join(', ')}.`;
}

function metric(value: number | null | undefined, label: string, unit: string): string | null {
  if (typeof value !== 'number') return null;
  return `${label} ${value.toLocaleString('es-ES', { maximumFractionDigits: 2 })} ${unit}`;
}
