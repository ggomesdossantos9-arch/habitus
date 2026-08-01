export class AiController {
  constructor(service) {
    this.service = service;
  }

  create = async (req, res) => res.status(201).json({ data: await this.service.create(req.user, req.validated, req.get('idempotency-key')) });
  list = async (req, res) => res.json({ data: await this.service.list(req.user, req.validatedQuery) });
  detail = async (req, res) => res.json({ data: await this.service.detail(req.user, req.validatedParams.insightId) });
  delete = async (req, res) => { await this.service.delete(req.user, req.validatedParams.insightId); res.status(204).end(); };
}
