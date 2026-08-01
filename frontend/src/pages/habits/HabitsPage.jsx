import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { habitService } from '../../services/habitService.js';
import { emotionService } from '../../services/emotionService.js';
import { getProblemMessage } from '../../services/api.js';

const today = () => new Date().toISOString().slice(0, 10);
const initialValues = { name: '', description: '', category: '', color: '#4f46e5', icon: 'check-circle', reminderTime: '', meta: 1, daysOfWeek: [] };
const initialCheckin = { date: today(), note: '', emotionCode: 'motivado', intensity: 3, resultingIntensity: 4, valence: 1, energy: 3 };

export function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [selected, setSelected] = useState(null);
  const [checkins, setCheckins] = useState({});
  const [catalog, setCatalog] = useState([]);
  const [values, setValues] = useState(initialValues);
  const [checkin, setCheckin] = useState(initialCheckin);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const weekdayLabels = useMemo(() => ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'], []);

  const loadHabits = async () => {
    setLoading(true);
    try {
      const [habitData, emotions] = await Promise.all([habitService.list(), emotionService.catalog()]);
      setHabits(habitData);
      setCatalog(emotions);
      setError('');
    } catch (e) {
      setError(getProblemMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadHabits(); }, []);

  const selectHabit = async (habit) => {
    setSelected(habit);
    setValues({
      name: habit.name,
      description: habit.description ?? '',
      category: habit.category ?? '',
      color: habit.color ?? '#4f46e5',
      icon: habit.icon ?? 'check-circle',
      reminderTime: habit.reminderTime ?? '',
      meta: habit.meta ?? 1,
      daysOfWeek: habit.daysOfWeek ?? [],
    });
    try {
      const data = await habitService.listCheckins(habit.id);
      setCheckins((current) => ({ ...current, [habit.id]: data }));
    } catch (e) {
      setError(getProblemMessage(e));
    }
  };

  const clearForm = () => {
    setSelected(null);
    setValues(initialValues);
    setCheckin(initialCheckin);
  };

  const payload = () => ({
    name: values.name.trim(),
    description: values.description.trim() || null,
    category: values.category.trim() || null,
    color: values.color,
    icon: values.icon || 'check-circle',
    reminderTime: values.reminderTime || null,
    meta: Number(values.meta || 1),
    daysOfWeek: values.daysOfWeek,
  });

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const saved = selected ? await habitService.update(selected.id, payload()) : await habitService.create(payload());
      setHabits((current) => selected ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setSuccess(selected ? 'Habito atualizado.' : `Habito criado: ${saved.name}`);
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
    if (!confirm(`Arquivar "${habit.name}"?`)) return;
    try {
      await habitService.remove(habit.id);
      setHabits((current) => current.map((item) => item.id === habit.id ? { ...item, status: 'archived' } : item));
      setSuccess('Habito arquivado.');
    } catch (e) {
      setError(getProblemMessage(e));
    }
  };

  const restore = async (habit) => {
    try {
      const restored = await habitService.restore(habit.id);
      setHabits((current) => current.map((item) => item.id === habit.id ? restored : item));
      setSuccess('Habito ativado.');
    } catch (e) {
      setError(getProblemMessage(e));
    }
  };

  const complete = async (habit) => {
    try {
      const event = {
        valence: Number(checkin.valence),
        energy: Number(checkin.energy),
        note: checkin.note || null,
        emotions: [{ code: checkin.emotionCode || 'outra', intensity: Number(checkin.intensity), resultingIntensity: Number(checkin.resultingIntensity), isPrimary: true }],
      };
      const saved = await habitService.upsertCheckin(habit.id, checkin.date || today(), { status: 'completed', note: checkin.note || null, emotion: event });
      setCheckins((current) => ({ ...current, [habit.id]: [saved, ...(current[habit.id] ?? []).filter((item) => item.date !== saved.date)] }));
      setSuccess('Conclusao registrada.');
    } catch (e) {
      setError(getProblemMessage(e));
    }
  };

  const undo = async (habit, date) => {
    try {
      await habitService.deleteCheckin(habit.id, date);
      setCheckins((current) => ({ ...current, [habit.id]: (current[habit.id] ?? []).filter((item) => item.date !== date) }));
      setSuccess('Conclusao desfeita.');
    } catch (e) {
      setError(getProblemMessage(e));
    }
  };

  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">Habitos</p>
        <h1>Crie e acompanhe sua rotina</h1>
        <p>Gerencie habitos reais da sua conta, registre conclusoes diarias e acompanhe suas sequencias.</p>
      </header>
      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" onDismiss={() => setSuccess('')}>{success}</Alert>}
      <div className="split-grid">
        <Card className="panel">
          <h2>{selected ? 'Editar habito' : 'Novo habito'}</h2>
          <form onSubmit={submit} className="stack">
            <Input label="Nome" value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Caminhada matinal" required />
            <Input label="Descricao" value={values.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} placeholder="Opcional" />
            <Input label="Categoria" value={values.category} onChange={(event) => setValues((current) => ({ ...current, category: event.target.value }))} placeholder="Saude, estudos..." />
            <div className="form-row">
              <Input label="Cor" type="color" value={values.color} onChange={(event) => setValues((current) => ({ ...current, color: event.target.value }))} />
              <Input label="Icone" value={values.icon} onChange={(event) => setValues((current) => ({ ...current, icon: event.target.value }))} />
            </div>
            <div className="field">
              <label>Repeticao semanal</label>
              <div className="chip-row">
                {weekdayLabels.map((label, index) => {
                  const weekday = index + 1;
                  const active = values.daysOfWeek.includes(weekday);
                  return <button className={`chip ${active ? 'active' : ''}`} key={label} type="button" onClick={() => toggleDay(weekday)}>{label}</button>;
                })}
              </div>
            </div>
            <div className="form-row">
              <Input label="Meta diaria" type="number" min="1" value={values.meta} onChange={(event) => setValues((current) => ({ ...current, meta: event.target.value }))} />
              <Input label="Horario" type="time" value={values.reminderTime} onChange={(event) => setValues((current) => ({ ...current, reminderTime: event.target.value }))} />
            </div>
            <div className="action-row">
              <Button type="submit" isLoading={saving}>{selected ? 'Salvar alteracoes' : 'Salvar habito'}</Button>
              {selected && <Button type="button" variant="secondary" onClick={clearForm}>Cancelar</Button>}
            </div>
          </form>
        </Card>
        <Card className="panel">
          <h2>Registro diario</h2>
          {selected ? (
            <div className="stack">
              <p className="muted">Habito selecionado: <strong>{selected.name}</strong></p>
              <Input label="Data" type="date" value={checkin.date} onChange={(event) => setCheckin((current) => ({ ...current, date: event.target.value }))} />
              <Input label="Observacao" value={checkin.note} onChange={(event) => setCheckin((current) => ({ ...current, note: event.target.value }))} />
              <div className="form-row">
                <label className="field">Emocao<select value={checkin.emotionCode} onChange={(event) => setCheckin((current) => ({ ...current, emotionCode: event.target.value }))}>{catalog.map((emotion) => <option key={emotion.code} value={emotion.code}>{emotion.name}</option>)}</select></label>
                <Input label="Intensidade" type="number" min="1" max="5" value={checkin.intensity} onChange={(event) => setCheckin((current) => ({ ...current, intensity: event.target.value }))} />
              </div>
              <div className="form-row">
                <Input label="Valencia" type="number" min="-2" max="2" value={checkin.valence} onChange={(event) => setCheckin((current) => ({ ...current, valence: event.target.value }))} />
                <Input label="Energia" type="number" min="1" max="5" value={checkin.energy} onChange={(event) => setCheckin((current) => ({ ...current, energy: event.target.value }))} />
              </div>
              <Button type="button" onClick={() => complete(selected)}>Marcar como concluido</Button>
            </div>
          ) : <p className="muted">Selecione um habito para registrar ou desfazer uma conclusao.</p>}
        </Card>
      </div>
      {loading ? (
        <Card className="empty-state"><h2>Carregando habitos...</h2></Card>
      ) : habits.length === 0 ? (
        <Card className="empty-state"><h2>Nenhum habito ainda</h2><p>Comece criando um habito para transformar sua rotina.</p></Card>
      ) : (
        <div className="item-list">
          {habits.map((habit) => (
            <Card key={habit.id} className="panel">
              <div className="item-heading">
                <div>
                  <h3>{habit.name}</h3>
                  <p>{habit.description || 'Sem descricao'}</p>
                </div>
                <span className="status-pill">{habit.status === 'active' ? 'Ativo' : 'Arquivado'}</span>
              </div>
              <div className="meta-row">
                <span>{habit.category || 'Geral'}</span>
                <span>Meta: {habit.meta ?? 1}</span>
                <span>Dias: {habit.daysOfWeek?.length ? habit.daysOfWeek.join(', ') : 'Todos'}</span>
                {habit.reminderTime && <span>Horario: {habit.reminderTime}</span>}
              </div>
              <div className="action-row">
                <Button type="button" variant="secondary" onClick={() => selectHabit(habit)}>Visualizar/editar</Button>
                {habit.status === 'active' ? <Button type="button" variant="secondary" onClick={() => archive(habit)}>Desativar</Button> : <Button type="button" variant="secondary" onClick={() => restore(habit)}>Ativar</Button>}
              </div>
              {(checkins[habit.id] ?? []).slice(0, 5).map((item) => (
                <div className="checkin-row" key={item.id}>
                  <span>{item.date}: {item.status} {item.emotion?.emotions?.[0]?.name ? `- ${item.emotion.emotions[0].name}` : ''}</span>
                  <button type="button" onClick={() => undo(habit, item.date)}>Desfazer</button>
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
