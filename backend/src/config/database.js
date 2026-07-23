import knex from 'knex';

export function createDatabase(env) {
  return knex({
    client: 'mysql2', connection: env.DATABASE_URL,
    pool: { min: 2, max: 10, afterCreate(connection, done) { connection.query("SET time_zone = '+00:00'", (error) => done(error, connection)); } },
  });
}
