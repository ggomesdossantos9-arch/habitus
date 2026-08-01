import 'dotenv/config';

function connection() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  return {
    host: process.env.MYSQLHOST,
    port: Number(process.env.MYSQLPORT || 3306),
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
  };
}

const shared = {
  client: 'mysql2',
  connection: connection(),
  pool: { min: 2, max: 10, afterCreate(connection, done) { connection.query("SET time_zone = '+00:00'", (error) => done(error, connection)); } },
  migrations: { directory: './migrations', extension: 'js' },
};

export default { development: shared, test: shared, production: shared };
