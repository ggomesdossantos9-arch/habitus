import 'dotenv/config';

const shared = {
  client: 'mysql2',
  connection: process.env.DATABASE_URL,
  pool: { min: 2, max: 10, afterCreate(connection, done) { connection.query("SET time_zone = '+00:00'", (error) => done(error, connection)); } },
  migrations: { directory: '../database/migrations', extension: 'js' },
};

export default { development: shared, test: shared, production: shared };
