import knex from 'knex';

export function databaseConnection(env) {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  return {
    host: env.MYSQLHOST,
    port: env.MYSQLPORT || 3306,
    user: env.MYSQLUSER,
    password: env.MYSQLPASSWORD,
    database: env.MYSQLDATABASE,
  };
}

export function createDatabase(env) {
  return knex({
    client: 'mysql2', connection: databaseConnection(env),
    pool: { min: 2, max: 10, afterCreate(connection, done) { connection.query("SET time_zone = '+00:00'", (error) => done(error, connection)); } },
  });
}
