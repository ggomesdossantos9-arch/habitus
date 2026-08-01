import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChartLineUp, CircleNotch, Fire, Heart, Target, ClipboardText, Smiley } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { dashboardService } from '../../services/dashboardService.js';
import { getProblemMessage } from '../../services/api.js';

function formatPercent(value) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

function ChartBars({ items, labelKey = 'date' }) {
  if (!items?.length || items.every((item) => !item.total)) return <p className="muted">Sem dados suficientes para este grafico.</p>;
  return <div className="chart-bars">{items.map((item) => <div key={item[labelKey]} title={`${item[labelKey]} - ${formatPercent(item.completionRate)}`}><i style={{ height: `${Math.max(6, Math.round((item.completionRate ?? 0) * 100))}%` }} /><span>{String(item[labelKey]).slice(labelKey === 'month' ? 5 : 8)}</span></div>)}</div>;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await dashboardService.summary();
        if (active) setSummary(data);
      } catch (e) {
        if (active) setError(getProblemMessage(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const hasData = (summary?.activeHabits ?? 0) > 0 || (summary?.weeklyChart ?? []).some((item) => item.total);
  const metrics = useMemo(() => [
    { label: 'Habitos Ativos', value: summary?.activeHabits ?? 0, note: 'habitos em andamento', icon: ChartLineUp, color: 'blue' },
    { label: 'Concluidos Hoje', value: summary?.habitsCompletedToday ?? 0, note: `${summary?.dailyProgress?.totalActive ?? 0} ativos hoje`, icon: Target, color: 'green' },
    { label: 'Taxa de Conclusao', value: formatPercent(summary?.completionRate), note: 'nos ultimos 30 dias', icon: CircleNotch, color: 'green' },
    { label: 'Sequencia Atual', value: summary?.bestStreak ?? 0, note: 'dias consecutivos', icon: Fire, color: 'orange' },
    { label: 'Melhor Sequencia', value: summary?.longestStreak ?? 0, note: 'recorde do periodo', icon: Fire, color: 'orange' },
    { label: 'Emocao Mais Frequente', value: summary?.mostFrequentEmotion?.name ?? '-', note: summary?.mostFrequentEmotion?.total ? `${summary.mostFrequentEmotion.total} registros` : 'sem dados suficientes', icon: Heart, color: 'purple' },
  ], [summary]);

  return (
    <div className="dashboard page">
      <header className="page-heading">
        <p className="eyebrow">Resumo da semana</p>
        <h1>Seu espaco de acompanhamento</h1>
        <p>Acompanhe progresso, sequencias, conclusoes e padroes emocionais usando apenas dados reais da sua conta.</p>
      </header>
      {error && <Alert variant="error">{error}</Alert>}
      {!loading && !hasData && <Card className="empty-state"><h2>Nenhum dado ainda</h2><p>Crie um habito e registre sua primeira conclusao para preencher o dashboard.</p></Card>}
      <ol className="journey">
        <li className="active"><span className="step-number">1</span><span className="step-icon"><Target size={30} weight="duotone" /></span><div><h2>Crie seu primeiro habito</h2><p>Defina um habito simples e significativo para comecar sua rotina com consistencia.</p></div><button onClick={() => navigate('/app/habitos')}>Criar habito <ArrowRight size={19} /></button></li>
        <li><span className="step-number">2</span><span className="step-icon"><ClipboardText size={30} /></span><div><h2>Registre sua execucao</h2><p>Marque cada dia como concluido para construir sequencia e consciencia.</p></div></li>
        <li><span className="step-number">3</span><span className="step-icon"><Smiley size={30} /></span><div><h2>Associe uma emocao</h2><p>Complete o ciclo registrando como voce se sentiu ao longo da pratica.</p></div></li>
      </ol>
      <section className="metrics metrics--wide" aria-label="Resumo de desempenho">
        {metrics.map(({ label, value, note, icon: Icon, color }) => (
          <article key={label}>
            <span className={`metric-icon ${color}`}><Icon size={28} /></span>
            <h2>{label}</h2>
            <strong>{loading ? '...' : value}</strong>
            <p>{loading ? 'Carregando...' : note}</p>
          </article>
        ))}
      </section>
      <div className="split-grid section-gap">
        <Card className="panel">
          <h2>Progresso diario</h2>
          <p className="metric-large">{formatPercent(summary?.dailyProgress?.completionRate)}</p>
          <p className="muted">{summary?.dailyProgress?.completed ?? 0} de {summary?.dailyProgress?.totalActive ?? 0} habitos ativos concluidos hoje.</p>
        </Card>
        <Card className="panel">
          <h2>Grafico semanal</h2>
          <ChartBars items={summary?.weeklyChart ?? []} />
        </Card>
      </div>
      <Card className="panel">
        <h2>Grafico mensal</h2>
        <ChartBars items={summary?.monthlyChart ?? []} labelKey="month" />
      </Card>
    </div>
  );
}
