import { dateOnly, normalizeDateRange, todayDate } from '../utils/domain.js';

const addDays = (date, days) => dateOnly(new Date(new Date(`${date}T00:00:00Z`).getTime() + days * 86400000));

function longestStreak(dates) {
  const unique = [...new Set(dates)].sort();
  let best = 0, current = 0, previous = null;
  for (const date of unique) {
    current = previous && addDays(previous, 1) === date ? current + 1 : 1;
    best = Math.max(best, current);
    previous = date;
  }
  return best;
}

function currentStreak(dates, asOf = todayDate()) {
  const set = new Set(dates);
  let count = 0, cursor = asOf;
  while (set.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export class DashboardService {
  constructor({ db, habitService, emotionService, telemetryService }) {
    Object.assign(this, { db, habitService, emotionService, telemetryService });
  }

  async chart(user, from, to) {
    const rows = await this.habitService.completionRows(user, from, to);
    const map = new Map();
    for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
      map.set(cursor, { date: cursor, total: 0, completed: 0, completionRate: 0 });
    }
    for (const row of rows) {
      const date = dateOnly(row.checkin_date);
      const item = map.get(date) ?? { date, total: 0, completed: 0, completionRate: 0 };
      item.total += 1;
      if (row.status === 'completed') item.completed += 1;
      map.set(date, item);
    }
    return [...map.values()].map((item) => ({ ...item, completionRate: item.total ? Number((item.completed / item.total).toFixed(4)) : 0 }));
  }

  async monthlyChart(user, from, to) {
    const rows = await this.habitService.completionRows(user, from, to);
    const map = new Map();
    for (const row of rows) {
      const month = dateOnly(row.checkin_date).slice(0, 7);
      const item = map.get(month) ?? { month, total: 0, completed: 0, completionRate: 0 };
      item.total += 1;
      if (row.status === 'completed') item.completed += 1;
      map.set(month, item);
    }
    return [...map.values()].map((item) => ({ ...item, completionRate: item.total ? Number((item.completed / item.total).toFixed(4)) : 0 }));
  }

  async streaks(user, query = {}) {
    const { from, to } = normalizeDateRange({ from: query.from, to: query.to, days: 120 });
    const rows = await this.habitService.completionRows(user, from, to);
    const groups = rows.reduce((acc, row) => {
      if (row.status !== 'completed') return acc;
      acc[row.habit_public_id] ??= { habitId: row.habit_public_id, name: row.habit_name, dates: [] };
      acc[row.habit_public_id].dates.push(dateOnly(row.checkin_date));
      return acc;
    }, {});
    return Object.values(groups).map((item) => ({
      habitId: item.habitId,
      name: item.name,
      current: currentStreak(item.dates, query.asOf ?? todayDate()),
      best: longestStreak(item.dates),
    }));
  }

  async summary(user, query = {}) {
    const today = query.asOf ?? todayDate();
    const { from, to } = normalizeDateRange({ from: query.from, to: query.to, days: 30 });
    const activeHabits = Number((await this.db('habits').where({ user_id: user.id, status: 'active' }).count('* as total').first()).total);
    const rows = await this.habitService.completionRows(user, from, to);
    const completed = rows.filter((row) => row.status === 'completed').length;
    const todayRows = rows.filter((row) => dateOnly(row.checkin_date) === today);
    const streaks = await this.streaks(user, { from, to, asOf: today });
    return {
      period: { from, to, asOf: today },
      activeHabits,
      completionRate: rows.length ? Number((completed / rows.length).toFixed(4)) : 0,
      bestStreak: streaks.reduce((best, item) => Math.max(best, item.current), 0),
      longestStreak: streaks.reduce((best, item) => Math.max(best, item.best), 0),
      habitsCompletedToday: todayRows.filter((row) => row.status === 'completed').length,
      mostFrequentEmotion: await this.emotionService.mostFrequent(user, from, to),
      weeklyChart: await this.chart(user, addDays(today, -6), today),
      monthlyChart: await this.monthlyChart(user, addDays(today, -120), today),
      dailyProgress: {
        date: today,
        completed: todayRows.filter((row) => row.status === 'completed').length,
        totalActive: activeHabits,
        completionRate: activeHabits ? Number((todayRows.filter((row) => row.status === 'completed').length / activeHabits).toFixed(4)) : 0,
      },
    };
  }

  async habits(user, query = {}) {
    const { from, to } = normalizeDateRange({ from: query.from, to: query.to, days: 30 });
    return this.habitService.habitCompletionStats(user, from, to);
  }

  async emotions(user, query = {}) {
    return {
      summary: await this.telemetryService.summary(user, query),
      distribution: await this.telemetryService.distribution(user, query),
      trends: await this.telemetryService.trends(user, query),
    };
  }
}
