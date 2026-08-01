export class TelemetryController {
  constructor(service) {
    this.service = service;
  }

  summary = async (req, res) => res.json({ data: await this.service.summary(req.user, req.validatedQuery) });
  trends = async (req, res) => res.json({ data: await this.service.trends(req.user, req.validatedQuery) });
  distribution = async (req, res) => res.json({ data: await this.service.distribution(req.user, req.validatedQuery) });
  habitCorrelations = async (req, res) => res.json({ data: await this.service.habitCorrelations(req.user, req.validatedQuery) });
}
