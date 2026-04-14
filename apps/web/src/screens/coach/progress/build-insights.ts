import type { ExerciseProgressPoint } from '../../../data/hooks/useExerciseProgressQuery';
import type { AnalysisMode } from './progress-screen.types';

export type InsightItem = { emoji: string; color: string; text: string };

function buildExerciseInsights(exercisePoints: ExerciseProgressPoint[]): InsightItem[] {
  const insights: InsightItem[] = [];

  const firstTonnage = exercisePoints.slice(0, 3).reduce((s, p) => s + p.tonnage, 0) / 3;
  const lastTonnage = exercisePoints.slice(-3).reduce((s, p) => s + p.tonnage, 0) / 3;
  const tonPct = firstTonnage > 0 ? ((lastTonnage - firstTonnage) / firstTonnage) * 100 : 0;

  if (tonPct >= 5) {
    const pct = Math.round(tonPct);
    insights.push({
      emoji: '📈',
      color: '#10b981',
      text: `Tonelaje con tendencia ascendente: +${pct}% respecto al inicio del período.`,
    });
  } else if (tonPct <= -5) {
    const absPct = Math.abs(Math.round(tonPct));
    insights.push({
      emoji: '📉',
      color: '#ef4444',
      text: `El tonelaje ha bajado un ${absPct}%. Puede indicar fatiga acumulada o reducción de volumen.`,
    });
  } else {
    insights.push({
      emoji: '➡️',
      color: '#3b82f6',
      text: 'El tonelaje se mantiene estable en el período (variación <5%).',
    });
  }

  const withE1rm = exercisePoints.filter((p) => p.e1rm !== null);
  if (withE1rm.length >= 2) {
    const firstE1rm = withE1rm[0]?.e1rm ?? 0;
    const lastE1rm = withE1rm[withE1rm.length - 1]?.e1rm ?? 0;
    const e1rmPct = firstE1rm > 0 ? ((lastE1rm - firstE1rm) / firstE1rm) * 100 : 0;
    if (e1rmPct >= 3) {
      const r = Math.round(e1rmPct);
      const a = Math.round(firstE1rm);
      const b = Math.round(lastE1rm);
      insights.push({
        emoji: '💪',
        color: '#8b5cf6',
        text: `El 1RM estimado ha mejorado un ${r}%: de ${a}kg a ${b}kg.`,
      });
    } else if (e1rmPct < 0) {
      const a = Math.round(firstE1rm);
      const b = Math.round(lastE1rm);
      insights.push({
        emoji: '⚠️',
        color: '#f59e0b',
        text: `El 1RM estimado ha bajado (${a}kg → ${b}kg). Revisa la fatiga o la técnica.`,
      });
    }
  }

  const withRpe = exercisePoints.filter((p) => p.avgRpe !== null);
  if (withRpe.length >= 3) {
    const recentRpe = withRpe.slice(-3).reduce((s, p) => s + p.avgRpe!, 0) / 3;
    const rpeLabel = Math.round(recentRpe * 10) / 10;
    if (recentRpe > 8.5) {
      insights.push({
        emoji: '💡',
        color: '#f59e0b',
        text: `RPE medio reciente elevado (${rpeLabel}). Considera una semana de descarga.`,
      });
    } else if (recentRpe < 7) {
      insights.push({
        emoji: '💡',
        color: '#3b82f6',
        text: `RPE reciente bajo (${rpeLabel}). Hay margen para progresar en carga o volumen.`,
      });
    }
  }

  return insights;
}

type SessionPoint = { sessionTonnage: number; sessionRpe: number | null; effortIndex: number | null };

function buildSessionInsights(sessionPoints: SessionPoint[]): InsightItem[] {
  const insights: InsightItem[] = [];
  const firstTon = sessionPoints.slice(0, 3).reduce((s, p) => s + p.sessionTonnage, 0) / 3;
  const lastTon = sessionPoints.slice(-3).reduce((s, p) => s + p.sessionTonnage, 0) / 3;
  const tonPct = firstTon > 0 ? ((lastTon - firstTon) / firstTon) * 100 : 0;

  if (tonPct >= 5) {
    insights.push({
      emoji: '📈',
      color: '#10b981',
      text: `Tonelaje por sesión en aumento: +${Math.round(tonPct)}% respecto al inicio.`,
    });
  } else if (tonPct <= -5) {
    const absPct = Math.abs(Math.round(tonPct));
    insights.push({
      emoji: '📉',
      color: '#ef4444',
      text: `El tonelaje por sesión ha bajado un ${absPct}%.`,
    });
  }

  const withRpe = sessionPoints.filter((p) => p.sessionRpe !== null);
  if (withRpe.length >= 3) {
    const recentRpe = withRpe.slice(-3).reduce((s, p) => s + p.sessionRpe!, 0) / 3;
    const rpeLabel = Math.round(recentRpe * 10) / 10;
    if (recentRpe > 8.5) {
      insights.push({
        emoji: '💡',
        color: '#f59e0b',
        text: `RPE de sesión elevado en las últimas semanas (${rpeLabel}). Valora reducir la carga.`,
      });
    } else {
      insights.push({
        emoji: '✅',
        color: '#10b981',
        text: `RPE de sesión controlado (${rpeLabel}). La intensidad está en rango óptimo.`,
      });
    }
  }

  return insights;
}

type MicroPoint = { totalTonnage: number; avgRpe: number | null; sessionsCount: number };

function buildMicrocycleInsights(microPoints: MicroPoint[]): InsightItem[] {
  const insights: InsightItem[] = [];
  const avgSessions = microPoints.reduce((s, p) => s + p.sessionsCount, 0) / microPoints.length;
  const firstTon = microPoints.slice(0, 2).reduce((s, p) => s + p.totalTonnage, 0) / 2;
  const lastTon = microPoints.slice(-2).reduce((s, p) => s + p.totalTonnage, 0) / 2;
  const tonPct = firstTon > 0 ? ((lastTon - firstTon) / firstTon) * 100 : 0;

  const avgSessionsLabel = Math.round(avgSessions * 10) / 10;
  insights.push({
    emoji: '🗓️',
    color: '#3b82f6',
    text: `Promedio de ${avgSessionsLabel} sesiones por semana en el período analizado.`,
  });

  if (tonPct >= 5) {
    insights.push({
      emoji: '📈',
      color: '#10b981',
      text: `Tonelaje semanal en progresión: +${Math.round(tonPct)}% en las últimas semanas.`,
    });
  } else if (tonPct <= -10) {
    const absPct = Math.abs(Math.round(tonPct));
    insights.push({
      emoji: '📉',
      color: '#ef4444',
      text: `El volumen semanal ha caído un ${absPct}%. Revisa la adherencia o planifica recarga.`,
    });
  }

  return insights;
}

export function buildInsights(mode: AnalysisMode, points: Record<string, unknown>[]): InsightItem[] {
  if (points.length < 2) return [];
  if (mode === 'exercise') {
    return buildExerciseInsights(points as ExerciseProgressPoint[]);
  }
  if (mode === 'session') {
    return buildSessionInsights(points as SessionPoint[]);
  }
  return buildMicrocycleInsights(points as MicroPoint[]);
}
