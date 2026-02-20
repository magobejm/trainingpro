import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { readFrontEnv } from '../env';

type ExportReportPdfInput = {
  clientId: string;
  from: string;
  to: string;
};

export function useExportReportPdfMutation() {
  const auth = useAuth();
  return useMutation({
    mutationFn: (input: ExportReportPdfInput) => downloadReportPdf(auth, input),
  });
}

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) {
    return null;
  }
  return { accessToken, activeRole };
}

async function downloadReportPdf(
  auth: ReturnType<typeof useAuth>,
  input: ExportReportPdfInput,
): Promise<void> {
  if (!auth) {
    throw new Error('Missing authenticated context');
  }
  const query = new URLSearchParams({ clientId: input.clientId, from: input.from, to: input.to });
  const response = await fetch(`${resolveBaseUrl()}/reports/export/pdf?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Active-Role': auth.activeRole,
    },
    method: 'GET',
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  const blob = await response.blob();
  const fileName = resolveFileName(response.headers.get('content-disposition'));
  triggerDownload(blob, fileName);
}

function resolveBaseUrl(): string {
  const env = readFrontEnv();
  return env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
}

function resolveFileName(contentDisposition: null | string): string {
  if (!contentDisposition) {
    return 'weekly-report.pdf';
  }
  const match = /filename="?([^";]+)"?/.exec(contentDisposition);
  return match?.[1] ?? 'weekly-report.pdf';
}

function triggerDownload(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    return (await response.text()) || 'Unexpected API error';
  } catch {
    return 'Unexpected API error';
  }
}
