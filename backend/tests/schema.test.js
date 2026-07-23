import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
const schema = fs.readFileSync(new URL('../../database/schema.sql', import.meta.url), 'utf8');
const initialMigration = fs.readFileSync(new URL('../../database/migrations/202606220001_initial_schema.sql', import.meta.url), 'utf8');
describe('schema MySQL', () => {
  it('declara as 14 tabelas arquitetadas', () => { const names = [...schema.matchAll(/CREATE TABLE (\w+)/g)].map((m) => m[1]); expect(names).toHaveLength(14); expect(names).toContain('users'); expect(names).toContain('ai_insights'); });
  it('usa InnoDB e utf8mb4 em todas as tabelas', () => expect((schema.match(/ENGINE=InnoDB DEFAULT CHARSET=utf8mb4/g) ?? [])).toHaveLength(14));
  it('mantém o snapshot equivalente ao SQL imutável da migration inicial', () => expect(schema.trim()).toBe(initialMigration.trim()));
  it('protege ownership, concorrência e proveniência das entidades sensíveis', () => {
    expect(schema).toContain('fk_checkin_schedule_habit_user');
    expect(schema).toContain('fk_event_checkin_user');
    expect(schema).toContain('UNIQUE KEY uq_event_primary');
    expect(schema).toContain('lock_version INT UNSIGNED');
    expect(schema).toContain('CONSTRAINT ck_insight_source');
  });
});
