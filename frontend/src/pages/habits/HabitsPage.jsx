import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { habitService } from '../../services/habitService.js';
import { getProblemMessage } from '../../services/api.js';

const initialValues = {
  name: '',
  description: '',
  category: '',
  color: '#4f46e5',
  icon: 'check-circle',
  reminderTime: '',
  meta: 1,
  daysOfWeek: [],
};

export function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [values, setValues] = useState(initialValues);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const data = await habitService.list();
      setHabits(data);
      setError('');
    } catch (e) {
      setError(getProblemMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHabits();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = {
        name: values.name.trim(),
        description: values.description.trim() || null,
        category: values.category.trim() || null,
        color: values.color,
        icon: values.icon || 'check-circle',
        reminderTime: values.reminderTime || null,
        meta: Number(values.meta || 1),
        daysOfWeek: values.daysOfWeek,
      };
      const created = await habitService.create(payload);
      setHabits((current) => [created, ...current]);
      setValues(initialValues);
      setSuccess(`Hábito criado: ${created.name}`);
    } catch (e) {
      setError(getProblemMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const weekdayLabels = useMemo(() => ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'], []);

  const toggleDay = (weekday) => {
    setValues((current) => ({
      ...current,
      daysOfWeek: current.daysOfWeek.includes(weekday)
        ? current.daysOfWeek.filter((item) => item !== weekday)
        : [...current.daysOfWeek, weekday],
    }));
  };

  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">Hábitos</p>
        <h1>Crie e acompanhe sua rotina</h1>
        <p>Adicione hábitos com metas e um ritmo semanal real, tudo vinculado à sua conta.</p>
      </header>
      {error && <Alert>{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>Novo hábito</h2>
        <form onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
          <Input label="Nome" value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Caminhada matinal" required />
          <Input label="Descrição" value={values.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} placeholder="Opcional" />
          <Input label="Categoria" value={values.category} onChange={(event) => setValues((current) => ({ ...current, category: event.target.value }))} placeholder="Saúde, estudos..." />
          <div className="field">
            <label>Repetição semanal</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {weekdayLabels.map((label, index) => {
                const weekday = index + 1;
                const active = values.daysOfWeek.includes(weekday);
                return (
                  <button key={label} type="button" onClick={() => toggleDay(weekday)} style={{ border: active ? '1px solid var(--primary)' : '1px solid var(--border)', background: active ? 'rgba(37,99,235,.1)' : 'var(--surface)', color: active ? 'var(--primary)' : 'var(--text)', borderRadius: 999, padding: '8px 12px', cursor: 'pointer' }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <Input label="Meta diária" type="number" min="1" value={values.meta} onChange={(event) => setValues((current) => ({ ...current, meta: event.target.value }))} />
          <Input label="Horário" type="time" value={values.reminderTime} onChange={(event) => setValues((current) => ({ ...current, reminderTime: event.target.value }))} />
          <Button type="submit" isLoading={saving}>Salvar hábito</Button>
        </form>
      </div>
      {loading ? (
        <Card className="empty-state"><h2>Carregando hábitos...</h2></Card>
      ) : habits.length === 0 ? (
        <Card className="empty-state">
          <h2>Nenhum hábito ainda</h2>
          <p>Comece criando um hábito para transformar sua rotina.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {habits.map((habit) => (
            <Card key={habit.id} style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{habit.name}</h3>
                  <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>{habit.description || 'Sem descrição'}</p>
                </div>
                <span style={{ borderRadius: 999, padding: '8px 12px', background: 'rgba(37,99,235,.08)', color: 'var(--primary)', fontWeight: 700 }}>{habit.category || 'Geral'}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
                <span style={{ borderRadius: 999, padding: '6px 10px', background: 'var(--background)' }}>Meta: {habit.meta ?? 1}</span>
                <span style={{ borderRadius: 999, padding: '6px 10px', background: 'var(--background)' }}>Dias: {habit.daysOfWeek?.length ? habit.daysOfWeek.join(', ') : 'Todos'}</span>
                {habit.reminderTime ? <span style={{ borderRadius: 999, padding: '6px 10px', background: 'var(--background)' }}>Horário: {habit.reminderTime}</span> : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

