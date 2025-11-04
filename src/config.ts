process.loadEnvFile();

type APIConfig = {
  fileServerHits: number;
  dbURL: string;
};

if (!process.env.DB_URL) {
  throw new Error('DB_URL environment variable is not set');
}

export const config: APIConfig = {
  fileServerHits: 0,
  dbURL: process.env.DB_URL,
};
