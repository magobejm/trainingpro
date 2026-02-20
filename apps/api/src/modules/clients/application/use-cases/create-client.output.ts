import type { Client } from '../../domain/client';

export type CreateClientOutput = {
  client: Client;
  credentials: {
    temporaryPassword: null | string;
    userCreated: boolean;
  };
};
