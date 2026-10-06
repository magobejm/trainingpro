import type { NextFunction, Request, Response } from 'express';
import { blockPrivateUploadPaths } from '../../src/modules/files/presentation/block-private-uploads';

describe('blockPrivateUploadPaths', () => {
  it('hides private prefixes and lets catalog uploads through', () => {
    const next = jest.fn();
    const blocked = createResponse();
    blockPrivateUploadPaths(request('/clients/avatars/a.jpg'), blocked.response, next);
    expect(blocked.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();

    const allowed = jest.fn();
    blockPrivateUploadPaths(request('/library/images/coach/a.jpg'), createResponse().response, allowed as NextFunction);
    expect(allowed).toHaveBeenCalled();
  });
});

function request(path: string): Request {
  return { path } as Request;
}

function createResponse(): { response: Response; status: jest.Mock } {
  const status = jest.fn().mockReturnThis();
  const end = jest.fn();
  return { response: { end, status } as unknown as Response, status };
}
