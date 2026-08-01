import { useEffect, useState } from 'react';
import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { journalService } from '../../services/journalService.js';
import { emotionService } from '../../services/emotionService.js';
import { aiService } from '../../services/aiService.js';
import { userService } from '../../services/userService.js';
import { getProblemMessage } from '../../services/api.js';

const toInputDateTime = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const initialEntry = () => ({
  title: '',
  text: '',
  mood: '',
  occurredAt: toInputDateTime(),
  emotionCode: 'calmo',
  intensity: 3,
  valence: 0,
  energy: 3,
});

export function JournalPage() {
  const [entries, setEntries] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [selected, setSelected] = useState(null);
  const [values, setValues] = useState(initialEntry);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [entryData, emotionData] = await Promise.all([journalService.list(), emotionService.catalog()]);
      setEntries(entryData);
      setCatalog(emotionData);
      setError('');
    } catch (e) {
      setError(getProblemMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const pick = (entry) => {
    setSelected(entry);
    setValues({
      title: entry.title ?? '',
      text: entry.text ?? '',
      mood: entry.mood ?? '',
      occurredAt: toInputDateTime(entry.occurredAt),
      emotionCode: entry.emotion?.emotions?.[0]?.code ?? 'calmo',
      intensity: entry.emotion?.emotions?.[0]?.intensity ?? 3,
      valence: entry.emotion?.valence ?? 0,
      energy: entry.emotion?.energy ?? 3,
    });
  };

  const reset = () => {
    setSelected(null);
    setValues(initialEntry());
  };

  const payload = () => ({
    title: values.title.trim() || null,
    text: values.text.trim() || null,
    mood: values.mood.trim() || null,
    occurredAt: values.occurredAt ? new Date(values.occurredAt).toISOString() : undefined,
    status: 'draft',
    emotion: {
      valence: Number(values.valence),
      energy: Number(values.energy),
      note: values.mood.trim() || null,
      emotions: [{ code: values.emotionCode || 'outra', intensity: Number(values.intensity), isPrimary: true }],
    },
  });

  const save = async (event) => {
    event.preventDefault();
    setSaving('entry');
    setError('');
    setSuccess('');
    try {
      const saved = selected ? await journalService.update(selected.id, payload()) : await journalService.create(payload());
      setEntries((current) => selected ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setSuccess(selected ? 'Entrada atualizada.' : 'Entrada criada.');
      reset();
    } catch (e) {
      setError(getProblemMessage(e));
    } finally {
      setSaving('');
    }
  };

  const remove = async (entry) => {
    if (!confirm(`Excluir "${entry.title || 'entrada sem titulo'}"?`)) return;
    try {
      await journalService.remove(entry.id);
      setEntries((current) => current.filter((item) => item.id !== entry.id));
      if (selected?.id === entry.id) reset();
      setSuccess('Entrada excluida.');
    } catch (e) {
      setError(getProblemMessage(e));
    }
  };

  const analyze = async (entry) => {
    setSaving(`ai-${entry.id}`);
    setError('');
    setSuccess('');
    try {
      await userService.addConsent('ai_processing');
      await aiService.create({ type: 'journal_reflection', journalEntryId: entry.id });
      await load();
      setSuccess('Analise por IA gerada.');
    } catch (e) {
      setError(getProblemMessage(e));
    } finally {
      setSaving('');
    }
  };

  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">Diario cognitivo</p>
        <h1>Registre pensamentos e padroes</h1>
        <p>Crie entradas privadas, associe humor e emocao, e solicite analise por IA quando o provedor estiver configurado.</p>
      </header>
      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" onDismiss={() => setSuccess('')}>{success}</Alert>}
      <div className="split-grid">
        <Card className="panel">
          <h2>{selected ? 'Editar entrada' : 'Nova entrada'}</h2>
          <form className="stack" onSubmit={save}>
            <Input label="Titulo" value={values.title} onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))} />
            <label className="field">Texto<textarea value={values.text} onChange={(event) => setValues((current) => ({ ...current, text: event.target.value }))} rows="8" required /></label>
            <div className="form-row">
              <Input label="Humor" value={values.mood} onChange={(event) => setValues((current) => ({ ...current, mood: event.target.value }))} />
              <Input label="Data e hora" type="datetime-local" value={values.occurredAt} onChange={(event) => setValues((current) => ({ ...current, occurredAt: event.target.value }))} />
            </div>
            <div className="form-row">
              <label className="field">Emocao<select value={values.emotionCode} onChange={(event) => setValues((current) => ({ ...current, emotionCode: event.target.value }))}>{catalog.map((emotion) => <option key={emotion.code} value={emotion.code}>{emotion.name}</option>)}</select></label>
              <Input label="Intensidade" type="number" min="1" max="5" value={values.intensity} onChange={(event) => setValues((current) => ({ ...current, intensity: event.target.value }))} />
            </div>
            <div className="form-row">
              <Input label="Valencia" type="number" min="-2" max="2" value={values.valence} onChange={(event) => setValues((current) => ({ ...current, valence: event.target.value }))} />
              <Input label="Energia" type="number" min="1" max="5" value={values.energy} onChange={(event) => setValues((current) => ({ ...current, energy: event.target.value }))} />
            </div>
            <div className="action-row">
              <Button isLoading={saving === 'entry'}>{selected ? 'Salvar entrada' : 'Criar entrada'}</Button>
              {selected && <Button type="button" variant="secondary" onClick={reset}>Cancelar</Button>}
            </div>
          </form>
        </Card>
        <div className="item-list">
          {loading ? <Card className="empty-state"><h2>Carregando diario...</h2></Card> : entries.length === 0 ? <Card className="empty-state"><h2>Nenhuma entrada ainda</h2><p>Registre uma situacao para acompanhar seus pensamentos ao longo do tempo.</p></Card> : entries.map((entry) => (
            <Card className="panel" key={entry.id}>
              <div className="item-heading">
                <div><h3>{entry.title || 'Entrada sem titulo'}</h3><p>{new Date(entry.occurredAt).toLocaleString('pt-BR')} {entry.mood ? `- ${entry.mood}` : ''}</p></div>
                <span className="status-pill">{entry.status}</span>
              </div>
              <p className="muted">{entry.text}</p>
              {entry.aiAnalysis && <div className="insight-box"><strong>IA</strong><p>{entry.aiAnalysis.resumo}</p></div>}
              <div className="action-row">
                <Button type="button" variant="secondary" onClick={() => pick(entry)}>Visualizar/editar</Button>
                <Button type="button" variant="secondary" isLoading={saving === `ai-${entry.id}`} onClick={() => analyze(entry)}>Analisar IA</Button>
                <Button type="button" variant="secondary" onClick={() => remove(entry)}>Excluir</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
