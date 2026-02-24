import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { createApiClient } from '../../api-client';
import { useAuthStore } from '../../../store/auth.store';

export type TechniqueAnalysisResult = {
    ejercicio: string;
    fase_movimiento: string;
    analisis_puntos_clave: {
        espalda: string;
        rango_movimiento: string;
        alineacion_articulaciones: string;
    };
    errores_detectados: string[];
    correccion_inmediata: string;
    score_seguridad: number;
};

type AnalyzeTechniquePayload = {
    file: File;
    exerciseName?: string;
};

export function useAnalyzeTechniqueMutation(): UseMutationResult<
    TechniqueAnalysisResult,
    Error,
    AnalyzeTechniquePayload
> {
    const activeRole = useAuthStore((state) => state.activeRole);
    const accessToken = useAuthStore((state) => state.accessToken);

    return useMutation({
        mutationFn: async (payload: AnalyzeTechniquePayload) => {
            const formData = new FormData();
            formData.append('file', payload.file);

            if (payload.exerciseName) {
                formData.append('exerciseName', payload.exerciseName);
            }

            const client = createApiClient({
                accessToken: accessToken ?? undefined,
                activeRole: activeRole ?? 'client',
            });

            // We bypass the global JSON stringify by passing FormData
            return client.post<TechniqueAnalysisResult>('/ai-evaluator/analyze', formData);
        },
    });
}
