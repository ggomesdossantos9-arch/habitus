import { normalizeDateRange } from '../utils/domain.js';

const avg = (values) => values.length ? Number((values.reduce((sum, value) => sum + Number(value), 0) / values.length).toFixed(2)) : 0;

export class TelemetryService {
  constructor({ db, emotionService }) {
    this.db = db;
    this.emotionService = emotionService;
  }

  range(query = {}) {
    return normalizeDateRange({ from: query.from, to: query.to, days: 30 });
  }

  async summary(user, query = {}) {
    const { from, to } = this.range(query);
    const events = await this.db('emotional_events').where({ user_id: user.id }).whereBetween('local_date', [from, to]);
    const bySource = events.reduce((acc, event) => {
      acc[event.source_type] = (acc[event.source_type] ?? 0) + 1;
      return acc;
    }, {});
    return {
      period: { from, to },
      totalEvents: events.length,
      averageValence: avg(events.map((event) => event.valence)),
      averageEnergy: avg(events.map((event) => event.energy)),
      mostFrequentEmotion: await this.emotionService.mostFrequent(user, from, to),
      bySource,
    };
  }

  async trends(user, query = {}) {
    const { from, to } = this.range(query);
    const rows = await this.db('emotional_events')
      .select('local_date')
      .avg('valence as averageValence')
      .avg('energy as averageEnergy')
      .count('* as total')
      .where({ user_id: user.id })
      .whereBetween('local_date', [from, to])
      .groupBy('local_date')
      .orderBy('local_date', 'asc');
    return rows.map((row) => ({
      date: row.local_date,
      total: Number(row.total),
      averageValence: Number(Number(row.averageValence ?? 0).toFixed(2)),
      averageEnergy: Number(Number(row.averageEnergy ?? 0).toFixed(2)),
    }));
  }

  async distribution(user, query = {}) {
    const { from, to } = this.range(query);
    const rows = await this.db('emotional_event_items')
      .select('emotions.code', 'emotions.name')
      .count('* as total')
      .avg('emotional_event_items.intensity as averageIntensity')
      .join('emotions', 'emotions.id', 'emotional_event_items.emotion_id')
      .join('emotional_events', 'emotional_events.id', 'emotional_event_items.event_id')
      .where({ 'emotional_events.user_id': user.id })
      .whereBetween('emotional_events.local_date', [from, to])
      .groupBy('emotions.code', 'emotions.name')
      .orderBy('total', 'desc');
    return rows.map((row) => ({
      code: row.code,
      name: row.name,
      total: Number(row.total),
      averageIntensity: Number(Number(row.averageIntensity ?? 0).toFixed(2)),
    }));
  }

  async habitCorrelations(user, query = {}) {
    const { from, to } = this.range(query);
    const rows = await this.db('habit_checkins')
      .select('habits.public_id as habitId', 'habits.name', 'habit_checkins.status', 'emotions.code', 'emotions.name as emotionName')
      .leftJoin('habits', 'habits.id', 'habit_checkins.habit_id')
      .leftJoin('emotional_events', 'emotional_events.habit_checkin_id', 'habit_checkins.id')
      .leftJoin('emotional_event_items', 'emotional_event_items.event_id', 'emotional_events.id')
      .leftJoin('emotions', 'emotions.id', 'emotional_event_items.emotion_id')
      .where({ 'habit_checkins.user_id': user.id })
      .whereBetween('habit_checkins.checkin_date', [from, to]);
    const map = new Map();
    for (const row of rows) {
      const item = map.get(row.habitId) ?? { habitId: row.habitId, name: row.name, totalCheckins: 0, completed: 0, emotions: {} };
      item.totalCheckins += 1;
      if (row.status === 'completed') item.completed += 1;
      if (row.code) item.emotions[row.code] = (item.emotions[row.code] ?? 0) + 1;
      map.set(row.habitId, item);
    }
    return [...map.values()].map((item) => ({
      ...item,
      completionRate: item.totalCheckins ? Number((item.completed / item.totalCheckins).toFixed(4)) : 0,
      emotions: Object.entries(item.emotions).map(([code, total]) => ({ code, total })),
    }));
  }
}
