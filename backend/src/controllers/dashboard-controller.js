export class DashboardController {
  constructor(service) {
    this.service = service;
  }

  summary = async (req, res) => res.json({ data: await this.service.summary(req.user, req.validatedQuery) });
  habits = async (req, res) => res.json({ data: await this.service.habits(req.user, req.validatedQuery) });
  emotions = async (req, res) => res.json({ data: await this.service.emotions(req.user, req.validatedQuery) });
  streaks = async (req, res) => res.json({ data: await this.service.streaks(req.user, req.validatedQuery) });
}
