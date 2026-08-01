import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChartLineUp, CircleNotch, Fire, Heart, Target, ClipboardText, Smiley } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert.jsx';
import { dashboardService } from '../../services/dashboardService.js';
import { getProblemMessage } from '../../services/api.js';

const metricConfig = [
  ['Hábitos Ativos', ChartLineUp, 'blue'],
  ['Taxa de Conclusão', CircleNotch, 'green'],
  ['Melhor Sequência', Fire, 'orange'],
  ['Emoção Mais Frequente', Heart, 'purple'],
];

function formatPercent(value) {
  return `${Math.round((value ?? 0) * 100)}%`;
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
    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => [
    { label: 'Hábitos Ativos', value: summary?.activeHabits ?? 0, note: 'hábitos em andamento', icon: ChartLineUp, color: 'blue' },
    { label: 'Taxa de Conclusão', value: formatPercent(summary?.completionRate), note: 'nos últimos 30 dias', icon: CircleNotch, color: 'green' },
    { label: 'Melhor Sequência', value: summary?.bestStreak ?? 0, note: 'dias consecutivos', icon: Fire, color: 'orange' },
    { label: 'Emoção Mais Frequente', value: summary?.mostFrequentEmotion?.code ?? '—', note: 'último ciclo', icon: Heart, color: 'purple' },
  ], [summary]);

  return (
    <div className="dashboard page">
      <header className="page-heading">
        <p className="eyebrow">Resumo da semana</p>
        <h1>Seu espaço está mais vivo do que nunca</h1>
        <p>Acompanhe seu progresso, seus hábitos ativos e o que está ajudando a manter a sua rotina em movimento.</p>
      </header>
      {error && <Alert variant="error">{error}</Alert>}
      <ol className="journey">
        <li className="active"><span className="step-number">1</span><span className="step-icon"><Target size={30} weight="duotone"/></span><div><h2>Crie seu primeiro hábito</h2><p>Defina um hábito simples e significativo para começar sua rotina com consistência.</p></div><button onClick={() => navigate('/app/habitos')}>Criar primeiro hábito <ArrowRight size={19}/></button></li>
        <li><span className="step-number">2</span><span className="step-icon"><ClipboardText size={30}/></span><div><h2>Registre sua execução</h2><p>Marque cada dia como concluído para construir sequência e consciência.</p></div></li>
        <li><span className="step-number">3</span><span className="step-icon"><Smiley size={30}/></span><div><h2>Associe uma emoção</h2><p>Complete o ciclo registrando como você se sentiu ao longo da prática.</p></div></li>
      </ol>
      <section className="metrics" aria-label="Resumo de desempenho">
        {metrics.map(({ label, value, note, icon: Icon, color }) => (
          <article key={label}>
            <span className={`metric-icon ${color}`}><Icon size={28}/></span>
            <h2>{label}</h2>
            <strong>{loading ? '…' : value}</strong>
            <p>{loading ? 'Carregando...' : note}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
