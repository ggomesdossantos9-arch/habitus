import { useEffect, useState } from 'react';
import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { emotionService } from '../../services/emotionService.js';
import { telemetryService } from '../../services/telemetryService.js';
import { getProblemMessage } from '../../services/api.js';

const today = () => new Date().toISOString().slice(0, 10);
const initialEvent = { localDate: today(), emotionCode: 'calmo', intensity: 3, valence: 0, energy: 3, note: '' };

export function TelemetryPage() {
  const [catalog, setCatalog] = useState([]);
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [trends, setTrends] = useState([]);
  const [correlations, setCorrelations] = useState([]);
  const [values, setValues] = useState(initialEvent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [emotionData, eventData, summaryData, distributionData, trendData, correlationData] = await Promise.all([
        emotionService.catalog(),
        emotionService.list(),
        telemetryService.summary(),
        telemetryService.distribution(),
        telemetryService.trends(),
        telemetryService.habitCorrelations(),
      ]);
      setCatalog(emotionData);
      setEvents(eventData);
      setSummary(summaryData);
      setDistribution(distributionData);
      setTrends(trendData);
      setCorrelations(correlationData);
      setError('');
    } catch (e) {
      setError(getProblemMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const create = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await emotionService.create({
        localDate: values.localDate,
        occurredAt: `${values.localDate}T12:00:00.000Z`,
        valence: Number(values.valence),
        energy: Number(values.energy),
        note: values.note || null,
        emotions: [{ code: values.emotionCode, intensity: Number(values.intensity), isPrimary: true }],
      });
      setValues(initialEvent);
      setSuccess('Emocao registrada.');
      await load();
    } catch (e) {
      setError(getProblemMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!confirm('Excluir este registro emocional?')) return;
    try {
      await emotionService.remove(item.id);
      await load();
      setSuccess('Registro excluido.');
    } catch (e) {
      setError(getProblemMessage(e));
    }
  };

  const topFailure = correlations
    .filter((item) => item.totalCheckins > item.completed)
    .sort((a, b) => (a.completionRate ?? 0) - (b.completionRate ?? 0))[0];
  const bestDay = [...trends].sort((a, b) => b.total - a.total)[0];

  return (
    <div className="page">
      <header className="page-heading">
        <p className="eyebrow">Telemetria emocional</p>
        <h1>Observe padroes reais</h1>
        <p>Registre emocoes, intensidade e contexto para entender frequencias, tendencias e relacoes com habitos.</p>
      </header>
      {error && <Alert onDismiss={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" onDismiss={() => setSuccess('')}>{success}</Alert>}
      <section className="metrics" aria-label="Resumo emocional">
        <article><span className="metric-icon blue" /><h2>Eventos</h2><strong>{loading ? '...' : summary?.totalEvents ?? 0}</strong><p>ultimos 30 dias</p></article>
        <article><span className="metric-icon green" /><h2>Valencia media</h2><strong>{summary?.averageValence ?? 0}</strong><p>escala de -2 a 2</p></article>
        <article><span className="metric-icon orange" /><h2>Energia media</h2><strong>{summary?.averageEnergy ?? 0}</strong><p>escala de 1 a 5</p></article>
        <article><span className="metric-icon purple" /><h2>Mais frequente</h2><strong>{summary?.mostFrequentEmotion?.name ?? '-'}</strong><p>{summary?.mostFrequentEmotion?.total ? `${summary.mostFrequentEmotion.total} registros` : 'sem dados suficientes'}</p></article>
      </section>
      <div className="split-grid section-gap">
        <Card className="panel">
          <h2>Novo registro</h2>
          <form className="stack" onSubmit={create}>
            <Input label="Data" type="date" value={values.localDate} onChange={(event) => setValues((current) => ({ ...current, localDate: event.target.value }))} />
            <label className="field">Emocao<select value={values.emotionCode} onChange={(event) => setValues((current) => ({ ...current, emotionCode: event.target.value }))}>{catalog.map((emotion) => <option key={emotion.code} value={emotion.code}>{emotion.name}</option>)}</select></label>
            <div className="form-row">
              <Input label="Intensidade" type="number" min="1" max="5" value={values.intensity} onChange={(event) => setValues((current) => ({ ...current, intensity: event.target.value }))} />
              <Input label="Energia" type="number" min="1" max="5" value={values.energy} onChange={(event) => setValues((current) => ({ ...current, energy: event.target.value }))} />
            </div>
            <Input label="Valencia" type="number" min="-2" max="2" value={values.valence} onChange={(event) => setValues((current) => ({ ...current, valence: event.target.value }))} />
            <label className="field">Observacao<textarea rows="4" value={values.note} onChange={(event) => setValues((current) => ({ ...current, note: event.target.value }))} /></label>
            <Button isLoading={saving}>Registrar emocao</Button>
          </form>
        </Card>
        <Card className="panel">
          <h2>Leituras automaticas</h2>
          <div className="stack">
            <p className="muted">Horario com mais falhas: {topFailure ? topFailure.name : 'dados insuficientes'}</p>
            <p className="muted">Dia com maior volume emocional: {bestDay ? `${bestDay.date} (${bestDay.total})` : 'dados insuficientes'}</p>
            <p className="muted">Fonte principal: {summary?.bySource ? Object.entries(summary.bySource).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'dados insuficientes' : 'dados insuficientes'}</p>
          </div>
        </Card>
      </div>
      <div className="split-grid">
        <Card className="panel">
          <h2>Frequencia por emocao</h2>
          {distribution.length ? distribution.map((item) => <div className="bar-row" key={item.code}><span>{item.name}</span><div><i style={{ width: `${Math.min(100, item.total * 12)}%` }} /></div><strong>{item.total}</strong></div>) : <p className="muted">Ainda nao ha dados suficientes.</p>}
        </Card>
        <Card className="panel">
          <h2>Relacao emocao e habito</h2>
          {correlations.length ? correlations.map((item) => <div className="correlation-row" key={item.habitId}><strong>{item.name}</strong><span>{Math.round(item.completionRate * 100)}% concluido</span><small>{item.emotions.map((emotion) => `${emotion.code}: ${emotion.total}`).join(', ') || 'sem emocao associada'}</small></div>) : <p className="muted">Registre conclusoes com emocao para gerar correlacoes.</p>}
        </Card>
      </div>
      <Card className="panel">
        <h2>Registros recentes</h2>
        {events.length ? events.slice(0, 10).map((item) => <div className="checkin-row" key={item.id}><span>{item.localDate} - {item.emotions?.[0]?.name ?? 'Emocao'} - intensidade {item.emotions?.[0]?.intensity ?? '-'}</span><button type="button" onClick={() => remove(item)}>Excluir</button></div>) : <p className="muted">Nenhum registro emocional ainda.</p>}
      </Card>
    </div>
  );
}
