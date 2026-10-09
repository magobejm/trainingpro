import { DispatchNotificationsUseCase } from './use-cases/dispatch-notifications.usecase';

export async function dispatchNotificationsQuietly(dispatch: DispatchNotificationsUseCase): Promise<void> {
  try {
    await dispatch.execute();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown';
    console.error(`[notifications] immediate dispatch failed: ${message}`);
  }
}
