export class HabitController {
  constructor(service) {
    this.service = service;
  }

  list = async (req, res) => res.json({ data: await this.service.list(req.user, req.validatedQuery) });
  create = async (req, res) => res.status(201).json({ data: await this.service.create(req.user, req.validated) });
  detail = async (req, res) => res.json({ data: await this.service.detail(req.user, req.validatedParams.habitId) });
  update = async (req, res) => res.json({ data: await this.service.update(req.user, req.validatedParams.habitId, req.validated) });
  archive = async (req, res) => { await this.service.archive(req.user, req.validatedParams.habitId); res.status(204).end(); };
  restore = async (req, res) => res.json({ data: await this.service.restore(req.user, req.validatedParams.habitId) });
  listCheckins = async (req, res) => res.json({ data: await this.service.listCheckins(req.user, req.validatedParams.habitId, req.validatedQuery) });
  upsertCheckin = async (req, res) => res.json({ data: await this.service.upsertCheckin(req.user, req.validatedParams.habitId, req.validatedParams.date, req.validated) });
  deleteCheckin = async (req, res) => { await this.service.deleteCheckin(req.user, req.validatedParams.habitId, req.validatedParams.date); res.status(204).end(); };
  dailyPlan = async (req, res) => res.json({ data: await this.service.dailyPlan(req.user, req.validatedQuery?.date) });
}
