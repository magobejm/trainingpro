import { discardStartedSession, type DiscardSessionClient } from '../session-discard.client';

describe('discardStartedSession', () => {
  it('stops before calling the API when the device is offline', async () => {
    const client = fakeClient(false);
    await expect(discardStartedSession('session-1', client)).rejects.toThrow('offline');
    expect(client.postDiscard).not.toHaveBeenCalled();
    expect(client.removeDraft).not.toHaveBeenCalled();
  });

  it('keeps the local draft when the request fails', async () => {
    const client = fakeClient(true);
    client.postDiscard.mockRejectedValue(new Error('network'));
    await expect(discardStartedSession('session-1', client)).rejects.toThrow('network');
    expect(client.removeDraft).not.toHaveBeenCalled();
    expect(client.invalidate).not.toHaveBeenCalled();
  });

  it('removes the draft and refreshes the day only after the server accepts the discard', async () => {
    const client = fakeClient(true);
    await discardStartedSession('session-1', client);
    expect(client.postDiscard).toHaveBeenCalledWith('session-1');
    expect(client.removeDraft).toHaveBeenCalledWith('session-1');
    expect(client.invalidate).toHaveBeenCalledWith('session-1');
  });
});

function fakeClient(online: boolean): DiscardSessionClient & {
  invalidate: jest.Mock;
  postDiscard: jest.Mock;
  removeDraft: jest.Mock;
} {
  return {
    invalidate: jest.fn().mockResolvedValue(undefined),
    isOnline: () => online,
    postDiscard: jest.fn().mockResolvedValue(undefined),
    removeDraft: jest.fn().mockResolvedValue(undefined),
  };
}
