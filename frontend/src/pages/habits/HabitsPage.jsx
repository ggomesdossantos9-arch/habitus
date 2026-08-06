import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarBlank,
  CheckCircle,
  Circle,
  Clock,
  Coffee,
  Fire,
  Footprints,
  Heartbeat,
  Leaf,
  Moon,
  PencilSimple,
  Target,
  Trash,
  XCircle,
} from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { habitService } from '../../services/habitService.js';
import { emotionService } from '../../services/emotionService.js';
import { getProblemMessage } from '../../services/api.js';

const today = () => new Date().toISOString().slice(0, 10);
const initialValues = { name: '', description: '', category: '', color: '#2563eb', icon: 'check-circle', reminderTime: '', meta: 1, daysOfWeek: [] };
const initialCheckin = { date: today(), note: '', emotionCode: 'motivado', intensity: 3, resultingIntensity: 4, valence: 1, energy: 3 };
const weekdayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
const colors = ['#2563eb', '#0ea5e9', '#14b8a6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];
const iconOptions = [
  { value: 'check-circle', label: 'Check', Icon: CheckCircle },
  { value: 'footprints', label: 'Passos', Icon: Footprints },
  { value: 'heartbeat', label: 'Saude', Icon: Heartbeat },
  { value: 'book-open', label: 'Estudo', Icon: BookOpen },
  { value: 'moon', label: 'Sono', Icon: Moon },
  { value: 'leaf', label: 'Calma', Icon: Leaf },
  { value: 'fire', label: 'Foco', Icon: Fire },
  { value: 'coffee', label: 'Rotina', Icon: Coffee },
];

function HabitIcon({ icon, size = 24, weight = 'duotone' }) {
  const match = iconOptions.find((item) => item.value === icon) ?? iconOptions[0];
  const Icon = match.Icon;
  return <Icon size={size} weight={weight} aria-hidden="true" />;
}

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : '';
}

function addDays(date, amount) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + amount);
  return next.toISOString().slice(0, 10);
}

function formatDays(days = []) {
  return days.length ? days.map((day) => weekdayLabels[day - 1]).filter(Boolean).join(', ') : 'Todos os dias';
}

function checkinForDate(items = [], date = today()) {
  return items.find((item) => dateOnly(item.date) === date && item.status === 'completed') ?? null;
}

function streakFor(checkins = [], asOf = today()) {
  const completed = new Set(checkins.filter((item) => item.status === 'completed').map((item) => dateOnly(item.date)));
  let streak = 0;
  for (let date = asOf; completed.has(date); date = addDays(date, -1)) streak += 1;
  return streak;
}

function toFormValues(habit) {
  return {
    name: habit.name ?? '',
    description: habit.description ?? '',
    category: habit.category ?? '',
    color: habit.color ?? '#2563eb',
    icon: habit.icon ?? 'check-circle',
    reminderTime: habit.reminderTime ?? '',
    meta: habit.meta ?? habit.schedule?.targetValue ?? 1,
    daysOfWeek: habit.daysOfWeek ?? habit.schedule?.weekdays ?? [],
  };
}

export function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [editingHabit, setEditingHabit] = useState(null);
  const [activeHabit, setActiveHabit] = useState(null);
  const [checkins, setCheckins] = useState({});
  const [catalog, setCatalog] = useState([]);
  const [values, setValues] = useState(initialValues);
  const [checkin, setCheckin] = useState(initialCheckin);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyHabitId, setBusyHabitId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const descriptionCount = values.description.length;
  const activeCheckins = activeHabit ? checkins[activeHabit.id] ?? [] : [];

  const loadHabitCheckins = async (items) => {
    const entries = await Promise.all(items.map(async (habit) => {
      try {
        const data = await habitService.listCheckins(habit.id, { limit: 60 });
        return [habit.id, data];
      } catch {
        return [habit.id, []];
      }
    }));
    setCheckins(Object.fromEntries(entries));
  };

  const loadHabits = async () => {
    setLoading(true);
    try {
      const [habitData, emotions] = await Promise.all([habitService.list(), emotionService.catalog()]);
      setHabits(habitData);
      setCatalog(emotions);
      setActiveHabit((current) => current ? habitData.find((habit) => habit.id === current.id) ?? null : habitData[0] ?? null);
      await loadHabitCheckins(habitData);
      setError('');
    } catch (e) {
      setError(getProblemMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadHabits(); }, []);

  const clearForm = () => {
    setEditingHabit(null);
    setValues(initialValues);
  };

  const editHabit = (habit) => {
    setEditingHabit(habit);
    setActiveHabit(habit);
    setValues(toFormValues(habit));
  };

  const normalizedPayload = () => {
    const daysOfWeek = [...new Set(values.daysOfWeek.map(Number))]
      .filter((day) => Number.isInteger(day) && day >= 1 && day <= 7)
      .sort((a, b) => a - b);
    const meta = Number(values.meta);
    return {
      name: values.name.trim(),
      description: values.description.trim() || null,
      category: values.category.trim() || null,
      color: values.color || '#2563eb',
      icon: values.icon || 'check-circle',
      reminderTime: values.reminderTime || null,
      meta: Number.isFinite(meta) && meta > 0 ? meta : 1,
      daysOfWeek,
      status: editingHabit?.status ?? 'active',
    };
  };

  const validateForm = (body) => {
    if (!body.name) return 'Informe o nome do hábito.';
    if (!body.daysOfWeek.length) return 'Escolha pelo menos um dia da semana.';
    return '';
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    const body = normalizedPayload();
    const validationMessage = validateForm(body);
    setError('');
    setSuccess('');
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setSaving(true);
    try {
      const saved = editingHabit ? await habitService.update(editingHabit.id, body) : await habitService.create(body);
      setHabits((current) => editingHabit ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setActiveHabit(saved);
      setCheckins((current) => ({ ...current, [saved.id]: current[saved.id] ?? [] }));
      setSuccess(editingHabit ? 'Hábito atualizado com sucesso.' : 'Hábito criado com sucesso.');
      clearForm();
    } catch (e) {
      setError(getProblemMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (weekday) => {
    setValues((current) => ({
      ...current,
      daysOfWeek: current.daysOfWeek.includes(weekday) ? current.daysOfWeek.filter((item) => item !== weekday) : [...current.daysOfWeek, weekday].sort((a, b) => a - b),
    }));
  };

  const archive = async (habit) => {
    if (!confirm(`Excluir "${habit.name}"? O hábito será movido para inativo e poderá ser reativado depois.`)) return;
    setBusyHabitId(habit.id);
    setError('');
    setSuccess('');
    try {
      await habitService.remove(habit.id);
      const archived = { ...habit, status: 'archived' };
      setHabits((current) => current.map((item) => item.id === habit.id ? archived : item));
      setActiveHabit((current) => current?.id === habit.id ? archived : current);
      setSuccess('Hábito excluído da rotina ativa.');
    } catch (e) {
      setError(getProblemMessage(e));
    } finally {
      setBusyHabitId('');
    }
  };

  const restore = async (habit) => {
    setBusyHabitId(habit.id);
    setError('');
    setSuccess('');
    try {
      const restored = await habitService.restore(habit.id);
      setHabits((current) => current.map((item) => item.id === habit.id ? restored : item));
      setActiveHabit(restored);
      setSuccess('Hábito ativado.');
    } catch (e) {
      setError(getProblemMessage(e));
    } finally {
      setBusyHabitId('');
    }
  };

  const complete = async (habit) => {
    if (busyHabitId) return;
    setBusyHabitId(habit.id);
    setError('');
    setSuccess('');
    try {
      const event = {
        valence: Number(checkin.valence),
        energy: Number(checkin.energy),
        note: checkin.note.trim() || null,
        emotions: [{ code: checkin.emotionCode || 'outra', intensity: Number(checkin.intensity), resultingIntensity: Number(checkin.resultingIntensity), isPrimary: true }],
      };
      const saved = await habitService.upsertCheckin(habit.id, checkin.date || today(), { status: 'completed', note: checkin.note.trim() || null, emotion: event });
      setActiveHabit(habit);
      setCheckins((current) => ({ ...current, [habit.id]: [saved, ...(current[habit.id] ?? []).filter((item) => dateOnly(item.date) !== dateOnly(saved.date))] }));
      setSuccess('Conclusão registrada.');
    } catch (e) {
      setError(getProblemMessage(e));
    } finally {
      setBusyHabitId('');
    }
  };

  const undo = async (habit, date) => {
    setBusyHabitId(habit.id);
    setError('');
    setSuccess('');
    try {
      await habitService.deleteCheckin(habit.id, date);
      setCheckins((current) => ({ ...current, [habit.id]: (current[habit.id] ?? []).filter((item) => dateOnly(item.date) !== dateOnly(date)) }));
      setSuccess('Conclusão desfeita.');
    } catch (e) {
      setError(getProblemMessage(e));
    } finally {
      setBusyHabitId('');
    }
  };

  const dailyCards = useMemo(() => habits.map((habit) => {
    const items = checkins[habit.id] ?? [];
    const completed = checkinForDate(items, checkin.date || today());
    return { habit, completed, streak: streakFor(items, checkin.date || today()) };
  }), [habits, checkins, checkin.date]);

  return (
    <div className="page habits-page">
      <header className="page-heading">
        <p className="eyebrow">Hábitos</p>
        <h1>Crie e acompanhe sua rotina</h1>
        <p>Gerencie hábitos reais da sua conta, registre conclusões diárias e acompanhe suas sequências.</p>
      </header>

      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" onDismiss={() => setSuccess('')}>{success}</Alert>}

      <div className="split-grid habits-layout">
        <Card className="panel habit-form-panel">
          <div className="panel-title-row">
            <div>
              <p className="eyebrow">Novo hábito</p>
              <h2>{editingHabit ? 'Editar hábito' : 'Configurar hábito'}</h2>
            </div>
            {editingHabit && <Button type="button" variant="secondary" className="button--compact" onClick={clearForm}>Cancelar</Button>}
          </div>

          <form onSubmit={submit} className="stack habit-form" noValidate>
            <section className="form-section">
              <h3>Informações principais</h3>
              <Input label="Nome *" value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Caminhada matinal" required />
              <label className="field">
                <span>Descrição</span>
                <textarea value={values.description} maxLength="240" rows="4" onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} placeholder="Ex.: 20 minutos no parque antes do trabalho" />
                <span className="field__hint">{descriptionCount}/240 caracteres. Use para registrar contexto, motivação ou uma regra simples.</span>
              </label>
              <Input label="Categoria" value={values.category} onChange={(event) => setValues((current) => ({ ...current, category: event.target.value }))} placeholder="Saúde, estudos, foco..." />
            </section>

            <section className="form-section">
              <h3>Personalização</h3>
              <div className="field">
                <label>Cor</label>
                <div className="color-picker">
                  {colors.map((color) => (
                    <button className={`color-swatch ${values.color === color ? 'active' : ''}`} style={{ '--swatch': color }} key={color} type="button" onClick={() => setValues((current) => ({ ...current, color }))} aria-label={`Selecionar cor ${color}`} />
                  ))}
                  <Input label="Cor personalizada" type="color" value={values.color} onChange={(event) => setValues((current) => ({ ...current, color: event.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label>Ícone</label>
                <div className="icon-picker">
                  {iconOptions.map(({ value, label, Icon }) => (
                    <button className={`icon-choice ${values.icon === value ? 'active' : ''}`} key={value} type="button" onClick={() => setValues((current) => ({ ...current, icon: value }))} aria-label={`Selecionar ícone ${label}`} title={label}>
                      <Icon size={24} weight="duotone" aria-hidden="true" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="form-section">
              <h3>Frequência</h3>
              <div className="field">
                <label>Dias da semana *</label>
                <div className="weekday-grid">
                  {weekdayLabels.map((label, index) => {
                    const weekday = index + 1;
                    const active = values.daysOfWeek.includes(weekday);
                    return <button className={`day-button ${active ? 'active' : ''}`} key={label} type="button" onClick={() => toggleDay(weekday)} aria-pressed={active}>{label}</button>;
                  })}
                </div>
              </div>
              <div className="form-row">
                <Input label="Horário" type="time" value={values.reminderTime} onChange={(event) => setValues((current) => ({ ...current, reminderTime: event.target.value }))} hint="Opcional. Se ficar vazio, enviaremos nulo." />
                <Input label="Meta diária" type="number" min="1" step="1" value={values.meta} onChange={(event) => setValues((current) => ({ ...current, meta: event.target.value }))} placeholder="1" />
              </div>
            </section>

            <div className="action-row form-actions">
              <Button type="submit" isLoading={saving} disabled={saving}>{saving ? 'Salvando...' : editingHabit ? 'Salvar alterações' : 'Salvar hábito'}</Button>
            </div>
          </form>
        </Card>

        <Card className="panel daily-panel">
          <div className="panel-title-row">
            <div>
              <p className="eyebrow">Registro diário</p>
              <h2>{activeHabit ? activeHabit.name : 'Hábitos de hoje'}</h2>
            </div>
            <Input className="daily-date" label="Data" type="date" value={checkin.date} onChange={(event) => setCheckin((current) => ({ ...current, date: event.target.value }))} />
          </div>

          {activeHabit && (
            <div className="checkin-editor">
              <label className="field">
                <span>Observação</span>
                <textarea rows="3" value={checkin.note} onChange={(event) => setCheckin((current) => ({ ...current, note: event.target.value }))} placeholder="Ex.: concluído com mais energia que ontem" />
              </label>
              <div className="form-row">
                <label className="field">Emoção
                  <select value={checkin.emotionCode} onChange={(event) => setCheckin((current) => ({ ...current, emotionCode: event.target.value }))}>
                    {catalog.map((emotion) => <option key={emotion.code} value={emotion.code}>{emotion.name}</option>)}
                  </select>
                </label>
                <Input label="Intensidade" type="number" min="1" max="5" value={checkin.intensity} onChange={(event) => setCheckin((current) => ({ ...current, intensity: event.target.value }))} />
              </div>
            </div>
          )}

          {loading ? (
            <div className="empty-state empty-state--compact"><h2>Carregando hábitos...</h2></div>
          ) : habits.length === 0 ? (
            <div className="empty-state empty-state--compact">
              <Circle size={44} weight="duotone" />
              <h2>Nenhum hábito ainda</h2>
              <p>Crie o primeiro hábito para o registro diário aparecer aqui.</p>
            </div>
          ) : (
            <div className="habit-card-list">
              {dailyCards.map(({ habit, completed, streak }) => {
                const inactive = habit.status !== 'active';
                const selected = activeHabit?.id === habit.id;
                const state = inactive ? 'inactive' : completed ? 'completed' : 'pending';
                return (
                  <article className={`habit-card habit-card--${state} ${selected ? 'selected' : ''}`} key={habit.id} style={{ '--habit-color': habit.color ?? '#2563eb' }}>
                    <button type="button" className="habit-card__main" onClick={() => setActiveHabit(habit)}>
                      <span className="habit-card__icon"><HabitIcon icon={habit.icon} /></span>
                      <span>
                        <strong>{habit.name}</strong>
                        <small>{habit.category || 'Geral'} • {formatDays(habit.daysOfWeek)}</small>
                      </span>
                    </button>
                    <div className="habit-card__meta">
                      <span><Clock size={16} />{habit.reminderTime || 'Sem horário'}</span>
                      <span><Target size={16} />Meta {habit.meta ?? 1}</span>
                      <span><CalendarBlank size={16} />{streak} dia{streak === 1 ? '' : 's'}</span>
                      <span className={`status-pill status-pill--${state}`}>{inactive ? 'Inativo' : completed ? 'Concluído' : 'Pendente'}</span>
                    </div>
                    <div className="habit-card__actions">
                      {completed ? (
                        <Button type="button" variant="secondary" className="button--compact" isLoading={busyHabitId === habit.id} onClick={() => undo(habit, checkin.date || today())}><XCircle size={18} />Desfazer</Button>
                      ) : (
                        <Button type="button" className="button--compact" disabled={inactive} isLoading={busyHabitId === habit.id} onClick={() => complete(habit)}><CheckCircle size={18} />Concluir</Button>
                      )}
                      <Button type="button" variant="secondary" className="button--icon" onClick={() => editHabit(habit)} aria-label={`Editar ${habit.name}`} title="Editar"><PencilSimple size={18} /></Button>
                      {inactive ? (
                        <Button type="button" variant="secondary" className="button--compact" isLoading={busyHabitId === habit.id} onClick={() => restore(habit)}>Ativar</Button>
                      ) : (
                        <Button type="button" variant="secondary" className="button--icon button--danger" isLoading={busyHabitId === habit.id} onClick={() => archive(habit)} aria-label={`Excluir ${habit.name}`} title="Excluir"><Trash size={18} /></Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {activeHabit && activeCheckins.length > 0 && (
            <div className="recent-checkins">
              <h3>Últimos registros</h3>
              {activeCheckins.slice(0, 5).map((item) => (
                <div className="checkin-row" key={item.id}>
                  <span>{dateOnly(item.date)}: {item.status === 'completed' ? 'concluído' : item.status}</span>
                  <button type="button" onClick={() => undo(activeHabit, item.date)}>Desfazer</button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
