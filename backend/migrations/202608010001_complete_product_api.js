const emotionSeed = [
  ['feliz', 'Feliz', 2, 1],
  ['triste', 'Triste', -2, 2],
  ['ansioso', 'Ansioso', -1, 3],
  ['motivado', 'Motivado', 2, 4],
  ['desanimado', 'Desanimado', -2, 5],
  ['estressado', 'Estressado', -1, 6],
  ['calmo', 'Calmo', 1, 7],
  ['outra', 'Outra', 0, 8],
];

async function addColumnIfMissing(knex, table, column, callback) {
  if (!(await knex.schema.hasColumn(table, column))) {
    await knex.schema.alterTable(table, callback);
  }
}

export async function up(knex) {
  await addColumnIfMissing(knex, 'users', 'plan_code', (table) => {
    table.enu('plan_code', ['free', 'premium']).notNullable().defaultTo('free').after('locale');
  });
  await addColumnIfMissing(knex, 'users', 'deleted_at', (table) => {
    table.dateTime('deleted_at', { precision: 3 }).nullable().after('last_login_at');
  });
  await addColumnIfMissing(knex, 'habits', 'category', (table) => {
    table.string('category', 80).nullable().after('description');
  });
  await addColumnIfMissing(knex, 'habits', 'reminder_time', (table) => {
    table.time('reminder_time').nullable().after('icon');
  });
  await addColumnIfMissing(knex, 'habit_checkins', 'duration_minutes', (table) => {
    table.integer('duration_minutes').unsigned().nullable().after('completed_at');
  });
  await addColumnIfMissing(knex, 'cognitive_journal_entries', 'body', (table) => {
    table.text('body').nullable().after('title');
  });
  await addColumnIfMissing(knex, 'cognitive_journal_entries', 'mood', (table) => {
    table.string('mood', 80).nullable().after('body');
  });
  await addColumnIfMissing(knex, 'cognitive_journal_entries', 'ai_analysis', (table) => {
    table.json('ai_analysis').nullable().after('outcome');
  });

  if (!(await knex.schema.hasTable('plans'))) {
    await knex.schema.createTable('plans', (table) => {
      table.bigIncrements('id').unsigned().primary();
      table.specificType('public_id', 'CHAR(36) CHARACTER SET ascii').notNullable();
      table.bigInteger('user_id').unsigned().notNullable();
      table.date('plan_date').notNullable();
      table.enu('status', ['draft', 'active', 'completed', 'archived']).notNullable().defaultTo('active');
      table.json('content_json').nullable();
      table.dateTime('created_at', { precision: 3 }).notNullable();
      table.dateTime('updated_at', { precision: 3 }).notNullable();
      table.unique(['public_id'], { indexName: 'uq_plans_public' });
      table.unique(['user_id', 'plan_date'], { indexName: 'uq_plans_user_date' });
      table.index(['user_id', 'status', 'plan_date'], 'ix_plans_user_status_date');
      table.foreign('user_id', 'fk_plans_user').references('users.id').onDelete('CASCADE');
    });
  }

  if (!(await knex.schema.hasTable('telemetry_snapshots'))) {
    await knex.schema.createTable('telemetry_snapshots', (table) => {
      table.bigIncrements('id').unsigned().primary();
      table.specificType('public_id', 'CHAR(36) CHARACTER SET ascii').notNullable();
      table.bigInteger('user_id').unsigned().notNullable();
      table.date('period_start').notNullable();
      table.date('period_end').notNullable();
      table.json('stats_json').notNullable();
      table.dateTime('created_at', { precision: 3 }).notNullable();
      table.dateTime('updated_at', { precision: 3 }).notNullable();
      table.unique(['public_id'], { indexName: 'uq_telemetry_public' });
      table.index(['user_id', 'period_start', 'period_end'], 'ix_telemetry_user_period');
      table.foreign('user_id', 'fk_telemetry_user').references('users.id').onDelete('CASCADE');
    });
  }

  const now = new Date();
  await knex('emotions')
    .insert(emotionSeed.map(([code, name, default_valence, display_order]) => ({
      code,
      name,
      default_valence,
      display_order,
      is_active: true,
      created_at: now,
      updated_at: now,
    })))
    .onConflict('code')
    .merge(['name', 'default_valence', 'display_order', 'is_active', 'updated_at']);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('telemetry_snapshots');
  await knex.schema.dropTableIfExists('plans');

  for (const [table, column] of [
    ['cognitive_journal_entries', 'ai_analysis'],
    ['cognitive_journal_entries', 'mood'],
    ['cognitive_journal_entries', 'body'],
    ['habit_checkins', 'duration_minutes'],
    ['habits', 'reminder_time'],
    ['habits', 'category'],
    ['users', 'deleted_at'],
    ['users', 'plan_code'],
  ]) {
    if (await knex.schema.hasColumn(table, column)) {
      await knex.schema.alterTable(table, (builder) => builder.dropColumn(column));
    }
  }
}
