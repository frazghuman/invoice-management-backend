import { MongoClient } from 'mongodb';

export const databaseProvider = {
  provide: 'DATABASE_CONNECTION',
  useFactory: async (): Promise<MongoClient> => {
    const uri = 'mongodb://0.0.0.0:27017/invoice-management';
    const client = new MongoClient(uri);
    await client.connect();
    return client;
  },
};
