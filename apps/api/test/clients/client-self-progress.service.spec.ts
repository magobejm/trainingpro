import { Logger } from '@nestjs/common';
import { ClientSelfProgressService } from '../../src/modules/clients/application/services/client-self-progress.service';
import { RecordClientMeasurementDto } from '../../src/modules/clients/presentation/dto/record-client-measurement.dto';

const chat = { resolveThread: jest.fn(), sendMessage: jest.fn() };
const getMe = { execute: jest.fn() };
const upload = { execute: jest.fn() };
const createdRow = {
  clientId: 'c1',
  createdAt: new Date('2026-10-24T10:00:00.000Z'),
  heightCm: null,
  hipCm: null,
  id: 'm1',
  recordedBy: 'client',
  waistCm: null,
  weightKg: { toNumber: () => 72.5 },
};
const tx = {
  client: { update: jest.fn() },
  clientMeasurement: { create: jest.fn() },
};
const prisma = {
  $transaction: jest.fn(async (run: (input: typeof tx) => Promise<unknown>) => run(tx)),
  clientMeasurement: { findMany: jest.fn() },
};

function service(): ClientSelfProgressService {
  return new ClientSelfProgressService(chat as never, getMe as never, prisma as never, upload as never);
}

beforeEach(() => {
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  chat.resolveThread.mockReset();
  chat.sendMessage.mockReset();
  getMe.execute.mockReset();
  upload.execute.mockReset();
  tx.client.update.mockReset();
  tx.clientMeasurement.create.mockReset();
  getMe.execute.mockResolvedValue({ id: 'c1' });
  chat.resolveThread.mockResolvedValue({ id: 'thread-1' });
  chat.sendMessage.mockResolvedValue({ id: 'message-1' });
  tx.clientMeasurement.create.mockResolvedValue(createdRow);
  tx.client.update.mockResolvedValue({ id: 'c1' });
});

it('rejects a measurement without a numeric value', () => {
  const parsed = RecordClientMeasurementDto.schema.safeParse({ weightKg: null });
  expect(parsed.success).toBe(false);
});

it('saves a measurement and tells the coach', async () => {
  const result = await service().recordMeasurement(
    { activeRole: 'client', roles: ['client'], subject: 'u1' },
    {
      weightKg: 72.5,
    },
  );

  expect(tx.client.update).toHaveBeenCalledWith({ data: { weightKg: 72.5 }, where: { id: 'c1' } });
  expect(result.weightKg).toBe(72.5);
  expect(chat.sendMessage).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ text: 'He actualizado mis medidas: peso 72,5 kg.', threadId: 'thread-1' }),
  );
});

it('keeps the measurement when the coach notice fails', async () => {
  chat.resolveThread.mockRejectedValue(new Error('chat down'));

  const result = await service().recordMeasurement(
    { activeRole: 'client', roles: ['client'], subject: 'u1' },
    {
      waistCm: 80.4,
    },
  );

  expect(result.id).toBe('m1');
  expect(tx.client.update).toHaveBeenCalledWith({ data: { waistCm: 80 }, where: { id: 'c1' } });
  expect(Logger.prototype.error).toHaveBeenCalled();
});

it('uploads a posed photo and tells the coach', async () => {
  const photo = { id: 'p1' };
  upload.execute.mockResolvedValue(photo);
  const file = { buffer: Buffer.from('a'), mimetype: 'image/jpeg', originalname: 'side.jpg', size: 10 };

  const result = await service().uploadPhoto({ activeRole: 'client', roles: ['client'], subject: 'u1' }, file, 'side');

  expect(upload.execute).toHaveBeenCalledWith(expect.anything(), 'c1', file, { pose: 'side', uploadedBy: 'client' });
  expect(chat.sendMessage).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ text: 'He subido una foto de progreso (perfil).' }),
  );
  expect(result).toBe(photo);
});
