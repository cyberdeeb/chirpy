import { MigrationConfig } from 'drizzle-orm/migrator';

process.loadEnvFile();

type Config = {
  api: APIConfig;
  db: DBConfig;
};

type DBConfig = {
  dbURL: string;
  migrationConfig: MigrationConfig;
};

type APIConfig = {
  fileServerHits: number;
  port: number;
  platform: string;
};

const migrationConfig: MigrationConfig = {
  migrationsFolder: 'src/db/generated',
};

if (!process.env.DB_URL) {
  throw new Error('DB_URL environment variable is not set');
}

export const config: Config = {
  api: {
    fileServerHits: 0,
    port: Number(process.env.PORT),
    platform: process.env.PLATFORM || 'development',
  },
  db: {
    dbURL: process.env.DB_URL,
    migrationConfig: migrationConfig,
  },
};
