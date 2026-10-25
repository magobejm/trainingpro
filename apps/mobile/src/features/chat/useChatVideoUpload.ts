import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { postChatUpload, useClientThreadQuery } from '../../data/hooks/useChat';
import { useAuthStore } from '../../store/auth.store';
import { acceptChatFile } from './chat-attachment.utils';
import { captureVideo, type PickedVideo } from './video-capture';
import type { AttachmentDraft } from './AttachmentsPicker';

export type PickedChatVideo = { draft: AttachmentDraft; localUri: string };
export type VideoUploadError = 'denied' | 'invalid' | 'upload';

/** Records/picks a short set video and uploads it to the client's chat thread, ready to be sent with a message. */
export function useChatVideoUpload() {
  const threadQuery = useClientThreadQuery();
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const [pending, setPending] = useState(false);
  const threadId = threadQuery.data?.id ?? '';
  const ready = Boolean(threadId && accessToken && activeRole);

  const pick = useCallback(
    async (source: 'camera' | 'library'): Promise<{ error: VideoUploadError | null; video: PickedChatVideo | null }> => {
      if (!ready || !accessToken || !activeRole) return { error: 'upload', video: null };
      setPending(true);
      try {
        const video = await captureVideo(source);
        if (!video) return { error: null, video: null };
        return await upload(video, { accessToken, activeRole, threadId });
      } catch {
        return { error: 'upload', video: null };
      } finally {
        setPending(false);
      }
    },
    [accessToken, activeRole, ready, threadId],
  );
  return { pending, pick, ready };
}

async function upload(
  video: PickedVideo,
  auth: { accessToken: string; activeRole: 'admin' | 'client' | 'coach'; threadId: string },
): Promise<{ error: VideoUploadError | null; video: PickedChatVideo | null }> {
  if (!acceptChatFile({ mimeType: video.mimeType, name: video.fileName, sizeBytes: video.sizeBytes })) {
    return { error: 'invalid', video: null };
  }
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(video.uri)).blob();
    form.append('file', new Blob([blob], { type: video.mimeType }), video.fileName);
  } else {
    form.append('file', { name: video.fileName, type: video.mimeType, uri: video.uri } as unknown as Blob);
  }
  form.append('threadId', auth.threadId);
  const draft = await postChatUpload({ accessToken: auth.accessToken, activeRole: auth.activeRole }, auth.threadId, form);
  return { error: null, video: { draft, localUri: video.uri } };
}
